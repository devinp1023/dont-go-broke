'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import TransactionList from '@/components/TransactionList'

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

  useEffect(() => {
    if (!hasSynced.current) {
      hasSynced.current = true
      fetch('/api/plaid/sync', { method: 'POST' }).then(() => {
        router.refresh()
      })
    }
  }, [])

  const months = useMemo(() => {
    const set = new Set(transactions.map((t) => getMonthKey(t.date)))
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [transactions])

  const [monthIndex, setMonthIndex] = useState(0)
  const currentMonth = months[monthIndex]

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
          onClick={() => setMonthIndex((i) => Math.max(i - 1, 0))}
          disabled={monthIndex <= 0}
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
          onClick={() => setMonthIndex((i) => Math.min(i + 1, months.length - 1))}
          disabled={monthIndex >= months.length - 1}
          className="btn btn-icon disabled:opacity-25"
          style={{ width: 44, height: 44, fontSize: 24, background: 'var(--color-sg-500)', color: 'white', border: 'none' }}
          aria-label="Older month"
        >
          &rarr;
        </button>
      </div>

      <TransactionList
        transactions={filtered}
        onCategoryChange={async (txnId, newCategory) => {
          setTransactions((prev) =>
            prev.map((t) => (t.id === txnId ? { ...t, category: newCategory } : t))
          )
          await fetch('/api/transactions/update-category', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactionId: txnId, category: newCategory }),
          })
        }}
      />
    </div>
  )
}
