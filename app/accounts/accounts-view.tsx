'use client'

import { useState } from 'react'
import PlaidLinkButton from '@/components/PlaidLinkButton'

export default function AccountsView() {
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
        <h1 className="text-hero font-display text-neutral-900">Accounts</h1>
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
        <div className="empty-state">
          <div className="empty-icon">🏦</div>
          <div className="empty-title">Coming soon</div>
          <div className="empty-desc">View and manage all your connected bank accounts.</div>
        </div>
      </div>
    </div>
  )
}
