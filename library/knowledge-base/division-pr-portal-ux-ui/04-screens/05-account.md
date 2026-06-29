# Screen: Account
**Route:** `/portal/account`
**Auth:** Required
**Governed by:** `00-design-brief.md §5`

---

## Purpose
Client's profile and contact details. Read from Clerk. No editing in MVP — if a client needs to update info they contact the rep.

---

## Layout

```
┌─────────────────────────────────────────┐
│  HEADER                                 │
├─────────────────────────────────────────┤
│                                         │
│  ACCOUNT                                │  section-label
│  [First Last]                           │  --text-2xl, --font-display
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  CONTACT DETAILS                │   │  card, section-label inside
│  │                                 │   │
│  │  Email                          │   │  --text-xs, --color-text-secondary
│  │  kassandra@agencyname.com       │   │  --text-base, --color-text-primary
│  │                                 │   │
│  │  Phone                          │   │
│  │  +1 (310) 555-0100              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  YOUR REP                       │   │  card
│  │                                 │   │
│  │  [Rep Name]                     │   │  --text-base, --color-text-primary
│  │  [rep@divisionpr.com]           │   │  --color-accent, mailto link
│  │  [+1 (310) 000-0000]            │   │  --color-accent, tel link
│  └─────────────────────────────────┘   │
│                                         │
│  ──────────────────────────────────    │  divider
│                                         │
│  [ SIGN OUT ]                           │  btn-ghost, full width on mobile
│                                         │
└─────────────────────────────────────────┘
```

---

## Notes
- Phone shown only if present in Clerk profile
- Rep info is dynamic — pulled from `Pull.rep_assigned` in Twenty (most recent active pull)
- "Sign out" calls `clerk.signOut()` and redirects to `/login`
- No "Delete account" or "Change password" in MVP — Clerk handles password reset via email flow
