'use client'

import { useEffect, useRef, useState } from 'react'
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-hero font-display text-neutral-900">Transactions</h1>
      </div>

      <TransactionList
        transactions={transactions}
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
