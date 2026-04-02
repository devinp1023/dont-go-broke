'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface AccountSummary {
  id: string
  name: string
  type: string
  subtype: string | null
  balance: number
  currency: string
}

interface SnapshotPoint {
  date: string
  totalAssets: number
  totalLiabilities: number
  netWorth: number
}

interface NetWorthViewProps {
  netWorth: number
  totalAssets: number
  totalLiabilities: number
  accounts: AccountSummary[]
  snapshots: SnapshotPoint[]
}

const TYPE_LABELS: Record<string, string> = {
  depository: 'Cash & Checking',
  investment: 'Investments',
  credit: 'Credit Cards',
  loan: 'Loans',
  brokerage: 'Brokerage',
  other: 'Other',
}

const TYPE_ORDER = ['depository', 'investment', 'brokerage', 'credit', 'loan', 'other']

const ASSET_TYPES = new Set(['depository', 'investment', 'brokerage', 'other'])

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatChartDate(dateStr: string, useShort: boolean) {
  const d = new Date(dateStr + 'T00:00:00')
  if (useShort) {
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTooltipDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function NetWorthView({ netWorth, totalAssets, totalLiabilities, accounts, snapshots }: NetWorthViewProps) {
  if (accounts.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-hero font-display text-neutral-900 mb-6">Net Worth</h1>
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📈</div>
            <div className="empty-title">No accounts connected</div>
            <div className="empty-desc">Connect a bank account to track your net worth over time.</div>
          </div>
        </div>
      </div>
    )
  }

  // Group accounts by type
  const grouped = new Map<string, AccountSummary[]>()
  for (const acct of accounts) {
    const type = acct.type || 'other'
    if (!grouped.has(type)) grouped.set(type, [])
    grouped.get(type)!.push(acct)
  }

  const sortedGroups = TYPE_ORDER
    .filter((t) => grouped.has(t))
    .map((t) => ({ type: t, label: TYPE_LABELS[t] || t, accounts: grouped.get(t)! }))

  // Add any types not in TYPE_ORDER
  for (const [type, accts] of grouped) {
    if (!TYPE_ORDER.includes(type)) {
      sortedGroups.push({ type, label: TYPE_LABELS[type] || type, accounts: accts })
    }
  }

  // Chart date formatting: use short format if snapshots span > 90 days
  const useShortDates = snapshots.length >= 2 &&
    (new Date(snapshots[snapshots.length - 1].date).getTime() - new Date(snapshots[0].date).getTime()) > 90 * 24 * 60 * 60 * 1000

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-hero font-display text-neutral-900 mb-6">Net Worth</h1>

      {/* Net Worth Hero */}
      <div className="card mb-4 text-center py-8">
        <div className="stat-label mb-2">NET WORTH</div>
        <div className={`text-number ${netWorth >= 0 ? 'text-sg-400' : 'text-danger-400'}`}>
          {formatCurrency(netWorth)}
        </div>
      </div>

      {/* Assets vs Liabilities */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="card p-5 text-center">
          <div className="stat-label mb-1">ASSETS</div>
          <div className="text-heading font-semibold text-sg-400">{formatCurrency(totalAssets)}</div>
        </div>
        <div className="card p-5 text-center">
          <div className="stat-label mb-1">LIABILITIES</div>
          <div className="text-heading font-semibold text-danger-400">{formatCurrency(totalLiabilities)}</div>
        </div>
      </div>

      {/* Net Worth Over Time Chart */}
      <div className="card mb-4 p-5">
        <div className="stat-label mb-4">NET WORTH OVER TIME</div>
        {snapshots.length < 2 ? (
          <div className="text-label text-neutral-500 text-center py-8">
            Chart will appear after your second account sync.
          </div>
        ) : (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={snapshots} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-100)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => formatChartDate(d, useShortDates)}
                  tick={{ fontSize: 12, fill: 'var(--color-neutral-500)' }}
                  axisLine={{ stroke: 'var(--color-neutral-200)' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12, fill: 'var(--color-neutral-500)' }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip
                  labelFormatter={(label) => formatTooltipDate(label as string)}
                  formatter={(value, name) => [
                    formatCurrency(Number(value)),
                    name === 'netWorth' ? 'Net Worth' : name === 'totalAssets' ? 'Assets' : 'Liabilities',
                  ]}
                  contentStyle={{
                    borderRadius: '10px',
                    border: '0.5px solid var(--color-neutral-200)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    fontSize: '14px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="netWorth"
                  stroke="var(--color-sg-500)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="totalAssets"
                  stroke="var(--color-sg-300)"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="totalLiabilities"
                  stroke="var(--color-danger-400)"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Account Breakdown by Type */}
      {sortedGroups.map((group) => {
        const groupTotal = group.accounts.reduce((sum, a) => sum + a.balance, 0)
        const isAsset = ASSET_TYPES.has(group.type)
        return (
          <div key={group.type} className="card mb-4 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-heading font-display text-neutral-900">{group.label}</h2>
              <span className={`text-heading font-semibold ${isAsset ? 'text-sg-400' : 'text-danger-400'}`}>
                {isAsset ? formatCurrency(groupTotal) : `-${formatCurrency(groupTotal)}`}
              </span>
            </div>
            {group.accounts.map((acct) => (
              <div key={acct.id} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-b-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-label font-medium text-neutral-900 truncate">{acct.name}</span>
                  {acct.subtype && (
                    <span className="badge badge-neutral text-xs">{acct.subtype}</span>
                  )}
                </div>
                <span className={`text-label font-semibold shrink-0 ml-4 ${isAsset ? 'text-sg-400' : 'text-danger-400'}`}>
                  {isAsset ? formatCurrency(acct.balance) : `-${formatCurrency(acct.balance)}`}
                </span>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
