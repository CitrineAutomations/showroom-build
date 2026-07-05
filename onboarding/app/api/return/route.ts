import { NextRequest, NextResponse } from 'next/server'
import { getOpenPullForContact, returnPullItems, type ItemCondition } from '@/lib/twenty'

const VALID_CONDITIONS: ItemCondition[] = ['AVAILABLE', 'DAMAGED', 'MISSING']

export async function GET(req: NextRequest) {
  try {
    const contactId = req.nextUrl.searchParams.get('contactId')
    if (!contactId) {
      return NextResponse.json({ error: 'contactId is required' }, { status: 400 })
    }
    const pull = await getOpenPullForContact(contactId)
    return NextResponse.json({ pull })
  } catch (err) {
    console.error('[api/return]', err)
    const message = err instanceof Error ? err.message : 'Failed to look up pull'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { pullId, items } = await req.json()
    if (!pullId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'pullId and items are required' }, { status: 400 })
    }
    const invalid = items.some(
      (item: { id?: unknown; condition?: unknown }) =>
        typeof item.id !== 'string' || !VALID_CONDITIONS.includes(item.condition as ItemCondition)
    )
    if (invalid) {
      return NextResponse.json({ error: 'Each item requires an id and a valid condition' }, { status: 400 })
    }
    const result = await returnPullItems(pullId, items)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[api/return]', err)
    const message = err instanceof Error ? err.message : 'Failed to process return'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
