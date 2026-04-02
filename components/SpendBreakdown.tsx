'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

type CategoryData = {
  category: string
  amount: number
}

const CATEGORY_COLORS: Record<string, string> = {
  income: '#0f6648',
  rent: '#7c4a1e',
  utilities: '#3d4551',
  restaurants: '#9a4e00',
  groceries: '#2e7d32',
  shopping: '#1a56db',
  travel: '#0369a1',
  bars_and_nightlife: '#5b21b6',
  entertainment: '#9d174d',
  transportation: '#854d0e',
  gym: '#283593',
  personal_care: '#6d28d9',
  health: '#006064',
  internal_transfer: '#0e6969',
  other: '#3a3a37',
}

const FALLBACK_COLORS = ['#1fa678', '#e05252', '#e5a020', '#9b9990', '#5a5955']

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category.toLowerCase()] || FALLBACK_COLORS[0]
}

function formatDollar(value: number) {
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function prettifyCategory(raw: string) {
  return raw
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase())
}

export default function SpendBreakdown({ data, monthLabel }: { data: CategoryData[]; monthLabel?: string }) {
  if (data.length === 0) {
    return (
      <div className="card">
        <div className="stat-label mb-4">{monthLabel ? `${monthLabel} Spend Breakdown` : 'Spend Breakdown'}</div>
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-title">No spending data</div>
          <div className="empty-desc">Expense categories will appear here.</div>
        </div>
      </div>
    )
  }

  const prettyData = data.map((d) => ({ ...d, category: prettifyCategory(d.category) }))
  const total = prettyData.reduce((sum, d) => sum + d.amount, 0)

  return (
    <div className="card">
      <div className="stat-label mb-4">{monthLabel ? `${monthLabel} Spend Breakdown` : 'Spend Breakdown'}</div>

      <div className="flex items-center gap-8">
        <div style={{ width: 200, height: 200, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={prettyData}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                strokeWidth={2}
                stroke="white"
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={getCategoryColor(d.category)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatDollar(Number(value))}
                contentStyle={{
                  borderRadius: '10px',
                  border: '0.5px solid var(--color-neutral-200)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  fontSize: '14px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 min-w-0">
          {data.map((item, i) => {
            const pretty = prettyData[i]
            const percent = ((item.amount / total) * 100).toFixed(1)
            return (
              <div key={pretty.category} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-b-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="rounded-full flex-shrink-0"
                    style={{ width: 10, height: 10, background: getCategoryColor(item.category) }}
                  />
                  <span className="text-label text-neutral-700 truncate">{pretty.category}</span>
                </div>
                <span className="flex-shrink-0 text-right" style={{ minWidth: '180px', fontVariantNumeric: 'tabular-nums' }}>
                  <span className="text-label font-medium text-neutral-800">{formatDollar(pretty.amount)}</span>
                  <span className="text-label text-neutral-400" style={{ display: 'inline-block', width: '70px', textAlign: 'right', marginLeft: '12px' }}>({percent}%)</span>
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
