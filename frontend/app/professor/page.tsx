'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { Session, Poll, Participant, PollResults, WSEvent } from '@/lib/types'
import { getSession, listPolls, getAttendance } from '@/lib/api'
import { SessionSocket } from '@/lib/websocket'
import SessionPanel from '@/components/professor/SessionPanel'
import PollPanel from '@/components/professor/PollPanel'
import AttendancePanel from '@/components/professor/AttendancePanel'
import ResultsPanel from '@/components/professor/ResultsPanel'

export default function ProfessorPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [polls, setPolls] = useState<Poll[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [results, setResults] = useState<Map<number, PollResults>>(new Map())
  const [connected, setConnected] = useState(false)
  const [socketRef, setSocketRef] = useState<SessionSocket | null>(null)

  // Handle WebSocket events
  const handleWSEvent = useCallback((event: WSEvent) => {
    const d = event.data as Record<string, unknown>
    switch (event.type) {
      case 'session_started':
      case 'session_paused':
      case 'session_resumed':
      case 'session_closed':
        setSession(prev => prev ? { ...prev, status: d.status as Session['status'] } : prev)
        break
      case 'participant_joined':
      case 'attendance_updated': {
        const raw = (d.participants ?? []) as Array<{ id: number; name: string; student_id: string | null; joined_at: string }>
        setParticipants(raw.map(p => ({ id: p.id, name: p.name, student_id: p.student_id, joined_at: p.joined_at })))
        setSession(prev => prev ? { ...prev, participant_count: (d.count as number) ?? prev.participant_count } : prev)
        break
      }
      case 'poll_created': {
        const poll = d as unknown as Poll
        setPolls(prev => {
          const exists = prev.find(p => p.id === poll.id)
          return exists ? prev : [...prev, poll]
        })
        setSession(prev => prev ? { ...prev, poll_count: prev.poll_count + 1 } : prev)
        break
      }
      case 'poll_opened':
      case 'poll_paused':
      case 'poll_resumed':
      case 'poll_closed': {
        const updatedPoll = d as unknown as Poll
        if (updatedPoll.id) {
          setPolls(prev => prev.map(p =>
            p.id === updatedPoll.id ? { ...p, ...updatedPoll } : p
          ))
        }
        break
      }
      case 'results_updated':
      case 'vote_submitted': {
        const pollId = d.poll_id as number
        const r = d.results as PollResults
        if (pollId && r) {
          setResults(prev => new Map(prev).set(pollId, r))
        }
        break
      }
    }
  }, [])

  // On mount: restore session from localStorage
  useEffect(() => {
    const savedId = localStorage.getItem('prof_session_id')
    if (!savedId) return
    const id = parseInt(savedId)
    if (isNaN(id)) return

    Promise.all([
      getSession(id),
      listPolls(id),
      getAttendance(id),
    ]).then(([sess, pollList, att]) => {
      if (sess.status === 'closed') {
        setSession(sess)
        setPolls(pollList)
        setParticipants(att.participants)
      } else {
        setSession(sess)
        setPolls(pollList)
        setParticipants(att.participants)
      }
    }).catch(() => {
      localStorage.removeItem('prof_session_id')
    })
  }, [])

  // Connect WebSocket when session changes
  useEffect(() => {
    if (socketRef) {
      socketRef.close()
      setSocketRef(null)
    }
    if (!session) return

    const sock = new SessionSocket(session.id, 'professor', handleWSEvent, setConnected)
    setSocketRef(sock)
    return () => sock.close()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id])

  const handleSessionChange = useCallback((s: Session | null) => {
    setSession(s)
    setPolls([])
    setParticipants([])
    setResults(new Map())
    if (!s) {
      localStorage.removeItem('prof_session_id')
    }
  }, [])

  const activePoll = polls.find(p => p.status === 'open') ?? polls.find(p => p.status === 'paused') ?? null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="font-bold text-gray-800 text-lg">ClassPoll</span>
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600 text-sm font-medium">Professor Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/analytics"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics
          </Link>
          {session && (
            <a
              href={`/display/${session.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Projector View
            </a>
          )}
          {session && (
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-xs text-gray-500">{connected ? 'Live' : 'Connecting…'}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        <SessionPanel session={session} onSessionChange={handleSessionChange} />

        {session && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left: polls */}
            <div className="lg:col-span-1">
              <PollPanel session={session} polls={polls} onPollsChange={setPolls} />
            </div>
            {/* Middle: live results */}
            <div className="lg:col-span-1">
              <ResultsPanel polls={polls} results={results} />
            </div>
            {/* Right: attendance */}
            <div className="lg:col-span-1">
              <AttendancePanel participants={participants} sessionId={session.id} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
