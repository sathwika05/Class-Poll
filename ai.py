import json
import os
from typing import Any, Literal, Optional

from fastapi import APIRouter, HTTPException
from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from dotenv import load_dotenv

router = APIRouter()

load_dotenv()

AI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.5")


class QuizGenerationRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=200)
    lecture_notes: str = Field(..., min_length=20)
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    question_count: int = Field(default=5, ge=1, le=20)


class PollsFromNotesRequest(BaseModel):
    lecture_title: str = Field(..., min_length=3, max_length=200)
    lecture_notes: str = Field(..., min_length=20)
    poll_count: int = Field(default=5, ge=1, le=15)


class PollOptionSnapshot(BaseModel):
    id: str
    text: str
    votes: int = Field(default=0, ge=0)


class PollResultSnapshot(BaseModel):
    question_id: str
    question: str
    options: list[PollOptionSnapshot] = Field(..., min_length=2)
    correct_option_id: Optional[str] = None
    started_at: Optional[str] = None
    ended_at: Optional[str] = None


class StudentResponseSnapshot(BaseModel):
    student_id: Optional[str] = None
    display_name: Optional[str] = None
    question_id: Optional[str] = None
    answer_text: str
    created_at: Optional[str] = None


class SessionSummaryRequest(BaseModel):
    session_title: str = Field(..., min_length=3, max_length=200)
    attendance_count: int = Field(default=0, ge=0)
    total_expected: Optional[int] = Field(default=None, gt=0)
    poll_results: list[PollResultSnapshot] = Field(default_factory=list)
    student_questions_or_comments: list[StudentResponseSnapshot] = Field(default_factory=list)


class EngagementAnalysisRequest(BaseModel):
    session_title: str = Field(..., min_length=3, max_length=200)
    attendance_count: int = Field(default=0, ge=0)
    total_expected: Optional[int] = Field(default=None, gt=0)
    poll_results: list[PollResultSnapshot] = Field(default_factory=list)
    joined_student_ids: list[str] = Field(default_factory=list)
    voted_student_ids: list[str] = Field(default_factory=list)


class SentimentAnalysisRequest(BaseModel):
    session_title: str = Field(..., min_length=3, max_length=200)
    responses: list[StudentResponseSnapshot] = Field(..., min_length=1)


class TrendRecommendationRequest(BaseModel):
    course_name: str = Field(..., min_length=3, max_length=200)
    recent_sessions: list[SessionSummaryRequest] = Field(..., min_length=1)


async def _json_ai_response(system_prompt: str, payload: BaseModel) -> dict[str, Any]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not configured on the backend.")

    client = AsyncOpenAI(api_key=api_key)
    response = await client.responses.create(
        model=AI_MODEL,
        instructions=system_prompt,
        input=payload.model_dump_json(),
    )

    try:
        return json.loads(response.output_text)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="AI response was not valid JSON.") from exc


@router.post("/ai/quiz-questions")
async def generate_quiz_questions(data: QuizGenerationRequest):
    return await _json_ai_response(
        """
        You generate classroom quiz questions for ClassPoll.
        Return JSON only:
        {
          "questions": [
            {
              "question": "string",
              "options": ["A", "B", "C", "D"],
              "correct_answer_index": 0,
              "explanation": "string",
              "difficulty": "easy|medium|hard",
              "topic_tag": "string"
            }
          ]
        }
        Generate exactly question_count questions. Use four clear options.
        Every question must be answerable from the lecture notes.
        """,
        data,
    )


@router.post("/ai/polls-from-notes")
async def generate_polls_from_notes(data: PollsFromNotesRequest):
    return await _json_ai_response(
        """
        You create live classroom poll questions from lecture notes for ClassPoll.
        Return JSON only:
        {
          "polls": [
            {
              "question": "string",
              "options": ["A", "B", "C", "D"],
              "poll_type": "concept_check|opinion|prediction|review",
              "teaching_goal": "string"
            }
          ]
        }
        Generate exactly poll_count polls. Keep questions short enough for phones.
        """,
        data,
    )


@router.post("/ai/session-summary")
async def generate_session_summary(data: SessionSummaryRequest):
    return await _json_ai_response(
        """
        You summarize a live ClassPoll classroom session for a professor.
        Return JSON only:
        {
          "summary": "string",
          "attendance": {"count": 0, "estimated_rate": "string", "note": "string"},
          "strong_concepts": ["string"],
          "confusing_concepts": ["string"],
          "notable_polls": [{"question": "string", "takeaway": "string"}],
          "suggested_follow_up": ["string"]
        }
        Be specific about poll patterns. Do not invent student identities.
        """,
        data,
    )


@router.post("/ai/engagement-analysis")
async def analyze_engagement(data: EngagementAnalysisRequest):
    return await _json_ai_response(
        """
        You analyze classroom engagement for ClassPoll.
        Return JSON only:
        {
          "engagement_score": 0,
          "engagement_level": "low|moderate|high",
          "participation_rate": "string",
          "attendance_rate": "string",
          "signals": ["string"],
          "risks": ["string"],
          "recommended_actions": ["string"]
        }
        Score must be 0 to 100. Use attendance, vote participation, and poll result spread.
        """,
        data,
    )


@router.post("/ai/sentiment-analysis")
async def analyze_sentiment(data: SentimentAnalysisRequest):
    return await _json_ai_response(
        """
        You analyze student sentiment from classroom free-text responses.
        Return JSON only:
        {
          "overall_sentiment": "negative|mixed|neutral|positive",
          "confidence": 0,
          "themes": [
            {
              "theme": "string",
              "sentiment": "negative|mixed|neutral|positive",
              "evidence_summary": "string"
            }
          ],
          "concerns": ["string"],
          "positive_signals": ["string"],
          "recommended_instructor_response": "string"
        }
        Do not quote personally identifying details. Note uncertainty when responses are short.
        """,
        data,
    )


@router.post("/ai/learning-recommendations")
async def recommend_learning_trends(data: TrendRecommendationRequest):
    return await _json_ai_response(
        """
        You identify learning trends across recent ClassPoll sessions.
        Return JSON only:
        {
          "trend_summary": "string",
          "improving_areas": ["string"],
          "declining_areas": ["string"],
          "persistent_gaps": ["string"],
          "recommended_mini_lessons": [
            {"topic": "string", "reason": "string", "activity": "string"}
          ],
          "next_poll_ideas": ["string"]
        }
        Compare recent sessions and give practical recommendations for the next class.
        """,
        data,
    )
