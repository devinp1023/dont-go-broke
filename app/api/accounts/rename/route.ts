import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { account_id, name } = await request.json()

    if (!account_id || !name?.trim()) {
      return NextResponse.json({ error: 'Missing account_id or name' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('accounts')
      .update({ name: name.trim() })
      .eq('id', account_id)
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to rename account' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Failed to rename account' },
      { status: 500 }
    )
  }
}
