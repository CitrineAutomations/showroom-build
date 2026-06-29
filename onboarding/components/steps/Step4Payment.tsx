'use client'

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { AlertCircle, Loader2 } from 'lucide-react'
import type { FormData } from '@/app/page'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#F5F0E6',
      fontFamily: 'Inter Variable, system-ui, sans-serif',
      fontSize: '16px',
      '::placeholder': { color: '#5A5550' },
    },
    invalid: { color: '#C0392B' },
  },
}

interface CardFormProps {
  formData: FormData
  onComplete: (stripeCustomerId: string) => void
  onBack: () => void
}

function CardForm({ formData, onComplete, onBack }: CardFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [cardComplete, setCardComplete] = useState(false)
  const [focused, setFocused] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/stripe/setup-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `${formData.firstName} ${formData.lastName}`.trim(), email: formData.email }),
    })
      .then(r => r.json())
      .then(d => { setClientSecret(d.clientSecret); setCustomerId(d.customerId) })
      .catch(() => setApiError('Failed to initialize payment setup. Please go back and try again.'))
  }, [formData.firstName, formData.lastName, formData.email])

  async function handleSave() {
    if (!stripe || !elements || !clientSecret || !customerId) return
    setLoading(true)
    setApiError(null)
    setCardError(null)

    const card = elements.getElement(CardElement)
    if (!card) return

    const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card },
    })

    if (error) {
      setCardError(error.message ?? 'Card error')
      setLoading(false)
      return
    }

    const paymentMethodId = typeof setupIntent?.payment_method === 'string'
      ? setupIntent.payment_method
      : setupIntent?.payment_method?.id

    if (!paymentMethodId) {
      setApiError('Card processed but payment method ID missing.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/stripe/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId: formData.contactId, customerId, paymentMethodId }),
    })

    if (!res.ok) {
      setApiError('Card was processed but could not be linked. Contact support.')
      setLoading(false)
      return
    }

    onComplete(customerId)
  }

  return (
    <>
      <div className="step-content">
        <p className="section-label">Payment</p>
        <h1 className="step-heading">Card on File</h1>

        <div
          className={`stripe-card-wrapper${focused ? ' focused' : ''}${cardError ? ' error' : ''}`}
          role="group"
          aria-label="Credit or debit card"
        >
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={e => {
              setCardComplete(e.complete)
              setCardError(e.error?.message ?? null)
            }}
          />
        </div>

        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-3)', lineHeight: 1.6 }}>
          Your card will be saved on file and only charged if items are damaged or not returned.
        </p>

        {(cardError || apiError) && (
          <div className="alert alert-danger" role="alert" style={{ marginTop: 'var(--space-4)' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
            <span>{cardError || apiError}</span>
          </div>
        )}
      </div>

      <div className="nav-bar">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={loading || !cardComplete || !clientSecret}
          aria-disabled={!cardComplete}
        >
          {loading ? <Loader2 size={16} className="spin" aria-hidden="true" /> : null}
          {loading ? 'Saving…' : 'Save Card →'}
        </button>
      </div>
    </>
  )
}

interface Props {
  formData: FormData
  onEntry: () => void
  onComplete: (stripeCustomerId: string) => void
  onSkip: () => void
  onBack: () => void
}

export default function Step4Payment({ formData, onEntry, onComplete, onSkip, onBack }: Props) {
  useEffect(() => { onEntry() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (formData.cardKept) {
    return (
      <>
        <div className="step-content">
          <p className="section-label">Payment</p>
          <h1 className="step-heading">Card on File</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)' }}>
            Existing card on file will be kept.
          </p>
        </div>
        <div className="nav-bar">
          <button className="btn btn-ghost" onClick={onBack}>← Back</button>
          <button className="btn btn-primary" onClick={onSkip}>Next →</button>
        </div>
      </>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <CardForm formData={formData} onComplete={onComplete} onBack={onBack} />
    </Elements>
  )
}
