import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    await supabase
      .from('insights')
      .delete()
      .eq('user_id', user.id)
      .eq('generated_date', today)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to refresh insight' }, { status: 500 })
  }
}
