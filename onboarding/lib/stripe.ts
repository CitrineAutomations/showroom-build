import 'server-only'
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY must be set in .env.local')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

export async function createStripeCustomer(name: string, email: string): Promise<Stripe.Customer> {
  return stripe.customers.create({ name, email })
}

export async function createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
  return stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
  })
}

export async function attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
  await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  })
}
