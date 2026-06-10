'use client'
import type { Poll, PollResults } from '@/lib/types'

interface Props {
  polls: Poll[]
  results: Map<number, PollResults>
}

const BAR_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-red-500', 'bg-indigo-500',
]

export default function ResultsPanel({ polls, results }: Props) {
  const openPoll = polls.find(p => p.status === 'open')
  const pausedPoll = polls.find(p => p.status === 'paused')
  const displayPoll = openPoll ?? pausedPoll

  if (!displayPoll) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Live Results</h3>
        <div className="text-center py-10">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">Open a poll to see live results</p>
        </div>
      </div>
    )
  }

  const pollResults = results.get(displayPoll.id)
  const total = pollResults?.total_votes ?? 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-800">Live Results</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${displayPoll.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {displayPoll.status === 'open' ? 'LIVE' : 'PAUSED'}
        </span>
      </div>

      <p className="text-sm font-medium text-gray-700 mb-4 leading-snug">{displayPoll.question}</p>

      <div className="space-y-3">
        {(pollResults?.options ?? displayPoll.options.map((o, i) => ({
          id: o.id, text: o.text, count: 0, percentage: 0
        }))).map((opt, i) => (
          <div key={opt.id}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">
                <span className="text-gray-400 mr-1">{String.fromCharCode(65 + i)}.</span>
                {opt.text}
              </span>
              <span className="text-gray-500">{opt.count} <span className="text-gray-400">({opt.percentage}%)</span></span>
            </div>
            <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${BAR_COLORS[i % BAR_COLORS.length]} transition-all duration-500 rounded-full`}
                style={{ width: `${opt.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-right text-xs text-gray-400 mt-3">{total} vote{total !== 1 ? 's' : ''} total</p>
    </div>
  )
}
