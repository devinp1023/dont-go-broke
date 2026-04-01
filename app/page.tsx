import { createClient } from '@/lib/supabase/server'
import Dashboard from './dashboard'

export default async function Home() {
  const supabase = await createClient()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, date, name, merchant_name, amount, category')
    .order('date', { ascending: false })
    .limit(100)

  return <Dashboard transactions={transactions || []} />
}
