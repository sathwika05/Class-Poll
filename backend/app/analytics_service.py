"""Analytics computation for ClassPoll historical and semester-wide insights."""
import math
from collections import defaultdict
from datetime import datetime
from typing import Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Session, Participant, Poll, Vote


def _entropy_percentages(percentages: List[float]) -> float:
    """Normalized Shannon entropy (0 = unanimous, 1 = evenly split)."""
    if not percentages or sum(percentages) == 0:
        return 0.0
    total = sum(percentages)
    probs = [p / total for p in percentages if p > 0]
    if len(probs) <= 1:
        return 0.0
    entropy = -sum(p * math.log2(p) for p in probs)
    max_entropy = math.log2(len(probs))
    return round(entropy / max_entropy, 3) if max_entropy > 0 else 0.0


def _student_key(name: str, student_id: Optional[str]) -> str:
    if student_id:
        return f"id:{student_id.strip().lower()}"
    return f"name:{name.strip().lower()}"


async def _load_all_sessions(db: AsyncSession) -> List[Session]:
    result = await db.execute(
        select(Session)
        .options(
            selectinload(Session.participants),
            selectinload(Session.polls).selectinload(Poll.options),
            selectinload(Session.polls).selectinload(Poll.votes),
        )
        .order_by(Session.created_at.asc())
    )
    return list(result.scalars().all())


def _poll_results(poll: Poll) -> dict:
    votes = poll.votes or []
    options = sorted(poll.options or [], key=lambda o: o.order)
    total = len(votes)
    counts: Dict[int, int] = defaultdict(int)
    for v in votes:
        counts[v.option_id] += 1
    result_options = []
    for opt in options:
        count = counts.get(opt.id, 0)
        pct = round(count / total * 100, 1) if total else 0.0
        result_options.append({"id": opt.id, "text": opt.text, "count": count, "percentage": pct})
    return {
        "poll_id": poll.id,
        "question": poll.question,
        "status": poll.status,
        "options": result_options,
        "total_votes": total,
    }


