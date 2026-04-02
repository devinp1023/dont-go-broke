import { createClient } from '@/lib/supabase/server'
import NetWorthView from './net-worth-view'

const ASSET_TYPES = new Set(['depository', 'investment', 'brokerage', 'other'])

export default async function NetWorthPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <NetWorthView netWorth={0} totalAssets={0} totalLiabilities={0} accounts={[]} snapshots={[]} />
  }

  // Fetch all accounts for current breakdown
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name, type, subtype, current_balance, currency')
    .eq('user_id', user.id)

  // Fetch historical snapshots
  const { data: snapshots } = await supabase
    .from('net_worth_snapshots')
    .select('date, total_assets, total_liabilities, net_worth')
    .eq('user_id', user.id)
    .order('date', { ascending: true })

  // Compute current totals from live account data
  let totalAssets = 0
  let totalLiabilities = 0
  const accountSummaries = (accounts || []).map((a) => {
    const balance = a.current_balance ?? 0
    if (ASSET_TYPES.has(a.type ?? '')) {
      totalAssets += balance
    } else {
      totalLiabilities += balance
    }
    return {
      id: a.id,
      name: a.name,
      type: a.type ?? 'other',
      subtype: a.subtype,
      balance,
      currency: a.currency ?? 'USD',
    }
  })

  const snapshotPoints = (snapshots || []).map((s) => ({
    date: s.date,
    totalAssets: Number(s.total_assets),
    totalLiabilities: Number(s.total_liabilities),
    netWorth: Number(s.net_worth),
  }))

  return (
    <NetWorthView
      netWorth={totalAssets - totalLiabilities}
      totalAssets={totalAssets}
      totalLiabilities={totalLiabilities}
      accounts={accountSummaries}
      snapshots={snapshotPoints}
    />
  )
}
