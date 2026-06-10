from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Session, Participant, Poll, PollOption, Vote
from app.schemas import PollCreate, PollResponse, PollOptionResponse, VoteRequest, VoteResponse, PollResults, PollResultOption
from app.utils import check_rate_limit, compute_poll_results
from app.websocket_manager import manager

router = APIRouter()


async def _poll_to_response(poll: Poll, db: AsyncSession) -> PollResponse:
    options = (await db.execute(
        select(PollOption).where(PollOption.poll_id == poll.id).order_by(PollOption.order)
    )).scalars().all()
    return PollResponse(
        id=poll.id, session_id=poll.session_id, question=poll.question, status=poll.status,
        created_at=poll.created_at, opened_at=poll.opened_at, closed_at=poll.closed_at,
        options=[PollOptionResponse(id=o.id, text=o.text, order=o.order) for o in options],
    )


@router.get("/sessions/{session_id}/polls", response_model=list[PollResponse])
async def list_polls(session_id: int, db: AsyncSession = Depends(get_db)):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    polls = (await db.execute(
        select(Poll).where(Poll.session_id == session_id).order_by(Poll.created_at)
    )).scalars().all()
    return [await _poll_to_response(p, db) for p in polls]


@router.post("/sessions/{session_id}/polls", response_model=PollResponse)
async def create_poll(session_id: int, data: PollCreate, db: AsyncSession = Depends(get_db)):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status == "closed":
        raise HTTPException(status_code=400, detail="Cannot create a poll in a closed session")
    if len(data.options) < 2:
        raise HTTPException(status_code=400, detail="Poll must have at least 2 options")

    poll = Poll(session_id=session_id, question=data.question, status="pending")
    db.add(poll)
    await db.flush()

    for i, text in enumerate(data.options):
        db.add(PollOption(poll_id=poll.id, text=text.strip(), order=i))
    await db.flush()

    response = await _poll_to_response(poll, db)
    await manager.broadcast(session_id, "poll_created", response.model_dump(mode="json"))
    return response


@router.post("/polls/{poll_id}/open", response_model=PollResponse)
async def open_poll(poll_id: int, db: AsyncSession = Depends(get_db)):
    poll = await db.get(Poll, poll_id)
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    if poll.status not in ("pending", "paused"):
        raise HTTPException(status_code=400, detail=f"Cannot open poll with status '{poll.status}'")
    session = await db.get(Session, poll.session_id)
    if not session or session.status != "active":
        raise HTTPException(status_code=400, detail="Session must be active to open a poll")
    # Close any other open poll in this session
    other_open = (await db.execute(
        select(Poll).where(Poll.session_id == poll.session_id, Poll.status == "open", Poll.id != poll_id)
    )).scalars().all()
    for other in other_open:
        other.status = "paused"
        await manager.broadcast(poll.session_id, "poll_paused", {"poll_id": other.id, "status": "paused"})

    poll.status = "open"
    if not poll.opened_at:
        poll.opened_at = datetime.utcnow()
    await db.flush()

    response = await _poll_to_response(poll, db)
    await manager.broadcast(poll.session_id, "poll_opened", response.model_dump(mode="json"))
    return response


@router.post("/polls/{poll_id}/pause", response_model=PollResponse)
async def pause_poll(poll_id: int, db: AsyncSession = Depends(get_db)):
    poll = await db.get(Poll, poll_id)
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    if poll.status != "open":
        raise HTTPException(status_code=400, detail="Poll is not open")
    poll.status = "paused"
    await db.flush()
    response = await _poll_to_response(poll, db)
    await manager.broadcast(poll.session_id, "poll_paused", {"poll_id": poll_id, "status": "paused"})
    return response


@router.post("/polls/{poll_id}/resume", response_model=PollResponse)
async def resume_poll(poll_id: int, db: AsyncSession = Depends(get_db)):
    poll = await db.get(Poll, poll_id)
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    if poll.status != "paused":
        raise HTTPException(status_code=400, detail="Poll is not paused")
    session = await db.get(Session, poll.session_id)
    if not session or session.status != "active":
        raise HTTPException(status_code=400, detail="Session must be active to resume a poll")
    poll.status = "open"
    await db.flush()
    response = await _poll_to_response(poll, db)
    await manager.broadcast(poll.session_id, "poll_resumed", response.model_dump(mode="json"))
    return response


@router.post("/polls/{poll_id}/close", response_model=PollResponse)
async def close_poll(poll_id: int, db: AsyncSession = Depends(get_db)):
    poll = await db.get(Poll, poll_id)
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    if poll.status == "closed":
        raise HTTPException(status_code=400, detail="Poll is already closed")
    poll.status = "closed"
    poll.closed_at = datetime.utcnow()
    await db.flush()

    # Compute and broadcast final results
    options = (await db.execute(
        select(PollOption).where(PollOption.poll_id == poll_id).order_by(PollOption.order)
    )).scalars().all()
    votes = (await db.execute(select(Vote).where(Vote.poll_id == poll_id))).scalars().all()
    results = compute_poll_results(poll, options, votes)

    response = await _poll_to_response(poll, db)
    await manager.broadcast(poll.session_id, "poll_closed", {
        "poll_id": poll_id, "status": "closed", "results": results
    })
    return response


@router.post("/polls/{poll_id}/vote", response_model=VoteResponse)
async def submit_vote(poll_id: int, data: VoteRequest, request: Request, db: AsyncSession = Depends(get_db)):
    # Rate limit per token
    check_rate_limit(f"vote:{data.participant_token}", 5, 60)

    poll = (await db.execute(
        select(Poll).options(selectinload(Poll.options), selectinload(Poll.votes)).where(Poll.id == poll_id)
    )).scalar_one_or_none()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    if poll.status != "open":
        raise HTTPException(status_code=400, detail=f"Poll is not accepting votes (status: {poll.status})")

    participant = (await db.execute(
        select(Participant).where(Participant.token == data.participant_token)
    )).scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found. Please rejoin the session.")
    if participant.session_id != poll.session_id:
        raise HTTPException(status_code=403, detail="You are not in this session")

    session = await db.get(Session, poll.session_id)
    if not session or session.status != "active":
        raise HTTPException(status_code=400, detail="Session is not active")

    existing = (await db.execute(
        select(Vote).where(Vote.poll_id == poll_id, Vote.participant_id == participant.id)
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="You have already voted on this poll")

    option = (await db.execute(
        select(PollOption).where(PollOption.id == data.option_id, PollOption.poll_id == poll_id)
    )).scalar_one_or_none()
    if not option:
        raise HTTPException(status_code=400, detail="Invalid option for this poll")

    vote = Vote(poll_id=poll_id, participant_id=participant.id, option_id=data.option_id)
    db.add(vote)
    await db.flush()

    # Recompute results
    votes = (await db.execute(select(Vote).where(Vote.poll_id == poll_id))).scalars().all()
    options = (await db.execute(
        select(PollOption).where(PollOption.poll_id == poll_id).order_by(PollOption.order)
    )).scalars().all()
    results = compute_poll_results(poll, options, votes)

    await manager.broadcast(poll.session_id, "results_updated", {"poll_id": poll_id, "results": results})

    poll_results = PollResults(
        poll_id=results["poll_id"],
        question=results["question"],
        status=results["status"],
        options=[PollResultOption(**o) for o in results["options"]],
        total_votes=results["total_votes"],
    )
    return VoteResponse(success=True, message="Vote submitted successfully", results=poll_results)
