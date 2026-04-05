'use client'

import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DonutChart } from '@/components/DonutChart'

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

type WeeklyExpense = { week: string; amount: number }
type RecentTransaction = { name: string; date: string; amount: number; category: string }
export default function Dashboard({ income, expenses, monthLabel, categoryBreakdown, insight, currentNetWorth, netWorthChange, netWorthPrevious, netWorthSparkline, topHolding, worstHolding, weeklyExpenses, recentTransactions, retirementAge, retirementYearsUntil, retirementProgressPct }: { income: number; expenses: number; monthLabel: string; categoryBreakdown: CategoryData[]; insight?: string; currentNetWorth?: number | null; netWorthChange?: number | null; netWorthPrevious?: number | null; netWorthSparkline?: number[]; topHolding?: TopHolding | null; worstHolding?: TopHolding | null; weeklyExpenses?: WeeklyExpense[]; recentTransactions?: RecentTransaction[]; retirementAge?: number | null; retirementYearsUntil?: number | null; retirementProgressPct?: number }) {
  const net = income - expenses

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

      {/* Summary cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">

        {/* Total Balance — accent card */}
        <div
          className="rounded-xl p-5 md:px-7 md:py-6 flex flex-col justify-between min-h-[156px] md:min-h-[164px]"
          style={{
            background: 'linear-gradient(135deg, var(--color-sg-700), var(--color-sg-800))',
            boxShadow: '0 4px 24px rgba(15, 102, 72, 0.25)',
          }}
        >
          <span className="text-[13px] font-medium tracking-wide uppercase text-white/70">
            Total Balance
          </span>
          <div>
            <div className="text-number tabular-nums text-white font-display mt-3">
              {formatDollar(currentNetWorth ?? 0)}
            </div>
            <span className="text-[13px] text-white/60 mt-2 block">
              Available across all accounts
            </span>
          </div>
        </div>

        {/* Income card */}
        <div className="card flex flex-col justify-between min-h-[156px] md:min-h-[164px] !py-5 md:!px-7 md:!py-6">
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-medium tracking-wide uppercase text-neutral-400">
              Income
            </span>
            {income > 0 && <TrendIcon up={income > expenses} />}
          </div>
          <div>
            <div className="text-number tabular-nums text-neutral-900 font-display mt-3">
              {formatDollar(income)}
            </div>
            <span className="text-[13px] text-neutral-400 mt-2 block">
              All incoming transfers &amp; salary
            </span>
          </div>
        </div>

        {/* Expenses card */}
        <div className="card flex flex-col justify-between min-h-[156px] md:min-h-[164px] !py-5 md:!px-7 md:!py-6">
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-medium tracking-wide uppercase text-neutral-400">
              Expenses
            </span>
            {expenses > 0 && <TrendIcon up={expenses > income} invert />}
          </div>
          <div>
            <div className="text-number tabular-nums text-neutral-900 font-display mt-3">
              {formatDollar(expenses)}
            </div>
            <span className="text-[13px] text-neutral-400 mt-2 block">
              Bills, shopping &amp; daily spend
            </span>
          </div>
        </div>

        {/* Net Savings card */}
        <div className="card flex flex-col justify-between min-h-[156px] md:min-h-[164px] !py-5 md:!px-7 md:!py-6">
          <span className="text-[13px] font-medium tracking-wide uppercase text-neutral-400">
            Net Savings
          </span>
          <div>
            <div className={`text-number tabular-nums font-display mt-3 ${net >= 0 ? 'text-sg-400' : 'text-danger-400'}`}>
              {formatDollar(net)}
            </div>
            <span className="text-[13px] text-neutral-400 mt-2 block">
              {income > 0
                ? `${Math.round((net / income) * 100)}% of income saved`
                : 'No income this month'}
            </span>
          </div>
        </div>

      </div>{/* end summary cards */}

      {/* My Cards + Monthly Trend row */}
      <div className="grid grid-cols-1 md:grid-cols-[3fr_7fr] gap-4 md:gap-6 mb-8">
        <MyCardsWidget />
        <MonthlyTrendChart data={weeklyExpenses ?? []} monthLabel={monthLabel} />
      </div>

      {/* Retirement Age + Recent Transactions + Spending by Category row */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_5fr_4fr] gap-4 md:gap-6 mb-8">
        {/* Retirement Age card */}
        <a href="/retirement" className="card flex flex-col no-underline hover:shadow-elevated transition-shadow duration-200">
          <div className="text-heading font-display text-neutral-900 mb-4">Projected Retirement</div>
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {/* Progress ring */}
            <div className="relative w-[150px] h-[150px]">
              <svg className="w-full h-full" viewBox="0 0 150 150" style={{ transform: 'rotate(90deg)' }}>
                <defs>
                  <linearGradient id="retirementGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--color-sg-600)" />
                    <stop offset="100%" stopColor="var(--color-sg-400)" />
                  </linearGradient>
                  <filter id="progressGlow">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="var(--color-sg-400)" floodOpacity="0.5" />
                  </filter>
                </defs>
                {/* Background track */}
                <circle cx="75" cy="75" r="62" fill="none" stroke="var(--color-neutral-100)" strokeWidth="5" opacity="0.6" />
                {/* Progress arc */}
                <circle
                  cx="75" cy="75" r="62" fill="none"
                  stroke="url(#retirementGradient)" strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.max((retirementProgressPct ?? 0) / 100 * 2 * Math.PI * 62, 1)} ${2 * Math.PI * 62}`}
                  filter="url(#progressGlow)"
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[48px] font-display text-sg-600 leading-none tabular-nums">
                  {retirementAge ?? '—'}
                </div>
              </div>
            </div>
            <div className="text-[14px] font-medium text-neutral-600 mt-3">
              {retirementYearsUntil != null ? `${retirementYearsUntil} years from now` : ''}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              {(retirementProgressPct ?? 0).toFixed(1)}% of $2M goal
            </div>
          </div>
          <span className="text-[13px] font-semibold text-sg-500 hover:text-sg-600 transition-colors mt-3">View details</span>
        </a>

        <RecentTransactionsWidget transactions={recentTransactions ?? []} />
        <SpendingDonutChart data={categoryBreakdown} />
      </div>

      {/* Category Spend + Holdings row */}
      <div className="grid grid-cols-1 md:grid-cols-[6fr_3fr_3fr] gap-6">
        <CategorySpendCard data={categoryBreakdown} monthLabel={monthLabel} />

        {/* Top performing holding */}
        {topHolding && (
          <HoldingCard holding={topHolding} label="Top Performer" />
        )}

        {/* Worst performing holding */}
        {worstHolding && (
          <HoldingCard holding={worstHolding} label="Worst Performer" />
        )}
      </div>
    </div>
  )
}

const HARDCODED_CARDS = [
  {
    name: 'American Express',
    holder: 'Devin Patel',
    product: 'Gold Card',
    number: '1111 2222 3333 4001',
    last4: '4001',
    expiry: '12/26',
    brand: 'amex' as const,
    gradient: 'radial-gradient(ellipse at 30% 20%, #e0c060 0%, #C5A44E 35%, #8A7230 80%, #6b5520 100%)',
  },
  {
    name: 'Capital One',
    holder: 'Devin Patel',
    product: 'Venture X',
    number: '1111 2222 3333 3873',
    last4: '3873',
    expiry: '09/27',
    brand: 'capitalone' as const,
    gradient: 'radial-gradient(ellipse at 30% 20%, #2a3a6e 0%, #1c2a52 35%, #0f1b3d 80%, #0a1228 100%)',
  },
]

function CardVisual({ card, className, style, onClick }: {
  card: typeof HARDCODED_CARDS[number]
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}) {
  return (
    <div
      className={`rounded-xl p-5 flex flex-col justify-between aspect-[1.6/1] w-full max-w-[320px] select-none ${className ?? ''}`}
      style={{ background: card.gradient, boxShadow: '0 8px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)', ...style }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <span className="text-white/90 text-[14px] font-semibold">{card.holder}</span>
        {card.brand === 'amex' ? (
          <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="4" fill="white" fillOpacity="0.15" />
            <text x="16" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="sans-serif">AMEX</text>
          </svg>
        ) : card.brand === 'capitalone' ? (
          <span className="text-[10px] font-bold tracking-wider uppercase italic" style={{ color: '#ED1C24', textShadow: '0 0 1px rgba(255,255,255,0.6)' }}>Capital One</span>
        ) : (
          <svg className="w-10 h-7" viewBox="0 0 40 28" fill="none">
            <circle cx="12" cy="14" r="8" fill="#EB001B" opacity="0.9" />
            <circle cx="24" cy="14" r="8" fill="#F79E1B" opacity="0.9" />
            <path d="M18 8.268a8 8 0 0 1 0 11.464 8 8 0 0 1 0-11.464z" fill="#FF5F00" opacity="0.9" />
          </svg>
        )}
      </div>
      <div>
        <div className="text-white/70 text-[13px] tracking-[0.15em] font-mono mb-1">
          •••• •••• •••• {card.last4}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/50 text-[11px]">{card.product}</span>
          <span className="text-white/60 text-[12px] font-mono">{card.expiry}</span>
        </div>
      </div>
    </div>
  )
}

function MyCardsWidget() {
  const [frontIndex, setFrontIndex] = useState(1)
  const [sheetCard, setSheetCard] = useState<typeof HARDCODED_CARDS[number] | null>(null)

  const handleCardClick = (index: number) => {
    if (index === frontIndex) {
      setSheetCard(HARDCODED_CARDS[index])
    } else {
      setFrontIndex(index)
    }
  }

  return (
    <div className="card flex flex-col">
      <div className="text-heading font-display text-neutral-900 mb-4">My Cards</div>

      {/* Stacked cards */}
      <div className="relative w-full max-w-[320px] mx-auto" style={{ aspectRatio: '1.6/1', marginBottom: '40px', transform: 'translate(25px, 12px)' }}>
        {HARDCODED_CARDS.map((card, i) => {
          const isFront = i === frontIndex
          return (
            <div
              key={i}
              className="absolute inset-0 cursor-pointer"
              style={{
                transform: isFront ? 'translateX(0)' : 'scale(0.95) translateX(-50px)',
                filter: isFront ? 'brightness(1)' : 'brightness(0.85)',
                zIndex: isFront ? 2 : 1,
                transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), filter 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onClick={() => handleCardClick(i)}
            >
              <CardVisual card={card} />
            </div>
          )
        })}
      </div>

      {/* Card detail sheet */}
      {sheetCard && (
        <>
          <div
            onClick={() => setSheetCard(null)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              zIndex: 200,
              animation: 'fadeIn 0.2s ease',
            }}
          />
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
              animation: 'slideUp 0.3s ease',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'var(--color-neutral-200)' }} />
            </div>
            <div style={{ padding: '24px 24px 40px', textAlign: 'center' }}>
              <div className="text-heading font-display text-neutral-900 mb-2">{sheetCard.name} {sheetCard.product}</div>
              <div className="text-label text-neutral-400 mb-6">•••• {sheetCard.last4}</div>
              <div className="text-body text-neutral-500">Coming soon</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MonthlyTrendChart({ data, monthLabel }: { data: WeeklyExpense[]; monthLabel: string }) {
  return (
    <div className="card flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="text-heading font-display text-neutral-900">Monthly Trend</div>
        {monthLabel && (
          <span className="text-[13px] font-medium text-neutral-400 px-3 py-1 rounded-full border border-neutral-100">
            {monthLabel}
          </span>
        )}
      </div>

      {data.length > 0 ? (
        <div className="w-full" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-sg-400)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-sg-400)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-100)" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 12, fill: 'var(--color-neutral-400)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: string) => v.replace(/Week \d+ \((.+)\)/, '$1')}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--color-neutral-400)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(v >= 1000 ? 0 : 1)}k`}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid var(--color-neutral-100)',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '13px',
                }}
                formatter={(value: unknown) => [formatDollar(Number(value)), 'Expenses']}
                labelFormatter={(label: unknown) => String(label)}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="var(--color-sg-500)"
                strokeWidth={2.5}
                fill="url(#expenseGradient)"
                dot={{ r: 4, fill: 'var(--color-sg-500)', stroke: 'white', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: 'var(--color-sg-500)', stroke: 'white', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-title">No expense data</div>
          <div className="empty-desc">Weekly spending will appear here after syncing.</div>
        </div>
      )}
    </div>
  )
}

