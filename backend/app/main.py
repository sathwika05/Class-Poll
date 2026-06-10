import socket
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import sessions, polls, participants, exports, analytics, teams
from app.websocket_manager import manager


def _detect_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


_local_ip = _detect_local_ip()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    print(f"\n  ClassPoll running — student join page: http://{_local_ip}:3000/student\n")
    yield


app = FastAPI(title="ClassPoll API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router,    prefix="/api", tags=["sessions"])
app.include_router(polls.router,       prefix="/api", tags=["polls"])
app.include_router(participants.router, prefix="/api", tags=["participants"])
app.include_router(exports.router,     prefix="/api", tags=["exports"])
app.include_router(analytics.router,   prefix="/api", tags=["analytics"])
app.include_router(teams.router,       prefix="/api", tags=["teams"])        # ← NEW


@app.websocket("/ws/sessions/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: int,
    role: str = Query(default="student"),
):
    await manager.connect(session_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)
    except Exception:
        manager.disconnect(session_id, websocket)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/server-info")
async def server_info():
    return {"local_ip": _local_ip}
