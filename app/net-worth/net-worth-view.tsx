'use client'

import { useState } from 'react'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import InstitutionLogo from '@/components/InstitutionLogo'

interface AccountSummary {
  id: string
  name: string
  type: string
  subtype: string | null
  balance: number
  creditLimit?: number | null
  currency: string
  institution: string | null
  institutionLogo?: string | null
  prevBalance?: number | null
}

interface HoldingDisplay {
  id: string
  accountId: string
  quantity: number
  value: number
  price: number
  costBasis: number | null
  currency: string
  securityName: string
  ticker: string | null
  securityType: string | null
  isCashEquivalent: boolean
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
  holdings?: HoldingDisplay[]
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

function formatGainLoss(value: number, costBasis: number | null) {
  if (costBasis === null || costBasis === 0) return null
  const gain = value - costBasis
  const pct = ((gain / costBasis) * 100).toFixed(1)
  const sign = gain >= 0 ? '+' : ''
  return {
    text: `${sign}${formatCurrency(gain)} (${sign}${pct}%)`,
    isPositive: gain >= 0,
  }
}

export default function NetWorthView({ netWorth, totalAssets, totalLiabilities, accounts, snapshots, holdings = [] }: NetWorthViewProps) {
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

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [selectedAccount, setSelectedAccount] = useState<AccountSummary | null>(null)

  function toggleGroup(type: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
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
          <div className="chart-container" style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={snapshots} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-sg-400)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="var(--color-sg-400)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-100)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => formatChartDate(d, useShortDates)}
                  tick={{ fontSize: 12, fill: 'var(--color-neutral-500)' }}
                  axisLine={{ stroke: 'var(--color-neutral-200)' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => {
                    const abs = Math.abs(v)
                    const formatted = abs >= 1000 ? `$${(abs / 1000).toFixed(0)}k` : `$${abs}`
                    return v < 0 ? `-${formatted}` : formatted
                  }}
                  tick={{ fontSize: 12, fill: 'var(--color-neutral-500)' }}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div style={{
                        background: 'white',
                        border: '1px solid var(--color-neutral-200)',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontFamily: 'var(--font-dm-sans)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      }}>
                        <div style={{ fontSize: 12, color: 'var(--color-neutral-500)', marginBottom: 2 }}>
                          {formatTooltipDate(label as string)}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-neutral-900)' }}>
                          {formatCurrency(Number(payload[0].value))}
                        </div>
                      </div>
                    )
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  stroke="var(--color-sg-500)"
                  strokeWidth={2.5}
                  fill="url(#netWorthGradient)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
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
            <button
              type="button"
              onClick={() => toggleGroup(group.type)}
              className="flex items-center justify-between w-full mb-3 cursor-pointer"
              style={{ background: 'none', border: 'none', padding: 0 }}
            >
              <div className="flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={{
                    transform: collapsed.has(group.type) ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <path d="M4 6L8 10L12 6" stroke="var(--color-neutral-400)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h2 className="text-heading font-display text-neutral-900">{group.label}</h2>
              </div>
              <span className={`text-heading font-semibold ${isAsset ? 'text-sg-400' : 'text-danger-400'}`}>
                {isAsset ? formatCurrency(groupTotal) : `-${formatCurrency(groupTotal)}`}
              </span>
            </button>
            <div className={`collapse-section${collapsed.has(group.type) ? ' collapsed' : ''}`}>
              <div className="collapse-inner">
              <div className="flex flex-col mt-1">
                {group.accounts.map((acct) => {
                  const prev = acct.prevBalance
                  const changePct = prev !== null && prev !== undefined && prev !== 0
                    ? ((acct.balance - prev) / Math.abs(prev)) * 100
                    : null
                  const isLiability = !isAsset
                  const utilPct = isLiability && acct.creditLimit && acct.creditLimit > 0
                    ? (acct.balance / acct.creditLimit) * 100
                    : null
                  const isInvestment = group.type === 'investment' || group.type === 'brokerage'
                  return (
                    <div
                      key={acct.id}
                      className="flex items-center gap-3 py-3 border-b border-neutral-100 last:border-b-0"
                      onClick={isInvestment ? () => setSelectedAccount(acct) : undefined}
                      style={isInvestment ? { cursor: 'pointer' } : undefined}
                    >
                      {acct.institution && (
                        <InstitutionLogo name={acct.institution} logo={acct.institutionLogo ?? null} size={32} />
                      )}
                      <div className="flex flex-col min-w-0" style={{ flex: 1 }}>
                        <span className="text-neutral-900 font-medium truncate" style={{ fontSize: 15 }}>{acct.name}</span>
                        {acct.institution && (
                          <span className="text-neutral-400" style={{ fontSize: 13 }}>{acct.institution}</span>
                        )}
                      </div>
                      <div className="flex items-center shrink-0 ml-auto gap-3">
                        <span className={`font-semibold text-right tabular-nums ${isAsset ? 'text-sg-400' : 'text-danger-400'}`} style={{ fontSize: 15, width: 110 }}>
                          {isAsset ? formatCurrency(acct.balance) : `-${formatCurrency(acct.balance)}`}
                        </span>
                        <span className={`font-semibold text-right tabular-nums ${utilPct !== null ? (utilPct > 30 ? 'text-danger-400' : 'text-sg-400') : changePct !== null && changePct >= 0 ? 'text-sg-400' : changePct !== null ? 'text-danger-400' : 'text-neutral-300'}`} style={{ fontSize: 14, width: 56 }}>
                          {utilPct !== null
                            ? `${utilPct.toFixed(1)}%`
                            : changePct !== null
                              ? `${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%`
                              : '--'}
                        </span>
                      </div>
                      <div style={{ width: 16, flexShrink: 0 }}>
                        {isInvestment && (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M6 4L10 8L6 12" stroke="var(--color-neutral-300)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Holdings slide-up sheet */}
      {selectedAccount && (() => {
        const acctHoldings = holdings.filter((h) => h.accountId === selectedAccount.id)
        const prev = selectedAccount.prevBalance
        const changePct = prev !== null && prev !== undefined && prev !== 0
          ? ((selectedAccount.balance - prev) / Math.abs(prev)) * 100
          : null
        return (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setSelectedAccount(null)}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.4)',
                zIndex: 200,
                animation: 'fadeIn 0.2s ease',
              }}
            />
            {/* Sheet */}
            <div
              style={{
                position: 'fixed',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: 480,
                zIndex: 201,
                backgroundColor: '#fff',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                maxHeight: '92vh',
                overflowY: 'auto',
                animation: 'slideUp 0.3s ease',
                boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
              }}
            >
              {/* Handle */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'var(--color-neutral-200)' }} />
              </div>

              <div style={{ padding: '8px 24px 32px' }}>
                {/* Header */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
                  {selectedAccount.institution && (
                    <InstitutionLogo name={selectedAccount.institution} logo={selectedAccount.institutionLogo ?? null} size={40} />
                  )}
                  <h2 className="text-heading font-display text-neutral-900" style={{ marginTop: 8 }}>
                    {selectedAccount.institution || selectedAccount.name}
                  </h2>
                  <span className="text-eyebrow text-neutral-500">{selectedAccount.name}</span>
                </div>

                {/* Balance & Change */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 20 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div className="stat-label" style={{ fontSize: 11 }}>CURRENT</div>
                    <div className="text-heading font-semibold text-sg-400">{formatCurrency(selectedAccount.balance)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div className="stat-label" style={{ fontSize: 11 }}>CHANGE</div>
                    <div className={`text-heading font-semibold ${changePct !== null && changePct >= 0 ? 'text-sg-400' : changePct !== null ? 'text-danger-400' : 'text-neutral-400'}`}>
                      {changePct !== null ? `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%` : '--'}
                    </div>
                  </div>
                </div>

                {/* Account chart from snapshots */}
                {(() => {
                  const acctSnapshots = snapshots
                    .map((s) => ({ date: s.date, value: 0 }))
                  // We don't have per-account historical data in snapshots prop,
                  // so show the main net worth chart scoped to this section
                  // For now, skip chart if no data
                  return acctSnapshots.length >= 2 ? (
                    <div style={{ height: 120, marginBottom: 20 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={snapshots} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                          <XAxis dataKey="date" hide />
                          <YAxis hide domain={['dataMin', 'dataMax']} />
                          <Line
                            type="monotone"
                            dataKey="netWorth"
                            stroke="var(--color-sg-500)"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : null
                })()}

                {/* Holdings list */}
                {acctHoldings.length > 0 && (
                  <div>
                    {acctHoldings
                      .sort((a, b) => b.value - a.value)
                      .map((h) => {
                        const gainLoss = !h.isCashEquivalent && h.costBasis && h.costBasis > 0
                          ? h.value - h.costBasis
                          : null
                        return (
                          <div key={h.id} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-b-0">
                            <div className="flex flex-col min-w-0" style={{ gap: 1 }}>
                              <span className="text-neutral-900 font-medium" style={{ fontSize: 15, lineHeight: 1.3 }}>
                                {h.securityName}
                              </span>
                              <span className="text-neutral-400" style={{ fontSize: 13 }}>
                                {h.ticker && <span className="font-mono">{h.ticker}</span>}
                                {h.ticker && !h.isCashEquivalent && ' · '}
                                {!h.isCashEquivalent && `${h.quantity.toLocaleString('en-US', { maximumFractionDigits: 4 })} shares`}
                              </span>
                            </div>
                            <div className="flex flex-col items-end shrink-0 ml-3">
                              <span className="font-semibold text-neutral-900" style={{ fontSize: 15 }}>
                                {formatCurrency(h.value)}
                              </span>
                              {gainLoss !== null && (
                                <span
                                  className={gainLoss >= 0 ? 'text-sg-400' : 'text-danger-400'}
                                  style={{ fontSize: 13 }}
                                >
                                  {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}

                {acctHoldings.length === 0 && (
                  <div className="text-label text-neutral-500 text-center py-8">
                    No holdings data available. Sync to update.
                  </div>
                )}
              </div>
            </div>
          </>
        )
      })()}
    </div>
  )
}
