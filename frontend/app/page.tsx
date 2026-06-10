import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-2xl mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">ClassPoll</h1>
          <p className="text-blue-200 text-xl">Real-time classroom polling &amp; attendance</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
          <Link href="/professor" className="group bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-200 hover:-translate-y-1">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Professor</h2>
              <p className="text-gray-500 text-sm text-center">Create sessions, run polls, track attendance, and export results</p>
            </div>
          </Link>

          <Link href="/student" className="group bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-200 hover:-translate-y-1">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Student</h2>
              <p className="text-gray-500 text-sm text-center">Join a session with a code and vote on live polls</p>
            </div>
          </Link>

          <Link href="/analytics" className="group bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-200 hover:-translate-y-1">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Analytics</h2>
              <p className="text-gray-500 text-sm text-center">Advanced dashboard with attendance, engagement, and performance insights</p>
            </div>
          </Link>
        </div>

        <p className="mt-8 text-blue-300 text-sm">
          For projector display, go to <span className="font-mono bg-white/20 px-2 py-0.5 rounded">/display/[session-id]</span>
        </p>
      </div>
    </main>
  )
}
