export type StageVariant = 'out' | 'due-soon' | 'overdue' | 'signed' | 'pending'

export function stageToVariant(stage: string): StageVariant {
  switch (stage) {
    case 'DUE_SOON': return 'due-soon'
    case 'OVERDUE':  return 'overdue'
    default:         return 'out'
  }
}

export function stageToLabel(stage: string): string {
  switch (stage) {
    case 'OUT':      return 'Out'
    case 'DUE_SOON': return 'Due Soon'
    case 'OVERDUE':  return 'Overdue'
    case 'RETURNED': return 'Returned'
    case 'CLOSED':   return 'Closed'
    default:         return stage
  }
}

export function contractVariant(sent: boolean | null, signed: boolean | null): StageVariant {
  if (signed) return 'signed'
  if (sent)   return 'pending'
  return 'out'
}

export function contractLabel(sent: boolean | null, signed: boolean | null): string {
  if (signed) return 'Signed'
  if (sent)   return 'Awaiting Signature'
  return 'Not Issued'
}

export function microsToDollars(micros: number): string {
  return `$${(micros / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 0 })}`
}

export function formatSeason(season: string | null): string {
  if (!season) return ''
  // "SS_2024" → "SS 2024", "FW_2023" → "FW 2023"
  return season.replace('_', ' ')
}

export function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatMonthYear(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
