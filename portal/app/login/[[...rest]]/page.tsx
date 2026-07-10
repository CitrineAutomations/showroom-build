import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-6)',
        padding: 'var(--space-4)',
      }}
    >
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

      <SignIn fallbackRedirectUrl="/portal" />
    </main>
  )
}
