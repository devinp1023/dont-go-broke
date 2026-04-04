import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/anthropic'
import Dashboard from './dashboard'

async function getOrGenerateInsight(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  income: number,
  expenses: number,
  topCategories: { category: string; amount: number }[]
): Promise<string> {
  // Use local date to avoid UTC timezone mismatch
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  // Check for cached insight
  const { data: existing, error: insightError } = await supabase
    .from('insights')
    .select('content')
    .eq('generated_date', today)
    .single()

  if (existing && !insightError) return existing.content
  // Generate new insight
  const topCatSummary = topCategories
    .slice(0, 5)
    .map((c) => `${c.category}: $${c.amount.toFixed(0)}`)
    .join(', ')

  try {
    // Turbopack strips non-NEXT_PUBLIC_ env vars in server components,
    // so fall back to reading .env.local from disk if needed
    let apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      const fs = await import('fs')
      const path = await import('path')
      const envPath = path.join(process.cwd(), '.env.local')
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8')
        const match = envContent.match(/ANTHROPIC_API_KEY=(.+)/)
        apiKey = match?.[1]?.trim()
      }
    }
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')
    const anthropic = getAnthropicClient(apiKey)
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: `You are a snarky personal finance roast comic. Given this monthly summary, write ONE short savage but funny sentence (under 20 words) roasting the user's spending habits. Be witty, sarcastic, and brutally honest — like a friend who doesn't sugarcoat anything. Think dry humor, not mean-spirited.

Income: $${income.toFixed(2)}
Expenses: $${expenses.toFixed(2)}
Top spending categories: ${topCatSummary || 'None'}

Reply with ONLY the sentence, no quotes.`,
        },
      ],
    })

    const insight =
      message.content[0].type === 'text'
        ? message.content[0].text
        : 'Keep an eye on your spending this month.'

    // Cache it
    await supabase.from('insights').upsert({
      user_id: userId,
      content: insight,
      generated_date: today,
    })

    return insight
  } catch {
    return ''
  }
}

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, date, category')
    .order('date', { ascending: false })

  let income = 0
  let expenses = 0
  let monthLabel = ''
  const categoryMap: Record<string, number> = {}

  if (transactions && transactions.length > 0) {
    const latestDate = new Date(transactions[0].date + 'T00:00:00')
    const latestMonth = latestDate.getMonth()
    const latestYear = latestDate.getFullYear()
    monthLabel = latestDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    for (const txn of transactions) {
      const txnDate = new Date(txn.date + 'T00:00:00')
      if (txnDate.getMonth() !== latestMonth || txnDate.getFullYear() !== latestYear) {
        break
      }
      if (txn.amount < 0) {
        income += Math.abs(txn.amount)
      } else {
        expenses += txn.amount
        const cat = txn.category || 'Uncategorized'
        categoryMap[cat] = (categoryMap[cat] || 0) + txn.amount
      }
    }
  }

  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)

  let insight = ''
  let netWorthChange: number | null = null
  let currentNetWorth: number | null = null
  let netWorthPrevious: number | null = null
  let netWorthSparkline: number[] = []
  let topHolding: { name: string; ticker: string | null; gainPct: number; gainAmount: number } | null = null
  let worstHolding: { name: string; ticker: string | null; gainPct: number; gainAmount: number } | null = null

  if (user) {
    insight = await getOrGenerateInsight(supabase, user.id, income, expenses, categoryBreakdown)

    // Fetch recent net worth snapshots for sparkline
    const { data: snapshots } = await supabase
      .from('net_worth_snapshots')
      .select('net_worth, date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(60)

    if (snapshots && snapshots.length >= 1) {
      currentNetWorth = Number(snapshots[0].net_worth)

      // Find snapshot closest to 30 days ago for month-over-month comparison
      const now = new Date(snapshots[0].date + 'T00:00:00')
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      let closestIdx = -1
      let closestDiff = Infinity
      for (let i = 1; i < snapshots.length; i++) {
        const d = new Date(snapshots[i].date + 'T00:00:00')
        const diff = Math.abs(d.getTime() - thirtyDaysAgo.getTime())
        if (diff < closestDiff) {
          closestDiff = diff
          closestIdx = i
        }
      }

      if (closestIdx >= 0) {
        netWorthPrevious = Number(snapshots[closestIdx].net_worth)
        netWorthChange = currentNetWorth - netWorthPrevious
      }

      // Sparkline data: oldest to newest (reverse the desc-ordered results), cap at 12
      netWorthSparkline = snapshots.slice(0, 12).map((s) => Number(s.net_worth)).reverse()
    }

    // Fetch holdings to find best performer (stocks/ETFs only, skip derivatives and cash)
    const { data: holdings } = await supabase
      .from('holdings')
      .select('institution_value, cost_basis, quantity, securities(name, ticker_symbol, type, is_cash_equivalent)')
      .eq('user_id', user.id)

    if (holdings && holdings.length > 0) {
      // Security types to skip (derivatives, cash, etc.)
      const SKIP_TYPES = new Set(['derivative', 'option', 'cash', 'fixed income', 'mutual fund'])
      let bestGainPct = -Infinity
      let worstGainPct = Infinity
      for (const h of holdings) {
        const sec = h.securities as unknown as { name: string | null; ticker_symbol: string | null; type: string | null; is_cash_equivalent: boolean | null }
        if (sec?.is_cash_equivalent) continue
        if (sec?.type && SKIP_TYPES.has(sec.type.toLowerCase())) continue
        if (sec?.ticker_symbol && sec.ticker_symbol.length > 6) continue
        if (!h.institution_value || h.institution_value <= 0) continue
        if (!h.quantity || h.quantity <= 0) continue
        const costBasis = h.cost_basis
        if (!costBasis || costBasis <= 0) continue
        const gainPct = ((h.institution_value - costBasis) / costBasis) * 100
        const holdingData = {
          name: sec?.name || 'Unknown',
          ticker: sec?.ticker_symbol || null,
          gainPct,
          gainAmount: h.institution_value - costBasis,
        }
        if (gainPct > bestGainPct) {
          bestGainPct = gainPct
          topHolding = holdingData
        }
        if (gainPct < worstGainPct) {
          worstGainPct = gainPct
          worstHolding = holdingData
        }
      }
    }
  }

  return (
    <Dashboard
      income={income}
      expenses={expenses}
      monthLabel={monthLabel}
      categoryBreakdown={categoryBreakdown}
      insight={insight}
      currentNetWorth={currentNetWorth}
      netWorthChange={netWorthChange}
      netWorthPrevious={netWorthPrevious}
      netWorthSparkline={netWorthSparkline}
      topHolding={topHolding}
      worstHolding={worstHolding}
    />
  )
}
