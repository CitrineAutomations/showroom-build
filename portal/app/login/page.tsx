import Link from 'next/link'

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 400,
          padding: 'var(--space-10)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center' }}>
          <span
            style={{
              fontFamily: 'var(--font-cormorant, var(--font-display))',
              fontSize: '1.5rem',
              color: 'var(--color-accent)',
              letterSpacing: '0.04em',
              fontWeight: 500,
            }}
          >
            DIVISION PR
          </span>
        </div>

        {/* Heading */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-cormorant, var(--font-display))',
              fontSize: '1.5rem',
              fontWeight: 400,
              color: 'var(--color-text-primary)',
            }}
          >
            Welcome back.
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Sign in to view your pull.
          </p>
        </div>

        {/* Form (demo — no real auth in MVP) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <input
            type="email"
            placeholder="Email"
            defaultValue="kassandra@maisonpriveepr.com"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              color: 'var(--color-text-primary)',
              fontSize: '1rem',
              width: '100%',
              outline: 'none',
            }}
            readOnly
          />
          <input
            type="password"
            placeholder="Password"
            defaultValue="••••••••"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              color: 'var(--color-text-primary)',
              fontSize: '1rem',
              width: '100%',
              outline: 'none',
            }}
            readOnly
          />
        </div>

        <Link href="/portal" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          Sign In
        </Link>

        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
          Demo mode — auth via Clerk in Phase 4
        </p>
      </div>
    </main>
  )
}
