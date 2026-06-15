'use client'
import { useState, useEffect } from 'react'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined'
    ? `http://${window.location.hostname}:8000`
    : 'http://localhost:8000')

// ─── storage keys ───────────────────────────────────────────────────────────
const KEY_URL     = 'teams_webhook_url'
const KEY_ENABLED = 'teams_enabled'

// ─── exported helpers (used by professor/page.tsx) ──────────────────────────

/** Read the stored webhook URL (or '' if not set). */
export function getTeamsWebhookUrl(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(KEY_URL) || ''
}

/** Return true when the integration is enabled and a URL is stored. */
export function isTeamsEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return (
    localStorage.getItem(KEY_ENABLED) === 'true' &&
    !!localStorage.getItem(KEY_URL)
  )
}

/**
 * Fire-and-forget Teams notification.
 * Swallows all errors so it never disrupts the professor UI.
 */
export async function fireTeamsNotification(
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  if (!isTeamsEnabled()) return
  const webhookUrl = getTeamsWebhookUrl()
  if (!webhookUrl) return
  try {
    await fetch(`${API_URL}/api/teams/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhook_url: webhookUrl, event_type: eventType, payload }),
    })
  } catch {
    // silently ignore — Teams notifications are best-effort
  }
}

// ─── component ───────────────────────────────────────────────────────────────

interface TeamsPanelProps {
  className?: string
}

export default function TeamsPanel({ className = '' }: TeamsPanelProps) {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [enabled, setEnabled]       = useState(false)
  const [savedUrl, setSavedUrl]     = useState('')
  const [savedEnabled, setSavedEnabled] = useState(false)
  const [saved, setSaved]           = useState(false)
  const [testing, setTesting]       = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Load from localStorage on mount (client only)
  useEffect(() => {
    const url = localStorage.getItem(KEY_URL) || ''
    const en  = localStorage.getItem(KEY_ENABLED) === 'true'
    setWebhookUrl(url)
    setEnabled(en)
    setSavedUrl(url)
    setSavedEnabled(en)
  }, [])

  const handleSave = () => {
    localStorage.setItem(KEY_URL, webhookUrl)
    localStorage.setItem(KEY_ENABLED, String(enabled))
    setSavedUrl(webhookUrl)
    setSavedEnabled(enabled)
    setSaved(true)
    setTestStatus('idle')
    setTimeout(() => setSaved(false), 2000)
  }

  const handleTest = async () => {
    if (!webhookUrl) return
    setTesting(true)
    setTestStatus('idle')
    try {
      const res = await fetch(`${API_URL}/api/teams/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_url: webhookUrl }),
      })
      setTestStatus(res.ok ? 'success' : 'error')
    } catch {
      setTestStatus('error')
    } finally {
      setTesting(false)
    }
  }

  const isDirty = webhookUrl !== savedUrl || enabled !== savedEnabled

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        {/* Microsoft Teams logo (purple) */}
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 2228.833 2073.333" xmlns="http://www.w3.org/2000/svg">
          <path d="M1554.637 777.5h575.713c54.391 0 98.483 44.092 98.483 98.483v524.398c0 199.901-162.051 361.952-361.952 361.952h-1.711c-199.901.028-361.975-162.009-361.975-361.911V828.971c0-28.427 23.044-51.471 51.442-51.471z" fill="#5059C9"/>
          <circle cx="1943.75" cy="440.583" r="233.25" fill="#5059C9"/>
          <circle cx="1218.083" cy="336.917" r="336.917" fill="#7B83EB"/>
          <path d="M1667.323 777.5H717.01c-53.743 1.33-96.257 45.931-94.927 99.675v598.105c-7.825 322.761 247.003 590.857 569.761 598.682 322.758-7.825 577.586-275.921 569.761-598.682V877.175c1.33-53.744-41.184-98.345-94.282-99.675z" fill="#7B83EB"/>
          <path d="M1244 777.5v838.145c-.31 44.738-27.457 85.023-69.196 102.429-13.639 5.741-28.24 8.68-42.99 8.617H667.613c-6.642-17.65-12.66-35.622-17.493-53.938-17.85-64.829-26.88-131.685-26.928-198.887V877.05c-1.33-53.634 41.094-98.115 94.719-99.55H1244z" opacity=".1"/>
          <path d="M1191.333 777.5v891.082c.057 14.75-2.882 29.352-8.617 42.99-17.406 41.74-57.691 68.886-102.429 69.196H691.261c-8.996-17.617-17.38-35.589-24.552-53.938-7.095-18.189-12.767-36.842-17.042-55.796-17.85-64.829-26.88-131.685-26.929-198.887V877.05c-1.33-53.634 41.094-98.115 94.719-99.55h473.876z" opacity=".2"/>
          <path d="M1191.333 777.5v784.206c-.413 52.309-42.679 94.574-94.987 94.986H649.619c-17.85-64.829-26.88-131.685-26.929-198.887V877.05c-1.33-53.634 41.094-98.115 94.719-99.55h473.924z" opacity=".2"/>
          <path d="M1138.667 777.5v784.206c-.413 52.309-42.679 94.574-94.987 94.986H649.619c-17.85-64.829-26.88-131.685-26.929-198.887V877.05c-1.33-53.634 41.094-98.115 94.719-99.55h421.258z" opacity=".2"/>
          <path d="M1244 509.522v163.275c-8.761.422-17.447.844-26.133 1.689-8.687.746-17.373 1.69-25.985 2.956-47.712 6.72-93.888 21.597-136.503 44.227-10.671 5.854-20.992 12.249-31.012 19.134a338.589 338.589 0 0 0-27.283 22.047c-9.867 8.93-19.134 18.488-27.726 28.629a257.368 257.368 0 0 0-23.29 37.247H573.167C518.878 828.49 474.957 784.57 474.5 730.28V509.522C474.957 455.233 518.878 411.312 573.167 410.5H1145.5c54.133.757 97.768 44.27 98.5 98.497v.525z" fill="#5059C9"/>
          <path d="M1079.439 509.522v215.667c-.335 52.325-42.692 94.682-95.017 95.017H474.5v-290.14c.457-54.289 44.378-98.21 98.667-99.022h507.272v78.478z" opacity=".2"/>
          <path d="M94.917 144.5h956.167c52.418 0 94.917 42.499 94.917 94.917v956.167c0 52.418-42.499 94.917-94.917 94.917H94.917C42.499 1290.5 0 1248.001 0 1195.583V239.417C0 187.002 42.499 144.5 94.917 144.5z" fill="#4B53BC"/>
          <path d="M820.211 481.25h-208.15v554.44H484.525V481.25H277.5v-124.2h542.711z" fill="#fff"/>
        </svg>
        <h3 className="font-semibold text-gray-800 text-sm">Microsoft Teams</h3>
        <span
          className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
            enabled
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {enabled ? 'Enabled' : 'Off'}
        </span>
      </div>

      <div className="space-y-3">
        {/* Webhook URL input */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Incoming Webhook URL
          </label>
          <input
            type="url"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            placeholder="https://yourorg.webhook.office.com/webhookb2/…"
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono placeholder:font-sans"
          />
          <p className="text-xs text-gray-400 mt-1">
            Teams channel → ··· → Connectors → Incoming Webhook → Configure
          </p>
        </div>

        {/* Enable toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled(v => !v)}
            className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${
              enabled ? 'bg-indigo-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                enabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-xs text-gray-600">
            Send notifications to Teams channel
          </span>
        </label>

        {/* What gets sent */}
        {enabled && (
          <ul className="text-xs text-gray-500 space-y-0.5 pl-1 border-l-2 border-indigo-200 ml-1">
            <li>🟢 Session started (name + join code)</li>
            <li>📊 Poll opened (question + options)</li>
            <li>✅ Poll closed (results + vote counts)</li>
            <li>🏁 Session ended (attendance summary)</li>
          </ul>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            className={`flex-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              saved
                ? 'bg-green-100 text-green-700'
                : isDirty
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {saved ? '✓ Saved' : 'Save'}
          </button>
          <button
            onClick={handleTest}
            disabled={!webhookUrl || testing}
            className="flex-1 text-xs border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-40"
          >
            {testing ? 'Sending…' : 'Send Test'}
          </button>
        </div>

        {/* Test result feedback */}
        {testStatus === 'success' && (
          <p className="text-xs text-green-600 font-medium">
            ✓ Test card sent — check your Teams channel!
          </p>
        )}
        {testStatus === 'error' && (
          <p className="text-xs text-red-500 font-medium">
            ✗ Failed — verify the webhook URL and try again.
          </p>
        )}
      </div>
    </div>
  )
}
