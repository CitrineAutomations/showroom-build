import { NextRequest, NextResponse } from 'next/server'
import { reconcileInventoryItemStatus } from '@/lib/twenty'

const MAX_ITEMS = 20

export async function POST(req: NextRequest) {
  try {
    const { inventoryItemIds } = await req.json()
    if (!Array.isArray(inventoryItemIds) || inventoryItemIds.length === 0) {
      return NextResponse.json({ error: 'inventoryItemIds is required' }, { status: 400 })
    }
    if (inventoryItemIds.length > MAX_ITEMS) {
      return NextResponse.json({ error: `A single request is limited to ${MAX_ITEMS} items` }, { status: 400 })
    }
    if (inventoryItemIds.some((id: unknown) => typeof id !== 'string' || !id.trim())) {
      return NextResponse.json({ error: 'inventoryItemIds must be non-empty strings' }, { status: 400 })
    }

    const results = await Promise.all(
      (inventoryItemIds as string[]).map(id => reconcileInventoryItemStatus(id))
    )
    return NextResponse.json({ results })
  } catch (err) {
    console.error('[api/reconcile-item-status]', err)
    const message = err instanceof Error ? err.message : 'Failed to reconcile item status'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
