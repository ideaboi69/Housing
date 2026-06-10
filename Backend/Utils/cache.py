import json
from functools import wraps
from typing import Optional
from upstash_redis import Redis
from fastapi.encoders import jsonable_encoder
from config import settings

_redis: Optional[Redis] = None


def get_redis() -> Optional[Redis]:
    global _redis
    if _redis is None and settings.UPSTASH_REDIS_REST_URL and settings.UPSTASH_REDIS_REST_TOKEN:
        _redis = Redis(
            url=settings.UPSTASH_REDIS_REST_URL,
            token=settings.UPSTASH_REDIS_REST_TOKEN,
        )
    return _redis


# Param types we should never serialize into a cache key
_SKIP_PARAM_NAMES = {"db", "current_user", "author", "landlord", "request", "background_tasks"}


def _serialize_kwargs(kwargs: dict) -> str:
    parts = []
    for k in sorted(kwargs.keys()):
        if k in _SKIP_PARAM_NAMES:
            continue
        v = kwargs[k]
        if v is None:
            continue
        parts.append(f"{k}={v}")
    return "|".join(parts) if parts else "_"


def _versioned_prefix(redis: Redis, prefix: str) -> str:
    version = redis.get(f"v:{prefix}") or "0"
    return f"{prefix}:v{version}"


def cached(prefix: str, ttl: int = 180):
    """Cache the return value of a FastAPI route. Skips silently if Redis is unavailable."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            redis = get_redis()
            if not redis:
                return func(*args, **kwargs)

            try:
                key = f"{_versioned_prefix(redis, prefix)}:{_serialize_kwargs(kwargs)}"
                hit = redis.get(key)
                if hit:
                    return json.loads(hit)
            except Exception:
                return func(*args, **kwargs)

            result = func(*args, **kwargs)

            try:
                redis.set(key, json.dumps(jsonable_encoder(result)), ex=ttl)
            except Exception:
                pass

            return result
        return wrapper
    return decorator


def invalidate(prefix: str) -> None:
    """Bump the version for a cache prefix. All previously cached entries become unreachable
    and expire naturally via TTL."""
    redis = get_redis()
    if not redis:
        return
    try:
        redis.incr(f"v:{prefix}")
    except Exception:
        pass
