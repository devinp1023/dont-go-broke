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
  const today = new Date().toISOString().split('T')[0]

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
    // Read API key from .env.local via fs as workaround for Turbopack env stripping
    const fs = await import('fs')
    const path = await import('path')
    const envPath = path.join(process.cwd(), '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf-8')
    const match = envContent.match(/ANTHROPIC_API_KEY=(.+)/)
    const apiKey = match?.[1]?.trim()
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not found in .env.local')
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
  if (user) {
    insight = await getOrGenerateInsight(supabase, user.id, income, expenses, categoryBreakdown)
  }

  return (
    <Dashboard
      income={income}
      expenses={expenses}
      monthLabel={monthLabel}
      categoryBreakdown={categoryBreakdown}
      insight={insight}
    />
  )
}
