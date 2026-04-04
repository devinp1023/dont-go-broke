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
    .select('id, name, type, subtype, current_balance, credit_limit, currency, plaid_item_id, plaid_items(institution_name, institution_logo)')
    .eq('user_id', user.id)

  // Fetch historical snapshots
  const { data: snapshots } = await supabase
    .from('net_worth_snapshots')
    .select('date, total_assets, total_liabilities, net_worth')
    .eq('user_id', user.id)
    .order('date', { ascending: true })

  // Fetch previous snapshot with account breakdown for change calculation
  const { data: prevSnapshots } = await supabase
    .from('net_worth_snapshots')
    .select('account_breakdown')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .range(1, 1)

  const prevBalanceMap = new Map<string, number>()
  if (prevSnapshots && prevSnapshots.length > 0) {
    const breakdown = prevSnapshots[0].account_breakdown as { account_id: string; balance: number }[] | null
    breakdown?.forEach((entry) => {
      prevBalanceMap.set(entry.account_id, entry.balance)
    })
  }

  // Fetch holdings with security details for investment accounts
  const investmentAccountIds = (accounts || [])
    .filter((a) => a.type === 'investment' || a.type === 'brokerage')
    .map((a) => a.id)

  let holdingsData: {
    id: string
    accountId: string
    quantity: number
    value: number
    price: number
    costBasis: number | null
    currency: string
    securityName: string
    ticker: string | null
    securityType: string | null
    isCashEquivalent: boolean
  }[] = []

  if (investmentAccountIds.length > 0) {
    const { data: holdings } = await supabase
      .from('holdings')
      .select('id, account_id, quantity, institution_value, institution_price, cost_basis, iso_currency_code, security_id, securities(name, ticker_symbol, type, is_cash_equivalent)')
      .eq('user_id', user.id)
      .in('account_id', investmentAccountIds)

    holdingsData = (holdings || []).map((h) => {
      const sec = h.securities as unknown as {
        name: string | null
        ticker_symbol: string | null
        type: string | null
        is_cash_equivalent: boolean | null
      }
      return {
        id: h.id,
        accountId: h.account_id,
        quantity: h.quantity,
        value: h.institution_value,
        price: h.institution_price,
        costBasis: h.cost_basis,
        currency: h.iso_currency_code || 'USD',
        securityName: sec?.name || 'Unknown',
        ticker: sec?.ticker_symbol || null,
        securityType: sec?.type || null,
        isCashEquivalent: sec?.is_cash_equivalent ?? false,
      }
    })
  }

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
    const plaidItem = a.plaid_items as unknown as { institution_name: string; institution_logo: string | null } | null
    return {
      id: a.id,
      name: a.name,
      type: a.type ?? 'other',
      subtype: a.subtype,
      balance,
      currency: a.currency ?? 'USD',
      creditLimit: a.credit_limit ?? null,
      institution: plaidItem?.institution_name ?? null,
      institutionLogo: plaidItem?.institution_logo ?? null,
      prevBalance: prevBalanceMap.get(a.id) ?? null,
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
      holdings={holdingsData}
    />
  )
}
