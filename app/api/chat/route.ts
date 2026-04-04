import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/anthropic'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messages } = await request.json()
  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Fetch financial context in parallel
  const now = new Date()
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  const dateStr = ninetyDaysAgo.toISOString().split('T')[0]

  const [accountsRes, txRes, snapshotRes, holdingsRes] = await Promise.all([
    supabase.from('accounts').select('id, name, type, subtype, current_balance, credit_limit').order('type'),
    supabase.from('transactions').select('amount, date, name, category, pending').gte('date', dateStr).order('date', { ascending: false }),
    supabase.from('net_worth_snapshots').select('date, total_assets, total_liabilities, net_worth').order('date', { ascending: false }).limit(30),
    supabase.from('holdings').select('quantity, institution_value, institution_price, cost_basis, account_id, security:securities(name, ticker_symbol, type, close_price)').order('institution_value', { ascending: false }),
  ])

  const accounts = accountsRes.data ?? []
  const transactions = txRes.data ?? []
  const snapshots = snapshotRes.data ?? []
  const holdingsRaw = holdingsRes.data ?? []

  // Deduplicate holdings by security + account (sandbox can create dupes across identical institutions)
  const holdingsSeen = new Set<string>()
  const holdings = holdingsRaw.filter((h) => {
    const sec = h.security as unknown as { ticker_symbol: string; name: string } | null
    const key = `${sec?.ticker_symbol || sec?.name || 'unknown'}-${Number(h.institution_value).toFixed(2)}`
    if (holdingsSeen.has(key)) return false
    holdingsSeen.add(key)
    return true
  })

  // Summarize transactions by category for the current month
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const thisMonthTxns = transactions.filter((t) => t.date?.startsWith(currentMonth))
  const categoryTotals: Record<string, number> = {}
  let monthIncome = 0
  let monthExpenses = 0
  for (const t of thisMonthTxns) {
    if (t.pending) continue
    if (t.amount < 0) {
      monthIncome += Math.abs(t.amount)
    } else {
      monthExpenses += t.amount
      const cat = t.category || 'Other'
      categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount
    }
  }

  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amt]) => `${cat}: $${amt.toFixed(0)}`)
    .join(', ')

  // Build financial context string
  const accountSummary = accounts.map((a) =>
    `${a.name} (${a.type}/${a.subtype}): $${Number(a.current_balance).toFixed(2)}${a.credit_limit ? ` (limit: $${a.credit_limit})` : ''}`
  ).join('\n')

  const latestSnapshot = snapshots[0]
  const netWorthStr = latestSnapshot
    ? `Net worth: $${Number(latestSnapshot.net_worth).toFixed(2)} (Assets: $${Number(latestSnapshot.total_assets).toFixed(2)}, Liabilities: $${Number(latestSnapshot.total_liabilities).toFixed(2)})`
    : 'No net worth data available.'

  const netWorthTrend = snapshots.length >= 2
    ? `Net worth 30 days ago: $${Number(snapshots[snapshots.length - 1].net_worth).toFixed(2)} -> Now: $${Number(snapshots[0].net_worth).toFixed(2)}`
    : ''

  // Build holdings summary grouped by account
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]))
  const holdingsByAccount = new Map<string, string[]>()
  for (const h of holdings.slice(0, 20)) {
    const sec = h.security as unknown as { name: string; ticker_symbol: string; type: string; close_price: number } | null
    const gainLoss = h.cost_basis ? Number(h.institution_value) - Number(h.cost_basis) : null
    const line = `  - ${sec?.ticker_symbol || sec?.name || 'Unknown'} (${sec?.type || 'unknown'}): ${Number(h.quantity).toFixed(2)} shares @ $${Number(h.institution_price).toFixed(2)} = $${Number(h.institution_value).toFixed(2)}${gainLoss !== null ? ` (${gainLoss >= 0 ? '+' : ''}$${gainLoss.toFixed(2)})` : ''}`
    const acctName = accountMap.get(h.account_id) || 'Unknown Account'
    if (!holdingsByAccount.has(acctName)) holdingsByAccount.set(acctName, [])
    holdingsByAccount.get(acctName)!.push(line)
  }
  const holdingsSummary = holdingsByAccount.size > 0
    ? Array.from(holdingsByAccount.entries()).map(([acct, lines]) => `${acct}:\n${lines.join('\n')}`).join('\n')
    : ''

  // Recent large transactions (top 10 by amount)
  const recentLarge = transactions
    .filter((t) => !t.pending && t.amount > 0)
    .slice(0, 10)
    .map((t) => `${t.date}: ${t.name} - $${t.amount.toFixed(2)} (${t.category || 'Other'})`)
    .join('\n')

  const systemPrompt = `You're a friend who's good with money. Not a financial advisor character — just a normal person who happens to understand personal finance really well and isn't afraid to be straight with people.

How you talk:
- Like a real person texting a friend. Lowercase is fine. Short sentences. No motivational poster energy.
- Never say things like "let's dive in", "here's the thing", "real talk:", "let me break this down", "great question". Just talk normally.
- Don't structure responses with headers or bullet points unless the user asks for a breakdown. Just say what you think.
- Be honest even when it's uncomfortable, but don't perform being "savage" or "brutally honest" — just be direct.
- It's okay to be funny but don't force it. If something is genuinely ridiculous, react naturally. Don't add punchlines.
- Reference specific numbers from their data. Don't be vague or generic.
- If you don't know something from the data, just say so plainly.
- Keep it short. 1-3 sentences is usually enough. Go longer only if they ask for detail.

Here is the user's current financial data:

ACCOUNTS:
${accountSummary || 'No accounts connected.'}

${netWorthStr}
${netWorthTrend}

THIS MONTH (${currentMonth}):
Income: $${monthIncome.toFixed(2)}
Expenses: $${monthExpenses.toFixed(2)}
Spending by category: ${sortedCategories || 'No spending data yet.'}

${holdingsSummary ? `INVESTMENT HOLDINGS (these are the actual securities/funds held inside the investment accounts above):\n${holdingsSummary}` : ''}

${recentLarge ? `RECENT LARGE TRANSACTIONS:\n${recentLarge}` : ''}

LAST 90 DAYS: ${transactions.length} total transactions

Keep responses concise (2-4 sentences usually). Only go longer if they ask for detailed analysis. Always reference their actual numbers — don't be vague.`

  // Get API key (same fallback pattern as insights)
  let apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    try {
      const fs = await import('fs')
      const path = await import('path')
      const envPath = path.join(process.cwd(), '.env.local')
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8')
        const match = envContent.match(/ANTHROPIC_API_KEY=(.+)/)
        apiKey = match?.[1]?.trim()
      }
    } catch { /* ignore */ }
  }
  if (!apiKey) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 500 })
  }

  const anthropic = getAnthropicClient(apiKey)

  const stream = await anthropic.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
