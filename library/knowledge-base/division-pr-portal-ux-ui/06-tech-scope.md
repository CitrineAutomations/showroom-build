# Division PR Client Portal — Tech Scope

**Phase:** 4 (Portal)
**Weapons:** `auth-weapon` · `crm-integration-weapon` · `react-weapon` · `ux-ui-weapon` · `security-weapon`

---

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 App Router | Server Components = no API key in browser; RSC-native data fetching |
| Auth | Clerk | Auto account creation via backend SDK; session JWT carries `contactId` |
| Styling | Tailwind v4 + CSS custom properties | Token layer in `01-master-tokens.css`; utilities in `02-surfaces-and-borders.css` |
| Components | shadcn/ui (Radix primitives) | Accessible, unstyled — maps cleanly onto Division PR tokens |
| Icons | Lucide React | Consistent stroke, tree-shakeable |
| Motion | Framer Motion | Named bucket system; `reducedMotion="user"` via `MotionConfig` |
| Hosting | Vercel | Edge middleware for Clerk auth guard; automatic preview deploys |
| CRM data | Twenty CRM GraphQL API | Server-side only; key in Vercel env vars |

---

## Folder Structure

```
apps/portal/
├── app/
│   ├── layout.tsx              ← ClerkProvider, global CSS imports
│   ├── login/
│   │   └── page.tsx            ← Clerk <SignIn /> wrapped in Division PR shell
│   ├── portal/
│   │   ├── layout.tsx          ← auth guard (clerk middleware), header
│   │   ├── page.tsx            ← Dashboard
│   │   ├── return/
│   │   │   └── page.tsx        ← Return Info (mostly static)
│   │   ├── history/
│   │   │   └── page.tsx        ← Pull History
│   │   └── account/
│   │       └── page.tsx        ← Account
├── components/
│   ├── ui/                     ← shadcn/ui wrappers (Division PR themed)
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Alert.tsx
│   ├── portal/
│   │   ├── Header.tsx
│   │   ├── ItemCard.tsx
│   │   ├── ReturnDateCard.tsx
│   │   ├── ContractCard.tsx
│   │   └── PullHistoryCard.tsx
├── lib/
│   ├── twenty.ts               ← Twenty GraphQL client (server-only)
│   ├── queries.ts              ← GraphQL query strings
│   └── auth.ts                 ← Clerk auth helpers + contactId extraction
├── middleware.ts                ← Clerk authMiddleware — guards /portal/*
└── public/
    └── brand/
        └── brand_kit/
            └── fonts/          ← Inter Variable, Cormorant Garamond
```

---

## Data Flow

```
Browser → Clerk session (JWT with contactId)
       → /portal page (Next.js RSC)
       → lib/twenty.ts (server-side GraphQL)
       → Twenty CRM API (filtered by contactId)
       → RSC renders HTML → sent to browser
```

**The Twenty API key never leaves the server.** The browser receives rendered HTML only.

---

## Key GraphQL Queries (server-side)

### Active Pull
```graphql
query GetActivePull($contactId: ID!) {
  pulls(filter: {
    clientId: { eq: $contactId }
    stage: { in: [Out, DueSoon, Overdue] }
  }, first: 1) {
    edges { node {
      id name stage returnDate
      contractSent contractSigned
      repAssigned { name email phone }
      items { edges { node {
        id itemId designer itemType color
        seasonYear photo { url }
      }}}
    }}
  }
}
```

### Pull History
```graphql
query GetPullHistory($contactId: ID!, $after: String) {
  pulls(filter: {
    clientId: { eq: $contactId }
    stage: { eq: Closed }
  }, first: 10, after: $after, orderBy: { createdAt: DescNullsLast }) {
    edges { node {
      id name createdAt
      coverageEvent coveragePlatform creditGiven
      items { totalCount }
    }}
    pageInfo { hasNextPage endCursor }
  }
}
```

---

## Auth: contactId Linking

When AUTO-11 creates a Clerk account, it stores the Twenty `contactId` in Clerk's `publicMetadata`:

```json
{ "twentyContactId": "9e3a8066-ba4a-45f7-88c9-8c10d53f7c49" }
```

In Next.js, extract it on every request:

```typescript
// lib/auth.ts
import { auth } from '@clerk/nextjs/server'

export async function getContactId(): Promise<string> {
  const { sessionClaims } = await auth()
  const contactId = sessionClaims?.publicMetadata?.twentyContactId
  if (!contactId) throw new Error('No CRM contact linked to this account')
  return contactId as string
}
```

All Twenty queries call `getContactId()` first. If it throws, the user sees a "contact your rep" error screen — they have an auth account but no CRM link yet.

---

## Clerk Middleware

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPortalRoute = createRouteMatcher(['/portal(.*)'])

export default clerkMiddleware((auth, req) => {
  if (isPortalRoute(req)) auth().protect()
})

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
```

---

## Environment Variables (Vercel)

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/portal
TWENTY_API_KEY=eyJ...                          # NEVER NEXT_PUBLIC_ prefixed
TWENTY_API_URL=http://your-twenty-host:3002
```

---

## Component Wrapping Rules

All shadcn/ui primitives are wrapped before use in feature code. Raw imports from `shadcn/ui` in page or portal component files are violations.

| shadcn primitive | Division PR wrapper | Location |
|---|---|---|
| `Button` | `components/ui/Button.tsx` | Applies `btn`, `btn-primary`, `btn-ghost` via CVA |
| `Badge` | `components/ui/Badge.tsx` | Maps `variant` to `.badge-*` classes |
| `Card` | `components/ui/Card.tsx` | Applies `.card`, optional `.card-interactive` |
| `Alert` | `components/ui/Alert.tsx` | Maps `variant` to `.alert-danger`, `.alert-warning` |

---

## Accessibility Checklist (pre-launch)

- [ ] All text passes 4.5:1 contrast — run axe-core in CI
- [ ] Focus ring visible on all interactive elements (`.btn`, nav icons, links)
- [ ] All icon-only nav buttons have `aria-label`
- [ ] Item photos have `alt` text (`"{designer} {itemType} {color}"`)
- [ ] Missing photo placeholders have `aria-hidden="true"`
- [ ] Damage warning communicates urgency via text, not color alone
- [ ] `MotionConfig reducedMotion="user"` wraps the entire app
- [ ] Clerk auth flow passes SC 3.3.8 (accessible authentication)
- [ ] All touch targets ≥ 44×44px

---

## Security Checklist (pre-launch — `security-weapon`)

- [ ] `TWENTY_API_KEY` not prefixed with `NEXT_PUBLIC_`
- [ ] `getContactId()` called before every Twenty query — no raw `contactId` from request params
- [ ] GraphQL queries always include `clientId: { eq: contactId }` filter — no unscoped queries
- [ ] Clerk `publicMetadata.twentyContactId` is set server-side only (AUTO-11 via Clerk backend SDK)
- [ ] No PII logged to console or error tracking (Sentry scrub rules configured)
- [ ] `Content-Security-Policy` header set in `next.config.ts`
- [ ] OWASP Top 10 review complete before go-live
