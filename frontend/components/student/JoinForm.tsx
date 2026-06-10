'use client'
import { useState } from 'react'
import type { JoinResponse } from '@/lib/types'
import { joinSession } from '@/lib/api'

interface Props {
  onJoin: (resp: JoinResponse) => void
  initialCode?: string
}

export default function JoinForm({ onJoin, initialCode = '' }: Props) {
  const [code, setCode] = useState(initialCode)
  const [name, setName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim() || !name.trim()) {
      setError('Session code and name are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const resp = await joinSession(code.trim(), name.trim(), studentId.trim() || undefined)
      onJoin(resp)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to join session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-xl mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Join Session</h1>
          <p className="text-gray-500 text-sm mt-1">Enter the code from your professor</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Session Code</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              maxLength={6}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Full name"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Student ID <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              placeholder="e.g. A12345678"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !code.trim() || !name.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50 transition-colors mt-2"
          >
            {loading ? 'Joining…' : 'Join Session'}
          </button>
        </form>
      </div>
    </div>
  )
}
