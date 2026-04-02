'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PlaidLinkButton from '@/components/PlaidLinkButton'

interface Account {
  id: string
  name: string
  type: string
  subtype: string | null
  currentBalance: number | null
  availableBalance: number | null
  currency: string
  updatedAt: string | null
  transactionCount: number
}

interface Institution {
  id: string
  name: string
  connectedAt: string
  accounts: Account[]
}

function formatCurrency(amount: number | null, currency: string) {
  if (amount === null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function AccountRow({ account, onRename }: { account: Account; onRename: (id: string, name: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(account.name)

  function handleSave() {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== account.name) {
      onRename(account.id, trimmed)
    }
    setEditing(false)
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {editing ? (
            <input
              className="input-field text-label py-1 px-2"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') { setEditName(account.name); setEditing(false) }
              }}
              autoFocus
            />
          ) : (
            <button
              className="text-label font-medium text-neutral-900 hover:text-sg-600 transition-colors text-left"
              onClick={() => setEditing(true)}
              title="Click to rename"
            >
              {account.name}
            </button>
          )}
          <span className="badge badge-neutral text-xs">
            {account.subtype || account.type}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
          <span>{account.transactionCount} transaction{account.transactionCount !== 1 ? 's' : ''}</span>
          <span>Synced {timeAgo(account.updatedAt)}</span>
        </div>
      </div>
      <div className="text-right ml-4 shrink-0">
        <div className={`text-number text-lg font-semibold ${account.type === 'credit' || account.type === 'loan' ? 'text-danger-400' : (account.currentBalance ?? 0) >= 0 ? 'text-sg-400' : 'text-danger-400'}`}>
          {formatCurrency(account.currentBalance, account.currency)}
        </div>
        {account.availableBalance !== null && account.availableBalance !== account.currentBalance && (
          <div className="text-xs text-neutral-500">
            {formatCurrency(account.availableBalance, account.currency)} available
          </div>
        )}
      </div>
    </div>
  )
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

  async function handleRename(accountId: string, name: string) {
    await fetch('/api/accounts/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id: accountId, name }),
    })
    router.refresh()
  }

  const totalBalance = institutions.reduce(
    (sum, inst) => sum + inst.accounts.reduce((s, a) => s + (a.currentBalance ?? 0), 0),
    0
  )

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
          <PlaidLinkButton onSuccess={async () => { await handleSync() }} />
        </div>
      </div>

      {institutions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🏦</div>
            <div className="empty-title">No accounts connected</div>
            <div className="empty-desc">
              Connect your bank to see all your accounts and balances in one place.
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="card mb-6 p-5">
            <div className="text-label text-neutral-500 mb-1">Total Balance</div>
            <div className={`text-number font-semibold ${totalBalance >= 0 ? 'text-sg-400' : 'text-danger-400'}`}>
              {formatCurrency(totalBalance, 'USD')}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              {institutions.length} institution{institutions.length !== 1 ? 's' : ''} &middot;{' '}
              {institutions.reduce((s, i) => s + i.accounts.length, 0)} account{institutions.reduce((s, i) => s + i.accounts.length, 0) !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Institution cards */}
          {institutions.map((inst) => (
            <div key={inst.id} className="card mb-4 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-heading font-display text-neutral-900">{inst.name}</h2>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    Connected {new Date(inst.connectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
              <div>
                {inst.accounts.map((account) => (
                  <AccountRow key={account.id} account={account} onRename={handleRename} />
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
