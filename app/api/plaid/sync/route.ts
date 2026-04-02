import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { plaidClient } from '@/lib/plaid'

// Map Plaid's personal_finance_category.primary to our custom categories
const PLAID_TO_CATEGORY: Record<string, string> = {
  INCOME: 'INCOME',
  TRANSFER_IN: 'INTERNAL_TRANSFER',
  TRANSFER_OUT: 'INTERNAL_TRANSFER',
  LOAN_PAYMENTS: 'OTHER',
  BANK_FEES: 'OTHER',
  ENTERTAINMENT: 'ENTERTAINMENT',
  FOOD_AND_DRINK: 'RESTAURANTS',
  GENERAL_MERCHANDISE: 'SHOPPING',
  HOME_IMPROVEMENT: 'SHOPPING',
  MEDICAL: 'HEALTH',
  PERSONAL_CARE: 'PERSONAL_CARE',
  GENERAL_SERVICES: 'OTHER',
  GOVERNMENT_AND_NON_PROFIT: 'OTHER',
  TRANSPORTATION: 'TRANSPORTATION',
  TRAVEL: 'TRAVEL',
  RENT_AND_UTILITIES: 'RENT',
}

function mapPlaidCategory(plaidPrimary: string | undefined): string {
  if (!plaidPrimary) return 'OTHER'
  return PLAID_TO_CATEGORY[plaidPrimary] || 'OTHER'
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: plaidItems } = await supabase
      .from('plaid_items')
      .select('id, access_token')
      .eq('user_id', user.id)

    if (!plaidItems || plaidItems.length === 0) {
      return NextResponse.json({ synced: 0 })
    }

    let totalSynced = 0

    for (const item of plaidItems) {
      // Get account mapping for this item
      const { data: dbAccounts } = await supabase
        .from('accounts')
        .select('id, plaid_account_id')
        .eq('plaid_item_id', item.id)

      const accountMap = new Map(
        dbAccounts?.map((a) => [a.plaid_account_id, a.id]) || []
      )

      // Update account balances
      const accountsResponse = await plaidClient.accountsGet({
        access_token: item.access_token,
      })

      for (const account of accountsResponse.data.accounts) {
        await supabase
          .from('accounts')
          .update({
            current_balance: account.balances.current,
            available_balance: account.balances.available,
            updated_at: new Date().toISOString(),
          })
          .eq('plaid_account_id', account.account_id)
          .eq('user_id', user.id)
      }

      // Fetch up to 2 years of transaction history, paginated
      const now = new Date()
      const twoYearsAgo = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000)
      const startDate = twoYearsAgo.toISOString().split('T')[0]
      const endDate = now.toISOString().split('T')[0]

      const firstPage = await plaidClient.transactionsGet({
        access_token: item.access_token,
        start_date: startDate,
        end_date: endDate,
        options: { count: 500, offset: 0 },
      })

      const allTransactions = [...firstPage.data.transactions]
      const totalAvailable = firstPage.data.total_transactions
      let offset = allTransactions.length

      while (offset < totalAvailable) {
        const response = await plaidClient.transactionsGet({
          access_token: item.access_token,
          start_date: startDate,
          end_date: endDate,
          options: { count: 500, offset },
        })
        allTransactions.push(...response.data.transactions)
        offset += response.data.transactions.length
      }

      // Find which transactions have been manually categorized
      const plaidTxnIds = allTransactions.map((t) => t.transaction_id)
      // Query in batches to avoid Supabase filter limits
      const manualSet = new Set<string>()
      for (let i = 0; i < plaidTxnIds.length; i += 500) {
        const batch = plaidTxnIds.slice(i, i + 500)
        const { data: manualTxns } = await supabase
          .from('transactions')
          .select('plaid_transaction_id')
          .in('plaid_transaction_id', batch)
          .eq('category_manual', true)
        manualTxns?.forEach((t) => manualSet.add(t.plaid_transaction_id))
      }

      for (const txn of allTransactions) {
        const base = {
          user_id: user.id,
          account_id: accountMap.get(txn.account_id),
          plaid_transaction_id: txn.transaction_id,
          amount: txn.amount,
          date: txn.date,
          name: txn.name,
          merchant_name: txn.merchant_name,
          plaid_category: txn.personal_finance_category,
          pending: txn.pending,
        }

        // Skip overwriting category if user manually set it
        const data = manualSet.has(txn.transaction_id)
          ? base
          : { ...base, category: mapPlaidCategory(txn.personal_finance_category?.primary) }

        await supabase.from('transactions').upsert(data, { onConflict: 'plaid_transaction_id' })
      }

      totalSynced += allTransactions.length
    }

    return NextResponse.json({ synced: totalSynced })
  } catch {
    return NextResponse.json(
      { error: 'Failed to sync transactions' },
      { status: 500 }
    )
  }
}
