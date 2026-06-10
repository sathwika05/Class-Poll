'use client'
import { useState, useCallback } from 'react'
import type { Poll, Session } from '@/lib/types'
import { createPoll, openPoll, pausePoll, resumePoll, closePoll } from '@/lib/api'

interface Props {
  session: Session | null
  polls: Poll[]
  onPollsChange: (polls: Poll[]) => void
}

const POLL_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  open: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-red-100 text-red-700',
}

export default function PollPanel({ session, polls, onPollsChange }: Props) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addOption = () => {
    if (options.length < 8) setOptions(o => [...o, ''])
  }
  const removeOption = (i: number) => {
    if (options.length > 2) setOptions(o => o.filter((_, idx) => idx !== i))
  }
  const updateOption = (i: number, val: string) => {
    setOptions(o => o.map((v, idx) => idx === i ? val : v))
  }

  const handleCreate = useCallback(async () => {
    if (!session) return
    const validOpts = options.map(o => o.trim()).filter(Boolean)
    if (!question.trim() || validOpts.length < 2) {
      setError('Question and at least 2 non-empty options are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const poll = await createPoll(session.id, question.trim(), validOpts)
      onPollsChange([...polls, poll])
      setQuestion('')
      setOptions(['', ''])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create poll')
    } finally {
      setLoading(false)
    }
  }, [session, question, options, polls, onPollsChange])

  const handlePollAction = useCallback(async (
    pollId: number,
    action: (id: number) => Promise<Poll>
  ) => {
    setError('')
    try {
      const updated = await action(pollId)
      onPollsChange(polls.map(p => p.id === pollId ? updated : p))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Poll action failed')
    }
  }, [polls, onPollsChange])

  const canCreate = session && session.status !== 'closed'

  return (
    <div className="space-y-4">
      {/* Create Poll Form */}
      {canCreate && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Create Poll</h3>
          {error && <p className="text-red-600 text-sm mb-3 bg-red-50 rounded-lg p-3">{error}</p>}
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Poll question…"
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none mb-3"
          />
          <div className="space-y-2 mb-3">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="text-xs font-medium text-gray-400 w-5 text-right">{String.fromCharCode(65 + i)}.</span>
                <input
                  type="text"
                  value={opt}
                  onChange={e => updateOption(i, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {options.length > 2 && (
                  <button onClick={() => removeOption(i)}
                    className="text-red-400 hover:text-red-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {options.length < 8 && (
              <button onClick={addOption}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Option
              </button>
            )}
            <button
              onClick={handleCreate}
              disabled={loading || !question.trim()}
              className="ml-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors">
              {loading ? 'Creating…' : 'Create Poll'}
            </button>
          </div>
        </div>
      )}

      {/* Poll History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          Polls ({polls.length})
        </h3>
        {polls.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No polls yet</p>
        ) : (
          <div className="space-y-3">
            {[...polls].reverse().map(poll => (
              <div key={poll.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-sm font-medium text-gray-800 leading-snug">{poll.question}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${POLL_STATUS_COLORS[poll.status]}`}>
                    {poll.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {poll.options.map(o => (
                    <span key={o.id} className="text-xs bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                      {String.fromCharCode(65 + o.order)}. {o.text}
                    </span>
                  ))}
                </div>
                {session && session.status !== 'closed' && (
                  <div className="flex gap-2 mt-3">
                    {poll.status === 'pending' && (
                      <button onClick={() => handlePollAction(poll.id, openPoll)}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                        Open
                      </button>
                    )}
                    {poll.status === 'open' && (
                      <>
                        <button onClick={() => handlePollAction(poll.id, pausePoll)}
                          className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                          Pause
                        </button>
                        <button onClick={() => handlePollAction(poll.id, closePoll)}
                          className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                          Close
                        </button>
                      </>
                    )}
                    {poll.status === 'paused' && (
                      <>
                        <button onClick={() => handlePollAction(poll.id, resumePoll)}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                          Resume
                        </button>
                        <button onClick={() => handlePollAction(poll.id, closePoll)}
                          className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                          Close
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
