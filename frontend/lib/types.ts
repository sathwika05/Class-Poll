export type SessionStatus = 'pending' | 'active' | 'paused' | 'closed'
export type PollStatus = 'pending' | 'open' | 'paused' | 'closed'

export interface Session {
  id: number
  name: string
  code: string
  status: SessionStatus
  created_at: string
  code_expires_at: string
  participant_count: number
  poll_count: number
}

export interface PollOption {
  id: number
  text: string
  order: number
}

export interface Poll {
  id: number
  session_id: number
  question: string
  status: PollStatus
  created_at: string
  opened_at: string | null
  closed_at: string | null
  options: PollOption[]
}

export interface PollResultOption {
  id: number
  text: string
  count: number
  percentage: number
}

export interface PollResults {
  poll_id: number
  question: string
  status: string
  options: PollResultOption[]
  total_votes: number
}

export interface Participant {
  id: number
  name: string
  student_id: string | null
  joined_at: string
}

export interface AttendanceResponse {
  session_id: number
  count: number
  participants: Participant[]
}

export interface JoinResponse {
  session_id: number
  participant_id: number
  token: string
  session_name: string
  session_status: SessionStatus
  session_code: string
  code_expires_at: string
}

// WebSocket event types
export type WSEventType =
  | 'session_created'
  | 'session_started'
  | 'session_paused'
  | 'session_resumed'
  | 'session_closed'
  | 'participant_joined'
  | 'attendance_updated'
  | 'poll_created'
  | 'poll_opened'
  | 'poll_paused'
  | 'poll_resumed'
  | 'poll_closed'
  | 'vote_submitted'
  | 'results_updated'

export interface WSEvent {
  type: WSEventType
  data: Record<string, unknown>
}

export interface StoredParticipant {
  token: string
  session_id: number
  participant_id: number
  session_name: string
}

// Analytics types
export interface AnalyticsOverview {
  total_sessions: number
  total_participants: number
  total_polls: number
  total_votes: number
  avg_attendance_per_session: number
  avg_participation_rate: number
  unique_students: number
  generated_at: string
}

export interface AttendanceTrend {
  session_id: number
  session_name: string
  date: string
  status: string
  participant_count: number
}

export interface ParticipationTrend {
  session_id: number
  session_name: string
  date: string
  participant_count: number
  total_votes: number
  poll_count: number
  participation_rate: number
}

export interface EngagementMetric {
  name: string
  student_id: string | null
  sessions_attended: number
  polls_answered: number
  polls_available: number
  participation_rate: number
  engagement_score: number
  engagement_level: 'High' | 'Medium' | 'Low'
}

export interface PollSummary {
  poll_id: number
  question: string
  status: string
  total_votes: number
  participation_rate: number
}

export interface HistoricalInsight {
  session_id: number
  session_name: string
  date: string
  status: string
  participant_count: number
  poll_count: number
  closed_poll_count: number
  total_votes: number
  avg_participation_rate: number
  polls: PollSummary[]
}

export interface QuestionDifficulty {
  poll_id: number
  session_id: number
  session_name: string
  question: string
  participation_rate: number
  answer_spread: number
  top_answer_percentage: number
  difficulty_score: number
  difficulty_label: 'Easy' | 'Medium' | 'Hard'
}

export interface PerformanceAnalytics {
  session_id: number
  session_name: string
  date: string
  attendance: number
  engagement_rate: number
  polls_completed: number
  total_polls: number
  completion_rate: number
}

export interface SemesterReport {
  period_start: string | null
  period_end: string | null
  total_sessions: number
  total_class_hours_proxy: number
  total_students: number
  total_polls: number
  total_votes: number
  avg_attendance: number
  avg_participation_rate: number
  top_engaged_students: EngagementMetric[]
  hardest_questions: QuestionDifficulty[]
  session_summaries: Array<{
    session_id: number
    session_name: string
    attendance: number
    participation_rate: number
  }>
}

export interface AnalyticsDashboard {
  overview: AnalyticsOverview
  attendance_trends: AttendanceTrend[]
  participation_trends: ParticipationTrend[]
  engagement_metrics: EngagementMetric[]
  historical_insights: HistoricalInsight[]
  semester_report: SemesterReport
  question_difficulty: QuestionDifficulty[]
  performance_analytics: PerformanceAnalytics[]
}

export interface StudentParticipation {
  participant_id: number
  name: string
  student_id: string | null
  joined_at: string
  polls_answered: number
  polls_available: number
  participation_rate: number
}

export interface SessionAnalytics {
  session_id: number
  session_name: string
  status: string
  created_at: string
  participant_count: number
  historical: HistoricalInsight | null
  performance: PerformanceAnalytics | null
  question_difficulty: QuestionDifficulty[]
  student_participation: StudentParticipation[]
}
