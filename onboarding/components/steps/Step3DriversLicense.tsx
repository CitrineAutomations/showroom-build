'use client'

import { useRef, useState, useId } from 'react'
import { Camera, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react'

interface Props {
  existingPhotoUrls: string[]
  newFileIds: (string | null)[]
  onNewFileIds: (ids: (string | null)[]) => void
  onNext: (newFileIds: (string | null)[]) => void
  onBack: () => void
}

type Side = 'front' | 'back'
type UploadState = 'existing' | 'idle' | 'uploading' | 'done' | 'error'

interface SideState {
  uploadState: UploadState
  preview: string | null
  fileId: string | null
  error: string | null
}

const INITIAL_SIDE: SideState = { uploadState: 'idle', preview: null, fileId: null, error: null }

export default function Step3DriversLicense({ existingPhotoUrls, newFileIds, onNewFileIds, onNext, onBack }: Props) {
  const frontStateRef = useRef<SideState>(INITIAL_SIDE)
  const backStateRef = useRef<SideState>(INITIAL_SIDE)

  const [front, setFront] = useState<SideState>(() => {
    const initial = existingPhotoUrls[0]
      ? { uploadState: 'existing' as const, preview: existingPhotoUrls[0], fileId: null, error: null }
      : INITIAL_SIDE
    frontStateRef.current = initial
    return initial
  })
  const [back, setBack] = useState<SideState>(() => {
    const initial = existingPhotoUrls[1]
      ? { uploadState: 'existing' as const, preview: existingPhotoUrls[1], fileId: null, error: null }
      : INITIAL_SIDE
    backStateRef.current = initial
    return initial
  })
  const [liveMsg, setLiveMsg] = useState('')

  function patchSide(side: Side, patch: SideState) {
    if (side === 'front') {
      frontStateRef.current = patch
      setFront(patch)
    } else {
      backStateRef.current = patch
      setBack(patch)
    }
  }

  async function handleFile(side: Side, file: File) {
    patchSide(side, {
      uploadState: 'uploading',
      preview: URL.createObjectURL(file),
      fileId: null,
      error: null,
    })
    setLiveMsg(`Uploading ${side}…`)

    const form = new FormData()
    form.append('file', file)
    form.append('target', 'driversLicense')
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      const current = side === 'front' ? frontStateRef.current : backStateRef.current
      patchSide(side, {
        uploadState: 'done',
        preview: current.preview,
        fileId: data.fileId,
        error: null,
      })
      setLiveMsg(`${side === 'front' ? 'Front' : 'Back'} saved`)

      const newFrontId = side === 'front' ? data.fileId : frontStateRef.current.fileId
      const newBackId = side === 'back' ? data.fileId : backStateRef.current.fileId
      onNewFileIds([newFrontId, newBackId])
    } catch {
      patchSide(side, {
        uploadState: 'error',
        preview: null,
        fileId: null,
        error: 'Upload failed. Tap to retry.',
      })
      setLiveMsg('Upload failed')
    }
  }

  function retake(side: Side) {
    patchSide(side, INITIAL_SIDE)

    const newFrontId = side === 'front' ? null : frontStateRef.current.fileId
    const newBackId = side === 'back' ? null : backStateRef.current.fileId
    onNewFileIds([newFrontId, newBackId])
    setLiveMsg('')
  }

  const canProceed =
    (front.uploadState === 'done' || front.uploadState === 'existing') &&
    (back.uploadState === 'done' || back.uploadState === 'existing')

  return (
    <>
      <div className="step-content">
        <p className="section-label">Identification</p>
        <h1 className="step-heading">Driver's License</h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-5)', lineHeight: 1.6 }}>
          Photograph both sides of the license.
        </p>

        <span aria-live="polite" className="sr-only">{liveMsg}</span>

        {(front.uploadState === 'existing' || back.uploadState === 'existing') && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 1.6 }}>
            Driver's license already on file — retake if it's changed.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <SideSlot
            label="Front"
            state={front}
            onFile={f => handleFile('front', f)}
            onRetake={() => retake('front')}
          />
          <SideSlot
            label="Back"
            state={back}
            onFile={f => handleFile('back', f)}
            onRetake={() => retake('back')}
          />
        </div>

        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 'var(--space-4)' }}>
          Accepted: JPG, PNG, HEIC · Max 10 MB each
        </p>
      </div>

      <div className="nav-bar">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button
          className="btn btn-primary"
          onClick={() => onNext(newFileIds)}
          disabled={!canProceed}
          aria-disabled={!canProceed}
        >
          Next →
        </button>
      </div>
    </>
  )
}

interface SlotProps {
  label: string
  state: SideState
  onFile: (f: File) => void
  onRetake: () => void
}

function SideSlot({ label, state, onFile, onRetake }: SlotProps) {
  const inputId = useId()

  if (state.uploadState === 'idle' || state.uploadState === 'error') {
    return (
      <div>
        <p className="field-label" style={{ marginBottom: 'var(--space-2)' }}>{label}</p>
        <label
          htmlFor={inputId}
          className="upload-zone"
          style={{ minHeight: 120 }}
          aria-label={`Photograph license ${label.toLowerCase()}`}
        >
          <Camera size={24} color="var(--color-text-secondary)" aria-hidden="true" />
          <span className="section-label">Tap to Photograph {label}</span>
          <input
            id={inputId}
            type="file"
            accept="image/*,.heic"
            capture="environment"
            aria-label={`Photograph license ${label.toLowerCase()}`}
            className="file-input-hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }}
          />
        </label>
        {state.error && (
          <div className="alert alert-danger" role="alert" style={{ marginTop: 'var(--space-2)' }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} aria-hidden="true" />
            <span>{state.error}</span>
          </div>
        )}
      </div>
    )
  }

  if (state.uploadState === 'uploading') {
    return (
      <div>
        <p className="field-label" style={{ marginBottom: 'var(--space-2)' }}>{label}</p>
        <div className="upload-zone" style={{ minHeight: 120 }}>
          <Loader2 size={20} className="spin" color="var(--color-text-secondary)" aria-hidden="true" />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>Uploading…</span>
        </div>
      </div>
    )
  }

  // existing (already on file) or done (freshly uploaded)
  const isExisting = state.uploadState === 'existing'
  return (
    <div>
      <p className="field-label" style={{ marginBottom: 'var(--space-2)' }}>{label}</p>
      {state.preview ? (
        <img
          src={state.preview}
          alt={`License ${label.toLowerCase()} preview`}
          style={{
            width: '100%',
            aspectRatio: '16/9',
            objectFit: 'cover',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            display: 'block',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            minHeight: 80,
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckCircle2 size={20} color="var(--color-success)" aria-hidden="true" />
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-success)', fontSize: 'var(--text-sm)' }}>
          <CheckCircle2 size={14} aria-hidden="true" />
          <span>{isExisting ? 'On file' : 'Saved'}</span>
        </div>
        <button className="btn btn-ghost" onClick={onRetake} style={{ padding: '4px 10px', fontSize: 'var(--text-xs)' }}>
          <X size={12} aria-hidden="true" /> Retake
        </button>
      </div>
    </div>
  )
}
