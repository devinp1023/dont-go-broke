'use client'

import { useState } from 'react'
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
  const [syncing, setSyncing] = useState(false)

  async function handleSync() {
    setSyncing(true)
    try {
      await fetch('/api/plaid/sync', { method: 'POST' })
      window.location.reload()
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-hero font-display text-neutral-900">Transactions</h1>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="btn btn-secondary disabled:opacity-50"
        >
          {syncing ? 'Syncing...' : 'Sync'}
        </button>
      </div>

      <div className="card">
        <TransactionList transactions={transactions} />
      </div>
    </div>
  )
}
