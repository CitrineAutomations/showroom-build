import { Badge } from '@/components/ui/Badge'
import { contractVariant, contractLabel } from '@/lib/utils'
import { FileCheck } from 'lucide-react'

interface ContractCardProps {
  contractSent: boolean | null
  contractSigned: boolean | null
}

export function ContractCard({ contractSent, contractSigned }: ContractCardProps) {
  const variant = contractVariant(contractSent, contractSigned)
  const label = contractLabel(contractSent, contractSigned)

  const subtext =
    contractSigned ? 'Sample loan agreement on file'
    : contractSent ? 'Check your email for the signing link'
    : 'Contract will be issued by your rep'

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <FileCheck size={16} style={{ color: 'var(--color-text-secondary)' }} />
          <span className="section-label">Contract</span>
        </div>
        <Badge variant={variant}>{label}</Badge>
      </div>
      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
        {subtext}
      </div>
    </div>
  )
}
