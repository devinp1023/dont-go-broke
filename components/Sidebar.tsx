'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/net-worth', label: 'Net Worth' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">Don&apos;t Go Broke</div>

      <div className="nav-section mt-8">Menu</div>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-link ${pathname === item.href ? 'active' : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
