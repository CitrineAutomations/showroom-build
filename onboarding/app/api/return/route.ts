import { NextRequest, NextResponse } from 'next/server'
import { getOpenPull, returnPullItems, type ItemCondition } from '@/lib/twenty'

const VALID_CONDITIONS: ItemCondition[] = ['AVAILABLE', 'DAMAGED', 'LOST']

export async function GET(req: NextRequest) {
  try {
    const pullId = req.nextUrl.searchParams.get('pullId')
    if (!pullId) {
      return NextResponse.json({ error: 'pullId is required' }, { status: 400 })
    }
    const pull = await getOpenPull(pullId)
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
      (item: { loanId?: unknown; inventoryItemId?: unknown; condition?: unknown; conditionNotes?: unknown; loanFileIds?: unknown }) =>
        typeof item.loanId !== 'string' ||
        typeof item.inventoryItemId !== 'string' ||
        !VALID_CONDITIONS.includes(item.condition as ItemCondition) ||
        (item.conditionNotes !== undefined && typeof item.conditionNotes !== 'string') ||
        (item.loanFileIds !== undefined && !(Array.isArray(item.loanFileIds) && item.loanFileIds.every((id: unknown) => typeof id === 'string')))
    )
    if (invalid) {
      return NextResponse.json({ error: 'Each item requires a loanId, inventoryItemId, and a valid condition' }, { status: 400 })
    }
    const damagedMissingProof = items.some(
      (item: { condition: ItemCondition; conditionNotes?: string; loanFileIds?: string[] }) =>
        item.condition === 'DAMAGED' && (!item.conditionNotes?.trim() || !item.loanFileIds?.length)
    )
    if (damagedMissingProof) {
      return NextResponse.json({ error: 'Damaged items require condition notes and at least one photo' }, { status: 400 })
    }
    const result = await returnPullItems(pullId, items)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[api/return]', err)
    const message = err instanceof Error ? err.message : 'Failed to process return'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
