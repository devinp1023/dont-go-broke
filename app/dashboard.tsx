'use client'

import { useState } from 'react'
import PlaidLinkButton from '@/components/PlaidLinkButton'
import TransactionList from '@/components/TransactionList'

type Transaction = {
  id: string
  date: string
  name: string
  merchant_name: string | null
  amount: number
  category: string | null
}

export default function Dashboard({ transactions: initialTransactions }: { transactions: Transaction[] }) {
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
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-display font-display text-neutral-900">Don&apos;t Go Broke</h1>
          <div className="flex gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="btn btn-secondary disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Sync'}
            </button>
            <PlaidLinkButton onSuccess={() => window.location.reload()} />
          </div>
        </div>

        <div className="card">
          <TransactionList transactions={transactions} />
        </div>
      </div>
    </div>
  )
}
