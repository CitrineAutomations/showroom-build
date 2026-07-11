'use client'

import { useRef, useState, useId, useEffect } from 'react'
import { Camera, Plus, X, Loader2, AlertCircle, Search, CheckCircle2 } from 'lucide-react'

interface Props {
  pullId: string | null
  onComplete: (photoFileIds: string[]) => void
  onBack: () => void
}

interface PhotoItem {
  localId: string
  preview: string
  fileId: string | null
  state: 'uploading' | 'done' | 'error'
}

interface SearchResult {
  id: string
  designer: string
  color: string
  itemType: string | null
  status: string
  lastRentedAt: string | null
  lastOutcome: string | null
}

interface ItemCard {
  localId: string
  mode: 'new' | 'existing'
  selectedItem: SearchResult | null
  searchQuery: string
  searchResults: SearchResult[]
  searching: boolean
  designer: string
  color: string
  itemType: string
  itemTypeOther: boolean
  conditionNotes: string
  photos: PhotoItem[]
  errors: { designer?: string; color?: string; itemType?: string }
}

const FALLBACK_ITEM_TYPES = [
  { label: 'Dress', value: 'DRESS' },
  { label: 'Mini Dress', value: 'MINI_DRESS' },
  { label: 'Maxi Dress', value: 'MAXI_DRESS' },
  { label: 'Top', value: 'TOP' },
  { label: 'Pants', value: 'PANTS' },
  { label: 'Jacket', value: 'JACKET' },
  { label: 'Coat', value: 'COAT' },
  { label: 'Skirt', value: 'SKIRT' },
  { label: 'Bag', value: 'BAG' },
  { label: 'Shoes', value: 'SHOES' },
  { label: 'Accessory', value: 'ACCESSORY' },
]

const MAX_ITEMS = 20

let localIdCounter = 0
function nextId() { return String(++localIdCounter) }

function emptyCard(): ItemCard {
  return {
    localId: nextId(),
    mode: 'new',
    selectedItem: null,
    searchQuery: '',
    searchResults: [],
    searching: false,
    designer: '',
    color: '',
    itemType: '',
    itemTypeOther: false,
    conditionNotes: '',
    photos: [],
    errors: {},
  }
}

