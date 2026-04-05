'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/net-worth', label: 'Net Worth' },
  { href: '/retirement', label: 'Retirement' },
  { href: '/accounts', label: 'Account Management' },
]

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname()

  return (
    <nav
      className={`fixed top-0 left-0 w-[220px] h-screen bg-sg-900 py-8 px-5 overflow-y-auto z-[100]
        -translate-x-full md:translate-x-0 transition-transform duration-[250ms] ease-out
        max-md:pt-[calc(2rem+env(safe-area-inset-top,0px))]
        ${isOpen ? 'translate-x-0' : ''}`}
    >
      <button
        className="hidden max-md:flex items-center justify-center bg-transparent border-none text-sg-200 cursor-pointer w-8 h-8 text-[20px] absolute top-4 right-3"
        onClick={onClose}
        aria-label="Close menu"
      >
        &times;
      </button>

      <div className="flex justify-center pb-4 mb-6 border-b border-sg-700">
        <Image src="/logo.png" alt="Birch" width={56} height={56} />
      </div>

      <div className="text-[15px] font-medium tracking-[0.1em] uppercase text-sg-200 mb-2">
        Menu
      </div>

      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`block text-[18px] no-underline py-1.5 px-2 rounded-md transition-colors duration-150 mb-px
            max-md:py-2.5 max-md:px-3
            ${pathname === item.href
              ? 'text-white bg-sg-700'
              : 'text-sg-100 hover:text-white hover:bg-sg-800'
            }`}
          onClick={onClose}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
