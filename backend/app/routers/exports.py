import csv
import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Session, Participant, Poll, PollOption, Vote
from app.utils import compute_poll_results

router = APIRouter()


@router.get("/sessions/{session_id}/export/attendance")
async def export_attendance(session_id: int, db: AsyncSession = Depends(get_db)):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    participants = (await db.execute(
        select(Participant).where(Participant.session_id == session_id).order_by(Participant.joined_at)
    )).scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["#", "Name", "Student ID", "Joined At"])
    for i, p in enumerate(participants, 1):
        writer.writerow([i, p.name, p.student_id or "", p.joined_at.strftime("%Y-%m-%d %H:%M:%S")])

    output.seek(0)
    filename = f"attendance_{session.name.replace(' ', '_')}_{session_id}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/sessions/{session_id}/export/results")
async def export_results(session_id: int, db: AsyncSession = Depends(get_db)):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    polls = (await db.execute(
        select(Poll)
        .options(selectinload(Poll.options), selectinload(Poll.votes))
        .where(Poll.session_id == session_id)
        .order_by(Poll.created_at)
    )).scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Poll #", "Question", "Status", "Option", "Votes", "Percentage", "Total Votes"])

    for i, poll in enumerate(polls, 1):
        results = compute_poll_results(poll, poll.options, poll.votes)
        for option in results["options"]:
            writer.writerow([
                i,
                poll.question,
                poll.status,
                option["text"],
                option["count"],
                f"{option['percentage']}%",
                results["total_votes"],
            ])
        if not results["options"]:
            writer.writerow([i, poll.question, poll.status, "", 0, "0%", 0])

    output.seek(0)
    filename = f"results_{session.name.replace(' ', '_')}_{session_id}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