function formatLastRented(item: SearchResult): string {
  if (!item.lastRentedAt) return 'Never rented'
  const date = new Date(item.lastRentedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const condition = item.lastOutcome ? item.lastOutcome.charAt(0) + item.lastOutcome.slice(1).toLowerCase() : 'Unknown'
  return `Last rented ${date} · ${condition}`
}

export default function Step4cItemEntry({ pullId, onComplete, onBack }: Props) {
  const cardsRef = useRef<ItemCard[]>([emptyCard()])
  const [cards, setCards] = useState<ItemCard[]>(cardsRef.current)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [itemTypes, setItemTypes] = useState(FALLBACK_ITEM_TYPES)
  const searchTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    let cancelled = false
    fetch('/api/item-types')
      .then(res => res.json())
      .then(data => {
        if (cancelled) return
        if (Array.isArray(data.options) && data.options.length > 0) setItemTypes(data.options)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  function updateCards(next: ItemCard[]) {
    cardsRef.current = next
    setCards(next)
  }

  function patchCard(localId: string, patch: Partial<ItemCard>) {
    updateCards(cardsRef.current.map(c => (c.localId === localId ? { ...c, ...patch } : c)))
  }

  function addCard() {
    if (cardsRef.current.length >= MAX_ITEMS) return
    updateCards([...cardsRef.current, emptyCard()])
  }

  function removeCard(localId: string) {
    if (cardsRef.current.length <= 1) return
    const timer = searchTimers.current[localId]
    if (timer) clearTimeout(timer)
    updateCards(cardsRef.current.filter(c => c.localId !== localId))
  }

  async function runSearch(localId: string, query: string) {
    patchCard(localId, { searching: true })
    try {
      const res = await fetch(`/api/inventory-search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      const current = cardsRef.current.find(c => c.localId === localId)
      if (!current) return
      patchCard(localId, { searchResults: Array.isArray(data.results) ? data.results : [], searching: false })
    } catch {
      patchCard(localId, { searchResults: [], searching: false })
    }
  }

  function handleSearchChange(localId: string, query: string) {
    patchCard(localId, { searchQuery: query, selectedItem: null })
    const existingTimer = searchTimers.current[localId]
    if (existingTimer) clearTimeout(existingTimer)
    if (!query.trim()) {
      patchCard(localId, { searchResults: [] })
      return
    }
    searchTimers.current[localId] = setTimeout(() => runSearch(localId, query.trim()), 300)
  }

  function selectItem(localId: string, item: SearchResult) {
    patchCard(localId, { selectedItem: item, searchResults: [] })
  }

  function switchToCreateNew(localId: string) {
    patchCard(localId, { mode: 'new', selectedItem: null, searchResults: [] })
  }

  function switchToSearch(localId: string) {
    patchCard(localId, { mode: 'existing', selectedItem: null, designer: '', color: '', itemType: '', itemTypeOther: false, errors: {} })
  }

  async function uploadFile(file: File): Promise<string | null> {
    const form = new FormData()
    form.append('file', file)
    form.append('target', 'pullItemLoanPhotos')
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    if (!res.ok) return null
    const data = await res.json()
    return data.fileId as string
  }

  async function handleFiles(cardLocalId: string, files: FileList) {
    const card = cardsRef.current.find(c => c.localId === cardLocalId)
    if (!card) return

    const batch = Array.from(files).map(file => ({
      file,
      item: {
        localId: nextId(),
        preview: URL.createObjectURL(file),
        fileId: null,
        state: 'uploading' as const,
      },
    }))
    if (batch.length === 0) return

    patchCard(cardLocalId, { photos: [...card.photos, ...batch.map(b => b.item)] })

    await Promise.all(batch.map(async ({ item, file }) => {
      const fileId = await uploadFile(file)
      const current = cardsRef.current.find(c => c.localId === cardLocalId)
      if (!current) return
      patchCard(cardLocalId, {
        photos: current.photos.map(p =>
          p.localId === item.localId ? { ...p, fileId, state: fileId ? 'done' as const : 'error' as const } : p
        ),
      })
    }))
  }

  function removePhoto(cardLocalId: string, photoLocalId: string) {
    const card = cardsRef.current.find(c => c.localId === cardLocalId)
    if (!card) return
    patchCard(cardLocalId, { photos: card.photos.filter(p => p.localId !== photoLocalId) })
  }

  function isCardFilled(card: ItemCard): boolean {
    if (card.mode === 'existing') return !!card.selectedItem
    return !!card.designer.trim() && !!card.color.trim() && !!card.itemType.trim()
  }

  const hasAtLeastOneItem = cards.some(isCardFilled)
  const atMaxItems = cards.length >= MAX_ITEMS

  function validate(): boolean {
    let valid = true
    const next = cardsRef.current.map(card => {
      if (card.mode === 'existing') {
        if (!card.selectedItem) valid = false
        return card
      }
      const errors: ItemCard['errors'] = {}
      if (!card.designer.trim()) errors.designer = 'Designer is required.'
      if (!card.color.trim()) errors.color = 'Color is required.'
      if (!card.itemType.trim()) errors.itemType = 'Item type is required.'
      if (Object.keys(errors).length > 0) valid = false
      return { ...card, errors }
    })
    updateCards(next)
    return valid
  }

  async function handleNext() {
    if (!pullId || submitting) return
    if (!hasAtLeastOneItem) {
      setSubmitError('Add at least one item.')
      return
    }
    if (!validate()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const submittedCards = cardsRef.current
      const items = submittedCards.map(card => {
        const fileIds = card.photos.filter(p => p.state === 'done' && p.fileId).map(p => p.fileId!)
        if (card.mode === 'existing' && card.selectedItem) {
          return {
            mode: 'existing' as const,
            inventoryItemId: card.selectedItem.id,
            conditionNotes: card.conditionNotes.trim() || undefined,
            fileIds,
          }
        }
        return {
          mode: 'new' as const,
          designer: card.designer.trim(),
          color: card.color.trim(),
          itemType: card.itemType.trim(),
          conditionNotes: card.conditionNotes.trim() || undefined,
          fileIds,
        }
      })
      const res = await fetch('/api/pull-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pullId, items }),
      })
      const data = await res.json()
      if (!res.ok) {
        const savedCount = Array.isArray(data.createdLoanIds) ? data.createdLoanIds.length : 0
        if (savedCount > 0) {
          // Drop the cards that already succeeded (matched against the snapshot
          // that was actually submitted, not any later edits) so retry doesn't
          // resubmit their fileIds — Twenty rejects re-linking a file already
          // attached to the loan created for that card.
          const succeededIds = new Set(submittedCards.slice(0, savedCount).map(c => c.localId))
          updateCards(cardsRef.current.filter(c => !succeededIds.has(c.localId)))
        }
        const prefix = savedCount > 0 ? `${savedCount} item${savedCount > 1 ? 's' : ''} already saved — retry the rest. ` : ''
        throw new Error(`${prefix}${data.error || 'Failed to save items'}`)
      }
      const photoFileIds = items.flatMap(item => item.fileIds)
      onComplete(photoFileIds)
    } catch (err) {
      setSubmitError(err instanceof Error && err.message ? err.message : 'Unable to save items. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    return () => {
      Object.values(searchTimers.current).forEach(clearTimeout)
    }
  }, [])

  return (
    <>
      <div className="step-content">
        <p className="section-label">Pull Items</p>
        <h1 className="step-heading">Items Being Pulled</h1>

        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)', lineHeight: 1.6 }}>
          Search the catalog for items already on file, or add a new one.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {cards.map((card, idx) => (
            <ItemCardEditor
              key={card.localId}
              index={idx}
              card={card}
              itemTypes={itemTypes}
              canRemove={cards.length > 1 && !submitting}
              onSearchChange={q => handleSearchChange(card.localId, q)}
              onSelectItem={item => selectItem(card.localId, item)}
              onSwitchToCreateNew={() => switchToCreateNew(card.localId)}
              onSwitchToSearch={() => switchToSearch(card.localId)}
              onChange={patch => patchCard(card.localId, patch)}
              onRemove={() => removeCard(card.localId)}
              onFiles={files => handleFiles(card.localId, files)}
              onRemovePhoto={photoLocalId => removePhoto(card.localId, photoLocalId)}
            />
          ))}
        </div>

        <button
          className="btn btn-ghost"
          onClick={addCard}
          disabled={submitting || atMaxItems}
          style={{ marginTop: 'var(--space-5)', width: '100%', justifyContent: 'center' }}
        >
          <Plus size={16} aria-hidden="true" /> Add Another Item
        </button>
        {atMaxItems && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 'var(--space-2)' }}>
            {MAX_ITEMS} item limit reached
          </p>
        )}

        {submitError && (
          <div className="alert alert-danger" role="alert" style={{ marginTop: 'var(--space-4)' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}
      </div>

      <div className="nav-bar">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button
          className="btn btn-primary"
          onClick={handleNext}
          disabled={submitting || !hasAtLeastOneItem}
          aria-disabled={submitting || !hasAtLeastOneItem}
        >
          {submitting ? <Loader2 size={16} className="spin" aria-hidden="true" /> : null}
          {submitting ? 'Saving…' : 'Next →'}
        </button>
      </div>
    </>
  )
}

interface ItemCardEditorProps {
  index: number
  card: ItemCard
  itemTypes: { label: string; value: string }[]
  canRemove: boolean
  onSearchChange: (query: string) => void
  onSelectItem: (item: SearchResult) => void
  onSwitchToCreateNew: () => void
  onSwitchToSearch: () => void
  onChange: (patch: Partial<ItemCard>) => void
  onRemove: () => void
  onFiles: (files: FileList) => void
  onRemovePhoto: (photoLocalId: string) => void
}

function ItemCardEditor({
  index, card, itemTypes, canRemove,
  onSearchChange, onSelectItem, onSwitchToCreateNew, onSwitchToSearch,
  onChange, onRemove, onFiles, onRemovePhoto,
}: ItemCardEditorProps) {
  const inputId = useId()
  const addMoreId = useId()
  const searchId = useId()

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
        <p className="section-label">Item {index + 1}</p>
        {canRemove && (
          <button className="btn btn-ghost" onClick={onRemove} style={{ padding: '4px 10px', fontSize: 'var(--text-xs)' }}>
            <X size={12} aria-hidden="true" /> Remove
          </button>
        )}
      </div>

      {card.mode === 'existing' && !card.selectedItem && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div>
            <label htmlFor={searchId} className="field-label">Search catalog</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} aria-hidden="true" />
              <input
                id={searchId}
                type="text"
                placeholder="Designer, color, or item ID…"
                value={card.searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                className="field-input"
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>

          {card.searching && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              <Loader2 size={14} className="spin" aria-hidden="true" /> Searching…
            </div>
          )}

          {!card.searching && card.searchQuery.trim() && card.searchResults.length === 0 && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              No matches found.
            </p>
          )}

          {card.searchResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {card.searchResults.map(result => (
                <button
                  key={result.id}
                  onClick={() => onSelectItem(result)}
                  className="btn btn-ghost"
                  style={{ justifyContent: 'flex-start', textAlign: 'left', height: 'auto', padding: 'var(--space-3)', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}
                >
                  <span style={{ fontWeight: 600 }}>{result.designer} — {result.color}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{formatLastRented(result)}</span>
                </button>
              ))}
            </div>
          )}

          <button className="btn btn-ghost" onClick={onSwitchToCreateNew} style={{ fontSize: 'var(--text-sm)' }}>
            <Plus size={14} aria-hidden="true" /> Item not found — create new
          </button>
        </div>
      )}

      {card.mode === 'existing' && card.selectedItem && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div className="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <CheckCircle2 size={16} color="var(--color-success)" aria-hidden="true" />
              <div>
                <p style={{ fontWeight: 600 }}>{card.selectedItem.designer} — {card.selectedItem.color}</p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{formatLastRented(card.selectedItem)}</p>
              </div>
            </div>
            <button className="btn btn-ghost" onClick={onSwitchToSearch} style={{ padding: '4px 10px', fontSize: 'var(--text-xs)' }}>
              Change
            </button>
          </div>
        </div>
      )}

      {card.mode === 'new' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost" onClick={onSwitchToSearch} style={{ fontSize: 'var(--text-sm)', alignSelf: 'flex-start' }}>
            <Search size={14} aria-hidden="true" /> Search catalog instead
          </button>

          <div>
            <label className="field-label">Designer</label>
            <input
              type="text"
              value={card.designer}
              onChange={e => onChange({ designer: e.target.value, errors: { ...card.errors, designer: undefined } })}
              className={`field-input${card.errors.designer ? ' error' : ''}`}
              aria-invalid={!!card.errors.designer}
            />
            {card.errors.designer && <p className="field-error" role="alert">{card.errors.designer}</p>}
          </div>

          <div>
            <label className="field-label">Color</label>
            <input
              type="text"
              value={card.color}
              onChange={e => onChange({ color: e.target.value, errors: { ...card.errors, color: undefined } })}
              className={`field-input${card.errors.color ? ' error' : ''}`}
              aria-invalid={!!card.errors.color}
            />
            {card.errors.color && <p className="field-error" role="alert">{card.errors.color}</p>}
          </div>

          <div>
            <label className="field-label">Item Type</label>
            {!card.itemTypeOther ? (
              <select
                value={card.itemType}
                onChange={e => {
                  if (e.target.value === '__other__') {
                    onChange({ itemType: '', itemTypeOther: true, errors: { ...card.errors, itemType: undefined } })
                  } else {
                    onChange({ itemType: e.target.value, errors: { ...card.errors, itemType: undefined } })
                  }
                }}
                className={`field-input${card.errors.itemType ? ' error' : ''}`}
                aria-invalid={!!card.errors.itemType}
              >
                <option value="">Select type…</option>
                {itemTypes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
                <option value="__other__">Other…</option>
              </select>
            ) : (
              <>
                <input
                  type="text"
                  value={card.itemType}
                  onChange={e => onChange({ itemType: e.target.value, errors: { ...card.errors, itemType: undefined } })}
                  placeholder="Enter item type…"
                  className={`field-input${card.errors.itemType ? ' error' : ''}`}
                  aria-invalid={!!card.errors.itemType}
                  aria-label="Custom item type"
                  autoFocus
                />
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => onChange({ itemType: '', itemTypeOther: false, errors: { ...card.errors, itemType: undefined } })}
                  style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-2)' }}
                >
                  ← Choose from list instead
                </button>
              </>
            )}
            {card.errors.itemType && <p className="field-error" role="alert">{card.errors.itemType}</p>}
          </div>
        </div>
      )}

      {(card.mode === 'new' || card.selectedItem) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
          <div>
            <label className="field-label">Condition Notes <span style={{ opacity: 0.6 }}>(optional)</span></label>
            <textarea
              value={card.conditionNotes}
              onChange={e => onChange({ conditionNotes: e.target.value })}
              className="field-input"
              rows={2}
            />
          </div>

          <div>
            <label className="field-label">Photos</label>
            {card.photos.length === 0 ? (
              <label htmlFor={inputId} className="upload-zone" aria-label={`Add photos for item ${index + 1}`}>
                <Camera size={24} color="var(--color-text-secondary)" aria-hidden="true" />
                <span className="section-label">Tap to Add Photos</span>
                <input
                  id={inputId}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  className="file-input-hidden"
                  onChange={e => { if (e.target.files?.length) onFiles(e.target.files); e.target.value = '' }}
                />
              </label>
            ) : (
              <div className="photo-grid">
                {card.photos.map((photo, pIdx) => (
                  <div key={photo.localId} className="photo-thumb-wrap">
                    <img src={photo.preview} alt={`Item ${index + 1} photo ${pIdx + 1}`} />
                    {photo.state === 'uploading' && (
                      <div className="photo-uploading-overlay">
                        <Loader2 size={20} className="spin" color="var(--color-text-primary)" aria-hidden="true" />
                      </div>
                    )}
                    {photo.state === 'error' && (
                      <div className="photo-uploading-overlay" style={{ background: 'rgba(192,57,43,0.6)' }}>
                        <AlertCircle size={20} color="white" aria-hidden="true" />
                      </div>
                    )}
                    <button
                      className="photo-remove-btn"
                      onClick={() => onRemovePhoto(photo.localId)}
                      aria-label={`Remove photo ${pIdx + 1}`}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                ))}
                <label htmlFor={addMoreId} className="add-more-tile" aria-label="Add another photo">
                  <Plus size={24} color="var(--color-text-secondary)" aria-hidden="true" />
                  <input
                    id={addMoreId}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="file-input-hidden"
                    onChange={e => { if (e.target.files?.length) onFiles(e.target.files); e.target.value = '' }}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
