# ClassPoll — Real-Time Classroom Polling

A complete real-time classroom polling and attendance system built with **FastAPI** (Python) and **Next.js** (TypeScript). Includes live WebSocket updates, analytics dashboards, AI-powered teaching tools, and optional Microsoft Teams notifications.

---

## Architecture

```
Class-Poll/
├── backend/                 # FastAPI Python backend
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, WebSocket endpoint
│   │   ├── database.py      # Async SQLAlchemy + SQLite setup
│   │   ├── models.py        # ORM models (Session, Participant, Poll, Vote…)
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   ├── websocket_manager.py  # Manages per-session WebSocket connections
│   │   ├── utils.py         # Code generation, token generation, rate limiter
│   │   ├── analytics_service.py  # Aggregation logic for analytics
│   │   └── routers/
│   │       ├── sessions.py      # Session lifecycle APIs
│   │       ├── polls.py         # Poll lifecycle + voting APIs
│   │       ├── participants.py  # Join / reconnect API
│   │       ├── exports.py       # CSV export endpoints
│   │       ├── analytics.py     # Analytics & insights APIs
│   │       ├── ai.py            # AI quiz, summary, sentiment, and trend APIs
│   │       └── teams.py         # Microsoft Teams webhook notifications
│   ├── requirements.txt
│   └── start.sh             # Convenience script to create venv and start server
│
└── frontend/                # Next.js 14 App Router frontend
    ├── app/
    │   ├── page.tsx                     # Landing page
    │   ├── professor/page.tsx           # Professor dashboard
    │   ├── analytics/page.tsx           # Analytics & insights dashboard
    │   ├── student/page.tsx             # Student join + voting
    │   ├── ai-demo/page.tsx             # AI feature preview (static demo)
    │   └── display/[sessionId]/page.tsx # Projector display
    ├── components/
    │   ├── professor/  SessionPanel, PollPanel, AttendancePanel, ResultsPanel, QRCard, TeamsPanel
    │   ├── analytics/  MetricCard, TrendChart, EngagementTable
    │   ├── student/    JoinForm, VotingPanel
    │   └── display/    DisplayPanel
    └── lib/
        ├── types.ts     # TypeScript interfaces
        ├── api.ts       # REST API client
        └── websocket.ts # Auto-reconnecting WebSocket class
```

---

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
```

**Activate the virtual environment:**

| Platform | Command |
|----------|---------|
| macOS / Linux | `source venv/bin/activate` |
| Windows (PowerShell) | `venv\Scripts\Activate.ps1` |
| Windows (cmd) | `venv\Scripts\activate.bat` |

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or on macOS/Linux, use the helper script:

```bash
cd backend
./start.sh
```

The API runs at **http://localhost:8000**.  
Use `--host 0.0.0.0` so phones on the same Wi‑Fi can reach the backend.  
Interactive docs: http://localhost:8000/docs

On startup, the backend prints your LAN IP and the student join URL.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at **http://localhost:3000**.  
`npm run dev` binds to all interfaces (`0.0.0.0`) so phones can connect via your machine's LAN IP.

### Join from a phone (same Wi‑Fi)

1. Find your computer's LAN IP:
   - **Windows:** `ipconfig` → look for IPv4 Address (e.g. `192.168.1.89`)
   - **macOS:** `ipconfig getifaddr en0`
   - **Linux:** `hostname -I | awk '{print $1}'`
2. Start the backend with `--host 0.0.0.0` (see above)
3. On your phone, open: `http://YOUR_IP:3000/student`
4. Or scan the QR code on the professor page (do **not** use `localhost` on your phone)

The professor dashboard QR code uses the backend `/api/server-info` endpoint to build a phone-friendly join link automatically.

If the page loads but join fails, the backend is still bound to localhost — restart it with `--host 0.0.0.0`.

---

## Pages

| URL | Description |
|-----|-------------|
| `/` | Landing page — links to Professor / Student |
| `/professor` | Professor dashboard — create sessions, manage polls, see live results & attendance |
| `/analytics` | Analytics & insights — attendance trends, engagement metrics, semester report |
| `/student` | Student page — join with a code and vote on polls |
| `/ai-demo` | Demo page — preview AI-powered teaching tools (static UI mockup) |
| `/display/[session-id]` | Projector-friendly live display for a session |

---

## Features

