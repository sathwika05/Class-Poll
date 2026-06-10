import random
import uuid
from collections import defaultdict
from datetime import datetime, timedelta
from time import time
from typing import Dict, List

from fastapi import HTTPException


def generate_code() -> str:
    return str(random.randint(100000, 999999))


def generate_token() -> str:
    return str(uuid.uuid4())


def get_code_expiry() -> datetime:
    return datetime.utcnow() + timedelta(minutes=15)


def is_code_expired(expires_at: datetime) -> bool:
    return datetime.utcnow() > expires_at


def compute_poll_results(poll, options, votes) -> dict:
    total_votes = len(votes)
    vote_counts: Dict[int, int] = defaultdict(int)
    for vote in votes:
        vote_counts[vote.option_id] += 1

    result_options = []
    for option in options:
        count = vote_counts.get(option.id, 0)
        percentage = round((count / total_votes * 100), 1) if total_votes > 0 else 0.0
        result_options.append({
            "id": option.id,
            "text": option.text,
            "count": count,
            "percentage": percentage,
        })

    return {
        "poll_id": poll.id,
        "question": poll.question,
        "status": poll.status,
        "options": result_options,
        "total_votes": total_votes,
    }


# Simple in-memory rate limiter (per-process, resets on restart)
_rate_store: Dict[str, List[float]] = defaultdict(list)


def check_rate_limit(key: str, max_calls: int, window_seconds: int) -> None:
    now = time()
    window_start = now - window_seconds
    _rate_store[key] = [t for t in _rate_store[key] if t > window_start]
    if len(_rate_store[key]) >= max_calls:
        raise HTTPException(status_code=429, detail="Too many requests. Please wait before trying again.")
    _rate_store[key].append(now)
