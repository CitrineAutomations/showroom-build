'use client'

import { useRef, useState, useId } from 'react'
import { Camera, Plus, X, Loader2, AlertCircle } from 'lucide-react'

interface PhotoItem {
  localId: string
  preview: string
  fileId: string | null
  state: 'uploading' | 'done' | 'error'
}

interface ExistingPhoto {
  id: string
  name: string
  url: string
}

interface Props {
  contactId: string | null
  pullId: string | null
  isResumedClient?: boolean
  existingPhotos?: ExistingPhoto[]
  onComplete: (photoFileIds: string[]) => void
  onBack: () => void
}

let localIdCounter = 0
function nextId() { return String(++localIdCounter) }

export default function Step5Photos({ contactId, pullId, isResumedClient, existingPhotos, onComplete, onBack }: Props) {
  const mainInputId = useId()
  const addMoreInputId = useId()
  const photosRef = useRef<PhotoItem[]>([])
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [apiError, setApiError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)
  const [liveMsg, setLiveMsg] = useState('')

  const MAX = 20

  async function uploadFile(file: File): Promise<string | null> {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    if (!res.ok) return null
    const data = await res.json()
    return data.fileId as string
  }

  async function handleFiles(files: FileList) {
    setUploadError(null)

    const slice = Array.from(files).slice(0, MAX - photosRef.current.length)
    const batch: { item: PhotoItem; file: File }[] = slice.map(file => ({
      file,
      item: {
        localId: nextId(),
        preview: URL.createObjectURL(file),
        fileId: null,
        state: 'uploading' as const,
      },
    }))

    if (batch.length === 0) return

    setPhotos(prev => {
      const next = [...prev, ...batch.map(entry => entry.item)]
      photosRef.current = next
      return next
    })
    setLiveMsg(`Uploading ${batch.length} photo${batch.length > 1 ? 's' : ''}…`)

    await Promise.all(batch.map(async ({ item, file }) => {
      const fileId = await uploadFile(file)
      setPhotos(prev => {
        const next = prev.map(p =>
          p.localId === item.localId ? { ...p, fileId, state: fileId ? 'done' as const : 'error' as const } : p,
        )
        photosRef.current = next
        return next
      })
      if (!fileId) setUploadError('One or more photos failed to upload. Remove and try again.')
    }))
    setLiveMsg('Upload complete')
  }

  function removePhoto(localId: string) {
    setPhotos(prev => {
      const next = prev.filter(p => p.localId !== localId)
      photosRef.current = next
      return next
    })
  }

  async function handleComplete() {
    const fileIds = photosRef.current.filter(p => p.state === 'done' && p.fileId).map(p => p.fileId!)
    setCompleting(true)
    setApiError(null)
    try {
      await fetch('/api/attach-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, pullId, fileIds }),
      })
    } catch {
      setApiError('Onboarding saved, but photos could not be attached. Check the CRM record manually.')
    } finally {
      setCompleting(false)
      onComplete(fileIds)
    }
  }

  const atMax = photos.length >= MAX

  return (
    <>
      <div className="step-content">
        <p className="section-label">Item Photos</p>
        <h1 className="step-heading">Condition Documentation</h1>

        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)', lineHeight: 1.6 }}>
          Photograph items before they leave the showroom.
        </p>

        {isResumedClient && existingPhotos && existingPhotos.length > 0 && (
          <>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)', lineHeight: 1.6 }}>
              Condition photos already on file — skip or add more if items have changed.
            </p>
            <div className="photo-grid" style={{ marginBottom: 'var(--space-4)' }}>
              {existingPhotos.map(photo => (
                <div key={photo.id} className="photo-thumb-wrap">
                  <img src={photo.url} alt={photo.name} />
                </div>
              ))}
            </div>
          </>
        )}

        {isResumedClient && (!existingPhotos || existingPhotos.length === 0) && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 1.6 }}>
            No condition photos on file yet.
          </p>
        )}

        <span aria-live="polite" className="sr-only">{liveMsg}</span>

        {photos.length === 0 ? (
          <label htmlFor={mainInputId} className="upload-zone" aria-label="Add item photos">
            <Camera size={32} color="var(--color-text-secondary)" aria-hidden="true" />
            <span className="section-label">Tap to Add Photos</span>
            <input
              id={mainInputId}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              aria-label="Add item photos"
              className="file-input-hidden"
              onChange={e => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = '' }}
            />
          </label>
        ) : (
          <div className="photo-grid">
            {photos.map((photo, idx) => (
              <div key={photo.localId} className="photo-thumb-wrap">
                <img src={photo.preview} alt={`Item photo ${idx + 1}`} />
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
                  onClick={() => removePhoto(photo.localId)}
                  aria-label={`Remove photo ${idx + 1}`}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            ))}

            {!atMax && (
              <label htmlFor={addMoreInputId} className="add-more-tile" aria-label="Add another photo">
                <Plus size={24} color="var(--color-text-secondary)" aria-hidden="true" />
                <input
                  id={addMoreInputId}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  aria-label="Add another photo"
                  className="file-input-hidden"
                  onChange={e => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = '' }}
                />
              </label>
            )}
          </div>
        )}

        {atMax && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-3)', textAlign: 'center' }}>
            20 photo limit reached
          </p>
        )}

        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-4)', textAlign: 'center' }}>
          Optional — skip if all items are already in inventory
        </p>

        {uploadError && (
          <div className="alert alert-danger" role="alert" style={{ marginTop: 'var(--space-4)' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
            <span>{uploadError}</span>
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
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button className="btn btn-primary" onClick={handleComplete} disabled={completing}>
          {completing ? <Loader2 size={16} className="spin" aria-hidden="true" /> : null}
          {completing ? 'Saving…' : 'Complete →'}
        </button>
      </div>
    </>
  )
}
