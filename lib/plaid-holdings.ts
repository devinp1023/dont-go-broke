import 'server-only'
import { plaidClient } from '@/lib/plaid'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Sync investment holdings from Plaid for a single item.
 * Silently skips if the item doesn't support investments.
 */
export async function syncInvestmentHoldings(
  supabase: SupabaseClient,
  accessToken: string,
  userId: string,
  accountMap: Map<string, string>, // plaid_account_id -> db UUID
  accountIds: string[], // db UUIDs for this item's accounts
): Promise<void> {
  try {
    const response = await plaidClient.investmentsHoldingsGet({
      access_token: accessToken,
    })

    const { securities: plaidSecurities, holdings: plaidHoldings } = response.data

    // Upsert securities
    for (const sec of plaidSecurities) {
      await supabase.from('securities').upsert(
        {
          plaid_security_id: sec.security_id,
          name: sec.name,
          ticker_symbol: sec.ticker_symbol,
          type: sec.type,
          close_price: sec.close_price,
          close_price_as_of: sec.close_price_as_of,
          is_cash_equivalent: sec.is_cash_equivalent ?? false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'plaid_security_id' }
      )
    }

    // Build security map: plaid_security_id -> db UUID
    const plaidSecIds = plaidSecurities.map((s) => s.security_id)
    const { data: dbSecurities } = await supabase
      .from('securities')
      .select('id, plaid_security_id')
      .in('plaid_security_id', plaidSecIds)
    const securityMap = new Map(
      dbSecurities?.map((s) => [s.plaid_security_id, s.id]) || []
    )

    // Delete old holdings for this item's accounts, then insert fresh
    if (accountIds.length > 0) {
      await supabase
        .from('holdings')
        .delete()
        .in('account_id', accountIds)
        .eq('user_id', userId)
    }

    // Insert current holdings
    for (const h of plaidHoldings) {
      const dbAccountId = accountMap.get(h.account_id)
      const dbSecurityId = securityMap.get(h.security_id)
      if (!dbAccountId || !dbSecurityId) continue

      await supabase.from('holdings').insert({
        user_id: userId,
        account_id: dbAccountId,
        security_id: dbSecurityId,
        quantity: h.quantity,
        institution_value: h.institution_value,
        institution_price: h.institution_price,
        cost_basis: h.cost_basis,
        iso_currency_code: h.iso_currency_code || 'USD',
        updated_at: new Date().toISOString(),
      })
    }
  } catch {
    // Item doesn't support investments — silently skip
  }
}
