interface Props {
  current: number
  total: number
}

export default function StepIndicator({ current, total }: Props) {
  return (
    <div className="step-indicator-bar" role="status" aria-label={`Step ${current} of ${total}`}>
      <ol role="list" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', listStyle: 'none' }}>
        {Array.from({ length: total }, (_, i) => {
          const n = i + 1
          const state = n < current ? 'complete' : n === current ? 'current' : 'upcoming'
          return (
            <li
              key={n}
              role="listitem"
              aria-label={`Step ${n} ${state}`}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background:
                  state === 'upcoming'
                    ? 'var(--color-border-strong)'
                    : state === 'complete'
                    ? 'color-mix(in srgb, var(--color-accent) 40%, transparent)'
                    : 'var(--color-accent)',
                flexShrink: 0,
              }}
            />
          )
        })}
      </ol>
      <span className="section-label" style={{ marginLeft: 'var(--space-3)' }}>
        Step {current} of {total}
      </span>
    </div>
  )
}
