import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plaid_item_id } = await request.json()

    if (!plaid_item_id) {
      return NextResponse.json({ error: 'Missing plaid_item_id' }, { status: 400 })
    }

    // Verify ownership before deleting
    const { data: item } = await supabase
      .from('plaid_items')
      .select('id')
      .eq('id', plaid_item_id)
      .eq('user_id', user.id)
      .single()

    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Delete cascades to accounts and transactions via FK
    const { error: deleteError } = await supabase
      .from('plaid_items')
      .delete()
      .eq('id', plaid_item_id)
      .eq('user_id', user.id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to disconnect account' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Failed to disconnect account' },
      { status: 500 }
    )
  }
}
