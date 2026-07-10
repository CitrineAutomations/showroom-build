'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Check, AlertCircle } from 'lucide-react'
import type { FormData } from '@/app/page'

interface Props {
  formData: FormData
  onReset: () => void
}

const CLIENT_TYPE_LABELS: Record<string, string> = {
  RENTAL: 'Rental',
  PUBLIC_RELATIONS: 'Public Relations',
}

export default function SuccessScreen({ formData, onReset }: Props) {
  const resetBtnRef = useRef<HTMLButtonElement>(null)
  const [portalAccountFailed, setPortalAccountFailed] = useState(false)

  useEffect(() => {
    resetBtnRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!formData.contactId) return
    fetch('/api/portal-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactId: formData.contactId,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
      }),
    })
      .then(res => { if (!res.ok) setPortalAccountFailed(true) })
      .catch(() => setPortalAccountFailed(true))
  }, [formData.contactId, formData.email, formData.firstName, formData.lastName])

  useEffect(() => {
    if (!formData.pullId) return
    fetch('/api/pull/mark-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pullId: formData.pullId }),
    }).catch(() => {})
  }, [formData.pullId])

  const photoCount = formData.photoFileIds.length
  const clientTypeLabel = formData.clientType ? CLIENT_TYPE_LABELS[formData.clientType] : null
  const dlPhotoCount = Math.max(formData.dlFileIds.length, formData.existingLicensePhotoUrls.length)

  const rows: { label: string; show: boolean; muted?: boolean }[] = [
    { label: 'Contact in CRM', show: true },
    { label: 'Client type set', show: !!formData.clientType },
    { label: `ID photos saved (${dlPhotoCount}/2)`, show: dlPhotoCount > 0 },
    {
      label: formData.cardKept ? 'Existing card on file kept' : 'Card on file',
      show: !!(formData.stripeCustomerId),
    },
    {
      label: photoCount > 0
        ? `${photoCount} condition photo${photoCount > 1 ? 's' : ''} attached`
        : 'No condition photos',
      show: true,
      muted: photoCount === 0,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      role="status"
      style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--space-10) var(--page-padding-x) var(--space-16)' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.22 }}
        >
          <CheckCircle2 size={48} color="var(--color-success)" aria-hidden="true" />
        </motion.div>

        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 300, marginTop: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
          Client Added
        </h1>

        <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', color: 'var(--color-accent)', letterSpacing: '0.04em' }}>
          {formData.firstName} {formData.lastName}
        </p>
        {clientTypeLabel && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            {clientTypeLabel}
          </p>
        )}
      </div>

      <hr className="divider" style={{ margin: 'var(--space-8) 0' }} />

      <p className="section-label" style={{ marginBottom: 'var(--space-3)' }}>What Was Saved</p>

      <div className="card" style={{ padding: 'var(--space-4) var(--space-6)' }}>
        {rows.filter(r => r.show).map(row => (
          <div
            key={row.label}
            className="success-row"
            style={{ color: row.muted ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}
          >
            <Check
              size={16}
              aria-hidden="true"
              color={row.muted ? 'var(--color-text-muted)' : 'var(--color-success)'}
              style={{ flexShrink: 0 }}
            />
            <span>{row.label}</span>
          </div>
        ))}
      </div>

      {portalAccountFailed && (
        <p
          role="status"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-2)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
            marginTop: 'var(--space-4)',
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
          <span>Portal access will be set up shortly. No action needed.</span>
        </p>
      )}

      <button
        ref={resetBtnRef}
        className="btn btn-primary"
        onClick={onReset}
        style={{ width: '100%', marginTop: 'var(--space-6)' }}
      >
        Start New Client
      </button>
    </motion.div>
  )
}
