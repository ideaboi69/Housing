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
import asyncio
from dataclasses import dataclass

app = FastAPI(title="Housing API")

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
    allow_origins=["*"],         
    allow_credentials=False,      
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
app.include_router(health_score_router, prefix="/api/health-scores", tags=["Health-Scores"])
# app.include_router(poem_router, tags=["Pic & Poem"])
# app.include_router(orders_router, tags=["Orders"])
# app.include_router(payment_router, tags=["Payment"])
# app.include_router(email_router, tags=["Email"])
# app.include_router(checkout_router, tags=["Checkout"])
# app.include_router(shipping_router, tags=["Shipping"])