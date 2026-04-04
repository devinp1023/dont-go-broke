'use client'

import { useState } from 'react'

type CategoryData = {
  category: string
  amount: number
}

function formatDollar(value: number) {
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDollarShort(value: number) {
  return `$${Math.round(value).toLocaleString('en-US')}`
}

function prettifyCategory(raw: string) {
  return raw
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase())
}

const SKIP_CATEGORIES = new Set(['internal_transfer'])

function buildCategoryOptions(data: CategoryData[]) {
  const options: { label: string; amount: number }[] = []

  for (const item of data) {
    const key = item.category.toLowerCase()
    if (SKIP_CATEGORIES.has(key)) continue
    if (item.amount > 0) {
      options.push({ label: prettifyCategory(item.category), amount: item.amount })
    }
  }

  return options.sort((a, b) => b.amount - a.amount)
}

type TopHolding = {
  name: string
  ticker: string | null
  gainPct: number
  gainAmount: number
}

export default function Dashboard({ income, expenses, monthLabel, categoryBreakdown, insight, currentNetWorth, netWorthChange, netWorthPrevious, netWorthSparkline, topHolding, worstHolding }: { income: number; expenses: number; monthLabel: string; categoryBreakdown: CategoryData[]; insight?: string; currentNetWorth?: number | null; netWorthChange?: number | null; netWorthPrevious?: number | null; netWorthSparkline?: number[]; topHolding?: TopHolding | null; worstHolding?: TopHolding | null }) {
  const net = income - expenses
  const netPositive = net >= 0
  const maxValue = Math.max(income, expenses, 1)
  const incomePct = (income / maxValue) * 100
  const expensePct = (expenses / maxValue) * 100

  return (
    <div className="px-6 lg:px-10 py-8">
      <h1 className="text-hero font-display text-neutral-900 mb-6">Hello, Devin!</h1>

      {/* AI Insight card */}
      {insight && (
        <div
          className="card mb-8"
          style={{ borderLeft: '4px solid #E07A3A', paddingLeft: '1.25rem' }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L9.2 5.8H14L10.1 8.7L11.3 13.5L8 10.6L4.7 13.5L5.9 8.7L2 5.8H6.8L8 1Z" fill="#E07A3A" opacity="0.5" />
              <path d="M8 1L9.2 5.8H14L10.1 8.7L11.3 13.5L8 10.6L4.7 13.5L5.9 8.7L2 5.8H6.8L8 1Z" stroke="#C96A30" strokeWidth="0.8" fill="none" />
            </svg>
            <span className="text-[12px] font-semibold tracking-[0.08em] uppercase" style={{ color: '#C96A30' }}>
              Claude&apos;s take
            </span>
          </div>
          <p className="text-[19px] leading-[1.55] text-neutral-700 italic font-display">{insight}</p>
        </div>
      )}

      {/* Income/Expenses + Net Worth row */}
      <div className="grid grid-cols-1 md:grid-cols-[6fr_3fr_3fr] gap-6 mb-8">

      {/* Income vs Expenses — horizontal bars */}
      <div className="card">
        {monthLabel && (
          <div className="flex items-center justify-between mb-6">
            <div className="stat-label text-neutral-800 mb-0">{monthLabel}</div>
            <div className={`text-label font-semibold tabular-nums ${netPositive ? 'text-sg-400' : 'text-danger-400'}`}>
              {netPositive ? '+' : ''}{formatDollarShort(net)} net
            </div>
          </div>
        )}

        {/* Income bar */}
        <div className="mb-5">
          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none">
                <path d="M8 13V3M8 3L4 7M8 3L12 7" stroke="var(--color-sg-500)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-label font-medium text-neutral-700">Income</span>
            </div>
            <span className="text-heading font-display text-sg-400 tabular-nums">{formatDollar(income)}</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--color-sg-50)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${incomePct}%`,
                background: 'linear-gradient(90deg, var(--color-sg-400), var(--color-sg-500))',
                transition: 'width 0.5s ease-out',
              }}
            />
          </div>
        </div>

        {/* Expenses bar */}
        <div className="mb-5">
          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none">
                <path d="M8 3V13M8 13L4 9M8 13L12 9" stroke="var(--color-danger-400)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-label font-medium text-neutral-700">Expenses</span>
            </div>
            <span className="text-heading font-display text-danger-400 tabular-nums">{formatDollar(expenses)}</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--color-danger-50)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${expensePct}%`,
                background: 'linear-gradient(90deg, var(--color-danger-400), var(--color-danger-600))',
                transition: 'width 0.5s ease-out',
              }}
            />
          </div>
        </div>

        {/* Savings rate */}
        {income > 0 && (
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-label text-neutral-500">Savings rate</span>
            {(() => {
              const savingsRate = ((income - expenses) / income) * 100
              const isPositive = savingsRate >= 0
              return (
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 text-label font-semibold tabular-nums px-2.5 py-0.5 rounded-full"
                    style={{
                      background: isPositive ? 'var(--color-sg-50)' : 'var(--color-danger-50)',
                      color: isPositive ? 'var(--color-sg-700)' : 'var(--color-danger-600)',
                    }}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                      {isPositive ? (
                        <path d="M7 10V4M7 4L4 7M7 4L10 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      ) : (
                        <path d="M7 4V10M7 10L4 7M7 10L10 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      )}
                    </svg>
                    {isPositive ? '+' : ''}{savingsRate.toFixed(1)}%
                  </span>
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {/* Net Worth Change card */}
      {netWorthChange !== null && netWorthChange !== undefined && (
        <div className="card flex flex-col justify-center md:col-span-2">
          {/* Sentence-style statement */}
          <p className="text-display font-display text-neutral-900 text-center mb-4">
            Your net worth{' '}
            <span className={netWorthChange >= 0 ? 'text-sg-400' : 'text-danger-400'}>
              {netWorthChange >= 0 ? 'increased' : 'decreased'} by {formatDollarShort(Math.abs(netWorthChange))}
            </span>
            {' '}this month
          </p>

          {/* Percentage change */}
          {netWorthPrevious !== null && netWorthPrevious !== undefined && netWorthPrevious !== 0 && (
            <div className="text-center mb-4">
              <span className={`text-label tabular-nums ${netWorthChange >= 0 ? 'text-sg-400' : 'text-danger-400'}`}>
                {netWorthChange >= 0 ? '+' : ''}{((netWorthChange / Math.abs(netWorthPrevious)) * 100).toFixed(1)}% from last month
              </span>
            </div>
          )}

          {/* Mini sparkline */}
          {netWorthSparkline && netWorthSparkline.length >= 3 && (() => {
            const min = Math.min(...netWorthSparkline)
            const max = Math.max(...netWorthSparkline)
            const range = max - min || 1
            const h = 48
            const w = 260
            const points = netWorthSparkline.map((v, i) => {
              const x = (i / (netWorthSparkline.length - 1)) * w
              const y = h - ((v - min) / range) * (h - 4) - 2
              return `${x},${y}`
            }).join(' ')
            const trending = netWorthSparkline[netWorthSparkline.length - 1] >= netWorthSparkline[0]
            return (
              <div className="flex justify-center">
                <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
                  <polyline
                    points={points}
                    stroke={trending ? 'var(--color-sg-400)' : 'var(--color-danger-400)'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
            )
          })()}
        </div>
      )}

      </div>{/* end grid */}

      {/* Category Spend + Holdings row */}
      <div className="grid grid-cols-1 md:grid-cols-[6fr_3fr_3fr] gap-6">
        <CategorySpendCard data={categoryBreakdown} monthLabel={monthLabel} />

        {/* Top performing holding */}
        {topHolding && (
          <HoldingCard
            holding={topHolding}
            label={monthLabel ? `${monthLabel} TOP PERFORMER` : 'TOP PERFORMER'}
          />
        )}

        {/* Worst performing holding */}
        {worstHolding && (
          <HoldingCard
            holding={worstHolding}
            label={monthLabel ? `${monthLabel} WORST PERFORMER` : 'WORST PERFORMER'}
          />
        )}
      </div>
    </div>
  )
}

function HoldingCard({ holding, label }: { holding: TopHolding; label: string }) {
  return (
    <div className="card flex flex-col justify-center items-center text-center">
      <div className="stat-label mb-4">{label}</div>
      {holding.ticker && (
        <span
          className="font-mono text-[13px] font-semibold tracking-wide px-2.5 py-1 rounded-md mb-2"
          style={{ background: 'var(--color-neutral-100)', color: 'var(--color-neutral-700)' }}
        >
          {holding.ticker}
        </span>
      )}
      <div className="text-label text-neutral-500 mb-3 text-center px-2">
        {holding.name}
      </div>
      <div className="flex items-baseline gap-3">
        <span
          className="inline-flex items-center gap-1 text-heading font-semibold tabular-nums px-3 py-1 rounded-full"
          style={{
            background: holding.gainPct >= 0 ? 'var(--color-sg-50)' : 'var(--color-danger-50)',
            color: holding.gainPct >= 0 ? 'var(--color-sg-700)' : 'var(--color-danger-600)',
          }}
        >
          <svg className="w-4 h-4" viewBox="0 0 14 14" fill="none">
            {holding.gainPct >= 0 ? (
              <path d="M7 10V4M7 4L4 7M7 4L10 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M7 4V10M7 10L4 7M7 10L10 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
          {holding.gainPct >= 0 ? '+' : ''}{holding.gainPct.toFixed(1)}%
        </span>
      </div>
      <div className={`text-label tabular-nums mt-2 ${holding.gainAmount >= 0 ? 'text-sg-400' : 'text-danger-400'}`}>
        {holding.gainAmount >= 0 ? '+' : ''}{formatDollar(holding.gainAmount)}
      </div>
    </div>
  )
}

function CategorySpendCard({ data, monthLabel }: { data: CategoryData[]; monthLabel?: string }) {
  const options = buildCategoryOptions(data)
  const defaultIdx = options.findIndex((o) => o.label === 'Restaurants' || o.label === 'Groceries')
  const [selected, setSelected] = useState(defaultIdx >= 0 ? defaultIdx : 0)

  if (options.length === 0) {
    return (
      <div className="card">
        <div className="stat-label mb-4">SPENDING BY CATEGORY</div>
        <div className="empty-state">
          <div className="empty-icon">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="var(--color-neutral-400)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div className="empty-title">No spending data</div>
          <div className="empty-desc">Category spending will appear here.</div>
        </div>
      </div>
    )
  }

  const current = options[selected]

  return (
    <div className="card">
      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {options.map((opt, i) => (
          <button
            key={opt.label}
            onClick={() => setSelected(i)}
            className="text-[14px] font-medium px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            style={
              i === selected
                ? { background: 'var(--color-sg-600)', color: 'white' }
                : { background: 'var(--color-neutral-100)', color: 'var(--color-neutral-600)' }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Spend statement */}
      <div className="text-center py-4">
        {monthLabel && (
          <p className="text-label text-neutral-500 mb-2">{monthLabel}</p>
        )}
        <p className="text-display font-display text-neutral-900">
          You spent{' '}
          <span className="text-danger-400">{formatDollar(current.amount)}</span>
          {' '}on{' '}
          <span className="text-neutral-900">{current.label.toLowerCase()}</span>
          {' '}this month
        </p>
      </div>
    </div>
  )
}
