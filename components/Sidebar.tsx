'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/net-worth', label: 'Net Worth' },
  { href: '/accounts', label: 'Account Management' },
]

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
      <button className="sidebar-close" onClick={onClose} aria-label="Close menu">
        &times;
      </button>
      <div className="sidebar-logo">Don&apos;t Go Broke</div>

      <div className="nav-section mt-8">Menu</div>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-link ${pathname === item.href ? 'active' : ''}`}
          onClick={onClose}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
