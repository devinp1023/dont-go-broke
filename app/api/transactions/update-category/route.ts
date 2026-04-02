import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_CATEGORIES = new Set([
  'INCOME',
  'RENT',
  'UTILITIES',
  'RESTAURANTS',
  'GROCERIES',
  'SHOPPING',
  'TRAVEL',
  'BARS_AND_NIGHTLIFE',
  'ENTERTAINMENT',
  'TRANSPORTATION',
  'GYM',
  'PERSONAL_CARE',
  'HEALTH',
  'INTERNAL_TRANSFER',
  'OTHER',
])

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transactionId, category } = await request.json()

    if (!transactionId || !category) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const normalized = category.toUpperCase()
    if (!VALID_CATEGORIES.has(normalized)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const { error } = await supabase
      .from('transactions')
      .update({ category: normalized, category_manual: true })
      .eq('id', transactionId)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}
