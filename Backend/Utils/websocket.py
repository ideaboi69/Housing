from dataclasses import dataclass
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)

@dataclass
class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, role: str, user_id: int):
        await websocket.accept()
        key = f"{role}:{user_id}"
        self.active_connections.setdefault(key, []).append(websocket)

    def disconnect(self, websocket: WebSocket, role: str, user_id: int):
        key = f"{role}:{user_id}"
        if key in self.active_connections:
            try:
                self.active_connections[key].remove(websocket)
            except ValueError:
                pass
            if not self.active_connections[key]:
                del self.active_connections[key]

    # Send a JSON payload to every active connection for a given user (all their tabs)
    async def send_to_user(self, role: str, user_id: int, payload: dict):
        key = f"{role}:{user_id}"
        connections = self.active_connections.get(key, [])
        for ws in list(connections):
            try:
                await ws.send_json(payload)
            except Exception as e:
                logger.warning(f"WebSocket send failed for {key}: {e}")
                try:
                    connections.remove(ws)
                except ValueError:
                    pass

connection_manager = ConnectionManager()