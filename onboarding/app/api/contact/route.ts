import { NextRequest, NextResponse } from 'next/server'
import { findContactByEmail, createContact, updateContact } from '@/lib/twenty'

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, phone, clientType } = await req.json()
    if (!fullName || !email) {
      return NextResponse.json({ error: 'fullName and email are required' }, { status: 400 })
    }

    let contact = await findContactByEmail(email)

    if (contact) {
      await updateContact(contact.id, { clientType, phone: phone || undefined })
      return NextResponse.json({
        contactId: contact.id,
        hasCardOnFile: !!contact.stripeCustomerId,
        existingStripeCustomerId: contact.stripeCustomerId ?? null,
        isNew: false,
      })
    }

    contact = await createContact(fullName, email, clientType, phone)
    return NextResponse.json({
      contactId: contact.id,
      hasCardOnFile: false,
      existingStripeCustomerId: null,
      isNew: true,
    })
  } catch (err) {
    console.error('[api/contact]', err)
    const message = err instanceof Error ? err.message : 'CRM unavailable'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { contactId, clientType } = await req.json()
    if (!contactId || !clientType) {
      return NextResponse.json({ error: 'contactId and clientType are required' }, { status: 400 })
    }

    await updateContact(contactId, { clientType })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/contact PATCH]', err)
    const message = err instanceof Error ? err.message : 'CRM unavailable'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
