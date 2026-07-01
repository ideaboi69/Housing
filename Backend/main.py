from fastapi import FastAPI, WebSocket, Request, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from fastapi.responses import HTMLResponse
from Routes.user import user_router
from Routes.landlord import landlord_router
from Routes.admin import admin_router
from Routes.property import property_router
from Routes.listing import listing_router
from Routes.review import review_router
from Routes.healthscore import health_score_router
from Routes.saved import saved_router
from Routes.flag import flag_router
from Routes.messages import message_router
from Routes.sublet import sublet_router
from Routes.writer import writer_router
from Routes.post import post_router
from Routes.marketplace import marketplace_router
from Routes.roommates import roommate_router
from Routes.viewing import viewing_router
from Routes.landlord_invite import landlord_invite_router
from Routes.ai import ai_router
from Routes.group_chat import group_chat_router
from Routes.auth import auth_router
from Routes.notification import notification_router
from dataclasses import dataclass
from apscheduler.schedulers.background import BackgroundScheduler
from Utils.scheduler import send_viewing_reminders
from Utils.ai_content.pipeline import run_biweekly_generation
from Utils.websocket import connection_manager
from Utils.security import decode_access_token
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from Utils.rate_limit import limiter 
import Utils.cloudinary_config
import asyncio
import sentry_sdk
from config import settings

if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        send_default_pii=True,
        traces_sample_rate=0.2,
        environment=settings.SENTRY_ENV,
    )

app = FastAPI(title="Cribb API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@dataclass
class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: list = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections: 
            await connection.send_text(message)

    async def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

connection_manager = ConnectionManager()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "https://www.findyourcribb.com",
        "https://housing-viqx.onrender.com",
        "https://cribb-frontend.onrender.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router, prefix="/api/users", tags=["Users"])
app.include_router(landlord_router, prefix="/api/landlords", tags=["Landlords"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
app.include_router(property_router, prefix="/api/properties", tags=["Properties"] )
app.include_router(listing_router, prefix="/api/listings", tags=["Listings"])
app.include_router(review_router, prefix="/api/reviews", tags=["Reviews"])
app.include_router(flag_router, prefix="/api/flags", tags=["Flags"])
app.include_router(saved_router, prefix="/api/saved", tags=["Saved"])
app.include_router(health_score_router, prefix="/api/health-scores", tags=["Cribb Scores"])
app.include_router(message_router, prefix="/api/messages", tags=["Messages"])
app.include_router(sublet_router, prefix="/api/sublets", tags=["Sublets"])
app.include_router(writer_router, prefix="/api/writers", tags=["Writers"])
app.include_router(post_router, prefix="/api/posts", tags=["Posts"])
app.include_router(marketplace_router, prefix="/api/marketplace", tags=["Marketplace"])
app.include_router(roommate_router, prefix="/api/roommates", tags=["Roommates"])
app.include_router(viewing_router, prefix="/api/viewings", tags=["Viewings"])
app.include_router(landlord_invite_router, prefix="/api/roommates", tags=["Landlord Invites"])
app.include_router(group_chat_router, prefix="/api/roommates", tags=["Group Chat"])
app.include_router(ai_router, prefix="/api/ai", tags=["AI"])
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(notification_router, prefix="/api/notifications", tags=["Notifications"])

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str):
    try:
        payload = decode_access_token(token)
    except Exception:
        await websocket.close(code=1008)
        return
 
    user_id = payload.get("user_id")
    role = payload.get("role")
    if not user_id or not role:
        await websocket.close(code=1008)
        return
 
    try:
        await connection_manager.connect(websocket, role, user_id)
    except Exception:
        # The client vanished mid-handshake (hot-reload / tab close / StrictMode
        # double-mount racing accept()). Nothing is registered yet, so just bail
        # instead of letting it surface as an unhandled ASGI error.
        return

    try:
        while True:
            # We don't process incoming WS messages from clients; this just keeps the socket open
            await websocket.receive_text()
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket, role, user_id)
    except Exception:
        # Any other transport error — drop the connection cleanly.
        connection_manager.disconnect(websocket, role, user_id)

# Email scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(send_viewing_reminders, "cron", hour=9, minute=0)
# Cribb AI bi-weekly content drafts — every other Sunday at 9am UTC (~5am ET)
# week=1,3 covers ISO weeks 1,3,5,...,53 which gives a stable bi-weekly cadence
scheduler.add_job(run_biweekly_generation, "cron", day_of_week="sun", hour=9, minute=0, week="1-53/2")
scheduler.start()

@app.on_event("shutdown")
def shutdown_scheduler():
    scheduler.shutdown()


if __name__ == "__main__":
    # Render (and most PaaS) inject the port to bind via the PORT env var.
    # Binding to 0.0.0.0:$PORT is what lets Render's port scan detect the service.
    import os
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
