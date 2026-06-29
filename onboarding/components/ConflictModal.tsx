'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface Props {
  clientName: string
  onKeep: () => void
  onReplace: () => void
}

export default function ConflictModal({ clientName, onKeep, onReplace }: Props) {
  const keepRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    keepRef.current?.focus()
  }, [])

  const firstName = clientName.split(' ')[0] || clientName

  return (
    <div
      className="modal-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="conflict-title"
      aria-describedby="conflict-desc"
    >
      <motion.div
        className="modal-panel"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <p className="section-label" style={{ textAlign: 'center', marginBottom: 'var(--space-2)' }}>
          Payment on File
        </p>
        <h2
          id="conflict-title"
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 300,
            textAlign: 'center',
            marginBottom: 'var(--space-4)',
          }}
        >
          Card Already Saved
        </h2>
        <p
          id="conflict-desc"
          style={{
            fontSize: 'var(--text-base)',
            color: 'var(--color-text-secondary)',
            textAlign: 'center',
            marginBottom: 'var(--space-6)',
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: 'var(--color-text-primary)' }}>{firstName}</strong> has a payment
          method saved from a previous session. Keep the existing card or replace it with a new one?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <button ref={keepRef} className="btn btn-ghost" style={{ width: '100%' }} onClick={onKeep}>
            Keep Existing Card
          </button>
          <button className="btn btn-primary" style={{ width: '100%', flex: 'none' }} onClick={onReplace}>
            Replace Card
          </button>
        </div>
      </motion.div>
    </div>
  )
}
