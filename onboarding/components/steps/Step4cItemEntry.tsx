'use client'

import { useRef, useState, useId } from 'react'
import { Camera, Plus, X, Loader2, AlertCircle } from 'lucide-react'

interface Props {
  pullId: string | null
  onComplete: () => void
  onBack: () => void
}

interface PhotoItem {
  localId: string
  preview: string
  fileId: string | null
  state: 'uploading' | 'done' | 'error'
}

interface ItemCard {
  localId: string
  designer: string
  color: string
  itemType: string
  photos: PhotoItem[]
  errors: { designer?: string; color?: string; itemType?: string }
}

const ITEM_TYPES = [
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

let localIdCounter = 0
function nextId() { return String(++localIdCounter) }

function emptyCard(): ItemCard {
  return { localId: nextId(), designer: '', color: '', itemType: '', photos: [], errors: {} }
}

export default function Step4cItemEntry({ pullId, onComplete, onBack }: Props) {
  const cardsRef = useRef<ItemCard[]>([emptyCard()])
  const [cards, setCards] = useState<ItemCard[]>(cardsRef.current)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function updateCards(next: ItemCard[]) {
    cardsRef.current = next
    setCards(next)
  }

  function patchCard(localId: string, patch: Partial<ItemCard>) {
    updateCards(cardsRef.current.map(c => (c.localId === localId ? { ...c, ...patch } : c)))
  }

  function addCard() {
    updateCards([...cardsRef.current, emptyCard()])
  }

  function removeCard(localId: string) {
    if (cardsRef.current.length <= 1) return
    updateCards(cardsRef.current.filter(c => c.localId !== localId))
  }

  async function uploadFile(file: File): Promise<string | null> {
    const form = new FormData()
    form.append('file', file)
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
    return !!card.designer.trim() && !!card.color.trim() && !!card.itemType
  }

  const hasAtLeastOneItem = cards.some(isCardFilled)

  function validate(): boolean {
    let valid = true
    const next = cardsRef.current.map(card => {
      const errors: ItemCard['errors'] = {}
      if (!card.designer.trim()) errors.designer = 'Designer is required.'
      if (!card.color.trim()) errors.color = 'Color is required.'
      if (!card.itemType) errors.itemType = 'Item type is required.'
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
      const items = cardsRef.current.map(card => ({
        designer: card.designer.trim(),
        color: card.color.trim(),
        itemType: card.itemType,
        fileIds: card.photos.filter(p => p.state === 'done' && p.fileId).map(p => p.fileId!),
      }))
      const res = await fetch('/api/pull-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pullId, items }),
      })
      const data = await res.json()
      if (!res.ok) {
        const savedCount = Array.isArray(data.createdItemIds) ? data.createdItemIds.length : 0
        const prefix = savedCount > 0 ? `${savedCount} item${savedCount > 1 ? 's' : ''} saved. ` : ''
        throw new Error(`${prefix}${data.error || 'Failed to save items'}`)
      }
      onComplete()
    } catch (err) {
      setSubmitError(err instanceof Error && err.message ? err.message : 'Unable to save items. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="step-content">
        <p className="section-label">Pull Items</p>
        <h1 className="step-heading">Items Being Pulled</h1>

        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)', lineHeight: 1.6 }}>
          Add each item being pulled, with photos of its current condition.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {cards.map((card, idx) => (
            <ItemCardEditor
              key={card.localId}
              index={idx}
              card={card}
              canRemove={cards.length > 1 && !submitting}
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
          disabled={submitting}
          style={{ marginTop: 'var(--space-5)', width: '100%', justifyContent: 'center' }}
        >
          <Plus size={16} aria-hidden="true" /> Add Another Item
        </button>

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
  canRemove: boolean
  onChange: (patch: Partial<ItemCard>) => void
  onRemove: () => void
  onFiles: (files: FileList) => void
  onRemovePhoto: (photoLocalId: string) => void
}

function ItemCardEditor({ index, card, canRemove, onChange, onRemove, onFiles, onRemovePhoto }: ItemCardEditorProps) {
  const inputId = useId()
  const addMoreId = useId()

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
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
          <select
            value={card.itemType}
            onChange={e => onChange({ itemType: e.target.value, errors: { ...card.errors, itemType: undefined } })}
            className={`field-input${card.errors.itemType ? ' error' : ''}`}
            aria-invalid={!!card.errors.itemType}
          >
            <option value="">Select type…</option>
            {ITEM_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {card.errors.itemType && <p className="field-error" role="alert">{card.errors.itemType}</p>}
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
    </div>
  )
}
