'use client'

import { useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'

interface Props {
  initialData: { firstName: string; lastName: string; email: string }
  onComplete: (data: {
    firstName: string
    lastName: string
    email: string
    contactId: string
    hasCardOnFile: boolean
    existingStripeCustomerId: string | null
  }) => void
}

export default function Step1Identity({ initialData, onComplete }: Props) {
  const [firstName, setFirstName] = useState(initialData.firstName)
  const [lastName, setLastName] = useState(initialData.lastName)
  const [email, setEmail] = useState(initialData.email)
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; email?: string }>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isValid = firstName.trim().length >= 1 && lastName.trim().length >= 1 && /\S+@\S+/.test(email)

  function validate() {
    const e: typeof errors = {}
    if (firstName.trim().length < 1) e.firstName = 'First name is required.'
    if (lastName.trim().length < 1) e.lastName = 'Last name is required.'
    if (!/\S+@\S+/.test(email)) e.email = 'Please enter a valid email address.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleNext() {
    if (!validate()) return
    setApiError(null)
    setLoading(true)
    const fullName = `${firstName.trim()} ${lastName.trim()}`
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email: email.trim(), clientType: null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'CRM error')
      onComplete({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        contactId: data.contactId,
        hasCardOnFile: data.hasCardOnFile,
        existingStripeCustomerId: data.existingStripeCustomerId,
      })
    } catch {
      setApiError('Unable to reach the CRM. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="step-content">
        <p className="section-label">New Client</p>
        <h1 className="step-heading">Client Information</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label htmlFor="firstName" className="field-label">First Name</label>
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="First"
                value={firstName}
                onChange={e => { setFirstName(e.target.value); setErrors(prev => ({ ...prev, firstName: undefined })) }}
                className={`field-input${errors.firstName ? ' error' : ''}`}
                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                aria-invalid={!!errors.firstName}
              />
              {errors.firstName && (
                <p id="firstName-error" className="field-error" role="alert">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="field-label">Last Name</label>
              <input
                id="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Last"
                value={lastName}
                onChange={e => { setLastName(e.target.value); setErrors(prev => ({ ...prev, lastName: undefined })) }}
                className={`field-input${errors.lastName ? ' error' : ''}`}
                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                aria-invalid={!!errors.lastName}
              />
              {errors.lastName && (
                <p id="lastName-error" className="field-error" role="alert">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="field-label">Email Address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="client@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })) }}
              className={`field-input${errors.email ? ' error' : ''}`}
              aria-describedby={errors.email ? 'email-error' : undefined}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p id="email-error" className="field-error" role="alert">{errors.email}</p>
            )}
          </div>

          {apiError && (
            <div className="alert alert-danger" role="alert">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
              <span>{apiError}</span>
            </div>
          )}
        </div>
      </div>

      <div className="nav-bar">
        <button
          className="btn btn-primary"
          onClick={handleNext}
          disabled={loading || !isValid}
          aria-disabled={!isValid}
          style={{ flex: 1 }}
        >
          {loading ? <Loader2 size={16} className="spin" aria-hidden="true" /> : null}
          {loading ? 'Checking…' : 'Next →'}
        </button>
      </div>
    </>
  )
}
