from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class SessionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)


class SessionResponse(BaseModel):
    id: int
    name: str
    code: str
    status: str
    created_at: datetime
    code_expires_at: datetime
    participant_count: int = 0
    poll_count: int = 0

    model_config = {"from_attributes": True}


class PollOptionResponse(BaseModel):
    id: int
    text: str
    order: int

    model_config = {"from_attributes": True}


class PollCreate(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)
    options: List[str] = Field(..., min_length=2, max_length=10)


class PollResponse(BaseModel):
    id: int
    session_id: int
    question: str
    status: str
    created_at: datetime
    opened_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    options: List[PollOptionResponse] = []

    model_config = {"from_attributes": True}


class PollResultOption(BaseModel):
    id: int
    text: str
    count: int
    percentage: float


class PollResults(BaseModel):
    poll_id: int
    question: str
    status: str
    options: List[PollResultOption]
    total_votes: int


class JoinRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)
    name: str = Field(..., min_length=1, max_length=200)
    student_id: Optional[str] = Field(None, max_length=100)
    token: Optional[str] = None


class JoinResponse(BaseModel):
    session_id: int
    participant_id: int
    token: str
    session_name: str
    session_status: str
    session_code: str
    code_expires_at: datetime


class VoteRequest(BaseModel):
    option_id: int
    participant_token: str


class VoteResponse(BaseModel):
    success: bool
    message: str
    results: Optional[PollResults] = None


class ParticipantRecord(BaseModel):
    id: int
    name: str
    student_id: Optional[str] = None
    joined_at: datetime

    model_config = {"from_attributes": True}


class AttendanceResponse(BaseModel):
    session_id: int
    count: int
    participants: List[ParticipantRecord]
