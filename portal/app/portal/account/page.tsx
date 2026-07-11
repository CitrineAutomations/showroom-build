import { fetchTwenty } from '@/lib/twenty'
import { GET_ACTIVE_PULL } from '@/lib/queries'
import { Mail, Phone, LogOut } from 'lucide-react'
import Link from 'next/link'

const DEMO_CLIENT_ID = '573f15e1-339c-4cf8-826b-ab0417c1832e'

interface AccountPullResponse {
  pulls: {
    edges: Array<{
      node: {
        client: {
          name: { firstName: string; lastName: string }
          emails: { primaryEmail: string }
          phones?: { primaryPhoneNumber?: string }
        }
      }
    }>
  }
}

export default async function AccountPage() {
  let client: AccountPullResponse['pulls']['edges'][0]['node']['client'] | null = null

  try {
    const data = await fetchTwenty<AccountPullResponse>(GET_ACTIVE_PULL, {
      clientId: DEMO_CLIENT_ID,
    })
    client = data.pulls.edges[0]?.node?.client ?? null
  } catch {
    // silently fall through to empty state
  }

  const fullName = client
    ? `${client.name.firstName} ${client.name.lastName}`
    : 'Client'

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <div className="section-label" style={{ marginBottom: 'var(--space-2)' }}>Account</div>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-cormorant, serif)',
            fontSize: '1.5rem',
            fontWeight: 400,
            color: 'var(--color-text-primary)',
          }}
        >
          {fullName}
        </h1>
      </div>

      {/* Contact details */}
      {client && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="section-label">Contact Details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 2 }}>Email</div>
              <div style={{ color: 'var(--color-text-primary)' }}>{client.emails.primaryEmail}</div>
            </div>
            {client.phones?.primaryPhoneNumber && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 2 }}>Phone</div>
                <div style={{ color: 'var(--color-text-primary)' }}>{client.phones.primaryPhoneNumber}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rep contact */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="section-label">Your Rep</div>
        <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
          Division PR Showroom
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <a
            href="mailto:studio@divisionpr.com"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-accent)', fontSize: '0.9375rem', textDecoration: 'none' }}
          >
            <Mail size={15} />
            studio@divisionpr.com
          </a>
          <a
            href="tel:+13105550100"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-accent)', fontSize: '0.9375rem', textDecoration: 'none' }}
          >
            <Phone size={15} />
            +1 (310) 555-0100
          </a>
        </div>
      </div>

      <hr className="divider" />

      {/* Sign out (demo) */}
      <Link
        href="/login"
        className="btn btn-ghost"
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', justifyContent: 'center' }}
      >
        <LogOut size={16} />
        Sign Out
      </Link>
    </div>
  )
}
