'use client'

import { useRef, useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import type { ClientType } from '@/app/page'

interface Props {
  contactId: string | null
  selected: ClientType | null
  onSelect: (ct: ClientType) => void
  onNext: () => void
  onBack: () => void
}

const OPTIONS: { value: ClientType; label: string; sublabel: string }[] = [
  { value: 'RENTAL',           label: 'Rental',           sublabel: 'Items rented to client' },
  { value: 'PUBLIC_RELATIONS', label: 'Public Relations', sublabel: 'PR samples and pulls' },
]

export default function Step2ClientType({ contactId, selected, onSelect, onNext, onBack }: Props) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!selected)
  const [apiError, setApiError] = useState<string | null>(null)
  const latestRequest = useRef(0)

  async function handleSelect(ct: ClientType) {
    onSelect(ct)
    setSaved(false)
    if (!contactId) {
      setApiError('Missing client record — go back and re-enter identity details before continuing.')
      return
    }
    const requestId = ++latestRequest.current
    setApiError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, clientType: ct }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'CRM error')
      if (requestId === latestRequest.current) setSaved(true)
    } catch (err) {
      if (requestId === latestRequest.current) {
        setApiError(
          err instanceof Error && err.message
            ? err.message
            : 'Unable to reach the CRM. Check your connection and try again.'
        )
      }
    } finally {
      if (requestId === latestRequest.current) setSaving(false)
    }
  }

  return (
    <>
      <div className="step-content">
        <p className="section-label">Client Type</p>
        <h1 className="step-heading">Select Account Type</h1>

        <div
          role="radiogroup"
          aria-labelledby="client-type-heading"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
        >
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              role="radio"
              aria-checked={selected === opt.value}
              className="option-card"
              onClick={() => handleSelect(opt.value)}
            >
              <span className="option-card-label">{opt.label}</span>
              <span className="option-card-sublabel">{opt.sublabel}</span>
            </button>
          ))}
        </div>

        {saving && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-3)' }}>
            <Loader2 size={14} className="spin" aria-hidden="true" style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Saving…
          </p>
        )}

        {apiError && (
          <div className="alert alert-danger" role="alert" style={{ marginTop: 'var(--space-3)' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
            <span>{apiError}</span>
          </div>
        )}
      </div>

      <div className="nav-bar">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button
          className="btn btn-primary"
          onClick={onNext}
          disabled={!selected || !saved || saving}
          aria-disabled={!selected || !saved || saving}
        >
          Next →
        </button>
      </div>
    </>
  )
}
