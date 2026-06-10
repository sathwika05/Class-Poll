'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'

type DemoView = 'quiz' | 'polls' | 'summary' | 'sentiment' | 'trends'

const views: Record<DemoView, ReactNode> = {
  quiz: (
    <div className="space-y-3">
      <ResultCard title="1. What is the main role of chlorophyll?">
        <Option text="Absorb light energy" badge="Correct" />
        <Option text="Store glucose" />
        <Option text="Release carbon dioxide" />
        <Option text="Break down ATP" />
      </ResultCard>
      <ResultCard title="2. Which products from light-dependent reactions support the Calvin cycle?">
        <Option text="ATP and NADPH" badge="Correct" />
        <Option text="Oxygen and water" />
        <Option text="Glucose and chlorophyll" />
        <Option text="Carbon dioxide and oxygen" />
      </ResultCard>
    </div>
  ),
  polls: (
    <div className="space-y-3">
      <ResultCard title="Concept Check: Which step releases oxygen?">
        <Option text="Water splitting during light-dependent reactions" />
        <Option text="Carbon fixation in the Calvin cycle" />
        <Option text="Glucose storage" />
        <Option text="Chlorophyll production" />
      </ResultCard>
      <ResultCard title="Prediction Poll: What would happen if a plant had no chlorophyll?">
        <Option text="It would absorb less light energy" />
        <Option text="It would make more glucose" />
        <Option text="It would release more oxygen" />
        <Option text="It would skip the Calvin cycle" />
      </ResultCard>
    </div>
  ),
  summary: (
    <div className="space-y-4">
      <ResultCard title="Automatic session summary">
        <p className="text-sm leading-6 text-gray-700">
          Students showed strong understanding of chlorophyll&apos;s role and oxygen release.
          The weakest area was connecting ATP and NADPH to the Calvin cycle. A short review
          activity before the next lecture would help reinforce the sequence of reactions.
        </p>
      </ResultCard>
      <MetricBar label="Attendance" value={84} />
      <MetricBar label="Correct responses" value={72} />
    </div>
  ),
  sentiment: (
    <div className="space-y-3">
      <ResultCard title="Overall sentiment: Mixed positive">
        <p className="text-sm leading-6 text-gray-700">
          Students feel more confident with the big idea of photosynthesis, but several
          comments show confusion about the order of light-dependent reactions and the Calvin cycle.
        </p>
      </ResultCard>
      <ResultCard title="Recommended instructor response">
        <p className="text-sm leading-6 text-gray-700">
          Start the next class with a two-minute sequence diagram and one quick poll asking
          students to place ATP, NADPH, oxygen, and glucose in the correct stage.
        </p>
      </ResultCard>
    </div>
  ),
  trends: (
    <div className="space-y-3">
      <ResultCard title="Learning trend recommendation">
        <p className="text-sm leading-6 text-gray-700">
          Students are improving on vocabulary questions but still miss process-order questions.
          Add a mini-lesson that asks students to trace energy movement from sunlight to glucose.
        </p>
      </ResultCard>
      <ResultCard title="Next poll ideas">
        <Option text="Put the photosynthesis steps in order" />
        <Option text="Identify where ATP is produced and used" />
        <Option text="Choose the best explanation for why oxygen is released" />
      </ResultCard>
    </div>
  ),
}

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

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export default function AIDemoPage() {
  const [active, setActive] = useState<DemoView>('quiz')

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
            <p className="mt-1 text-sm text-gray-500">Biology 101: Photosynthesis Review</p>
          </div>
          <div className="space-y-4 p-5">
            <textarea
              className="min-h-[240px] w-full resize-y rounded-lg border border-gray-300 p-3 text-sm leading-6 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              defaultValue={`Photosynthesis converts light energy into chemical energy. Chlorophyll absorbs light, mostly from red and blue wavelengths. In the light-dependent reactions, water is split and oxygen is released. ATP and NADPH are produced, then used in the Calvin cycle to convert carbon dioxide into glucose.`}
              aria-label="Lecture notes"
            />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button onClick={() => setActive('quiz')} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                Generate Quiz
              </button>
              <button onClick={() => setActive('polls')} className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100">
                Generate Polls
              </button>
              <button onClick={() => setActive('summary')} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Summarize Session
              </button>
              <button onClick={() => setActive('trends')} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Recommend Review
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-bold text-gray-900">AI Output Preview</h2>
          </div>
          <div className="p-5">
            <div className="mb-5 grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="text-xl font-bold text-gray-900">42</div>
                <div className="text-xs text-gray-500">Students joined</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="text-xl font-bold text-gray-900">86%</div>
                <div className="text-xs text-gray-500">Participation</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="text-xl font-bold text-gray-900">High</div>
                <div className="text-xs text-gray-500">Engagement</div>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {(['quiz', 'polls', 'summary', 'sentiment', 'trends'] as DemoView[]).map(view => (
                <button
                  key={view}
                  onClick={() => setActive(view)}
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

            {views[active]}
          </div>
        </div>
      </section>
    </main>
  )
}