### Professor
- Create a named session → get a random 6-digit join code (valid 15 min)
- Start / Pause / Resume / Close the session
- Create multiple-choice polls (2–8 options)
- Open / Pause / Resume / Close individual polls
- Watch attendance list update live via WebSocket
- Watch poll results update in real-time as students vote
- QR code + copyable join link for student onboarding (LAN IP aware)
- Open projector view in a new tab
- Export attendance to CSV
- Export all poll results to CSV
- Session persists across professor page refreshes (via localStorage)
- Optional Microsoft Teams notifications (see below)

### Microsoft Teams Integration
- Configure an Incoming Webhook URL in the professor dashboard's Teams panel
- Send Adaptive Card notifications to a Teams channel on:
  - **Session started** — session name + join code
  - **Session closed** — attendance summary
  - **Poll opened** — question + answer options
  - **Poll closed** — full results with vote counts and percentages
- Test webhook button to verify setup before going live
- Webhook URL and enable/disable state stored in browser localStorage (no backend secrets required)

### Analytics & Insights
- Advanced analytics dashboard at `/analytics`
- **Attendance trends** — participant counts per session over time
- **Participation trends** — poll participation rate across sessions
- **Student engagement metrics** — per-student scores based on sessions attended and poll participation
- **Historical classroom insights** — expandable session history with per-poll breakdown
- **Semester-wide reporting** — period summary, top engaged students, hardest questions
- **Question difficulty analysis** — inferred from answer spread and participation rate
- **Classroom performance analytics** — attendance vs engagement per session
- **Session drill-down** — per-student participation for any past session

### Student
- Join with 6-digit code + name + optional student ID
- Participant token stored in localStorage — survives page refresh / network loss
- Reconnects automatically to the same session on reload
- Sees active poll and submits exactly one vote per poll
- Sees feedback (waiting / paused / voted / closed) for every poll state
- Rate-limited: max 10 join requests per minute, max 5 vote requests per minute per token

### Display (Projector)
- Dark theme, large text — readable from across a classroom
- Shows session name, student count, live connection status
- Shows active poll question with animated progress bars
- Percentages and vote counts update in real-time
- Auto-reconnects WebSocket on disconnect

### AI-Powered Features
Requires an OpenAI API key (see Environment Variables). Available via REST API; `/ai-demo` shows a static preview of the UI.

- Generate multiple-choice quiz questions from lecture notes
- Generate live polls from lecture notes
- Create automatic session summaries from attendance, poll results, and student comments
- Analyze student engagement using attendance and voting patterns
- Analyze sentiment from classroom text responses
- Recommend follow-up lessons and future poll ideas from learning trends

---

## REST API Reference

### Health & Server Info
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/server-info` | Returns `{ "local_ip": "..." }` for QR/join links |

### Sessions
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/sessions` | Create session |
| GET | `/api/sessions` | List all sessions |
| GET | `/api/sessions/{id}` | Get session |
| POST | `/api/sessions/{id}/start` | Start session |
| POST | `/api/sessions/{id}/pause` | Pause session (auto-pauses open polls) |
| POST | `/api/sessions/{id}/resume` | Resume session |
| POST | `/api/sessions/{id}/close` | Close session (closes all polls) |
| GET | `/api/sessions/{id}/attendance` | Get attendance list |
| GET | `/api/sessions/{id}/results` | Get all poll results |
| GET | `/api/sessions/{id}/export/attendance` | Download attendance CSV |
| GET | `/api/sessions/{id}/export/results` | Download results CSV |

### Polls
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/sessions/{id}/polls` | Create poll |
| GET | `/api/sessions/{id}/polls` | List polls |
| POST | `/api/polls/{id}/open` | Open poll for voting |
| POST | `/api/polls/{id}/pause` | Pause poll |
| POST | `/api/polls/{id}/resume` | Resume poll |
| POST | `/api/polls/{id}/close` | Close poll |
| POST | `/api/polls/{id}/vote` | Submit vote |

### Participants
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/join` | Join session (or reconnect with token) |

