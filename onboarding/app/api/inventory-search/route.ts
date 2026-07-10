import { NextRequest, NextResponse } from 'next/server'
import { searchInventoryItems } from '@/lib/twenty'

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
    if (!q) {
      return NextResponse.json({ results: [] })
    }
    const results = await searchInventoryItems(q)
    return NextResponse.json({ results })
  } catch (err) {
    console.error('[api/inventory-search]', err)
    const message = err instanceof Error ? err.message : 'Search failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
