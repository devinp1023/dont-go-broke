'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import TransactionList from '@/components/TransactionList'
import { useToast } from '@/components/Toast'

type Transaction = {
  id: string
  date: string
  name: string
  merchant_name: string | null
  amount: number
  category: string | null
}

function getMonthKey(date: string) {
  return date.slice(0, 7) // "2026-03"
}

function formatMonth(monthKey: string) {
  const [year, month] = monthKey.split('-')
  const date = new Date(Number(year), Number(month) - 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function TransactionsView({ transactions: initialTransactions }: { transactions: Transaction[] }) {
  const [transactions, setTransactions] = useState(initialTransactions)
  const hasSynced = useRef(false)
  const router = useRouter()
  const { toastEl, showToast } = useToast()

  useEffect(() => {
    if (!hasSynced.current) {
      hasSynced.current = true
      fetch('/api/plaid/sync', { method: 'POST' })
        .then(() => router.refresh())
        .catch(() => showToast('Failed to sync transactions'))
    }
  }, [])

  const months = useMemo(() => {
    const set = new Set(transactions.map((t) => getMonthKey(t.date)))
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [transactions])

  const [monthIndex, setMonthIndex] = useState(0)
  const [slide, setSlide] = useState<'idle' | 'out' | 'in'>('idle')
  const pendingDir = useRef<'left' | 'right' | null>(null)
  const lastDir = useRef<'left' | 'right'>('right')
  const currentMonth = months[monthIndex]

  function goMonth(dir: 'left' | 'right') {
    if (slide !== 'idle') return
    if (dir === 'left' && monthIndex <= 0) return
    if (dir === 'right' && monthIndex >= months.length - 1) return
    pendingDir.current = dir
    lastDir.current = dir
    setSlide('out')
  }

  const filtered = useMemo(() => {
    if (!currentMonth) return transactions
    return transactions.filter((t) => getMonthKey(t.date) === currentMonth)
  }, [transactions, currentMonth])

  if (months.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-hero font-display text-neutral-900">Transactions</h1>
        </div>
        <TransactionList transactions={[]} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-hero font-display text-neutral-900">Transactions</h1>
      </div>

      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => goMonth('left')}
          disabled={monthIndex <= 0 || slide !== 'idle'}
          className="btn btn-icon disabled:opacity-25"
          style={{ width: 44, height: 44, fontSize: 24, background: 'var(--color-sg-500)', color: 'white', border: 'none' }}
          aria-label="Newer month"
        >
          &larr;
        </button>
        <span className="text-heading font-display text-neutral-900">
          {formatMonth(currentMonth)}
        </span>
        <button
          onClick={() => goMonth('right')}
          disabled={monthIndex >= months.length - 1 || slide !== 'idle'}
          className="btn btn-icon disabled:opacity-25"
          style={{ width: 44, height: 44, fontSize: 24, background: 'var(--color-sg-500)', color: 'white', border: 'none' }}
          aria-label="Older month"
        >
          &rarr;
        </button>
      </div>

      <div style={{ overflow: 'hidden' }}>
        <div
          style={{
            transition: slide === 'out'
              ? 'opacity 0.3s ease-in, transform 0.3s ease-in'
              : 'opacity 0.3s ease-out, transform 0.3s ease-out',
            ...(slide === 'out'
              ? { opacity: 0, transform: `translateX(${lastDir.current === 'right' ? '-40px' : '40px'})` }
              : slide === 'in'
                ? { opacity: 0, transform: `translateX(${lastDir.current === 'right' ? '40px' : '-40px'})` }
                : { opacity: 1, transform: 'translateX(0)' }),
          }}
          onTransitionEnd={(e) => {
            if (e.propertyName !== 'opacity') return
            if (slide === 'out') {
              const dir = pendingDir.current
              pendingDir.current = null
              setMonthIndex((i) => dir === 'left' ? Math.max(i - 1, 0) : Math.min(i + 1, months.length - 1))
              // Start from the opposite side, then animate to center
              setSlide('in')
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  setSlide('idle')
                })
              })
            }
          }}
        >
        <TransactionList
          transactions={filtered}
          onCategoryChange={async (txnId, newCategory) => {
            const prev = transactions
            setTransactions((cur) =>
              cur.map((t) => (t.id === txnId ? { ...t, category: newCategory } : t))
            )
            try {
              const res = await fetch('/api/transactions/update-category', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactionId: txnId, category: newCategory }),
              })
              if (!res.ok) throw new Error()
            } catch {
              setTransactions(prev)
              showToast('Failed to update category')
            }
          }}
        />
        </div>
      </div>
      {toastEl}
    </div>
  )
}
