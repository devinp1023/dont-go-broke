'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PlaidLinkButton from '@/components/PlaidLinkButton'
import InstitutionLogo from '@/components/InstitutionLogo'
import { useToast } from '@/components/Toast'

interface Institution {
  id: string
  name: string
  logo: string | null
  connectedAt: string
  accountCount: number
}

export default function AccountsView({ institutions }: { institutions: Institution[] }) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const { toastEl, showToast } = useToast()

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch('/api/plaid/sync', { method: 'POST' })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      showToast('Failed to sync accounts')
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
      const res = await fetch('/api/accounts/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plaid_item_id: plaidItemId }),
      })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      showToast('Failed to disconnect institution')
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
          <PlaidLinkButton onSuccess={async () => { router.refresh(); await handleSync() }} />
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
          {(() => {
            const totalAccounts = institutions.reduce((sum, inst) => sum + inst.accountCount, 0)
            return (
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                <span className="text-[14px] font-medium px-3 py-1 rounded-full" style={{ background: 'var(--color-sg-50)', color: 'var(--color-sg-700)' }}>
                  {totalAccounts} account{totalAccounts !== 1 ? 's' : ''}
                </span>
                <span className="text-neutral-300">&middot;</span>
                <span className="text-[14px] font-medium px-3 py-1 rounded-full" style={{ background: 'var(--color-sg-50)', color: 'var(--color-sg-700)' }}>
                  {institutions.length} institution{institutions.length !== 1 ? 's' : ''}
                </span>
              </div>
            )
          })()}

          {institutions.map((inst) => (
            <div key={inst.id} className="card mb-4 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <InstitutionLogo name={inst.name} logo={inst.logo} size={40} />
                  <div>
                  <h2 className="text-heading font-display text-neutral-900">{inst.name}</h2>
                  <div className="text-eyebrow text-neutral-500 mt-1">
                    {inst.accountCount} account{inst.accountCount !== 1 ? 's' : ''} &middot; Connected {new Date(inst.connectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDisconnect(inst.id, inst.name)}
                  disabled={disconnecting === inst.id}
                  className="btn btn-sm disabled:opacity-50"
                  style={{
                    background: 'white',
                    color: 'var(--color-neutral-600)',
                    border: '1px solid var(--color-neutral-300)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-neutral-100)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                >
                  {disconnecting === inst.id ? 'Removing...' : 'Disconnect'}
                </button>
              </div>
            </div>
          ))}
        </>
      )}
      {toastEl}
    </div>
  )
}
