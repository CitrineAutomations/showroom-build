import { NextRequest, NextResponse } from 'next/server'
import { createPortalAccount } from '@/lib/portalAccount'

export async function POST(req: NextRequest) {
  try {
    const { contactId, email, firstName, lastName } = await req.json()
    if (!contactId || !email || !firstName || !lastName) {
      return NextResponse.json({ error: 'contactId, email, firstName, lastName required' }, { status: 400 })
    }

    await createPortalAccount({ contactId, email, firstName, lastName })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/portal-account]', err)
    return NextResponse.json({ error: 'Failed to create portal account' }, { status: 500 })
  }
}
