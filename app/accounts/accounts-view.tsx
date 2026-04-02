'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PlaidLinkButton from '@/components/PlaidLinkButton'

interface Institution {
  id: string
  name: string
  connectedAt: string
  accountCount: number
}

export default function AccountsView({ institutions }: { institutions: Institution[] }) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  async function handleSync() {
    setSyncing(true)
    try {
      await fetch('/api/plaid/sync', { method: 'POST' })
      router.refresh()
    } finally {
      setSyncing(false)
    }
  }

  async function handleDisconnect(plaidItemId: string, institutionName: string) {
    if (!confirm(`Disconnect ${institutionName}? This will remove all accounts and transactions from this institution.`)) {
      return
    }
    setDisconnecting(plaidItemId)
    try {
      await fetch('/api/accounts/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plaid_item_id: plaidItemId }),
      })
      router.refresh()
    } finally {
      setDisconnecting(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-y-4">
        <h1 className="text-hero font-display text-neutral-900">Account Management</h1>
        <div className="flex gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="btn btn-secondary disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
          <PlaidLinkButton onSuccess={async () => { await handleSync() }} />
        </div>
      </div>

      {institutions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🏦</div>
            <div className="empty-title">No accounts connected</div>
            <div className="empty-desc">
              Connect your bank to start tracking your finances.
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="text-label text-neutral-500 mb-4">
            {institutions.length} institution{institutions.length !== 1 ? 's' : ''} connected
          </div>

          {institutions.map((inst) => (
            <div key={inst.id} className="card mb-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-heading font-display text-neutral-900">{inst.name}</h2>
                  <div className="text-eyebrow text-neutral-500 mt-1">
                    {inst.accountCount} account{inst.accountCount !== 1 ? 's' : ''} &middot; Connected {new Date(inst.connectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <button
                  onClick={() => handleDisconnect(inst.id, inst.name)}
                  disabled={disconnecting === inst.id}
                  className="btn btn-danger btn-sm disabled:opacity-50"
                >
                  {disconnecting === inst.id ? 'Removing...' : 'Disconnect'}
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
