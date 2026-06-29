import { Badge } from '@/components/ui/Badge'
import { daysUntil, formatDate, stageToVariant, stageToLabel } from '@/lib/utils'

interface ReturnDateCardProps {
  returnDate: string
  stage: string
}

export function ReturnDateCard({ returnDate, stage }: ReturnDateCardProps) {
  const days = daysUntil(returnDate)
  const variant = stageToVariant(stage)

  let urgencyText = ''
  let urgencyColor = 'var(--color-text-secondary)'

  if (days > 0) {
    urgencyText = `${days} day${days === 1 ? '' : 's'} remaining`
    if (days <= 2) urgencyColor = 'var(--color-warning)'
  } else if (days === 0) {
    urgencyText = 'Due today'
    urgencyColor = 'var(--color-warning)'
  } else {
    urgencyText = `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
    urgencyColor = 'var(--color-danger)'
  }

  const dateColor =
    stage === 'OVERDUE' ? 'var(--color-danger)'
    : stage === 'DUE_SOON' ? 'var(--color-warning)'
    : 'var(--color-text-primary)'

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="section-label">Return Date</span>
        <Badge variant={variant}>{stageToLabel(stage)}</Badge>
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 600, color: dateColor, lineHeight: 1.2 }}>
        {formatDate(returnDate)}
      </div>
      <div style={{ fontSize: '0.875rem', color: urgencyColor }}>
        {urgencyText}
      </div>
    </div>
  )
}
