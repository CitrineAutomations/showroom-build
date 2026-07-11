'use client'

import { useState } from 'react'
import { formatSeason } from '@/lib/utils'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface Photo {
  fileId: string
  label: string
  extension: string
}

interface ItemCardProps {
  id: string
  itemId: string
  designer: string
  color: string | null
  season: string | null
  photo: Photo[]
}

export function ItemCard({ itemId, designer, color, season, photo }: ItemCardProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const firstPhoto = photo?.[0]
  const seasonDisplay = formatSeason(season)
  const photoCount = photo?.length ?? 0

  return (
    <>
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-4)',
          padding: 'var(--space-4)',
        }}
      >
        {/* Photo */}
        <button
          type="button"
          onClick={() => firstPhoto && setLightboxIndex(0)}
          disabled={!firstPhoto}
          aria-label={firstPhoto ? `View ${photoCount} photo${photoCount === 1 ? '' : 's'} of ${designer} ${itemId}` : undefined}
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            flexShrink: 0,
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)',
            padding: 0,
            position: 'relative',
            cursor: firstPhoto ? 'pointer' : 'default',
          }}
        >
          {firstPhoto ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/photo/${firstPhoto.fileId}`}
                alt={`${designer} ${itemId}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {photoCount > 1 && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    fontSize: '0.625rem',
                    fontWeight: 600,
                    color: '#fff',
                    background: 'rgba(0,0,0,0.65)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1px 4px',
                    lineHeight: 1.4,
                  }}
                >
                  +{photoCount - 1}
                </span>
              )}
            </>
          ) : (
            <div
              aria-hidden="true"
              style={{ width: '100%', height: '100%', background: 'var(--color-surface-raised)' }}
            />
          )}
        </button>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
            {designer}
          </div>
          {(color || seasonDisplay) && (
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              {[color, seasonDisplay].filter(Boolean).join(' · ')}
            </div>
          )}
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
            {itemId}
          </div>
        </div>
      </div>

      {lightboxIndex !== null && photo.length > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${designer} ${itemId} photos`}
          onClick={() => setLightboxIndex(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-6)',
          }}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 'var(--space-4)',
              right: 'var(--space-4)',
              color: '#fff',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 'var(--space-2)',
            }}
          >
            <X size={24} />
          </button>

          {photo.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIndex((i) => (i === null ? 0 : (i - 1 + photo.length) % photo.length))
              }}
              aria-label="Previous photo"
              style={{
                position: 'absolute',
                left: 'var(--space-4)',
                color: '#fff',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 'var(--space-2)',
              }}
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/photo/${photo[lightboxIndex].fileId}`}
            alt={`${designer} ${itemId} — photo ${lightboxIndex + 1} of ${photo.length}`}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
          />

          {photo.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIndex((i) => (i === null ? 0 : (i + 1) % photo.length))
              }}
              aria-label="Next photo"
              style={{
                position: 'absolute',
                right: 'var(--space-4)',
                color: '#fff',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 'var(--space-2)',
              }}
            >
              <ChevronRight size={28} />
            </button>
          )}

          {photo.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: 'var(--space-4)',
                color: 'var(--color-text-secondary)',
                fontSize: '0.75rem',
              }}
            >
              {lightboxIndex + 1} / {photo.length}
            </div>
          )}
        </div>
      )}
    </>
  )
}
