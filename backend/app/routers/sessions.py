from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Session, Participant, Poll, Vote, PollOption
from app.schemas import SessionCreate, SessionResponse, AttendanceResponse, ParticipantRecord
from app.utils import generate_code, get_code_expiry, compute_poll_results
from app.websocket_manager import manager

router = APIRouter()


async def _build_session_response(session: Session, db: AsyncSession) -> SessionResponse:
    p_count = (await db.execute(
        select(func.count(Participant.id)).where(Participant.session_id == session.id)
    )).scalar() or 0
    poll_count = (await db.execute(
        select(func.count(Poll.id)).where(Poll.session_id == session.id)
    )).scalar() or 0
    return SessionResponse(
        id=session.id, name=session.name, code=session.code, status=session.status,
        created_at=session.created_at, code_expires_at=session.code_expires_at,
        participant_count=p_count, poll_count=poll_count,
    )


@router.post("/sessions", response_model=SessionResponse)
async def create_session(data: SessionCreate, db: AsyncSession = Depends(get_db)):
    code = generate_code()
    for _ in range(10):
        existing = (await db.execute(select(Session).where(Session.code == code))).scalar_one_or_none()
        if not existing:
            break
        code = generate_code()

    session = Session(name=data.name, code=code, code_expires_at=get_code_expiry(), status="pending")
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return await _build_session_response(session, db)


@router.get("/sessions", response_model=list[SessionResponse])
async def list_sessions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Session).order_by(Session.created_at.desc()))
    sessions = result.scalars().all()
    return [await _build_session_response(s, db) for s in sessions]


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: int, db: AsyncSession = Depends(get_db)):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return await _build_session_response(session, db)


@router.post("/sessions/{session_id}/start", response_model=SessionResponse)
async def start_session(session_id: int, db: AsyncSession = Depends(get_db)):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status not in ("pending", "paused"):
        raise HTTPException(status_code=400, detail=f"Cannot start a session with status '{session.status}'")
    session.status = "active"
    await db.flush()
    await manager.broadcast(session_id, "session_started", {"session_id": session_id, "status": "active"})
    return await _build_session_response(session, db)


@router.post("/sessions/{session_id}/pause", response_model=SessionResponse)
async def pause_session(session_id: int, db: AsyncSession = Depends(get_db)):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "active":
        raise HTTPException(status_code=400, detail="Session is not active")
    # Auto-pause open polls
    open_polls = (await db.execute(
        select(Poll).where(Poll.session_id == session_id, Poll.status == "open")
    )).scalars().all()
    for poll in open_polls:
        poll.status = "paused"
        await manager.broadcast(session_id, "poll_paused", {"poll_id": poll.id, "status": "paused"})
    session.status = "paused"
    await db.flush()
    await manager.broadcast(session_id, "session_paused", {"session_id": session_id, "status": "paused"})
    return await _build_session_response(session, db)


@router.post("/sessions/{session_id}/resume", response_model=SessionResponse)
async def resume_session(session_id: int, db: AsyncSession = Depends(get_db)):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "paused":
        raise HTTPException(status_code=400, detail="Session is not paused")
    session.status = "active"
    await db.flush()
    await manager.broadcast(session_id, "session_resumed", {"session_id": session_id, "status": "active"})
    return await _build_session_response(session, db)


@router.post("/sessions/{session_id}/close", response_model=SessionResponse)
async def close_session(session_id: int, db: AsyncSession = Depends(get_db)):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status == "closed":
        raise HTTPException(status_code=400, detail="Session is already closed")
    # Close all active/paused polls
    active_polls = (await db.execute(
        select(Poll).where(Poll.session_id == session_id, Poll.status.in_(["open", "paused"]))
    )).scalars().all()
    for poll in active_polls:
        poll.status = "closed"
        poll.closed_at = datetime.utcnow()
        await manager.broadcast(session_id, "poll_closed", {"poll_id": poll.id, "status": "closed"})
    session.status = "closed"
    await db.flush()
    await manager.broadcast(session_id, "session_closed", {"session_id": session_id, "status": "closed"})
    return await _build_session_response(session, db)


@router.get("/sessions/{session_id}/attendance", response_model=AttendanceResponse)
async def get_attendance(session_id: int, db: AsyncSession = Depends(get_db)):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    participants = (await db.execute(
        select(Participant).where(Participant.session_id == session_id).order_by(Participant.joined_at)
    )).scalars().all()
    return AttendanceResponse(
        session_id=session_id,
        count=len(participants),
        participants=[ParticipantRecord(id=p.id, name=p.name, student_id=p.student_id, joined_at=p.joined_at)
                      for p in participants],
    )


@router.get("/sessions/{session_id}/results")
async def get_session_results(session_id: int, db: AsyncSession = Depends(get_db)):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    polls = (await db.execute(
        select(Poll)
        .options(selectinload(Poll.options), selectinload(Poll.votes))
        .where(Poll.session_id == session_id)
        .order_by(Poll.created_at)
    )).scalars().all()
    return {
        "session_id": session_id,
        "polls": [compute_poll_results(p, p.options, p.votes) for p in polls],
    }
