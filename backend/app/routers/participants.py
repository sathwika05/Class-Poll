from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Session, Participant
from app.schemas import JoinRequest, JoinResponse, ParticipantRecord, AttendanceResponse
from app.utils import generate_token, is_code_expired, check_rate_limit
from app.websocket_manager import manager

router = APIRouter()


@router.post("/join", response_model=JoinResponse)
async def join_session(data: JoinRequest, request: Request, db: AsyncSession = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    check_rate_limit(f"join:{client_ip}", 10, 60)

    # Reconnect using stored token
    if data.token:
        participant = (await db.execute(
            select(Participant).where(Participant.token == data.token)
        )).scalar_one_or_none()
        if participant:
            session = await db.get(Session, participant.session_id)
            if session and session.status != "closed":
                return JoinResponse(
                    session_id=session.id,
                    participant_id=participant.id,
                    token=participant.token,
                    session_name=session.name,
                    session_status=session.status,
                    session_code=session.code,
                    code_expires_at=session.code_expires_at,
                )

    # New join — look up session by code
    session = (await db.execute(
        select(Session).where(Session.code == data.code)
    )).scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session code not found")
    if session.status == "closed":
        raise HTTPException(status_code=400, detail="This session is already closed")
    if is_code_expired(session.code_expires_at):
        raise HTTPException(status_code=400, detail="Session code has expired. Ask your professor for a new code.")

    # Deduplicate: return existing participant if same student_id (or name if no ID) in this session
    name = data.name.strip()
    student_id = data.student_id.strip() if data.student_id else None
    if student_id:
        existing = (await db.execute(
            select(Participant).where(
                Participant.session_id == session.id,
                Participant.student_id == student_id,
            )
        )).scalar_one_or_none()
    else:
        existing = (await db.execute(
            select(Participant).where(
                Participant.session_id == session.id,
                Participant.name == name,
                Participant.student_id.is_(None),
            )
        )).scalar_one_or_none()

    if existing:
        return JoinResponse(
            session_id=session.id,
            participant_id=existing.id,
            token=existing.token,
            session_name=session.name,
            session_status=session.status,
            session_code=session.code,
            code_expires_at=session.code_expires_at,
        )

    token = generate_token()
    participant = Participant(
        session_id=session.id,
        name=name,
        student_id=student_id,
        token=token,
    )
    db.add(participant)
    await db.flush()
    await db.refresh(participant)

    # Broadcast attendance update
    participants = (await db.execute(
        select(Participant).where(Participant.session_id == session.id).order_by(Participant.joined_at)
    )).scalars().all()

    await manager.broadcast(session.id, "participant_joined", {
        "participant": {
            "id": participant.id,
            "name": participant.name,
            "student_id": participant.student_id,
            "joined_at": participant.joined_at.isoformat(),
        },
        "count": len(participants),
    })
    await manager.broadcast(session.id, "attendance_updated", {
        "count": len(participants),
        "participants": [
            {"id": p.id, "name": p.name, "student_id": p.student_id, "joined_at": p.joined_at.isoformat()}
            for p in participants
        ],
    })

    return JoinResponse(
        session_id=session.id,
        participant_id=participant.id,
        token=token,
        session_name=session.name,
        session_status=session.status,
        session_code=session.code,
        code_expires_at=session.code_expires_at,
    )
