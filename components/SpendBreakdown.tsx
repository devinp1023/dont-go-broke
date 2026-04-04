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

const TRANSFER_CATEGORIES = new Set(['internal_transfer', 'internal transfer'])

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

const MAX_SLICES = 6
const SMALL_CATEGORY_THRESHOLD = 0.02 // 2%

export default function SpendBreakdown({ data, monthLabel }: { data: CategoryData[]; monthLabel?: string }) {
  if (data.length === 0) {
    return (
      <div className="card">
        <div className="stat-label mb-4">{monthLabel ? `${monthLabel} Spend Breakdown` : 'Spend Breakdown'}</div>
        <div className="empty-state">
          <div className="empty-icon">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="var(--color-neutral-400)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div className="empty-title">No spending data</div>
          <div className="empty-desc">Expense categories will appear here.</div>
        </div>
      </div>
    )
  }

  // Filter out internal transfers
  const filtered = data.filter((d) => !TRANSFER_CATEGORIES.has(d.category.toLowerCase()))
  const transferTotal = data
    .filter((d) => TRANSFER_CATEGORIES.has(d.category.toLowerCase()))
    .reduce((sum, d) => sum + d.amount, 0)

  // If everything was transfers, show the original data
  const working = filtered.length > 0 ? filtered : data

  const total = working.reduce((sum, d) => sum + d.amount, 0)

  // Group small categories into "Other"
  const grouped: CategoryData[] = []
  let otherAmount = 0

  for (const item of working) {
    const pct = item.amount / total
    if (pct < SMALL_CATEGORY_THRESHOLD) {
      otherAmount += item.amount
    } else {
      grouped.push(item)
    }
  }

  // If we have too many slices, collapse the smallest ones into Other
  if (grouped.length > MAX_SLICES) {
    grouped.sort((a, b) => b.amount - a.amount)
    const keep = grouped.slice(0, MAX_SLICES - 1)
    const collapse = grouped.slice(MAX_SLICES - 1)
    otherAmount += collapse.reduce((sum, d) => sum + d.amount, 0)
    grouped.length = 0
    grouped.push(...keep)
  }

  // Merge with existing "Other" if present
  const existingOtherIdx = grouped.findIndex((d) => d.category.toLowerCase() === 'other')
  if (otherAmount > 0) {
    if (existingOtherIdx >= 0) {
      grouped[existingOtherIdx] = {
        category: 'other',
        amount: grouped[existingOtherIdx].amount + otherAmount,
      }
    } else {
      grouped.push({ category: 'other', amount: otherAmount })
    }
  }

  // Sort by amount descending
  grouped.sort((a, b) => b.amount - a.amount)

  const chartData = grouped.map((d) => ({
    ...d,
    prettyCategory: prettifyCategory(d.category),
  }))

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="stat-label mb-0">{monthLabel ? `${monthLabel} Spend Breakdown` : 'Spend Breakdown'}</div>
        {transferTotal > 0 && (
          <span className="text-[13px] text-neutral-400">
            Excludes {formatDollar(transferTotal)} in transfers
          </span>
        )}
      </div>

      <div className="flex flex-col items-center gap-6">
        {/* Donut chart */}
        <div className="spend-chart-wrap" style={{ width: 220, height: 220, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="amount"
                nameKey="prettyCategory"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={58}
                strokeWidth={2}
                stroke="white"
              >
                {chartData.map((d, i) => (
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
              {/* Center total */}
              <text
                x="50%"
                y="47%"
                textAnchor="middle"
                dominantBaseline="central"
                style={{ fontSize: 13, fill: 'var(--color-neutral-400)', fontFamily: 'var(--font-dm-sans)' }}
              >
                Total
              </text>
              <text
                x="50%"
                y="57%"
                textAnchor="middle"
                dominantBaseline="central"
                style={{ fontSize: 18, fontWeight: 600, fill: 'var(--color-neutral-900)', fontFamily: 'var(--font-dm-sans)' }}
              >
                {`$${Math.round(total).toLocaleString('en-US')}`}
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend — directly below the chart */}
        <div className="w-full">
          {chartData.map((item) => {
            const percent = ((item.amount / total) * 100).toFixed(1)
            return (
              <div key={item.prettyCategory} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-b-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="rounded-full flex-shrink-0"
                    style={{ width: 10, height: 10, background: getCategoryColor(item.category) }}
                  />
                  <span className="text-label text-neutral-700">{item.prettyCategory}</span>
                </div>
                <span className="flex-shrink-0 text-right tabular-nums">
                  <span className="text-label font-medium text-neutral-800">{formatDollar(item.amount)}</span>
                  <span className="text-label text-neutral-400 inline-block w-[60px] text-right ml-2">({percent}%)</span>
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
