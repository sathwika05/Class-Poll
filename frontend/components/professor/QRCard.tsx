'use client'
import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { getServerInfo } from '@/lib/api'

interface Props {
  sessionCode: string
}

const FRONTEND_PORT = process.env.NEXT_PUBLIC_FRONTEND_PORT || '3000'

export default function QRCard({ sessionCode }: Props) {
  const [joinUrl, setJoinUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getServerInfo()
      .then(({ local_ip }) => {
        setJoinUrl(`http://${local_ip}:${FRONTEND_PORT}/student?code=${sessionCode}`)
      })
      .catch(() => {
        // Fall back to current browser origin if the endpoint is unreachable
        setJoinUrl(`${window.location.origin}/student?code=${sessionCode}`)
      })
  }, [sessionCode])

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!joinUrl) return null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center gap-4">
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Scan to Join</h3>

      <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-inner">
        <QRCodeSVG
          value={joinUrl}
          size={180}
          bgColor="#ffffff"
          fgColor="#1e293b"
          level="M"
        />
      </div>

      <p className="text-xs text-gray-400 text-center">
        Students can scan this QR code or enter the session code manually.
      </p>

      <div className="w-full">
        <p className="text-xs text-gray-500 font-medium mb-1.5">Join link</p>
        <div className="flex items-center gap-2">
          <span className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 font-mono truncate">
            {joinUrl}
          </span>
          <button
            onClick={copyLink}
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  )
}
