import { NextRequest, NextResponse } from 'next/server'
import { searchContacts } from '@/lib/twenty'

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
    if (!q) {
      return NextResponse.json({ results: [] })
    }
    const results = await searchContacts(q)
    return NextResponse.json({ results })
  } catch (err) {
    console.error('[api/contact-search]', err)
    const message = err instanceof Error ? err.message : 'CRM unavailable'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
