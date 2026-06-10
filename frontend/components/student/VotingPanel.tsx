'use client'
import { useState } from 'react'
import type { Poll, PollResults, SessionStatus } from '@/lib/types'
import { submitVote } from '@/lib/api'

interface Props {
  sessionName: string
  sessionStatus: SessionStatus
  activePoll: Poll | null
  participantToken: string
  votedPolls: Set<number>
  onVoted: (pollId: number, results: PollResults) => void
}

const OPTION_COLORS = [
  'border-blue-400 bg-blue-50 hover:bg-blue-100',
  'border-green-400 bg-green-50 hover:bg-green-100',
  'border-purple-400 bg-purple-50 hover:bg-purple-100',
  'border-orange-400 bg-orange-50 hover:bg-orange-100',
  'border-pink-400 bg-pink-50 hover:bg-pink-100',
  'border-teal-400 bg-teal-50 hover:bg-teal-100',
  'border-red-400 bg-red-50 hover:bg-red-100',
  'border-indigo-400 bg-indigo-50 hover:bg-indigo-100',
]

export default function VotingPanel({
  sessionName, sessionStatus, activePoll, participantToken, votedPolls, onVoted
}: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastResults, setLastResults] = useState<PollResults | null>(null)

  const alreadyVoted = activePoll ? votedPolls.has(activePoll.id) : false

  const handleVote = async () => {
    if (!activePoll || selected === null) return
    setLoading(true)
    setError('')
    try {
      const resp = await submitVote(activePoll.id, selected, participantToken)
      onVoted(activePoll.id, resp.results)
      setLastResults(resp.results)
      setSelected(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Vote failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">{sessionName}</h1>
          <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-sm font-medium ${
            sessionStatus === 'active' ? 'bg-green-400/30 text-green-100' :
            sessionStatus === 'paused' ? 'bg-yellow-400/30 text-yellow-100' :
            'bg-red-400/30 text-red-100'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              sessionStatus === 'active' ? 'bg-green-300 animate-pulse' :
              sessionStatus === 'paused' ? 'bg-yellow-300' : 'bg-red-300'
            }`} />
            {sessionStatus === 'active' ? 'Session active' :
             sessionStatus === 'paused' ? 'Session paused' : 'Session closed'}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          {sessionStatus === 'closed' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-gray-700 font-medium">This session has ended.</p>
              <p className="text-gray-400 text-sm mt-1">Thank you for participating!</p>
            </div>
          ) : !activePoll || activePoll.status === 'pending' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-700 font-medium">
                {sessionStatus === 'paused' ? 'Session is paused' : 'Waiting for a poll…'}
              </p>
              <p className="text-gray-400 text-sm mt-1">Your professor will open a poll shortly</p>
            </div>
          ) : activePoll.status === 'paused' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-700 font-medium">Poll is paused</p>
              <p className="text-gray-400 text-sm mt-1">Voting will resume shortly</p>
            </div>
          ) : activePoll.status === 'closed' ? (
            <div className="text-center py-8">
              <p className="text-gray-700 font-medium">Poll has closed</p>
              <p className="text-gray-400 text-sm mt-1">Waiting for the next poll…</p>
            </div>
          ) : alreadyVoted ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-700 font-medium mb-1">Vote submitted!</p>
              <p className="text-gray-400 text-sm">Waiting for results…</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-800 mb-5 leading-snug">
                {activePoll.question}
              </h2>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2.5 mb-5">
                {activePoll.options.map((opt, i) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelected(opt.id)}
                    className={`w-full text-left border-2 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      selected === opt.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : OPTION_COLORS[i % OPTION_COLORS.length]
                    }`}
                  >
                    <span className="font-bold mr-2 text-gray-500">{String.fromCharCode(65 + i)}.</span>
                    {opt.text}
                  </button>
                ))}
              </div>
              <button
                onClick={handleVote}
                disabled={selected === null || loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50 transition-colors"
              >
                {loading ? 'Submitting…' : 'Submit Vote'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
