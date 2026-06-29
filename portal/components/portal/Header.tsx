'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Clock, User } from 'lucide-react'

const NAV = [
  { href: '/portal', icon: Home, label: 'Dashboard' },
  { href: '/portal/history', icon: Clock, label: 'History' },
  { href: '/portal/account', icon: User, label: 'Account' },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: 'var(--header-height)',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--page-padding-x)',
      }}
    >
      <Link
        href="/portal"
        style={{
          fontFamily: 'var(--font-cormorant, var(--font-display))',
          fontSize: '1.25rem',
          color: 'var(--color-accent)',
          letterSpacing: '0.04em',
          textDecoration: 'none',
          fontWeight: 500,
        }}
      >
        DIVISION PR
      </Link>

      <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {NAV.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                transition: 'color 100ms ease-out',
                textDecoration: 'none',
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
