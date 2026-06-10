import type { WSEvent } from './types'

export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  (typeof window !== 'undefined'
    ? `ws://${window.location.hostname}:8000`
    : 'ws://localhost:8000')

type MessageHandler = (event: WSEvent) => void
type StatusHandler = (connected: boolean) => void

export class SessionSocket {
  private ws: WebSocket | null = null
  private sessionId: number
  private role: string
  private onMessage: MessageHandler
  private onStatus: StatusHandler
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private pingInterval: ReturnType<typeof setInterval> | null = null
  private shouldClose = false
  private reconnectDelay = 1000

  constructor(
    sessionId: number,
    role: string,
    onMessage: MessageHandler,
    onStatus: StatusHandler
  ) {
    this.sessionId = sessionId
    this.role = role
    this.onMessage = onMessage
    this.onStatus = onStatus
    this.connect()
  }

  private connect() {
    if (this.shouldClose) return
    const url = `${WS_URL}/ws/sessions/${this.sessionId}?role=${this.role}`
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.reconnectDelay = 1000
      this.onStatus(true)
      this.pingInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send('ping')
        }
      }, 25000)
    }

    this.ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as WSEvent
        this.onMessage(event)
      } catch {
        // ignore malformed messages
      }
    }

    this.ws.onclose = () => {
      this.onStatus(false)
      this.clearPing()
      if (!this.shouldClose) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000)
          this.connect()
        }, this.reconnectDelay)
      }
    }

    this.ws.onerror = () => {
      this.ws?.close()
    }
  }

  private clearPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  close() {
    this.shouldClose = true
    this.clearPing()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.ws?.close()
  }
}
