'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, AlertCircle, Loader2 } from 'lucide-react'
import type { ClientType } from '@/app/page'

interface SearchResult {
  id: string
  name: { firstName: string; lastName: string }
  emails: { primaryEmail: string }
  phones: { primaryPhoneNumber: string } | null
  clientType: string | null
  stripeCustomerId: string | null
}

interface ExistingClientData {
  firstName: string
  lastName: string
  email: string
  phone: string
  contactId: string
  hasCardOnFile: boolean
  existingStripeCustomerId: string | null
  clientType: ClientType | null
  pullId: string | null
  pullReturnDate: string | null
  licensePhotoUrls: string[]
}

interface Props {
  onNewClient: () => void
  onExistingClientSelected: (data: ExistingClientData) => void
  onReturn: () => void
}

export default function Step0ClientRouter({ onNewClient, onExistingClientSelected, onReturn }: Props) {
  const [mode, setMode] = useState<'choose' | 'search'>('choose')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [selecting, setSelecting] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (mode !== 'search') return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = query.trim()
    if (!q) {
      setResults([])
      setApiError(null)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      setApiError(null)
      try {
        const res = await fetch(`/api/contact-search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Search failed')
        setResults(data.results)
      } catch (err) {
        setApiError(
          err instanceof Error && err.message
            ? err.message
            : 'Unable to reach the CRM. Check your connection and try again.'
        )
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, mode])

  async function selectResult(result: SearchResult) {
    setSelecting(true)
    setApiError(null)
    try {
      const [pullRes, licenseRes] = await Promise.all([
        fetch(`/api/pull?contactId=${encodeURIComponent(result.id)}`),
        fetch(`/api/contact/license?contactId=${encodeURIComponent(result.id)}`),
      ])
      const pullData = await pullRes.json()
      if (!pullRes.ok) throw new Error(pullData.error || 'Pull lookup failed')
      const licenseData = await licenseRes.json()
      if (!licenseRes.ok) throw new Error(licenseData.error || 'License photo lookup failed')

      onExistingClientSelected({
        firstName: result.name.firstName,
        lastName: result.name.lastName,
        email: result.emails.primaryEmail,
        phone: result.phones?.primaryPhoneNumber ?? '',
        contactId: result.id,
        hasCardOnFile: !!result.stripeCustomerId,
        existingStripeCustomerId: result.stripeCustomerId ?? null,
        clientType: (result.clientType as ClientType | null) ?? null,
        pullId: pullData.pull?.id ?? null,
        pullReturnDate: pullData.pull?.returnDate ?? null,
        licensePhotoUrls: (licenseData.photos ?? []).map((p: { url: string }) => p.url),
      })
    } catch (err) {
      setApiError(
        err instanceof Error && err.message
          ? err.message
          : 'Unable to load this client. Check your connection and try again.'
      )
      setSelecting(false)
    }
  }

  if (mode === 'choose') {
    return (
      <div className="step-content">
        <p className="section-label">Welcome</p>
        <h1 className="step-heading">What Are You Here For?</h1>

        <div
          role="radiogroup"
          aria-label="Client action"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
        >
          <button role="radio" aria-checked={false} className="option-card" onClick={onNewClient}>
            <span className="option-card-label">New Client</span>
            <span className="option-card-sublabel">First time visiting the showroom</span>
          </button>
          <button role="radio" aria-checked={false} className="option-card" onClick={() => setMode('search')}>
            <span className="option-card-label">Existing Client</span>
            <span className="option-card-sublabel">Find and continue an existing record</span>
          </button>
          <button role="radio" aria-checked={false} className="option-card" onClick={onReturn}>
            <span className="option-card-label">Return</span>
            <span className="option-card-sublabel">Check in items from a pull</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="step-content">
        <p className="section-label">Existing Client</p>
        <h1 className="step-heading">Find Client</h1>

        <div style={{ position: 'relative' }}>
          <Search size={16} color="var(--color-text-secondary)" aria-hidden="true" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            autoFocus
            placeholder="Search name, email, or phone"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="field-input"
            style={{ paddingLeft: 36 }}
            aria-label="Search for existing client"
          />
        </div>

        {searching && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-3)' }}>
            <Loader2 size={14} className="spin" aria-hidden="true" style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Searching…
          </p>
        )}

        {!searching && query.trim() && results.length === 0 && !apiError && (
          <div style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              No matches — try a different search or continue as new.
            </p>
            <button className="btn btn-ghost" onClick={onNewClient} style={{ marginTop: 'var(--space-3)' }}>
              New Client →
            </button>
          </div>
        )}

        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            {results.map(r => (
              <button
                key={r.id}
                className="option-card"
                onClick={() => selectResult(r)}
                disabled={selecting}
              >
                <span className="option-card-label">{r.name.firstName} {r.name.lastName}</span>
                <span className="option-card-sublabel">{r.emails.primaryEmail}{r.phones?.primaryPhoneNumber ? ` · ${r.phones.primaryPhoneNumber}` : ''}</span>
              </button>
            ))}
          </div>
        )}

        {apiError && (
          <div className="alert alert-danger" role="alert" style={{ marginTop: 'var(--space-4)' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
            <span>{apiError}</span>
          </div>
        )}
      </div>

      <div className="nav-bar">
        <button className="btn btn-ghost" onClick={() => setMode('choose')}>← Back</button>
      </div>
    </>
  )
}
