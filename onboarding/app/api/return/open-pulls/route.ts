import { NextResponse } from 'next/server'
import { listOpenPulls } from '@/lib/twenty'

export async function GET() {
  try {
    const pulls = await listOpenPulls()
    return NextResponse.json({ pulls })
  } catch (err) {
    console.error('[api/return/open-pulls]', err)
    const message = err instanceof Error ? err.message : 'Failed to list open pulls'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
