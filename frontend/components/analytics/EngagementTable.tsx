'use client'
import type { EngagementMetric } from '@/lib/types'

interface Props {
  students: EngagementMetric[]
}

const LEVEL_COLORS = {
  High: 'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Low: 'bg-red-100 text-red-700',
}

export default function EngagementTable({ students }: Props) {
  if (!students.length) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No student engagement data yet
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-gray-500">
            <th className="pb-2 font-medium">Student</th>
            <th className="pb-2 font-medium">Sessions</th>
            <th className="pb-2 font-medium">Polls Answered</th>
            <th className="pb-2 font-medium">Participation</th>
            <th className="pb-2 font-medium">Score</th>
            <th className="pb-2 font-medium">Level</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s, i) => (
            <tr key={`${s.name}-${s.student_id ?? i}`} className="border-b border-gray-50">
              <td className="py-2.5 font-medium text-gray-800">
                {s.name}
                {s.student_id && (
                  <span className="block text-xs text-gray-400 font-normal">{s.student_id}</span>
                )}
              </td>
              <td className="py-2.5 text-gray-600">{s.sessions_attended}</td>
              <td className="py-2.5 text-gray-600">
                {s.polls_answered}/{s.polls_available}
              </td>
              <td className="py-2.5 text-gray-600">{s.participation_rate}%</td>
              <td className="py-2.5 font-semibold text-gray-800">{s.engagement_score}</td>
              <td className="py-2.5">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_COLORS[s.engagement_level]}`}>
                  {s.engagement_level}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
