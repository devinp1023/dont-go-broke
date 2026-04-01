import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { plaidClient } from '@/lib/plaid'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { public_token, institution_name } = await request.json()

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    })
    const { access_token, item_id } = exchangeResponse.data

    // Store the plaid item
    const { data: plaidItem, error: insertError } = await supabase
      .from('plaid_items')
      .insert({
        user_id: user.id,
        access_token,
        item_id,
        institution_name,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Failed to store connection' }, { status: 500 })
    }

    // Fetch accounts
    const accountsResponse = await plaidClient.accountsGet({ access_token })
    const accounts = accountsResponse.data.accounts

    for (const account of accounts) {
      await supabase.from('accounts').insert({
        user_id: user.id,
        plaid_item_id: plaidItem.id,
        plaid_account_id: account.account_id,
        name: account.name,
        type: account.type,
        subtype: account.subtype,
        current_balance: account.balances.current,
        available_balance: account.balances.available,
        currency: account.balances.iso_currency_code || 'USD',
      })
    }

    // Fetch recent transactions
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const transactionsResponse = await plaidClient.transactionsGet({
      access_token,
      start_date: thirtyDaysAgo.toISOString().split('T')[0],
      end_date: now.toISOString().split('T')[0],
    })

    // Get account mapping
    const { data: dbAccounts } = await supabase
      .from('accounts')
      .select('id, plaid_account_id')
      .eq('plaid_item_id', plaidItem.id)

    const accountMap = new Map(
      dbAccounts?.map((a) => [a.plaid_account_id, a.id]) || []
    )

    for (const txn of transactionsResponse.data.transactions) {
      await supabase.from('transactions').upsert(
        {
          user_id: user.id,
          account_id: accountMap.get(txn.account_id),
          plaid_transaction_id: txn.transaction_id,
          amount: txn.amount,
          date: txn.date,
          name: txn.name,
          merchant_name: txn.merchant_name,
          category: txn.personal_finance_category?.primary || txn.category?.[0],
          plaid_category: txn.personal_finance_category,
          pending: txn.pending,
        },
        { onConflict: 'plaid_transaction_id' }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Failed to exchange token' },
      { status: 500 }
    )
  }
}
