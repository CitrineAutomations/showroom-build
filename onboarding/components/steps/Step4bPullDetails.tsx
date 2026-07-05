'use client'

import { useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'

interface Props {
  contactId: string | null
  clientName: string
  initialReturnDate?: string | null
  onComplete: (pullId: string) => void
  onBack: () => void
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function Step4bPullDetails({ contactId, clientName, initialReturnDate, onComplete, onBack }: Props) {
  const [returnDate, setReturnDate] = useState(initialReturnDate ?? '')
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isValid = returnDate.length > 0

  async function handleNext() {
    if (!isValid || !contactId) return
    setApiError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, returnDate, clientName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create pull')
      onComplete(data.pullId)
    } catch {
      setApiError('Unable to save pull details. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="step-content">
        <p className="section-label">Pull Details</p>
        <h1 className="step-heading">Return Date</h1>

        <div>
          <label htmlFor="returnDate" className="field-label">Return Date</label>
          <input
            id="returnDate"
            type="date"
            min={today()}
            value={returnDate}
            onChange={e => setReturnDate(e.target.value)}
            className="field-input"
          />
        </div>

        {apiError && (
          <div className="alert alert-danger" role="alert" style={{ marginTop: 'var(--space-4)' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
            <span>{apiError}</span>
          </div>
        )}
      </div>

      <div className="nav-bar">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button
          className="btn btn-primary"
          onClick={handleNext}
          disabled={loading || !isValid}
          aria-disabled={!isValid}
        >
          {loading ? <Loader2 size={16} className="spin" aria-hidden="true" /> : null}
          {loading ? 'Saving…' : 'Next →'}
        </button>
      </div>
    </>
  )
}
