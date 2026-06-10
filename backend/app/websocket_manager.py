import json
from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, session_id: int, websocket: WebSocket):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)

    def disconnect(self, session_id: int, websocket: WebSocket):
        if session_id in self.active_connections:
            try:
                self.active_connections[session_id].remove(websocket)
            except ValueError:
                pass
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def broadcast(self, session_id: int, event_type: str, data: dict):
        if session_id not in self.active_connections:
            return

        message = json.dumps({"type": event_type, "data": data}, default=str)
        dead: List[WebSocket] = []

        for ws in list(self.active_connections.get(session_id, [])):
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)

        for ws in dead:
            self.disconnect(session_id, ws)

    def connection_count(self, session_id: int) -> int:
        return len(self.active_connections.get(session_id, []))


manager = ConnectionManager()
