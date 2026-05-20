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
from dataclasses import dataclass
from apscheduler.schedulers.background import BackgroundScheduler
from Utils.scheduler import send_viewing_reminders
from Utils.websocket import connection_manager
from Utils.security import decode_access_token
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from Utils.rate_limit import limiter 
import Utils.cloudinary_config
import asyncio
from config import settings

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
        "https://findyourcribb.com",
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
 
    await connection_manager.connect(websocket, role, user_id)
    try:
        while True:
            # We don't process incoming WS messages from clients; this just keeps the socket open
            await websocket.receive_text()
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket, role, user_id)

# Email scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(send_viewing_reminders, "cron", hour=9, minute=0)
scheduler.start()

@app.on_event("shutdown")
def shutdown_scheduler():
    scheduler.shutdown()
