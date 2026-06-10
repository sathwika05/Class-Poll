import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ClassPoll — Real-Time Classroom Polling',
  description: 'Live polling and attendance for classroom engagement',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
