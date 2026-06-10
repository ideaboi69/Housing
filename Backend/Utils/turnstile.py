import httpx
from fastapi import HTTPException
from config import settings

TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


def verify_turnstile(token: str | None, remoteip: str | None = None) -> None:
    """Raise HTTPException if the captcha token is missing or invalid.
    Silently passes if TURNSTILE_SECRET is unset (dev convenience).
    """
    if not settings.TURNSTILE_SECRET:
        return

    if not token:
        raise HTTPException(status_code=400, detail="Captcha required")

    data = {"secret": settings.TURNSTILE_SECRET, "response": token}
    if remoteip:
        data["remoteip"] = remoteip

    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.post(TURNSTILE_VERIFY_URL, data=data)
            result = resp.json()
    except Exception:
        raise HTTPException(status_code=503, detail="Captcha service unavailable")

    if not result.get("success"):
        raise HTTPException(status_code=400, detail="Captcha verification failed")
