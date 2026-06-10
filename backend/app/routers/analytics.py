from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.analytics_service import build_analytics_dashboard, build_session_analytics

router = APIRouter()


@router.get("/analytics/dashboard")
async def get_analytics_dashboard(db: AsyncSession = Depends(get_db)):
    """Advanced analytics dashboard with all semester-wide metrics."""
    return await build_analytics_dashboard(db)


@router.get("/analytics/attendance-trends")
async def get_attendance_trends(db: AsyncSession = Depends(get_db)):
    data = await build_analytics_dashboard(db)
    return {"trends": data["attendance_trends"]}


@router.get("/analytics/participation-trends")
async def get_participation_trends(db: AsyncSession = Depends(get_db)):
    data = await build_analytics_dashboard(db)
    return {"trends": data["participation_trends"]}


@router.get("/analytics/engagement")
async def get_engagement_metrics(db: AsyncSession = Depends(get_db)):
    data = await build_analytics_dashboard(db)
    return {"students": data["engagement_metrics"]}


@router.get("/analytics/historical")
async def get_historical_insights(db: AsyncSession = Depends(get_db)):
    data = await build_analytics_dashboard(db)
    return {"sessions": data["historical_insights"]}


@router.get("/analytics/semester-report")
async def get_semester_report(db: AsyncSession = Depends(get_db)):
    data = await build_analytics_dashboard(db)
    return data["semester_report"]


@router.get("/analytics/question-difficulty")
async def get_question_difficulty(db: AsyncSession = Depends(get_db)):
    data = await build_analytics_dashboard(db)
    return {"questions": data["question_difficulty"]}


@router.get("/analytics/performance")
async def get_performance_analytics(db: AsyncSession = Depends(get_db)):
    data = await build_analytics_dashboard(db)
    return {"sessions": data["performance_analytics"]}


@router.get("/analytics/sessions/{session_id}")
async def get_session_analytics(session_id: int, db: AsyncSession = Depends(get_db)):
    """Classroom performance analytics for a single session."""
    result = await build_session_analytics(db, session_id)
    if not result:
        raise HTTPException(status_code=404, detail="Session not found")
    return result
