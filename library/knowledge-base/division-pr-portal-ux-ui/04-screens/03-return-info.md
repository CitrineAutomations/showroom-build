# Screen: Return Info
**Route:** `/portal/return`
**Auth:** Required
**Governed by:** `00-design-brief.md §3 (principle 3), §5`

---

## Purpose
Static content page. Return process, damage policy, and rep contact. This is where clients go when they need to know what to do. No dynamic data — renders identically for all clients.

---

## Layout

```
┌─────────────────────────────────────────┐
│  HEADER                                 │
├─────────────────────────────────────────┤
│                                         │
│  RETURN & POLICY                        │  section-label
│  How to return your items               │  --text-2xl, --font-display
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  RETURN PROCESS                 │   │  card
│  │                                 │   │
│  │  1. Package all items carefully │   │
│  │     in original garment bags.   │   │
│  │                                 │   │
│  │  2. Bring to the showroom or    │   │
│  │     schedule a messenger pickup │   │
│  │     with your rep.              │   │
│  │                                 │   │
│  │  3. Items must be returned in   │   │
│  │     original condition — no     │   │
│  │     alterations, stains, or     │   │
│  │     missing accessories.        │   │
│  │                                 │   │
│  │  SHOWROOM ADDRESS               │   │  section-label inside card
│  │  8285 Sunset Blvd, Studio #1    │   │  --text-base
│  │  West Hollywood, CA 90046       │   │
│  │                                 │   │
│  │  HOURS                          │   │  section-label inside card
│  │  Mon–Fri · 10AM–6PM PT          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │  alert-danger
│  │  ⚠  DAMAGE & LOSS POLICY       │   │
│  │                                 │   │
│  │  Items returned damaged, with   │   │
│  │  stains, missing parts, or not  │   │
│  │  returned at all are subject to │   │
│  │  a loan fee per the agreement   │   │
│  │  you signed.                    │   │
│  │                                 │   │
│  │  Late returns beyond 2 days     │   │
│  │  will incur a late penalty as   │   │
│  │  outlined in your contract.     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  NEED TO EXTEND YOUR RETURN?    │   │  card
│  │                                 │   │
│  │  Contact your rep directly —    │   │
│  │  extensions are not available   │   │
│  │  through the portal.            │   │
│  │                                 │   │
│  │  [Name of assigned rep]         │   │  --color-text-primary
│  │  [rep@divisionpr.com]           │   │  --color-accent, underline on hover
│  │  [+1 (310) 000-0000]            │   │  --color-accent
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## Notes
- Rep contact info is the only dynamic data on this page — pulled from `Pull.rep_assigned` → their email/phone from Twenty
- All other content is static markdown rendered server-side
- Damage alert uses `.alert-danger` — visually prominent, not dismissible
- No CTAs beyond the rep contact links