### Analytics
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/analytics/dashboard` | Full analytics dashboard payload |
| GET | `/api/analytics/attendance-trends` | Attendance time series |
| GET | `/api/analytics/participation-trends` | Participation rate time series |
| GET | `/api/analytics/engagement` | Student engagement metrics |
| GET | `/api/analytics/historical` | Historical session insights |
| GET | `/api/analytics/semester-report` | Semester-wide summary report |
| GET | `/api/analytics/question-difficulty` | Question difficulty ranking |
| GET | `/api/analytics/performance` | Per-session performance analytics |
| GET | `/api/analytics/sessions/{id}` | Single-session drill-down |

### AI
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ai/quiz-questions` | Generate multiple-choice quiz questions |
| POST | `/api/ai/polls-from-notes` | Generate live poll questions from lecture notes |
| POST | `/api/ai/session-summary` | Summarize a completed or active session |
| POST | `/api/ai/engagement-analysis` | Analyze attendance and voting engagement |
| POST | `/api/ai/sentiment-analysis` | Analyze sentiment from text responses |
| POST | `/api/ai/learning-recommendations` | Recommend follow-up lessons and future poll ideas |

### Teams
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/teams/notify` | Send an Adaptive Card notification to a Teams webhook |
| POST | `/api/teams/test` | Send a test card to verify a webhook URL |

**Teams notify body:**
```json
{
  "webhook_url": "https://outlook.office.com/webhook/...",
  "event_type": "session_started",
  "payload": { "name": "Lecture 5", "code": "482913" }
}
```

Valid `event_type` values: `session_started`, `session_closed`, `poll_opened`, `poll_closed`.

### WebSocket
```
ws://localhost:8000/ws/sessions/{session_id}?role=professor|student|display
```

---

## WebSocket Events

All events are JSON: `{ "type": "event_name", "data": { ... } }`

| Event | Triggered by |
|-------|-------------|
| `session_started` | POST /start |
| `session_paused` | POST /pause |
| `session_resumed` | POST /resume |
| `session_closed` | POST /close |
| `participant_joined` | POST /join |
| `attendance_updated` | POST /join |
| `poll_created` | POST /polls |
| `poll_opened` | POST /open |
| `poll_paused` | POST /pause |
| `poll_resumed` | POST /resume |
| `poll_closed` | POST /close |
| `results_updated` | POST /vote |

---

## Database Schema

```
sessions         id, name, code, status, created_at, code_expires_at
participants     id, session_id, name, student_id, token, joined_at
polls            id, session_id, question, status, created_at, opened_at, closed_at
poll_options     id, poll_id, text, order
votes            id, poll_id, participant_id, option_id, voted_at
                 UNIQUE(poll_id, participant_id)  — prevents duplicate votes
```

---

## Security & Reliability

- **Duplicate vote prevention**: DB-level `UNIQUE(poll_id, participant_id)` constraint
- **NAT-aware**: Identity is tracked by participant token (UUID), not IP address
- **Code expiry**: 15-minute window enforced in the join endpoint
- **Token persistence**: Students rejoin seamlessly using token stored in localStorage
- **Rate limiting**: In-memory limiter (10 joins/min per IP; 5 votes/min per token)
- **Auto-reconnect WebSocket**: Exponential back-off up to 10 s, with 25 s keep-alive pings

---

## Environment Variables

### Frontend (optional — create `frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_FRONTEND_PORT=3000
```

When unset, the frontend auto-detects the API host from the browser hostname (useful on LAN).

### Backend AI

Create `backend/.env` or export these variables before starting FastAPI:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5.5
```

### Backend Database (optional — for PostgreSQL instead of SQLite)

Edit `backend/app/database.py` and change `DATABASE_URL`:

```python
DATABASE_URL = "postgresql+asyncpg://user:pass@localhost/classpoll"
```

Then add `asyncpg` to `requirements.txt`.

---

## Analytics Metric Definitions

| Metric | Definition |
|--------|-----------|
| **Participation rate** | Votes received on a poll ÷ students in session × 100 |
| **Engagement score** | Weighted score: sessions attended × 15 + participation rate × 0.85 (capped at 100) |
| **Answer spread** | Normalized Shannon entropy of answer percentages (0 = unanimous, 100 = evenly split) |
| **Difficulty score** | `spread × 0.6 + (100 − participation_rate) × 0.4` — higher = harder |
| **Difficulty label** | Easy (< 40), Medium (40–69), Hard (≥ 70) |

Note: Question difficulty is **inferred** from response patterns since polls do not mark a correct answer.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Backend | FastAPI, SQLAlchemy (async), SQLite, WebSockets, httpx, OpenAI SDK |
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Recharts, qrcode.react |
