'use client'

import type { ClientType } from '@/app/page'

interface Props {
  selected: ClientType | null
  onSelect: (ct: ClientType) => void
  onNext: () => void
  onBack: () => void
}

const OPTIONS: { value: ClientType; label: string; sublabel: string }[] = [
  { value: 'RENTAL',           label: 'Rental',           sublabel: 'Items rented to client' },
  { value: 'PUBLIC_RELATIONS', label: 'Public Relations', sublabel: 'PR samples and pulls' },
]

export default function Step2ClientType({ selected, onSelect, onNext, onBack }: Props) {
  return (
    <>
      <div className="step-content">
        <p className="section-label">Client Type</p>
        <h1 className="step-heading">Select Account Type</h1>

        <div
          role="radiogroup"
          aria-labelledby="client-type-heading"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
        >
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              role="radio"
              aria-checked={selected === opt.value}
              className="option-card"
              onClick={() => onSelect(opt.value)}
            >
              <span className="option-card-label">{opt.label}</span>
              <span className="option-card-sublabel">{opt.sublabel}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="nav-bar">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button
          className="btn btn-primary"
          onClick={onNext}
          disabled={!selected}
          aria-disabled={!selected}
        >
          Next →
        </button>
      </div>
    </>
  )
}
