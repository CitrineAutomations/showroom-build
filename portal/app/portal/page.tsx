import { fetchTwenty } from '@/lib/twenty'
import { GET_ACTIVE_PULL } from '@/lib/queries'
import { ReturnDateCard } from '@/components/portal/ReturnDateCard'
import { ContractCard } from '@/components/portal/ContractCard'
import { ItemCard } from '@/components/portal/ItemCard'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

// TODO: replace with session.contactId when Clerk auth is wired (Phase 4)
const DEMO_CLIENT_ID = '573f15e1-339c-4cf8-826b-ab0417c1832e'

interface PullNode {
  id: string
  name: string
  stage: string
  returnDate: string
  contractSent: boolean | null
  contractSigned: boolean | null
  client: {
    id: string
    name: { firstName: string; lastName: string }
    emails: { primaryEmail: string }
    phones?: { primaryPhoneNumber?: string }
  }
  items: {
    edges: Array<{
      node: {
        id: string
        itemId: string
        designer: string
        color: string | null
        season: string | null
        photo: Array<{ fileId: string; label: string; extension: string }>
      }
    }>
  }
}

interface PullsResponse {
  pulls: { edges: Array<{ node: PullNode }> }
}

export default async function DashboardPage() {
  let pull: PullNode | null = null
  let error: string | null = null

  try {
    const data = await fetchTwenty<PullsResponse>(GET_ACTIVE_PULL, {
      clientId: DEMO_CLIENT_ID,
    })
    pull = data.pulls.edges[0]?.node ?? null
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load pull data'
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="alert alert-danger">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (!pull) {
    return (
      <div className="page-content" style={{ textAlign: 'center', paddingTop: 'var(--space-16)' }}>
        <p style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '1.25rem', color: 'var(--color-text-secondary)' }}>
          No active pull.
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
          You don&apos;t currently have any items from the showroom.
        </p>
        <Link href="/portal/history" className="btn btn-ghost" style={{ marginTop: 'var(--space-6)' }}>
          View History
        </Link>
      </div>
    )
  }

  const items = pull.items.edges.map((e) => e.node)
  const clientName = `${pull.client.name.firstName} ${pull.client.name.lastName}`
  const isOverdue = pull.stage === 'OVERDUE'

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Pull header */}
      <div>
        <div className="section-label" style={{ marginBottom: 'var(--space-2)' }}>Your Pull</div>
        <h1
          style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
          }}
        >
          {pull.name}
        </h1>
      </div>

      {/* Overdue banner */}
      {isOverdue && (
        <div className="alert alert-danger">
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>Your pull is overdue.</strong> Please return items immediately or{' '}
            <Link href="/portal/return" style={{ color: 'inherit', textDecoration: 'underline' }}>
              contact your rep
            </Link>
            .
          </div>
        </div>
      )}

      {/* Return date + contract */}
      <ReturnDateCard returnDate={pull.returnDate} stage={pull.stage} />
      <ContractCard contractSent={pull.contractSent} contractSigned={pull.contractSigned} />

      <hr className="divider" />

      {/* Items */}
      <div>
        <div className="section-label" style={{ marginBottom: 'var(--space-4)' }}>
          Items Out ({items.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {items.map((item) => (
            <ItemCard key={item.id} {...item} />
          ))}
        </div>
      </div>

      <hr className="divider" />

      {/* Policy teaser */}
      <div className="alert alert-warning" style={{ alignItems: 'center' }}>
        <AlertTriangle size={16} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.875rem' }}>
          Damaged or unreturned items are subject to loan fees.{' '}
          <Link href="/portal/return" style={{ color: 'inherit', fontWeight: 600, textDecoration: 'underline' }}>
            View return policy →
          </Link>
        </span>
      </div>
    </div>
  )
}
