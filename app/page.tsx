import { createClient } from '@/lib/supabase/server'
import Dashboard from './dashboard'

export default async function Home() {
  const supabase = await createClient()

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

  return <Dashboard income={income} expenses={expenses} monthLabel={monthLabel} categoryBreakdown={categoryBreakdown} />
}
