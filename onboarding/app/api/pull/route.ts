import { NextRequest, NextResponse } from 'next/server'
import { createPull, getActivePullForContact } from '@/lib/twenty'

export async function POST(req: NextRequest) {
  try {
    const { contactId, returnDate, clientName } = await req.json()
    if (!contactId || !returnDate || !clientName) {
      return NextResponse.json({ error: 'contactId, returnDate, and clientName are required' }, { status: 400 })
    }
    const pull = await createPull(contactId, returnDate, clientName)
    return NextResponse.json({ pullId: pull.id })
  } catch (err) {
    console.error('[api/pull]', err)
    const message = err instanceof Error ? err.message : 'Failed to create pull'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const contactId = req.nextUrl.searchParams.get('contactId')
    if (!contactId) {
      return NextResponse.json({ error: 'contactId is required' }, { status: 400 })
    }
    const pull = await getActivePullForContact(contactId)
    return NextResponse.json({ pull })
  } catch (err) {
    console.error('[api/pull]', err)
    const message = err instanceof Error ? err.message : 'Failed to look up pull'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
