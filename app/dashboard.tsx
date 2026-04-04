'use client'

import SpendBreakdown from '@/components/SpendBreakdown'

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

export default function Dashboard({ income, expenses, monthLabel, categoryBreakdown, insight }: { income: number; expenses: number; monthLabel: string; categoryBreakdown: CategoryData[]; insight?: string }) {
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

      {/* Income vs Expenses — horizontal bars */}
      <div className="card mb-8">
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

      {/* Spend Breakdown */}
      <SpendBreakdown data={categoryBreakdown} monthLabel={monthLabel} />
    </div>
  )
}
