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
      // Reload to get fresh data from the server component
      window.location.reload()
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Don't Go Broke</h1>
          <div className="flex gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              {syncing ? 'Syncing...' : 'Sync'}
            </button>
            <PlaidLinkButton onSuccess={() => window.location.reload()} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <TransactionList transactions={transactions} />
        </div>
      </div>
    </div>
  )
}
