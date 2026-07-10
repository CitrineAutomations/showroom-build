'use client'

import { useEffect, useState } from 'react'
import { Search, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import type { ItemCondition } from '@/lib/twenty'

interface OpenPullListEntry {
  id: string
  returnDate: string
  stage: string
  client: {
    id: string
    name: { firstName: string; lastName: string }
    emails: { primaryEmail: string }
    phones: { primaryPhoneNumber: string } | null
  }
}

interface PullItem {
  loanId: string
  inventoryItemId: string
  itemId: string
  designer: string
  itemType: string
  color: string
  outcome: string | null
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
  LOST: 'Missing',
}

interface Props {
  onDone: () => void
}

type Mode = 'search' | 'items' | 'done'

export default function ReturnFlow({ onDone }: Props) {
  const [mode, setMode] = useState<Mode>('search')
  const [query, setQuery] = useState('')
  const [openPulls, setOpenPulls] = useState<OpenPullListEntry[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [loadingPull, setLoadingPull] = useState(false)
  const [pull, setPull] = useState<OpenPull | null>(null)
  const [clientName, setClientName] = useState('')
  const [conditions, setItemConditions] = useState<Record<string, ItemCondition | null>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [finalStage, setFinalStage] = useState<string | null>(null)

  async function loadOpenPulls() {
    setLoadingList(true)
    setSearchError(null)
    try {
      const res = await fetch('/api/return/open-pulls')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load open pulls')
      setOpenPulls(data.pulls)
    } catch (err) {
      setSearchError(
        err instanceof Error && err.message
          ? err.message
          : 'Unable to reach the CRM. Check your connection and try again.'
      )
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    loadOpenPulls()
  }, [])

  const q = query.trim().toLowerCase()
  const filteredPulls = q
    ? openPulls.filter(p => {
        const { firstName, lastName } = p.client.name
        return (
          `${firstName} ${lastName}`.toLowerCase().includes(q) ||
          p.client.emails.primaryEmail.toLowerCase().includes(q) ||
          (p.client.phones?.primaryPhoneNumber ?? '').toLowerCase().includes(q)
        )
      })
    : openPulls

  async function selectClient(entry: OpenPullListEntry) {
    setLoadingPull(true)
    setSearchError(null)
    try {
      const res = await fetch(`/api/return?contactId=${encodeURIComponent(entry.client.id)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Pull lookup failed')
      if (!data.pull) {
        setSearchError('No open pull found for this client.')
        return
      }
      if (data.pull.items.length === 0) {
        setSearchError('No items have been recorded for this pull yet.')
        return
      }
      if (data.pull.items.every((i: PullItem) => i.outcome !== null)) {
        setSearchError('All items on this client’s pull have already been returned.')
        return
      }
      setPull(data.pull)
      setClientName(`${entry.client.name.firstName} ${entry.client.name.lastName}`.trim())
      const initial: Record<string, ItemCondition | null> = {}
      for (const item of data.pull.items as PullItem[]) {
        initial[item.loanId] = item.outcome === null ? 'AVAILABLE' : null
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
        .map(([loanId, condition]) => {
          const item = pull.items.find(i => i.loanId === loanId)
          return { loanId, inventoryItemId: item?.inventoryItemId ?? '', condition }
        })
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
    setSearchError(null)
    setPull(null)
    setClientName('')
    setItemConditions({})
    setSubmitError(null)
    setFinalStage(null)
    loadOpenPulls()
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
              const alreadyBack = item.outcome !== null
              const condition = conditions[item.loanId]
              const checked = !!condition
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }} key={item.loanId}>
                  <button
                    role="checkbox"
                    aria-checked={checked}
                    className="option-card"
                    onClick={() => toggleItem(item.loanId)}
                    disabled={alreadyBack}
                  >
                    <span className="option-card-label">{item.designer} — {item.itemType}</span>
                    <span className="option-card-sublabel">
                      {item.color}{alreadyBack ? ` · Already ${item.outcome!.toLowerCase()}` : ''}
                    </span>
                  </button>

                  {checked && !alreadyBack && (
                    <div role="radiogroup" aria-label={`Condition for ${item.designer} ${item.itemType}`} style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      {(['AVAILABLE', 'DAMAGED', 'LOST'] as ItemCondition[]).map(c => (
                        <button
                          key={c}
                          role="radio"
                          aria-checked={condition === c}
                          className="btn btn-ghost"
                          onClick={() => setItemCondition(item.loanId, c)}
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
            placeholder="Search open pulls by name, email, or phone"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="field-input"
            style={{ paddingLeft: 36 }}
            aria-label="Search open pulls"
          />
        </div>

        {(loadingList || loadingPull) && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-3)' }}>
            <Loader2 size={14} className="spin" aria-hidden="true" style={{ marginRight: 6, verticalAlign: 'middle' }} />
            {loadingPull ? 'Loading pull…' : 'Loading open pulls…'}
          </p>
        )}

        {!loadingList && openPulls.length === 0 && !searchError && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)', textAlign: 'center' }}>
            No open pulls right now.
          </p>
        )}

        {!loadingList && openPulls.length > 0 && filteredPulls.length === 0 && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-4)', textAlign: 'center' }}>
            No open pulls match “{query.trim()}”.
          </p>
        )}

        {filteredPulls.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            {filteredPulls.map(p => (
              <button
                key={p.id}
                className="option-card"
                onClick={() => selectClient(p)}
                disabled={loadingPull}
              >
                <span className="option-card-label">{p.client.name.firstName} {p.client.name.lastName}</span>
                <span className="option-card-sublabel">
                  {p.stage} · returns {new Date(p.returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {p.client.phones?.primaryPhoneNumber ? ` · ${p.client.phones.primaryPhoneNumber}` : ''}
                </span>
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
