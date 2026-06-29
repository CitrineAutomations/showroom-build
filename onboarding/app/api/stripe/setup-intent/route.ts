import { NextRequest, NextResponse } from 'next/server'
import { createStripeCustomer, createSetupIntent } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json()
    if (!name || !email) return NextResponse.json({ error: 'name and email required' }, { status: 400 })

    const customer = await createStripeCustomer(name, email)
    const intent = await createSetupIntent(customer.id)

    return NextResponse.json({ clientSecret: intent.client_secret, customerId: customer.id })
  } catch (err) {
    console.error('[api/stripe/setup-intent]', err)
    return NextResponse.json({ error: 'Failed to create payment setup' }, { status: 500 })
  }
}
