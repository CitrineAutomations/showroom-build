import { NextRequest, NextResponse } from 'next/server'
import { addInventoryItemImagesIfMissing, createInventoryItem, createPullItemLoan, getInventoryItemIdentifier } from '@/lib/twenty'

const MAX_ITEMS = 20

interface NewItemInput {
  mode: 'new'
  designer: string
  color: string
  itemType: string
  conditionNotes?: string
  fileIds: string[]
}

interface ExistingItemInput {
  mode: 'existing'
  inventoryItemId: string
  conditionNotes?: string
  fileIds: string[]
}

type ItemInput = NewItemInput | ExistingItemInput

function isValidItem(item: Partial<ItemInput>): boolean {
  if (item.mode === 'existing') {
    return typeof item.inventoryItemId === 'string' && item.inventoryItemId.trim().length > 0
  }
  if (item.mode === 'new') {
    const n = item as Partial<NewItemInput>
    return (
      typeof n.designer === 'string' && n.designer.trim().length > 0 &&
      typeof n.color === 'string' && n.color.trim().length > 0 &&
      typeof n.itemType === 'string' && n.itemType.trim().length > 0
    )
  }
  return false
}

export async function POST(req: NextRequest) {
  try {
    const { pullId, items } = await req.json()
    if (!pullId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'pullId and at least one item are required' }, { status: 400 })
    }

    if (items.length > MAX_ITEMS) {
      return NextResponse.json({ error: `A single submission is limited to ${MAX_ITEMS} items` }, { status: 400 })
    }

    const invalid = items.some((item: Partial<ItemInput>) => !isValidItem(item))
    if (invalid) {
      return NextResponse.json({ error: 'Each item requires a valid mode with its required fields' }, { status: 400 })
    }

    const createdLoanIds: string[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i] as ItemInput
      const fileIds = Array.isArray(item.fileIds) ? item.fileIds : []
      const label = item.mode === 'new' ? item.designer : `existing item ${item.inventoryItemId.slice(0, 8)}`
      try {
        let inventoryItemId: string
        let itemIdentifier: string
        if (item.mode === 'new') {
          const created = await createInventoryItem(item.designer, item.color, item.itemType, i + 1, fileIds)
          inventoryItemId = created.id
          itemIdentifier = created.itemId
        } else {
          inventoryItemId = item.inventoryItemId
          itemIdentifier = await getInventoryItemIdentifier(inventoryItemId)
          await addInventoryItemImagesIfMissing(inventoryItemId, fileIds)
        }
        const loan = await createPullItemLoan(pullId, inventoryItemId, itemIdentifier, item.conditionNotes, fileIds)
        createdLoanIds.push(loan.id)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create item'
        const stage = item.mode === 'new' ? 'creating new item' : 'linking existing item'
        return NextResponse.json(
          { error: `Item ${i + 1} (${label}), ${stage}: ${message}`, createdLoanIds },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ loanIds: createdLoanIds })
  } catch (err) {
    console.error('[api/pull-items]', err)
    const message = err instanceof Error ? err.message : 'Failed to create items'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
