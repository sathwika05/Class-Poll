import type {
  Session,
  Poll,
  AttendanceResponse,
  JoinResponse,
  PollResults,
  AnalyticsDashboard,
  SessionAnalytics,
} from './types'

const _backendHost =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined'
    ? `http://${window.location.hostname}:8000`
    : 'http://localhost:8000')

export const API_URL = _backendHost

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `Request failed: ${res.status}`)
  }
  return res.json()
}

// Sessions
export const createSession = (name: string) =>
  apiFetch<Session>('/api/sessions', { method: 'POST', body: JSON.stringify({ name }) })

export const listSessions = () => apiFetch<Session[]>('/api/sessions')

export const getSession = (id: number) => apiFetch<Session>(`/api/sessions/${id}`)

export const startSession = (id: number) =>
  apiFetch<Session>(`/api/sessions/${id}/start`, { method: 'POST' })

export const pauseSession = (id: number) =>
  apiFetch<Session>(`/api/sessions/${id}/pause`, { method: 'POST' })

export const resumeSession = (id: number) =>
  apiFetch<Session>(`/api/sessions/${id}/resume`, { method: 'POST' })

export const closeSession = (id: number) =>
  apiFetch<Session>(`/api/sessions/${id}/close`, { method: 'POST' })

// Polls
export const createPoll = (sessionId: number, question: string, options: string[]) =>
  apiFetch<Poll>(`/api/sessions/${sessionId}/polls`, {
    method: 'POST',
    body: JSON.stringify({ question, options }),
  })

export const listPolls = (sessionId: number) =>
  apiFetch<Poll[]>(`/api/sessions/${sessionId}/polls`)

export const openPoll = (pollId: number) =>
  apiFetch<Poll>(`/api/polls/${pollId}/open`, { method: 'POST' })

export const pausePoll = (pollId: number) =>
  apiFetch<Poll>(`/api/polls/${pollId}/pause`, { method: 'POST' })

export const resumePoll = (pollId: number) =>
  apiFetch<Poll>(`/api/polls/${pollId}/resume`, { method: 'POST' })

export const closePoll = (pollId: number) =>
  apiFetch<Poll>(`/api/polls/${pollId}/close`, { method: 'POST' })

export const submitVote = (pollId: number, optionId: number, participantToken: string) =>
  apiFetch<{ success: boolean; message: string; results: PollResults }>(
    `/api/polls/${pollId}/vote`,
    {
      method: 'POST',
      body: JSON.stringify({ option_id: optionId, participant_token: participantToken }),
    }
  )

// Participants
export const joinSession = (
  code: string,
  name: string,
  studentId?: string,
  token?: string
) =>
  apiFetch<JoinResponse>('/api/join', {
    method: 'POST',
    body: JSON.stringify({ code, name, student_id: studentId || null, token: token || null }),
  })

// Attendance & Results
export const getAttendance = (sessionId: number) =>
  apiFetch<AttendanceResponse>(`/api/sessions/${sessionId}/attendance`)

export const getSessionResults = (sessionId: number) =>
  apiFetch<{ session_id: number; polls: PollResults[] }>(`/api/sessions/${sessionId}/results`)

// Exports (returns URL to download)
export const attendanceExportUrl = (sessionId: number) =>
  `${API_URL}/api/sessions/${sessionId}/export/attendance`

export const resultsExportUrl = (sessionId: number) =>
  `${API_URL}/api/sessions/${sessionId}/export/results`

export const getServerInfo = () =>
  apiFetch<{ local_ip: string }>('/api/server-info')

// Analytics
export const getAnalyticsDashboard = () =>
  apiFetch<AnalyticsDashboard>('/api/analytics/dashboard')

export const getSessionAnalytics = (sessionId: number) =>
  apiFetch<SessionAnalytics>(`/api/analytics/sessions/${sessionId}`)
