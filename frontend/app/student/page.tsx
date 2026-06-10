'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Poll, PollResults, JoinResponse, WSEvent, SessionStatus } from '@/lib/types'
import { listPolls, getSession } from '@/lib/api'
import { SessionSocket } from '@/lib/websocket'
import JoinForm from '@/components/student/JoinForm'
import VotingPanel from '@/components/student/VotingPanel'

interface StoredSession {
  token: string
  session_id: number
  session_name: string
  session_status: SessionStatus
  session_code: string
}

const STORAGE_KEY = 'student_session'

function StudentPageInner() {
  const searchParams = useSearchParams()
  const codeFromUrl = searchParams.get('code') ?? ''
  const [joined, setJoined] = useState<StoredSession | null>(null)
  const [activePoll, setActivePoll] = useState<Poll | null>(null)
  const [results, setResults] = useState<Map<number, PollResults>>(new Map())
  const [votedPolls, setVotedPolls] = useState<Set<number>>(new Set())
  const [socketRef, setSocketRef] = useState<SessionSocket | null>(null)

  const handleWSEvent = useCallback((event: WSEvent) => {
    const d = event.data as Record<string, unknown>
    switch (event.type) {
      case 'session_started':
        setJoined(prev => prev ? { ...prev, session_status: 'active' } : prev)
        break
      case 'session_paused':
        setJoined(prev => prev ? { ...prev, session_status: 'paused' } : prev)
        break
      case 'session_resumed':
        setJoined(prev => prev ? { ...prev, session_status: 'active' } : prev)
        break
      case 'session_closed':
        setJoined(prev => prev ? { ...prev, session_status: 'closed' } : prev)
        setActivePoll(null)
        break
      case 'poll_opened': {
        const poll = d as unknown as Poll
        setActivePoll(poll)
        break
      }
      case 'poll_paused': {
        setActivePoll(prev => prev && prev.id === (d.poll_id as number)
          ? { ...prev, status: 'paused' } : prev)
        break
      }
      case 'poll_resumed': {
        const poll = d as unknown as Poll
        setActivePoll(prev => prev && prev.id === poll.id ? { ...prev, status: 'open' } : prev)
        break
      }
      case 'poll_closed': {
        setActivePoll(prev => prev && prev.id === (d.poll_id as number)
          ? { ...prev, status: 'closed' } : prev)
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

  // Restore from localStorage on mount — skip if URL has a code for a DIFFERENT session
  useEffect(() => {
    if (codeFromUrl) {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        try {
          const stored: StoredSession = JSON.parse(raw)
          // Same session: restore token so student doesn't get a duplicate record
          if (stored.session_code === codeFromUrl) {
            // Fall through to normal reconnect below
          } else {
            // Different session: clear and show JoinForm with new code
            localStorage.removeItem(STORAGE_KEY)
            return
          }
        } catch {
          localStorage.removeItem(STORAGE_KEY)
          return
        }
      } else {
        return
      }
    }
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const stored: StoredSession = JSON.parse(raw)
      getSession(stored.session_id).then(async session => {
        if (session.status === 'closed') {
          localStorage.removeItem(STORAGE_KEY)
          return
        }
        const polls = await listPolls(stored.session_id)
        const open = polls.find(p => p.status === 'open') ?? null
        setActivePoll(open)
        setJoined({ ...stored, session_status: session.status })
      }).catch(() => {
        localStorage.removeItem(STORAGE_KEY)
      })
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [codeFromUrl])

  // Connect WebSocket when joined
  useEffect(() => {
    if (socketRef) {
      socketRef.close()
      setSocketRef(null)
    }
    if (!joined) return
    const sock = new SessionSocket(joined.session_id, 'student', handleWSEvent, () => {})
    setSocketRef(sock)
    return () => sock.close()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined?.session_id])

  const handleJoin = useCallback(async (resp: JoinResponse) => {
    const stored: StoredSession = {
      token: resp.token,
      session_id: resp.session_id,
      session_name: resp.session_name,
      session_status: resp.session_status,
      session_code: resp.session_code,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    // Fetch current open poll
    try {
      const polls = await listPolls(resp.session_id)
      const open = polls.find(p => p.status === 'open') ?? null
      setActivePoll(open)
    } catch {
      // ignore
    }
    setJoined(stored)
  }, [])

  const handleVoted = useCallback((pollId: number, res: PollResults) => {
    setVotedPolls(prev => new Set(prev).add(pollId))
    setResults(prev => new Map(prev).set(pollId, res))
  }, [])

  if (!joined) {
    return <JoinForm onJoin={handleJoin} initialCode={codeFromUrl} />
  }

  return (
    <VotingPanel
      sessionName={joined.session_name}
      sessionStatus={joined.session_status}
      activePoll={activePoll}
      participantToken={joined.token}
      votedPolls={votedPolls}
      onVoted={handleVoted}
    />
  )
}

export default function StudentPage() {
  return (
    <Suspense fallback={null}>
      <StudentPageInner />
    </Suspense>
  )
}