const DONUT_CATEGORY_COLORS: Record<string, string> = {
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
  other: '#9b9990',
}

function getInitialColor(name: string) {
  const colors = ['#1a56db', '#9a4e00', '#2e7d32', '#0369a1', '#5b21b6', '#9d174d', '#854d0e', '#006064']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function RecentTransactionsWidget({ transactions }: { transactions: RecentTransaction[] }) {
  // Group by relative day
  const grouped: { label: string; items: RecentTransaction[] }[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const txn of transactions) {
    const txnDate = new Date(txn.date + 'T00:00:00')
    const diffDays = Math.floor((today.getTime() - txnDate.getTime()) / (1000 * 60 * 60 * 24))
    let label: string
    if (diffDays === 0) label = 'Today'
    else if (diffDays === 1) label = 'Yesterday'
    else label = txnDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    const existing = grouped.find((g) => g.label === label)
    if (existing) existing.items.push(txn)
    else grouped.push({ label, items: [txn] })
  }

  return (
    <div className="card flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="text-heading font-display text-neutral-900">Recent Transactions</div>
        <a href="/transactions" className="text-[15px] font-semibold text-sg-500 hover:text-sg-600 transition-colors">
          View all
        </a>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">No transactions yet</div>
          <div className="empty-desc">Transactions will appear here after syncing.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {grouped.map((group) => (
            <div key={group.label}>
              <div className="text-[12px] font-medium text-neutral-400 uppercase tracking-wide mb-2 mt-1 px-1">
                {group.label}
              </div>
              {group.items.map((txn, i) => {
                const isExpense = txn.amount > 0
                const initial = txn.name.charAt(0).toUpperCase()
                const bgColor = getInitialColor(txn.name)
                const catKey = txn.category.toLowerCase().replace(/\s+/g, '_')
                const catColor = DONUT_CATEGORY_COLORS[catKey] || DONUT_CATEGORY_COLORS.other

                return (
                  <div
                    key={`${txn.date}-${i}`}
                    className="flex items-center gap-3 py-3 px-4 bg-neutral-50/70 rounded-xl mb-1.5 last:mb-0 border border-neutral-100/40"
                  >
                    {/* Initial avatar */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[15px] font-bold shrink-0"
                      style={{ background: bgColor, boxShadow: `0 2px 6px ${bgColor}44` }}
                    >
                      {initial}
                    </div>

                    {/* Name + date */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-medium text-neutral-800 truncate">{txn.name}</div>
                      <div className="text-[12px] text-neutral-400">
                        {new Date(txn.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>

                    {/* Category dot + label */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-2 h-2 rounded-full" style={{ background: catColor }} />
                      <span className="text-[12px] text-neutral-400">{prettifyCategory(txn.category)}</span>
                    </div>

                    {/* Amount */}
                    <div className={`text-[15px] font-semibold tabular-nums shrink-0 ml-3 ${isExpense ? 'text-neutral-900' : 'text-sg-500'}`}>
                      {isExpense ? `-${formatDollar(txn.amount)}` : `+${formatDollar(Math.abs(txn.amount))}`}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SpendingDonutChart({ data }: { data: CategoryData[] }) {
  // Filter out internal transfers, build top 5 + other
  const filtered = data
    .filter((d) => !SKIP_CATEGORIES.has(d.category.toLowerCase()))
    .filter((d) => d.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  if (filtered.length === 0) {
    return (
      <div className="card flex flex-col">
        <div className="text-heading font-display text-neutral-900 mb-4">Spending by Category</div>
        <div className="empty-state">
          <div className="empty-title">No spending data</div>
          <div className="empty-desc">Category breakdown will appear here.</div>
        </div>
      </div>
    )
  }

  const top5 = filtered.slice(0, 5)
  const rest = filtered.slice(5)
  const otherTotal = rest.reduce((sum, d) => sum + d.amount, 0)

  const slices: { label: string; amount: number; color: string }[] = top5.map((d) => ({
    label: prettifyCategory(d.category),
    amount: d.amount,
    color: DONUT_CATEGORY_COLORS[d.category.toLowerCase().replace(/\s+/g, '_')] || '#9b9990',
  }))

  if (otherTotal > 0) {
    slices.push({ label: 'Other', amount: otherTotal, color: '#9b9990' })
  }

  const pieData = slices.map((s) => ({ name: s.label, value: s.amount, color: s.color }))
  const colors = slices.map((s) => s.color)

  return (
    <div className="card flex flex-col">
      <div className="text-heading font-display text-neutral-900 mb-4">Spending by Category</div>

      {/* Donut */}
      <div className="flex justify-center mb-5">
        <DonutChart data={pieData} colors={colors} />
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-[13px] text-neutral-500 truncate">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TrendIcon({ up, light, invert }: { up: boolean; light?: boolean; invert?: boolean }) {
  // invert: for expenses, "up" arrow means bad (red), "down" means good (green)
  const isGood = invert ? !up : up
  const color = light
    ? (isGood ? 'rgba(255,255,255,0.85)' : '#f87171')
    : (isGood ? 'var(--color-sg-500)' : 'var(--color-danger-400)')

  return (
    <svg
      className="w-5 h-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      style={{ color }}
    >
      {up ? (
        // Trending up arrow (zig-zag up-right)
        <path
          d="M3 17L9 11L13 15L21 7M21 7H15M21 7V13"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        // Trending down arrow (zig-zag down-right)
        <path
          d="M3 7L9 13L13 9L21 17M21 17H15M21 17V11"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

function HoldingCard({ holding, label }: { holding: TopHolding; label: string }) {
  return (
    <div className="card flex flex-col items-center text-center">
      <div className="text-heading font-display text-neutral-900 mb-4 self-start">{label}</div>
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
