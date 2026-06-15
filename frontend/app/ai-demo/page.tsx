'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'

type DemoView = 'quiz' | 'polls' | 'summary' | 'trends'

function Option({ text, badge }: { text: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
      <span>{text}</span>
      {badge && (
        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
          {badge}
        </span>
      )}
    </div>
  )
}

function ResultCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">{title}</h3>
      <div className="space-y-2">{children}</div>
    </article>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
    </div>
  )
}

type QuizData = { questions: { question: string; options: string[]; correct: string }[] }
type PollsData = { polls: { question: string; options: string[] }[] }
type SummaryData = { summary: string; recommendation: string }
type TrendsData = { trend: string; ideas: string[] }
type OutputData = QuizData | PollsData | SummaryData | TrendsData | null

export default function AIDemoPage() {
  const [active, setActive] = useState<DemoView>('quiz')
  const [notes, setNotes] = useState(
    `Photosynthesis converts light energy into chemical energy. Chlorophyll absorbs light, mostly from red and blue wavelengths. In the light-dependent reactions, water is split and oxygen is released. ATP and NADPH are produced, then used in the Calvin cycle to convert carbon dioxide into glucose.`
  )
  const [output, setOutput] = useState<OutputData>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate(mode: DemoView) {
    setActive(mode)
    setLoading(true)
    setError(null)
    setOutput(null)
    try {
      const res = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, mode }),
      })
      if (!res.ok) throw new Error('Generation failed')
      const data = await res.json()
      setOutput(data)
    } catch {
      setError('Failed to generate content. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function renderOutput() {
    if (loading) return <Spinner />
    if (error) return <p className="py-8 text-center text-sm text-red-500">{error}</p>
    if (!output) return (
      <p className="py-8 text-center text-sm text-gray-400">
        Enter your lecture notes and click a button to generate content.
      </p>
    )

    if (active === 'quiz') {
      const data = output as QuizData
      return (
        <div className="space-y-3">
          {data.questions?.map((q, i) => (
            <ResultCard key={i} title={`${i + 1}. ${q.question}`}>
              {q.options.map((opt) => (
                <Option key={opt} text={opt} badge={opt === q.correct ? 'Correct' : undefined} />
              ))}
            </ResultCard>
          ))}
        </div>
      )
    }

    if (active === 'polls') {
      const data = output as PollsData
      return (
        <div className="space-y-3">
          {data.polls?.map((p, i) => (
            <ResultCard key={i} title={p.question}>
              {p.options.map((opt) => (
                <Option key={opt} text={opt} />
              ))}
            </ResultCard>
          ))}
        </div>
      )
    }

    if (active === 'summary') {
      const data = output as SummaryData
      return (
        <div className="space-y-3">
          <ResultCard title="Session Summary">
            <p className="text-sm leading-6 text-gray-700">{data.summary}</p>
          </ResultCard>
          <ResultCard title="Recommended Follow-up">
            <p className="text-sm leading-6 text-gray-700">{data.recommendation}</p>
          </ResultCard>
        </div>
      )
    }

    if (active === 'trends') {
      const data = output as TrendsData
      return (
        <div className="space-y-3">
          <ResultCard title="Student Understanding Trend">
            <p className="text-sm leading-6 text-gray-700">{data.trend}</p>
          </ResultCard>
          <ResultCard title="Recommended Activities">
            {data.ideas?.map((idea) => (
              <Option key={idea} text={idea} />
            ))}
          </ResultCard>
        </div>
      )
    }

    return null
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            Back to ClassPoll
          </Link>
          <div className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600">
            Join code <span className="ml-2 font-mono text-lg font-bold text-gray-900">482913</span>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h1 className="text-2xl font-bold text-gray-900">AI Teaching Tools</h1>
            <p className="mt-1 text-sm text-gray-500">Paste your lecture notes below</p>
          </div>
          <div className="space-y-4 p-5">
            <textarea
              className="min-h-[240px] w-full resize-y rounded-lg border border-gray-300 p-3 text-sm leading-6 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste your lecture notes or topic description here..."
              aria-label="Lecture notes"
            />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                onClick={() => generate('quiz')}
                disabled={loading}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Generate Quiz
              </button>
              <button
                onClick={() => generate('polls')}
                disabled={loading}
                className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
              >
                Generate Polls
              </button>
              <button
                onClick={() => generate('summary')}
                disabled={loading}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Summarize Session
              </button>
              <button
                onClick={() => generate('trends')}
                disabled={loading}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Recommend Review
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-bold text-gray-900">AI Output</h2>
          </div>
          <div className="p-5">
            <div className="mb-5 flex flex-wrap gap-2">
              {(['quiz', 'polls', 'summary', 'trends'] as DemoView[]).map((view) => (
                <button
                  key={view}
                  onClick={() => generate(view)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${
                    active === view
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>

            {renderOutput()}
          </div>
        </div>
      </section>
    </main>
  )
}
