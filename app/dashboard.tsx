'use client'

export default function Dashboard({ income, expenses, monthLabel }: { income: number; expenses: number; monthLabel: string }) {
  const maxVal = Math.max(income, expenses, 1)
  const incomePercent = (income / maxVal) * 100
  const expensePercent = (expenses / maxVal) * 100

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-hero font-display text-neutral-900 mb-8">Hello, Devin!</h1>

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
    </div>
  )
}
