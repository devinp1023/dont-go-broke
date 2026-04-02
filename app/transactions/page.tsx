import { createClient } from '@/lib/supabase/server'
import TransactionsView from './transactions-view'

export default async function TransactionsPage() {
  const supabase = await createClient()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, date, name, merchant_name, amount, category')
    .order('date', { ascending: false })
    .limit(1000)

  return <TransactionsView transactions={transactions || []} />
}
