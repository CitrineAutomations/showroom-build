import type { StageVariant } from '@/lib/utils'

interface BadgeProps {
  variant: StageVariant
  children: React.ReactNode
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`badge badge-${variant}`}>
      {children}
    </span>
  )
}
