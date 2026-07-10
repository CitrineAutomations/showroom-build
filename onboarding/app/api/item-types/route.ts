import { NextResponse } from 'next/server'
import { getItemTypeOptions } from '@/lib/twenty'

export async function GET() {
  try {
    const options = await getItemTypeOptions()
    return NextResponse.json({ options })
  } catch (err) {
    console.error('[api/item-types]', err)
    const message = err instanceof Error ? err.message : 'Failed to load item types'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
