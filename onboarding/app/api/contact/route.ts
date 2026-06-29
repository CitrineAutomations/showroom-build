import { NextRequest, NextResponse } from 'next/server'
import { findContactByEmail, createContact, updateContact } from '@/lib/twenty'

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, clientType } = await req.json()
    if (!fullName || !email) {
      return NextResponse.json({ error: 'fullName and email are required' }, { status: 400 })
    }

    let contact = await findContactByEmail(email)

    if (contact) {
      await updateContact(contact.id, { clientType })
      return NextResponse.json({
        contactId: contact.id,
        hasCardOnFile: !!contact.stripeCustomerId,
        existingStripeCustomerId: contact.stripeCustomerId ?? null,
        isNew: false,
      })
    }

    contact = await createContact(fullName, email, clientType)
    return NextResponse.json({
      contactId: contact.id,
      hasCardOnFile: false,
      existingStripeCustomerId: null,
      isNew: true,
    })
  } catch (err) {
    console.error('[api/contact]', err)
    return NextResponse.json({ error: 'CRM unavailable' }, { status: 500 })
  }
}
