import { NextRequest, NextResponse } from 'next/server'
import { markPullOut } from '@/lib/twenty'

export async function POST(req: NextRequest) {
  try {
    const { pullId } = await req.json()
    if (!pullId) {
      return NextResponse.json({ error: 'pullId is required' }, { status: 400 })
    }

    await markPullOut(pullId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/pull/mark-out]', err)
    return NextResponse.json({ error: 'Failed to mark pull as out' }, { status: 500 })
  }
}
