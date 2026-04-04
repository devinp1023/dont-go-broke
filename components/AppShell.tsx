'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import ChatWidget from './ChatWidget'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/auth')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auto-close sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <>
      {/* Mobile header */}
      <div className="hidden max-md:flex items-center gap-3 sticky top-0 z-50 px-4 py-3 pt-[env(safe-area-inset-top,12px)] bg-sg-900 border-b border-sg-700">
        <button
          className="bg-transparent border-none p-1.5 cursor-pointer text-sg-200"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="font-display text-[20px] text-sg-400">Don&apos;t Go Broke</span>
      </div>

      {/* Sidebar overlay (mobile only) */}
      <div
        className={`hidden max-md:block fixed inset-0 bg-black/40 z-[99] transition-opacity duration-[250ms]
          ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="md:ml-[220px] min-h-screen">{children}</main>
      <ChatWidget />
    </>
  )
}
