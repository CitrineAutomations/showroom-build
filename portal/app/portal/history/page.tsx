import { fetchTwenty } from '@/lib/twenty'
import { GET_CLOSED_PULLS } from '@/lib/queries'
import { formatMonthYear } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { AlertTriangle } from 'lucide-react'

const DEMO_CLIENT_ID = '573f15e1-339c-4cf8-826b-ab0417c1832e'

interface ClosedPull {
  id: string
  name: string
  createdAt: string
  coverageEvent: string | null
  coveragePlatform: string | null
  creditGiven: boolean | null
  items: { totalCount: number }
}

interface ClosedPullsResponse {
  pulls: {
    edges: Array<{ node: ClosedPull }>
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
  }
}

export default async function HistoryPage() {
  let pulls: ClosedPull[] = []
  let error: string | null = null

  try {
    const data = await fetchTwenty<ClosedPullsResponse>(GET_CLOSED_PULLS, {
      clientId: DEMO_CLIENT_ID,
    })
    pulls = data.pulls.edges.map((e) => e.node)
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load history'
  }

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <div className="section-label" style={{ marginBottom: 'var(--space-2)' }}>Pull History</div>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-cormorant, serif)',
            fontSize: '1.5rem',
            fontWeight: 400,
            color: 'var(--color-text-primary)',
          }}
        >
          Past pulls
        </h1>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {!error && pulls.length === 0 && (
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
          No past pulls on record.
        </p>
      )}

      {pulls.map((pull) => (
        <div key={pull.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              {formatMonthYear(pull.createdAt)} · {pull.items.totalCount} item{pull.items.totalCount === 1 ? '' : 's'}
            </span>
            {pull.creditGiven && (
              <Badge variant="signed">Credited</Badge>
            )}
          </div>
          {pull.coverageEvent && (
            <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {pull.coverageEvent}
            </div>
          )}
          {pull.coveragePlatform && (
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              {pull.coveragePlatform}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
