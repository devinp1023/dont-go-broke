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
      <div className="mobile-header">
        <button className="mobile-header-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="mobile-header-title">Don&apos;t Go Broke</span>
      </div>
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">{children}</main>
      <ChatWidget />
    </>
  )
}
