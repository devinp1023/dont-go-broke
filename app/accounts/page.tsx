import { createClient } from '@/lib/supabase/server'
import AccountsView from './accounts-view'

export default async function AccountsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <AccountsView institutions={[]} />
  }

  // Fetch plaid items (institutions)
  const { data: plaidItems } = await supabase
    .from('plaid_items')
    .select('id, institution_name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  // Fetch all accounts
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, plaid_item_id, name, type, subtype, current_balance, available_balance, currency, updated_at')
    .eq('user_id', user.id)

  // Fetch transaction counts per account
  const { data: txCounts } = await supabase
    .from('transactions')
    .select('account_id')
    .eq('user_id', user.id)

  const countMap = new Map<string, number>()
  txCounts?.forEach((t) => {
    countMap.set(t.account_id, (countMap.get(t.account_id) || 0) + 1)
  })

  // Group accounts by institution
  const institutions = (plaidItems || []).map((item) => ({
    id: item.id,
    name: item.institution_name,
    connectedAt: item.created_at,
    accounts: (accounts || [])
      .filter((a) => a.plaid_item_id === item.id)
      .map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        subtype: a.subtype,
        currentBalance: a.current_balance,
        availableBalance: a.available_balance,
        currency: a.currency,
        updatedAt: a.updated_at,
        transactionCount: countMap.get(a.id) || 0,
      })),
  }))

  return <AccountsView institutions={institutions} />
}
