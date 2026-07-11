import { NextRequest, NextResponse } from 'next/server'
import { createInventoryItem, attachFilesToItem } from '@/lib/twenty'

interface ItemInput {
  designer: string
  color: string
  itemType: string
  fileIds: string[]
}

export async function POST(req: NextRequest) {
  try {
    const { pullId, items } = await req.json()
    if (!pullId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'pullId and at least one item are required' }, { status: 400 })
    }

    const invalid = items.some(
      (item: Partial<ItemInput>) =>
        typeof item.designer !== 'string' || !item.designer.trim() ||
        typeof item.color !== 'string' || !item.color.trim() ||
        typeof item.itemType !== 'string' || !item.itemType.trim()
    )
    if (invalid) {
      return NextResponse.json({ error: 'Each item requires designer, color, and item type' }, { status: 400 })
    }

    const createdItemIds: string[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i] as ItemInput
      try {
        const created = await createInventoryItem(pullId, item.designer, item.color, item.itemType, i + 1)
        if (Array.isArray(item.fileIds) && item.fileIds.length > 0) {
          await attachFilesToItem(created.id, item.fileIds)
        }
        createdItemIds.push(created.id)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create item'
        return NextResponse.json({ error: `Item ${i + 1} (${item.designer}): ${message}`, createdItemIds }, { status: 500 })
      }
    }

    return NextResponse.json({ itemIds: createdItemIds })
  } catch (err) {
    console.error('[api/pull-items]', err)
    const message = err instanceof Error ? err.message : 'Failed to create items'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
