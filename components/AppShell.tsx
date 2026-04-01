'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/auth')

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <>
      <Sidebar />
      <main className="main-content">{children}</main>
    </>
  )
}
