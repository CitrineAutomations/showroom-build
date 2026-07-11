import { NextRequest, NextResponse } from 'next/server'
import { addInventoryItemImagesIfMissing, createInventoryItem, createPullItemLoan, deleteInventoryItem, getInventoryItemIdentifier, getInventoryItemStatus, markInventoryItemOut } from '@/lib/twenty'

const MAX_ITEMS = 20

interface NewItemInput {
  mode: 'new'
  designer: string
  color: string
  itemType: string
  conditionNotes?: string
  loanFileIds: string[]
  itemFileIds: string[]
}

interface ExistingItemInput {
  mode: 'existing'
  inventoryItemId: string
  conditionNotes?: string
  loanFileIds: string[]
  itemFileIds: string[]
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
    const statusWarnings: string[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i] as ItemInput
      const loanFileIds = Array.isArray(item.loanFileIds) ? item.loanFileIds : []
      const itemFileIds = Array.isArray(item.itemFileIds) ? item.itemFileIds : []
      const label = item.mode === 'new' ? item.designer : `existing item ${item.inventoryItemId.slice(0, 8)}`
      let createdNewInventoryItemId: string | null = null
      try {
        let inventoryItemId: string
        let itemIdentifier: string
        if (item.mode === 'new') {
          const created = await createInventoryItem(item.designer, item.color, item.itemType, i + 1, itemFileIds)
          inventoryItemId = created.id
          itemIdentifier = created.itemId
          createdNewInventoryItemId = created.id
        } else {
          inventoryItemId = item.inventoryItemId
          const status = await getInventoryItemStatus(inventoryItemId)
          if (status !== 'AVAILABLE') {
            throw new Error(`Item is no longer available (status: ${status ?? 'unknown'})`)
          }
          itemIdentifier = await getInventoryItemIdentifier(inventoryItemId)
          await addInventoryItemImagesIfMissing(inventoryItemId, itemFileIds)
        }
        // Create the loan before flipping status: the loan is the source of truth for
        // "is this item checked out", so if loan creation fails there's nothing to roll
        // back. Marking status after loan creation avoids the race where a rollback could
        // clobber a status change made by a different concurrent pull of the same item.
        const loan = await createPullItemLoan(pullId, inventoryItemId, itemIdentifier, item.conditionNotes, loanFileIds)
        createdLoanIds.push(loan.id)
        if (item.mode === 'existing') {
          try {
            await markInventoryItemOut(inventoryItemId)
          } catch (statusErr) {
            console.error(`[api/pull-items] loan ${loan.id} created but failed to mark item ${inventoryItemId} OUT`, statusErr)
            statusWarnings.push(`Item ${i + 1} (${label}): loan created but still shows AVAILABLE in Twenty — update its status manually.`)
          }
        }
      } catch (err) {
        // If we created a new InventoryItem for this card but the loan write failed,
        // remove it so a retry doesn't leave an orphaned OUT item and create a duplicate.
        let cleanupFailed = false
        if (createdNewInventoryItemId) {
          try {
            await deleteInventoryItem(createdNewInventoryItemId)
          } catch {
            cleanupFailed = true
          }
        }
        const message = err instanceof Error ? err.message : 'Failed to create item'
        const stage = item.mode === 'new' ? 'creating new item' : 'linking existing item'
        const cleanupNote = cleanupFailed
          ? ` (also failed to remove the partially-created inventory item ${createdNewInventoryItemId} — remove it manually before retrying to avoid a duplicate)`
          : ''
        return NextResponse.json(
          { error: `Item ${i + 1} (${label}), ${stage}: ${message}${cleanupNote}`, createdLoanIds },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      loanIds: createdLoanIds,
      ...(statusWarnings.length ? { warnings: statusWarnings } : {}),
    })
  } catch (err) {
    console.error('[api/pull-items]', err)
    const message = err instanceof Error ? err.message : 'Failed to create items'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
