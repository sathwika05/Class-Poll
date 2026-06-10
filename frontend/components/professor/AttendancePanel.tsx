'use client'
import type { Participant } from '@/lib/types'

interface Props {
  participants: Participant[]
  sessionId: number | null
}

export default function AttendancePanel({ participants, sessionId }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-800">
          Attendance
          <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {participants.length}
          </span>
        </h3>
      </div>

      {participants.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">Waiting for students to join…</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-80 overflow-y-auto scrollbar-thin">
          {participants.map((p, idx) => (
            <div key={p.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-xs text-gray-400 w-6 text-right flex-shrink-0">{idx + 1}</span>
              <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-700 text-xs font-bold">{p.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                {p.student_id && (
                  <p className="text-xs text-gray-400 truncate">{p.student_id}</p>
                )}
              </div>
              <p className="text-xs text-gray-400 flex-shrink-0">
                {new Date(p.joined_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
