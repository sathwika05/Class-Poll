'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Session } from '@/lib/types'
import {
  createSession, startSession, pauseSession, resumeSession, closeSession,
  attendanceExportUrl, resultsExportUrl,
} from '@/lib/api'
import QRCard from './QRCard'

interface Props {
  session: Session | null
  onSessionChange: (s: Session | null) => void
}

function useCountdown(expiresAt: string | null) {
  const [secondsLeft, setSecondsLeft] = useState(0)
  useEffect(() => {
    if (!expiresAt) return
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt + 'Z').getTime() - Date.now()) / 1000))
      setSecondsLeft(diff)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])
  const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0')
  const s = (secondsLeft % 60).toString().padStart(2, '0')
  return { display: `${m}:${s}`, expired: secondsLeft === 0 }
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-orange-100 text-orange-800',
  closed: 'bg-red-100 text-red-800',
}

export default function SessionPanel({ session, onSessionChange }: Props) {
  const [sessionName, setSessionName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const { display: countdown, expired } = useCountdown(session?.code_expires_at ?? null)

  const handleCreate = useCallback(async () => {
    if (!sessionName.trim()) return
    setLoading(true)
    setError('')
    try {
      const s = await createSession(sessionName.trim())
      onSessionChange(s)
      localStorage.setItem('prof_session_id', String(s.id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create session')
    } finally {
      setLoading(false)
    }
  }, [sessionName, onSessionChange])

  const handleAction = useCallback(async (
    action: (id: number) => Promise<Session>
  ) => {
    if (!session) return
    setLoading(true)
    setError('')
    try {
      const s = await action(session.id)
      onSessionChange(s)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setLoading(false)
    }
  }, [session, onSessionChange])

  const copyCode = () => {
    if (!session) return
    navigator.clipboard.writeText(session.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!session) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Create New Session</h2>
        {error && <p className="text-red-600 text-sm mb-3 bg-red-50 rounded-lg p-3">{error}</p>}
        <div className="flex gap-3">
          <input
            type="text"
            value={sessionName}
            onChange={e => setSessionName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Session name (e.g. CS101 — Week 5)"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleCreate}
            disabled={loading || !sessionName.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-3 rounded-xl text-sm disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {error && <p className="text-red-600 text-sm mb-3 bg-red-50 rounded-lg p-3">{error}</p>}

      <div className="flex flex-wrap items-start gap-4 mb-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-gray-800 truncate">{session.name}</h2>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_COLORS[session.status]}`}>
              {session.status.toUpperCase()}
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            {session.participant_count} student{session.participant_count !== 1 ? 's' : ''} &bull; {session.poll_count} poll{session.poll_count !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Code box */}
        <div className="flex-shrink-0">
          <button
            onClick={copyCode}
            className="group relative flex flex-col items-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-3 transition-colors"
            title="Click to copy"
          >
            <span className="text-3xl font-mono font-bold tracking-widest">{session.code}</span>
            <span className="text-xs text-blue-200 mt-0.5">{copied ? 'Copied!' : 'Click to copy'}</span>
          </button>
          <p className={`text-center text-xs mt-1 font-medium ${expired ? 'text-red-500' : 'text-gray-500'}`}>
            {expired ? 'Code expired' : `Expires in ${countdown}`}
          </p>
        </div>
      </div>

      {/* QR code */}
      <QRCard sessionCode={session.code} />

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mt-2">
        {session.status === 'pending' && (
          <button onClick={() => handleAction(startSession)} disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors">
            Start Session
          </button>
        )}
        {session.status === 'active' && (
          <>
            <button onClick={() => handleAction(pauseSession)} disabled={loading}
              className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors">
              Pause Session
            </button>
            <button onClick={() => handleAction(closeSession)} disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors">
              Close Session
            </button>
          </>
        )}
        {session.status === 'paused' && (
          <>
            <button onClick={() => handleAction(resumeSession)} disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors">
              Resume Session
            </button>
            <button onClick={() => handleAction(closeSession)} disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 transition-colors">
              Close Session
            </button>
          </>
        )}

        <a href={attendanceExportUrl(session.id)} download
          className="ml-auto bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          Attendance CSV
        </a>
        <a href={resultsExportUrl(session.id)} download
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          Results CSV
        </a>

        <button onClick={() => {
          onSessionChange(null)
          localStorage.removeItem('prof_session_id')
        }}
          className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          New Session
        </button>
      </div>
    </div>
  )
}