async def build_analytics_dashboard(db: AsyncSession) -> dict:
    sessions = await _load_all_sessions(db)
    total_sessions = len(sessions)
    total_participants = sum(len(s.participants) for s in sessions)
    total_polls = sum(len(s.polls) for s in sessions)
    total_votes = sum(len(p.votes) for s in sessions for p in s.polls)

    attendance_trends = []
    participation_trends = []
    historical_insights = []
    question_difficulty = []
    performance_analytics = []

    student_stats: Dict[str, dict] = defaultdict(lambda: {
        "name": "",
        "student_id": None,
        "sessions_attended": 0,
        "polls_available": 0,
        "polls_answered": 0,
        "votes_submitted": 0,
    })

    for session in sessions:
        participant_count = len(session.participants)
        closed_polls = [p for p in session.polls if p.status == "closed"]
        all_polls = session.polls
        session_votes = sum(len(p.votes) for p in all_polls)
        polls_with_votes = sum(1 for p in all_polls if len(p.votes) > 0)

        avg_participation = 0.0
        if participant_count > 0 and all_polls:
            rates = [len(p.votes) / participant_count * 100 for p in all_polls]
            avg_participation = round(sum(rates) / len(rates), 1)

        attendance_trends.append({
            "session_id": session.id,
            "session_name": session.name,
            "date": session.created_at.isoformat(),
            "status": session.status,
            "participant_count": participant_count,
        })

        participation_trends.append({
            "session_id": session.id,
            "session_name": session.name,
            "date": session.created_at.isoformat(),
            "participant_count": participant_count,
            "total_votes": session_votes,
            "poll_count": len(all_polls),
            "participation_rate": avg_participation,
        })

        poll_summaries = []
        for poll in all_polls:
            results = _poll_results(poll)
            part_rate = round(len(poll.votes) / participant_count * 100, 1) if participant_count else 0.0
            pcts = [o["percentage"] for o in results["options"]]
            spread = _entropy_percentages(pcts)
            top_pct = max(pcts) if pcts else 0.0
            difficulty = round((spread * 0.6 + (100 - part_rate) / 100 * 0.4) * 100, 1)

            poll_summaries.append({
                "poll_id": poll.id,
                "question": poll.question,
                "status": poll.status,
                "total_votes": results["total_votes"],
                "participation_rate": part_rate,
            })

            if poll.status == "closed" or results["total_votes"] > 0:
                question_difficulty.append({
                    "poll_id": poll.id,
                    "session_id": session.id,
                    "session_name": session.name,
                    "question": poll.question,
                    "participation_rate": part_rate,
                    "answer_spread": round(spread * 100, 1),
                    "top_answer_percentage": top_pct,
                    "difficulty_score": difficulty,
                    "difficulty_label": (
                        "Hard" if difficulty >= 70 else "Medium" if difficulty >= 40 else "Easy"
                    ),
                })

        historical_insights.append({
            "session_id": session.id,
            "session_name": session.name,
            "date": session.created_at.isoformat(),
            "status": session.status,
            "participant_count": participant_count,
            "poll_count": len(all_polls),
            "closed_poll_count": len(closed_polls),
            "total_votes": session_votes,
            "avg_participation_rate": avg_participation,
            "polls": poll_summaries,
        })

        performance_analytics.append({
            "session_id": session.id,
            "session_name": session.name,
            "date": session.created_at.isoformat(),
            "attendance": participant_count,
            "engagement_rate": avg_participation,
            "polls_completed": polls_with_votes,
            "total_polls": len(all_polls),
            "completion_rate": round(polls_with_votes / len(all_polls) * 100, 1) if all_polls else 0.0,
        })

        participant_ids = {p.id: p for p in session.participants}
        for p in session.participants:
            key = _student_key(p.name, p.student_id)
            student_stats[key]["name"] = p.name
            student_stats[key]["student_id"] = p.student_id
            student_stats[key]["sessions_attended"] += 1
            student_stats[key]["polls_available"] += len(all_polls)

        for poll in all_polls:
            for vote in poll.votes:
                participant = participant_ids.get(vote.participant_id)
                if not participant:
                    continue
                key = _student_key(participant.name, participant.student_id)
                student_stats[key]["polls_answered"] += 1
                student_stats[key]["votes_submitted"] += 1

    engagement_metrics = []
    for stats in student_stats.values():
        available = stats["polls_available"]
        answered = stats["polls_answered"]
        rate = round(answered / available * 100, 1) if available else 0.0
        score = round(min(100, stats["sessions_attended"] * 15 + rate * 0.85), 1)
        engagement_metrics.append({
            "name": stats["name"],
            "student_id": stats["student_id"],
            "sessions_attended": stats["sessions_attended"],
            "polls_answered": answered,
            "polls_available": available,
            "participation_rate": rate,
            "engagement_score": score,
            "engagement_level": (
                "High" if score >= 75 else "Medium" if score >= 45 else "Low"
            ),
        })
    engagement_metrics.sort(key=lambda x: x["engagement_score"], reverse=True)
    question_difficulty.sort(key=lambda x: x["difficulty_score"], reverse=True)

    avg_attendance = round(total_participants / total_sessions, 1) if total_sessions else 0.0
    avg_participation = round(
        sum(t["participation_rate"] for t in participation_trends) / len(participation_trends), 1
    ) if participation_trends else 0.0

    return {
        "overview": {
            "total_sessions": total_sessions,
            "total_participants": total_participants,
            "total_polls": total_polls,
            "total_votes": total_votes,
            "avg_attendance_per_session": avg_attendance,
            "avg_participation_rate": avg_participation,
            "unique_students": len(student_stats),
            "generated_at": datetime.utcnow().isoformat(),
        },
        "attendance_trends": attendance_trends,
        "participation_trends": participation_trends,
        "engagement_metrics": engagement_metrics,
        "historical_insights": list(reversed(historical_insights)),
        "semester_report": {
            "period_start": sessions[0].created_at.isoformat() if sessions else None,
            "period_end": sessions[-1].created_at.isoformat() if sessions else None,
            "total_sessions": total_sessions,
            "total_class_hours_proxy": total_sessions,
            "total_students": len(student_stats),
            "total_polls": total_polls,
            "total_votes": total_votes,
            "avg_attendance": avg_attendance,
            "avg_participation_rate": avg_participation,
            "top_engaged_students": engagement_metrics[:5],
            "hardest_questions": question_difficulty[:5],
            "session_summaries": [
                {
                    "session_id": s["session_id"],
                    "session_name": s["session_name"],
                    "attendance": s["participant_count"],
                    "participation_rate": s["avg_participation_rate"],
                }
                for s in historical_insights
            ],
        },
        "question_difficulty": question_difficulty,
        "performance_analytics": performance_analytics,
    }


async def build_session_analytics(db: AsyncSession, session_id: int) -> Optional[dict]:
    result = await db.execute(
        select(Session)
        .options(
            selectinload(Session.participants),
            selectinload(Session.polls).selectinload(Poll.options),
            selectinload(Session.polls).selectinload(Poll.votes),
        )
        .where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        return None

    dashboard = await build_analytics_dashboard(db)
    session_data = next(
        (h for h in dashboard["historical_insights"] if h["session_id"] == session_id),
        None,
    )
    session_performance = next(
        (p for p in dashboard["performance_analytics"] if p["session_id"] == session_id),
        None,
    )
    session_questions = [
        q for q in dashboard["question_difficulty"] if q["session_id"] == session_id
    ]
    participant_count = len(session.participants)
    per_student = []
    for p in session.participants:
        answered = sum(
            1 for poll in session.polls
            for v in poll.votes if v.participant_id == p.id
        )
        available = len(session.polls)
        rate = round(answered / available * 100, 1) if available else 0.0
        per_student.append({
            "participant_id": p.id,
            "name": p.name,
            "student_id": p.student_id,
            "joined_at": p.joined_at.isoformat(),
            "polls_answered": answered,
            "polls_available": available,
            "participation_rate": rate,
        })

    return {
        "session_id": session_id,
        "session_name": session.name,
        "status": session.status,
        "created_at": session.created_at.isoformat(),
        "participant_count": participant_count,
        "historical": session_data,
        "performance": session_performance,
        "question_difficulty": session_questions,
        "student_participation": sorted(per_student, key=lambda x: x["participation_rate"], reverse=True),
    }
