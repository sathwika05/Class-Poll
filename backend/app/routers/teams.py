"""
Microsoft Teams Incoming Webhook integration for ClassPoll.

Posts Adaptive Cards to a configured Teams channel on these events:
  - session_started  → session name + join code
  - session_closed   → attendance summary
  - poll_opened      → question + answer options
  - poll_closed      → full results with vote counts / percentages

Setup (Teams side):
  1. Open the channel you want notifications in.
  2. Click ··· → Connectors → Incoming Webhook → Configure.
  3. Name it "ClassPoll", copy the webhook URL, paste it in the
     professor dashboard's Teams panel.

Routes:
  POST /api/teams/notify  – send a real event notification
  POST /api/teams/test    – send a canned test card to verify the URL
"""

from typing import Any, Dict, List

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


# ---------------------------------------------------------------------------
# Request schema
# ---------------------------------------------------------------------------

class TeamsNotifyRequest(BaseModel):
    webhook_url: str
    event_type: str   # session_started | session_closed | poll_opened | poll_closed
    payload: Dict[str, Any]


# ---------------------------------------------------------------------------
# Adaptive Card builders
# ---------------------------------------------------------------------------

def _card(body: List[Dict]) -> Dict:
    """Wrap body items in a Teams-compatible Adaptive Card message."""
    return {
        "type": "message",
        "attachments": [{
            "contentType": "application/vnd.microsoft.card.adaptive",
            "content": {
                "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                "type": "AdaptiveCard",
                "version": "1.4",
                "body": body,
            },
        }],
    }


def _build_session_started_card(p: Dict[str, Any]) -> Dict:
    return _card([
        {
            "type": "Container",
            "style": "accent",
            "items": [{
                "type": "TextBlock",
                "text": "🎓 ClassPoll Session Started",
                "weight": "Bolder",
                "size": "Large",
                "color": "Light",
            }],
        },
        {
            "type": "FactSet",
            "facts": [
                {"title": "Session", "value": p.get("name", "")},
                {"title": "Join Code", "value": f"**{p.get('code', '')}**"},
                {"title": "Status",   "value": "🟢 Active"},
            ],
        },
        {
            "type": "TextBlock",
            "text": (
                f"Students can join using code **{p.get('code', '')}**. "
                "No app install required."
            ),
            "wrap": True,
            "color": "Good",
        },
    ])


def _build_session_closed_card(p: Dict[str, Any]) -> Dict:
    return _card([
        {
            "type": "Container",
            "style": "emphasis",
            "items": [{
                "type": "TextBlock",
                "text": "🏁 ClassPoll Session Ended",
                "weight": "Bolder",
                "size": "Large",
            }],
        },
        {
            "type": "FactSet",
            "facts": [
                {"title": "Session",          "value": p.get("name", "")},
                {"title": "Total Attendance", "value": str(p.get("participant_count", 0))},
                {"title": "Polls Run",        "value": str(p.get("poll_count", 0))},
                {"title": "Status",           "value": "🔴 Closed"},
            ],
        },
    ])


def _build_poll_opened_card(p: Dict[str, Any]) -> Dict:
    options: List[str] = p.get("options", [])
    option_blocks = [
        {"type": "TextBlock", "text": f"• {opt}", "wrap": True, "spacing": "Small"}
        for opt in options
    ]
    return _card([
        {
            "type": "Container",
            "style": "accent",
            "items": [{
                "type": "TextBlock",
                "text": "📊 New Poll",
                "weight": "Bolder",
                "size": "Large",
                "color": "Light",
            }],
        },
        {
            "type": "TextBlock",
            "text": p.get("question", ""),
            "weight": "Bolder",
            "size": "Medium",
            "wrap": True,
        },
        *option_blocks,
    ])


def _build_poll_closed_card(p: Dict[str, Any]) -> Dict:
    results = p.get("results") or {}
    options = results.get("options") or []
    total   = results.get("total_votes", 0)
    question = results.get("question") or p.get("question", "Poll")

    result_facts = [
        {
            "title": opt["text"],
            "value": (
                f"{opt['count']} vote{'s' if opt['count'] != 1 else ''} "
                f"({opt['percentage']:.0f}%)"
            ),
        }
        for opt in options
    ]

    return _card([
        {
            "type": "Container",
            "style": "good",
            "items": [{
                "type": "TextBlock",
                "text": "✅ Poll Closed — Results",
                "weight": "Bolder",
                "size": "Large",
                "color": "Light",
            }],
        },
        {
            "type": "TextBlock",
            "text": question,
            "weight": "Bolder",
            "wrap": True,
        },
        {"type": "FactSet", "facts": result_facts},
        {
            "type": "TextBlock",
            "text": f"Total responses: {total}",
            "isSubtle": True,
            "size": "Small",
        },
    ])


_CARD_BUILDERS: Dict[str, Any] = {
    "session_started": _build_session_started_card,
    "session_closed":  _build_session_closed_card,
    "poll_opened":     _build_poll_opened_card,
    "poll_closed":     _build_poll_closed_card,
}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

async def _post_to_teams(webhook_url: str, card: Dict) -> None:
    """POST an Adaptive Card to a Teams Incoming Webhook URL."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                webhook_url,
                json=card,
                headers={"Content-Type": "application/json"},
            )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not reach Teams webhook: {exc}")

    # Teams returns 200 with body "1" on success.
    # Some org policies return 202. Anything else is an error.
    if resp.status_code not in (200, 202):
        raise HTTPException(
            status_code=502,
            detail=f"Teams webhook returned HTTP {resp.status_code}: {resp.text[:300]}",
        )


@router.post("/teams/notify")
async def notify_teams(request: TeamsNotifyRequest):
    """
    Send a ClassPoll event notification to a Teams channel via Incoming Webhook.

    Body:
        webhook_url  – Teams Incoming Webhook URL
        event_type   – one of: session_started | session_closed | poll_opened | poll_closed
        payload      – event-specific data (see card builders above)
    """
    builder = _CARD_BUILDERS.get(request.event_type)
    if not builder:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown event_type '{request.event_type}'. "
                   f"Valid types: {', '.join(_CARD_BUILDERS)}",
        )

    card = builder(request.payload)
    await _post_to_teams(request.webhook_url, card)
    return {"ok": True, "event_type": request.event_type}


@router.post("/teams/test")
async def test_teams_webhook(body: dict):
    """
    Send a canned 'session started' card to verify a webhook URL works.

    Body: { "webhook_url": "https://..." }
    """
    webhook_url = body.get("webhook_url", "")
    if not webhook_url:
        raise HTTPException(status_code=400, detail="webhook_url is required")

    card = _build_session_started_card({
        "name": "Test Session",
        "code": "123456",
    })
    await _post_to_teams(webhook_url, card)
    return {"ok": True, "message": "Test notification sent to Teams."}
