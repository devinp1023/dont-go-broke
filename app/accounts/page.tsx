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
    .select('id, institution_name, institution_logo, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  // Fetch account counts per institution
  const { data: accounts } = await supabase
    .from('accounts')
    .select('plaid_item_id')
    .eq('user_id', user.id)

  const accountCountMap = new Map<string, number>()
  accounts?.forEach((a) => {
    accountCountMap.set(a.plaid_item_id, (accountCountMap.get(a.plaid_item_id) || 0) + 1)
  })

  const institutions = (plaidItems || []).map((item) => ({
    id: item.id,
    name: item.institution_name,
    logo: item.institution_logo ?? null,
    connectedAt: item.created_at,
    accountCount: accountCountMap.get(item.id) || 0,
  }))

  return <AccountsView institutions={institutions} />
}
