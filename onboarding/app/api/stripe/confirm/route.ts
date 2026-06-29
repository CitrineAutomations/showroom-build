import { NextRequest, NextResponse } from 'next/server'
import { attachPaymentMethod } from '@/lib/stripe'
import { updateContact } from '@/lib/twenty'

export async function POST(req: NextRequest) {
  try {
    const { contactId, customerId, paymentMethodId } = await req.json()
    if (!contactId || !customerId || !paymentMethodId) {
      return NextResponse.json({ error: 'contactId, customerId, paymentMethodId required' }, { status: 400 })
    }

    await attachPaymentMethod(customerId, paymentMethodId)
    await updateContact(contactId, { stripeCustomerId: customerId })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[api/stripe/confirm]', err)
    return NextResponse.json({ error: 'Failed to save card' }, { status: 500 })
  }
}
