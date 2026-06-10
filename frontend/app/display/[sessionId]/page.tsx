'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import type { Session, Poll, PollResults, WSEvent } from '@/lib/types'
import { getSession, listPolls, getSessionResults, getAttendance } from '@/lib/api'
import { SessionSocket } from '@/lib/websocket'
import DisplayPanel from '@/components/display/DisplayPanel'

export default function DisplayPage() {
  const params = useParams()
  const sessionId = parseInt(params.sessionId as string)

  const [session, setSession] = useState<Session | null>(null)
  const [activePoll, setActivePoll] = useState<Poll | null>(null)
  const [results, setResults] = useState<Map<number, PollResults>>(new Map())
  const [participantCount, setParticipantCount] = useState(0)
  const [connected, setConnected] = useState(false)

  const handleWSEvent = useCallback((event: WSEvent) => {
    const d = event.data as Record<string, unknown>
    switch (event.type) {
      case 'session_started':
        setSession(prev => prev ? { ...prev, status: 'active' } : prev)
        break
      case 'session_paused':
        setSession(prev => prev ? { ...prev, status: 'paused' } : prev)
        break
      case 'session_resumed':
        setSession(prev => prev ? { ...prev, status: 'active' } : prev)
        break
      case 'session_closed':
        setSession(prev => prev ? { ...prev, status: 'closed' } : prev)
        setActivePoll(null)
        break
      case 'participant_joined':
      case 'attendance_updated':
        setParticipantCount((d.count as number) ?? 0)
        setSession(prev => prev ? { ...prev, participant_count: (d.count as number) ?? prev.participant_count } : prev)
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
        setActivePoll(prev => prev && prev.id === poll.id ? { ...prev, ...poll } : prev)
        break
      }
      case 'poll_closed': {
        setActivePoll(prev => prev && prev.id === (d.poll_id as number)
          ? { ...prev, status: 'closed' } : prev)
        if (d.results) {
          const r = d.results as PollResults
          setResults(prev => new Map(prev).set(r.poll_id, r))
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

  // Load initial state
  useEffect(() => {
    if (isNaN(sessionId)) return
    Promise.all([
      getSession(sessionId),
      listPolls(sessionId),
      getAttendance(sessionId),
      getSessionResults(sessionId),
    ]).then(([sess, polls, att, sessResults]) => {
      setSession(sess)
      setParticipantCount(att.count)
      const open = polls.find(p => p.status === 'open') ?? polls.find(p => p.status === 'paused') ?? null
      setActivePoll(open)
      const resMap = new Map<number, PollResults>()
      for (const pr of sessResults.polls) {
        resMap.set(pr.poll_id, pr)
      }
      setResults(resMap)
    }).catch(console.error)
  }, [sessionId])

  // WebSocket
  useEffect(() => {
    if (isNaN(sessionId)) return
    const sock = new SessionSocket(sessionId, 'display', handleWSEvent, setConnected)
    return () => sock.close()
  }, [sessionId, handleWSEvent])

  const activeResults = activePoll ? (results.get(activePoll.id) ?? null) : null

  return (
    <DisplayPanel
      session={session}
      activePoll={activePoll}
      results={activeResults}
      participantCount={participantCount}
      connected={connected}
    />
  )
}
