'use client'
import type { Poll, PollResults, Session } from '@/lib/types'

interface Props {
  session: Session | null
  activePoll: Poll | null
  results: PollResults | null
  participantCount: number
  connected: boolean
}

const BAR_COLORS = [
  'bg-blue-400', 'bg-emerald-400', 'bg-purple-400', 'bg-amber-400',
  'bg-rose-400', 'bg-teal-400', 'bg-orange-400', 'bg-indigo-400',
]

export default function DisplayPanel({ session, activePoll, results, participantCount, connected }: Props) {
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-gray-600 border-t-blue-400 rounded-full animate-spin mx-auto mb-6" />
          <p className="text-gray-400 text-xl">Connecting to session…</p>
        </div>
      </div>
    )
  }

  const showPoll = activePoll && (activePoll.status === 'open' || activePoll.status === 'paused')
  const total = results?.total_votes ?? 0

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-white">{session.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-white font-semibold">{participantCount}</span>
            <span className="text-gray-400 text-sm">students</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-gray-400 text-sm">{connected ? 'Live' : 'Reconnecting…'}</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-12 py-10">
        {!showPoll ? (
          <div className="text-center">
            {session.status === 'active' ? (
              <>
                <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-slow">
                  <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">Waiting for a poll…</h2>
                <p className="text-gray-400 text-lg">Your professor will open a poll shortly</p>
              </>
            ) : session.status === 'paused' ? (
              <>
                <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">Session Paused</h2>
                <p className="text-gray-400 text-lg">Resuming shortly…</p>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold text-white mb-3">Session Ended</h2>
                <p className="text-gray-400 text-lg">Thank you for participating!</p>
              </>
            )}
          </div>
        ) : (
          <div className="w-full max-w-4xl">
            <div className="flex items-center gap-3 mb-8">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${activePoll.status === 'open' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                {activePoll.status === 'open' ? 'LIVE' : 'PAUSED'}
              </span>
              <span className="text-gray-400 text-sm">{total} vote{total !== 1 ? 's' : ''}</span>
            </div>

            <h2 className="text-4xl font-bold text-white mb-10 leading-tight">
              {activePoll.question}
            </h2>

            <div className="space-y-5">
              {(results?.options ?? activePoll.options.map((o, i) => ({
                id: o.id, text: o.text, count: 0, percentage: 0
              }))).map((opt, i) => (
                <div key={opt.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-medium text-gray-200">
                      <span className="text-gray-500 mr-2">{String.fromCharCode(65 + i)}.</span>
                      {opt.text}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-white">{opt.percentage}%</span>
                      <span className="text-gray-400 text-sm w-16 text-right">{opt.count} vote{opt.count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="h-8 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${BAR_COLORS[i % BAR_COLORS.length]} transition-all duration-700 ease-out rounded-full`}
                      style={{ width: `${opt.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-8 py-3 border-t border-gray-800">
        <span className="text-gray-600 text-sm">ClassPoll</span>
        <span className="text-gray-600 text-sm font-mono">Session #{session.id}</span>
      </div>
    </div>
  )
}
