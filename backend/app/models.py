from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(6), unique=True, nullable=False, index=True)
    status = Column(String(20), default="pending", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    code_expires_at = Column(DateTime, nullable=False)

    participants = relationship("Participant", back_populates="session")
    polls = relationship("Poll", back_populates="session")


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    name = Column(String(200), nullable=False)
    student_id = Column(String(100), nullable=True)
    token = Column(String(100), unique=True, nullable=False, index=True)
    joined_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="participants")
    votes = relationship("Vote", back_populates="participant")


class Poll(Base):
    __tablename__ = "polls"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    question = Column(String(500), nullable=False)
    status = Column(String(20), default="pending", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    opened_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)

    session = relationship("Session", back_populates="polls")
    options = relationship("PollOption", back_populates="poll", order_by="PollOption.order")
    votes = relationship("Vote", back_populates="poll")


class PollOption(Base):
    __tablename__ = "poll_options"

    id = Column(Integer, primary_key=True, index=True)
    poll_id = Column(Integer, ForeignKey("polls.id"), nullable=False)
    text = Column(String(300), nullable=False)
    order = Column(Integer, default=0)

    poll = relationship("Poll", back_populates="options")
    votes = relationship("Vote", back_populates="option")


class Vote(Base):
    __tablename__ = "votes"
    __table_args__ = (
        UniqueConstraint("poll_id", "participant_id", name="uq_vote_poll_participant"),
    )

    id = Column(Integer, primary_key=True, index=True)
    poll_id = Column(Integer, ForeignKey("polls.id"), nullable=False)
    participant_id = Column(Integer, ForeignKey("participants.id"), nullable=False)
    option_id = Column(Integer, ForeignKey("poll_options.id"), nullable=False)
    voted_at = Column(DateTime, default=datetime.utcnow)

    poll = relationship("Poll", back_populates="votes")
    participant = relationship("Participant", back_populates="votes")
    option = relationship("PollOption", back_populates="votes")
