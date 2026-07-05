'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import type { ItemCondition } from '@/lib/twenty'

interface SearchResult {
  id: string
  name: { firstName: string; lastName: string }
  emails: { primaryEmail: string }
  phones: { primaryPhoneNumber: string } | null
}

interface PullItem {
  id: string
  itemId: string
  designer: string
  itemType: string
  color: string
  status: string
}

interface OpenPull {
  id: string
  returnDate: string
  stage: string
  items: PullItem[]
}

const CONDITION_LABELS: Record<ItemCondition, string> = {
  AVAILABLE: 'Good',
  DAMAGED: 'Damaged',
  MISSING: 'Missing',
}

interface Props {
  onDone: () => void
}

type Mode = 'search' | 'items' | 'done'

export default function ReturnFlow({ onDone }: Props) {
  const [mode, setMode] = useState<Mode>('search')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [loadingPull, setLoadingPull] = useState(false)
  const [pull, setPull] = useState<OpenPull | null>(null)
  const [clientName, setClientName] = useState('')
  const [conditions, setItemConditions] = useState<Record<string, ItemCondition | null>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [finalStage, setFinalStage] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (mode !== 'search') return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = query.trim()
    if (!q) {
      setResults([])
      setSearchError(null)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      setSearchError(null)
      try {
        const res = await fetch(`/api/contact-search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Search failed')
        setResults(data.results)
      } catch (err) {
        setSearchError(
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

  async function selectClient(result: SearchResult) {
    setLoadingPull(true)
    setSearchError(null)
    try {
      const res = await fetch(`/api/return?contactId=${encodeURIComponent(result.id)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Pull lookup failed')
      if (!data.pull) {
        setSearchError('No open pull found for this client.')
        return
      }
      if (data.pull.items.length === 0 || data.pull.items.every((i: PullItem) => i.status !== 'OUT')) {
        setSearchError('All items on this client’s pull have already been returned.')
        return
      }
      setPull(data.pull)
      setClientName(`${result.name.firstName} ${result.name.lastName}`.trim())
      const initial: Record<string, ItemCondition | null> = {}
      for (const item of data.pull.items as PullItem[]) {
        initial[item.id] = item.status === 'OUT' ? 'AVAILABLE' : null
      }
      setItemConditions(initial)
      setMode('items')
    } catch (err) {
      setSearchError(
        err instanceof Error && err.message
          ? err.message
          : 'Unable to load this client. Check your connection and try again.'
      )
    } finally {
      setLoadingPull(false)
    }
  }

  function toggleItem(id: string) {
    setItemConditions(prev => ({ ...prev, [id]: prev[id] ? null : 'AVAILABLE' }))
  }

  function setItemCondition(id: string, condition: ItemCondition) {
    setItemConditions(prev => ({ ...prev, [id]: condition }))
  }

  const returningCount = Object.values(conditions).filter(Boolean).length

  async function submitReturn() {
    if (!pull || returningCount === 0) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const items = Object.entries(conditions)
        .filter((entry): entry is [string, ItemCondition] => !!entry[1])
        .map(([id, condition]) => ({ id, condition }))
      const res = await fetch('/api/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pullId: pull.id, items }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to process return')
      setFinalStage(data.stage)
      setMode('done')
    } catch (err) {
      setSubmitError(
        err instanceof Error && err.message
          ? err.message
          : 'Unable to process the return. Check your connection and try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setMode('search')
    setQuery('')
    setResults([])
    setSearchError(null)
    setPull(null)
    setClientName('')
    setItemConditions({})
    setSubmitError(null)
    setFinalStage(null)
  }

  if (mode === 'done') {
    return (
      <div className="step-content" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <CheckCircle2 size={48} color="var(--color-success)" aria-hidden="true" style={{ margin: '0 auto' }} />
        <h1 className="step-heading" style={{ marginTop: 'var(--space-3)' }}>Return Recorded</h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
          {returningCount} item{returningCount > 1 ? 's' : ''} checked in for {clientName}.
        </p>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
          {finalStage === 'RETURNED' ? 'All items returned — pull closed.' : 'Some items are still out on this pull.'}
        </p>
        <button className="btn btn-primary" onClick={onDone} style={{ width: '100%', marginTop: 'var(--space-6)' }}>
          Done
        </button>
      </div>
    )
  }

  if (mode === 'items' && pull) {
    return (
      <>
        <div className="step-content">
          <p className="section-label">Return</p>
          <h1 className="step-heading">{clientName}</h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 1.6 }}>
            Select the items being returned today.
          </p>

          <div
            role="group"
            aria-label="Items on this pull"
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}
          >
            {pull.items.map(item => {
              const alreadyBack = item.status !== 'OUT'
              const condition = conditions[item.id]
              const checked = !!condition
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }} key={item.id}>
                  <button
                    role="checkbox"
                    aria-checked={checked}
                    className="option-card"
                    onClick={() => toggleItem(item.id)}
                    disabled={alreadyBack}
                  >
                    <span className="option-card-label">{item.designer} — {item.itemType}</span>
                    <span className="option-card-sublabel">
                      {item.color}{alreadyBack ? ` · Already ${item.status.toLowerCase()}` : ''}
                    </span>
                  </button>

                  {checked && !alreadyBack && (
                    <div role="radiogroup" aria-label={`Condition for ${item.designer} ${item.itemType}`} style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      {(['AVAILABLE', 'DAMAGED', 'MISSING'] as ItemCondition[]).map(c => (
                        <button
                          key={c}
                          role="radio"
                          aria-checked={condition === c}
                          className="btn btn-ghost"
                          onClick={() => setItemCondition(item.id, c)}
                          style={{
                            flex: 1,
                            fontSize: 'var(--text-xs)',
                            padding: 'var(--space-2)',
                            border: condition === c ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                            color: condition === c ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                          }}
                        >
                          {CONDITION_LABELS[c]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {submitError && (
            <div className="alert alert-danger" role="alert" style={{ marginTop: 'var(--space-4)' }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
              <span>{submitError}</span>
            </div>
          )}
        </div>

        <div className="nav-bar">
          <button className="btn btn-ghost" onClick={reset}>← Back</button>
          <button
            className="btn btn-primary"
            onClick={submitReturn}
            disabled={submitting || returningCount === 0}
          >
            {submitting ? <Loader2 size={16} className="spin" aria-hidden="true" /> : null}
            {submitting ? 'Saving…' : 'Confirm Return'}
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="step-content">
        <p className="section-label">Return</p>
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
            aria-label="Search for client"
          />
        </div>

        {(searching || loadingPull) && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-3)' }}>
            <Loader2 size={14} className="spin" aria-hidden="true" style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {loadingPull ? 'Loading pull…' : 'Searching…'}
          </p>
        )}

        {!searching && query.trim() && results.length === 0 && !searchError && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)', textAlign: 'center' }}>
            No matches.
          </p>
        )}

        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            {results.map(r => (
              <button
                key={r.id}
                className="option-card"
                onClick={() => selectClient(r)}
                disabled={loadingPull}
              >
                <span className="option-card-label">{r.name.firstName} {r.name.lastName}</span>
                <span className="option-card-sublabel">{r.emails.primaryEmail}{r.phones?.primaryPhoneNumber ? ` · ${r.phones.primaryPhoneNumber}` : ''}</span>
              </button>
            ))}
          </div>
        )}

        {searchError && (
          <div className="alert alert-danger" role="alert" style={{ marginTop: 'var(--space-4)' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      <div className="nav-bar">
        <button className="btn btn-ghost" onClick={onDone}>← Back</button>
      </div>
    </>
  )
}
