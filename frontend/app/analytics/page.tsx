'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import type { AnalyticsDashboard, SessionAnalytics } from '@/lib/types'
import { getAnalyticsDashboard, getSessionAnalytics } from '@/lib/api'
import MetricCard from '@/components/analytics/MetricCard'
import TrendChart from '@/components/analytics/TrendChart'
import EngagementTable from '@/components/analytics/EngagementTable'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsDashboard | null>(null)
  const [sessionDetail, setSessionDetail] = useState<SessionAnalytics | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<number | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSession, setExpandedSession] = useState<number | null>(null)

  useEffect(() => {
    getAnalyticsDashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedSessionId) {
      setSessionDetail(null)
      return
    }
    getSessionAnalytics(selectedSessionId)
      .then(setSessionDetail)
      .catch((e) => setError(e.message))
  }, [selectedSessionId])

  const attendanceChartData =
    data?.attendance_trends.map((t) => ({
      session_name: t.session_name,
      participant_count: t.participant_count,
    })) ?? []

  const participationChartData =
    data?.participation_trends.map((t) => ({
      session_name: t.session_name,
      participation_rate: t.participation_rate,
    })) ?? []

  const performanceChartData =
    data?.performance_analytics.map((p) => ({
      session_name: p.session_name,
      attendance: p.attendance,
      engagement_rate: p.engagement_rate,
    })) ?? []

  const difficultyChartData =
    data?.question_difficulty.slice(0, 8).map((q) => ({
      question: q.question.slice(0, 30) + (q.question.length > 30 ? '…' : ''),
      difficulty_score: q.difficulty_score,
    })) ?? []

  const topEngagementData =
    data?.engagement_metrics.slice(0, 8).map((s) => ({
      name: s.name.split(' ')[0],
      engagement_score: s.engagement_score,
    })) ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="font-bold text-gray-800 text-lg">ClassPoll</span>
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600 text-sm font-medium">Analytics &amp; Insights</span>
        </div>
        <Link
          href="/professor"
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          ← Back to Professor Dashboard
        </Link>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {loading && (
          <div className="text-center py-20 text-gray-400">Loading analytics…</div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
            {error}
          </div>
        )}

        {data && !loading && (
          <>
            {/* Overview KPIs */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Overview</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total Sessions" value={data.overview.total_sessions} accent="blue" />
                <MetricCard label="Unique Students" value={data.overview.unique_students} accent="green" />
                <MetricCard label="Total Polls" value={data.overview.total_polls} accent="purple" />
                <MetricCard
                  label="Avg Participation"
                  value={`${data.overview.avg_participation_rate}%`}
                  subtext={`${data.overview.avg_attendance_per_session} avg attendance/session`}
                  accent="orange"
                />
              </div>
            </section>

            {/* Attendance & Participation Trends */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Attendance Trends</h3>
                <TrendChart
                  data={attendanceChartData}
                  xKey="session_name"
                  yKey="participant_count"
                  yLabel="Participants"
                  type="bar"
                  color="#2563eb"
                />
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Participation Trends</h3>
                <TrendChart
                  data={participationChartData}
                  xKey="session_name"
                  yKey="participation_rate"
                  yLabel="Participation %"
                  type="line"
                  color="#7c3aed"
                />
              </div>
            </section>

            {/* Semester Report */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Semester-Wide Report</h3>
              {data.semester_report.period_start ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Period</p>
                    <p className="text-sm text-gray-700">
                      {formatDate(data.semester_report.period_start)} —{' '}
                      {formatDate(data.semester_report.period_end!)}
                    </p>
                    <p className="text-xs text-gray-400 mt-3">
                      {data.semester_report.total_votes} total votes across{' '}
                      {data.semester_report.total_sessions} sessions
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Top Engaged Students</p>
                    <ul className="space-y-1">
                      {data.semester_report.top_engaged_students.map((s) => (
                        <li key={s.name} className="text-sm text-gray-700 flex justify-between">
                          <span>{s.name}</span>
                          <span className="font-medium text-green-600">{s.engagement_score}</span>
                        </li>
                      ))}
                      {!data.semester_report.top_engaged_students.length && (
                        <li className="text-sm text-gray-400">No data yet</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Hardest Questions</p>
                    <ul className="space-y-1">
                      {data.semester_report.hardest_questions.map((q) => (
                        <li key={q.poll_id} className="text-sm text-gray-700">
                          <span className="line-clamp-1">{q.question}</span>
                          <span className="text-xs text-red-500 font-medium">{q.difficulty_label} ({q.difficulty_score})</span>
                        </li>
                      ))}
                      {!data.semester_report.hardest_questions.length && (
                        <li className="text-sm text-gray-400">No data yet</li>
                      )}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Run some classroom sessions to generate a semester report.</p>
              )}
            </section>

            {/* Classroom Performance */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Classroom Performance Analytics</h3>
              {performanceChartData.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={performanceChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="session_name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="attendance" fill="#2563eb" name="Attendance" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="engagement_rate" fill="#7c3aed" name="Engagement %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">No performance data yet</p>
              )}
            </section>

            {/* Question Difficulty & Engagement */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Question Difficulty Analysis</h3>
                {difficultyChartData.length ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={difficultyChartData} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="question" width={120} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="difficulty_score" fill="#ef4444" name="Difficulty Score" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8">No poll data yet</p>
                )}
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-base font-semibold text-gray-800 mb-4">Top Student Engagement</h3>
                {topEngagementData.length ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={topEngagementData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="engagement_score" fill="#16a34a" name="Engagement Score" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8">No student data yet</p>
                )}
              </div>
            </section>

            {/* Student Engagement Table */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Student Engagement Metrics</h3>
              <EngagementTable students={data.engagement_metrics} />
            </section>

            {/* Historical Insights */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Historical Classroom Insights</h3>
              {!data.historical_insights.length ? (
                <p className="text-sm text-gray-400 text-center py-8">No session history yet</p>
              ) : (
                <div className="space-y-3">
                  {data.historical_insights.map((session) => (
                    <div key={session.session_id} className="border border-gray-100 rounded-xl overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left"
                        onClick={() =>
                          setExpandedSession(
                            expandedSession === session.session_id ? null : session.session_id
                          )
                        }
                      >
                        <div>
                          <p className="font-medium text-gray-800">{session.session_name}</p>
                          <p className="text-xs text-gray-400">{formatDate(session.date)} · {session.status}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{session.participant_count} students</span>
                          <span>{session.poll_count} polls</span>
                          <span>{session.avg_participation_rate}% participation</span>
                          <svg
                            className={`w-4 h-4 transition-transform ${expandedSession === session.session_id ? 'rotate-180' : ''}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      {expandedSession === session.session_id && (
                        <div className="px-4 pb-4 border-t border-gray-50">
                          <ul className="mt-3 space-y-2">
                            {session.polls.map((poll) => (
                              <li key={poll.poll_id} className="flex justify-between text-sm">
                                <span className="text-gray-700">{poll.question}</span>
                                <span className="text-gray-400 shrink-0 ml-4">
                                  {poll.total_votes} votes · {poll.participation_rate}%
                                </span>
                              </li>
                            ))}
                            {!session.polls.length && (
                              <li className="text-sm text-gray-400">No polls in this session</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Session Drill-down */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Session Drill-Down</h3>
              <select
                className="w-full max-w-md border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 mb-4"
                value={selectedSessionId}
                onChange={(e) =>
                  setSelectedSessionId(e.target.value ? parseInt(e.target.value) : '')
                }
              >
                <option value="">Select a session…</option>
                {data.historical_insights.map((s) => (
                  <option key={s.session_id} value={s.session_id}>
                    {s.session_name} ({formatDate(s.date)})
                  </option>
                ))}
              </select>

              {sessionDetail && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard label="Students" value={sessionDetail.participant_count} accent="blue" />
                    <MetricCard
                      label="Engagement"
                      value={`${sessionDetail.performance?.engagement_rate ?? 0}%`}
                      accent="purple"
                    />
                    <MetricCard
                      label="Polls"
                      value={sessionDetail.historical?.poll_count ?? 0}
                      accent="green"
                    />
                    <MetricCard
                      label="Completion"
                      value={`${sessionDetail.performance?.completion_rate ?? 0}%`}
                      accent="orange"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Per-Student Participation</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 text-left text-gray-500">
                            <th className="pb-2 font-medium">Student</th>
                            <th className="pb-2 font-medium">Polls Answered</th>
                            <th className="pb-2 font-medium">Participation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessionDetail.student_participation.map((s) => (
                            <tr key={s.participant_id} className="border-b border-gray-50">
                              <td className="py-2 text-gray-800">{s.name}</td>
                              <td className="py-2 text-gray-600">
                                {s.polls_answered}/{s.polls_available}
                              </td>
                              <td className="py-2 text-gray-600">{s.participation_rate}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
