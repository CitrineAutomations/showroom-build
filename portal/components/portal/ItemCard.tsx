import { formatSeason } from '@/lib/utils'

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
  const firstPhoto = photo?.[0]
  const seasonDisplay = formatSeason(season)

  return (
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
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          flexShrink: 0,
          background: 'var(--color-surface-raised)',
          border: '1px solid var(--color-border)',
        }}
      >
        {firstPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/photo/${firstPhoto.fileId}`}
            alt={`${designer} ${itemId}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            aria-hidden="true"
            style={{ width: '100%', height: '100%', background: 'var(--color-surface-raised)' }}
          />
        )}
      </div>

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
  )
}
