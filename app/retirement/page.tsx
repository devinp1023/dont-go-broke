import { createClient } from '@/lib/supabase/server'
import RetirementView from './retirement-view'

const RETIREMENT_SUBTYPES = new Set([
  '401a', '401k', '403b', '457b',
  'ira', 'roth', 'roth 401k',
  'sep ira', 'simple ira',
  'keogh', 'pension', 'retirement',
  'thrift savings plan',
])

export default async function RetirementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <RetirementView accounts={[]} totalBalance={0} projection={{ projectedAge: 0, yearsUntil: 0, currentBalance: 0, monthlyContribution: 0, annualGrowthRate: 0.07, targetBalance: 2_000_000 }} />
  }

  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name, type, subtype, current_balance, currency, plaid_item_id, plaid_items(institution_name, institution_logo)')
    .eq('user_id', user.id)

  const retirementAccounts = (accounts || [])
    .filter((a) => RETIREMENT_SUBTYPES.has((a.subtype ?? '').toLowerCase()))
    .map((a) => {
      const plaidItem = a.plaid_items as unknown as { institution_name: string; institution_logo: string | null } | null
      return {
        id: a.id,
        name: a.name,
        subtype: a.subtype ?? 'retirement',
        balance: a.current_balance ?? 0,
        currency: a.currency ?? 'USD',
        institution: plaidItem?.institution_name ?? null,
        institutionLogo: plaidItem?.institution_logo ?? null,
      }
    })

  const totalBalance = retirementAccounts.reduce((sum, a) => sum + a.balance, 0)

  // Retirement projection calculation
  const CURRENT_AGE = 29
  const TARGET_BALANCE = 2_000_000

  const { data: retSnapshots } = await supabase
    .from('net_worth_snapshots')
    .select('date, account_breakdown')
    .eq('user_id', user.id)
    .order('date', { ascending: true })

  const retHistory: { date: string; balance: number }[] = []
  for (const snap of retSnapshots || []) {
    const breakdown = snap.account_breakdown as { subtype?: string; balance: number }[] | null
    if (!breakdown) continue
    const retBal = breakdown
      .filter((entry) => RETIREMENT_SUBTYPES.has((entry.subtype ?? '').toLowerCase()))
      .reduce((sum, entry) => sum + (entry.balance ?? 0), 0)
    if (retBal > 0) retHistory.push({ date: snap.date, balance: retBal })
  }

  let monthlyContribution = 500
  let annualGrowthRate = 0.07

  if (retHistory.length >= 2) {
    const first = retHistory[0]
    const last = retHistory[retHistory.length - 1]
    const msPerMonth = 1000 * 60 * 60 * 24 * 30.44
    const months = Math.max(1, (new Date(last.date).getTime() - new Date(first.date).getTime()) / msPerMonth)
    const totalChange = last.balance - first.balance
    const avgBalance = (first.balance + last.balance) / 2
    const years = months / 12
    const estimatedGrowth = avgBalance * annualGrowthRate * years
    const estimatedContributions = totalChange - estimatedGrowth
    const derivedMonthly = estimatedContributions / months
    if (derivedMonthly > 0) monthlyContribution = derivedMonthly
  }

  const monthlyRate = annualGrowthRate / 12
  let projectedMonths = 0
  let balance = totalBalance
  const maxMonths = 12 * 80

  while (balance < TARGET_BALANCE && projectedMonths < maxMonths) {
    balance = balance * (1 + monthlyRate) + monthlyContribution
    projectedMonths++
  }

  const yearsUntil = projectedMonths / 12
  const projection = {
    projectedAge: Math.round(CURRENT_AGE + yearsUntil),
    yearsUntil: Math.round(yearsUntil),
    currentBalance: totalBalance,
    monthlyContribution: Math.round(monthlyContribution),
    annualGrowthRate,
    targetBalance: TARGET_BALANCE,
  }

  return <RetirementView accounts={retirementAccounts} totalBalance={totalBalance} projection={projection} />
}
