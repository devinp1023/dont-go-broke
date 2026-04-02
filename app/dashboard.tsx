'use client'

import SpendBreakdown from '@/components/SpendBreakdown'

type CategoryData = {
  category: string
  amount: number
}

export default function Dashboard({ income, expenses, monthLabel, categoryBreakdown, insight }: { income: number; expenses: number; monthLabel: string; categoryBreakdown: CategoryData[]; insight?: string }) {
  const maxVal = Math.max(income, expenses, 1)
  const incomePercent = (income / maxVal) * 100
  const expensePercent = (expenses / maxVal) * 100

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-hero font-display text-neutral-900 mb-6">Hello, Devin!</h1>
      {insight && (
        <div className="card mb-8">
          <div className="stat-label mb-3" style={{ color: 'var(--color-neutral-800)' }}>Here&apos;s what Claude says about your financial situation today</div>
          <p className="text-body text-neutral-500 italic">
            <span className="font-display not-italic" style={{ color: '#E3722B', fontSize: '32px', lineHeight: 0, verticalAlign: 'middle', marginRight: '4px' }}>&ldquo;</span>
            {insight}
            <span className="font-display not-italic" style={{ color: '#E3722B', fontSize: '32px', lineHeight: 0, verticalAlign: 'middle', marginLeft: '4px' }}>&rdquo;</span>
          </p>
        </div>
      )}
      {!insight && <div className="mb-8" />}

      <div className="card mb-8">
        {monthLabel && <div className="stat-label mb-4">{monthLabel}</div>}

        <div className="mb-5">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-label font-medium text-neutral-600">Income</span>
            <span className="stat-value" style={{ color: 'var(--color-sg-400)', fontSize: '24px' }}>${income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div
            className="rounded-full"
            style={{ height: '18px', width: `${incomePercent}%`, background: 'var(--color-sg-400)', transition: 'width 0.5s ease' }}
          />
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-label font-medium text-neutral-600">Expenses</span>
            <span className="stat-value" style={{ color: 'var(--color-danger-400)', fontSize: '24px' }}>${expenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div
            className="rounded-full"
            style={{ height: '18px', width: `${expensePercent}%`, background: 'var(--color-danger-400)', transition: 'width 0.5s ease' }}
          />
        </div>
      </div>

      <SpendBreakdown data={categoryBreakdown} monthLabel={monthLabel} />
    </div>
  )
}
