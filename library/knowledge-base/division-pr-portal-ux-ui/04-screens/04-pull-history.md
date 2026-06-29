# Screen: Pull History
**Route:** `/portal/history`
**Auth:** Required
**Governed by:** `00-design-brief.md §5.1, §5.2`

---

## Purpose
All closed pulls for this client, newest first. Read-only record of their relationship with Division PR.

---

## Layout

```
┌─────────────────────────────────────────┐
│  HEADER                                 │
├─────────────────────────────────────────┤
│                                         │
│  PULL HISTORY                           │  section-label
│  Past pulls                             │  --text-2xl, --font-display
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Jun 2026 · 3 items             │   │  card (most recent first)
│  │  BET Awards 2026                │   │  --text-base, --color-text-primary
│  │  Instagram · Vogue              │   │  --text-sm, --color-text-secondary
│  │                           [✓ Credit given]  │  badge-signed (small)
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Mar 2026 · 5 items             │   │
│  │  Grammy Week 2026               │   │
│  │  Red Carpet                     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  … (paginated or load-more)             │
│                                         │
└─────────────────────────────────────────┘
```

---

## Pull History Card Spec

| Element | Token | Notes |
|---|---|---|
| Month + item count | `--text-sm`, `--color-text-secondary` | e.g. "Jun 2026 · 3 items" |
| Coverage event | `--text-base`, `--color-text-primary` | e.g. "BET Awards 2026" |
| Coverage platform | `--text-sm`, `--color-text-secondary` | e.g. "Instagram · Vogue" |
| Credit badge | `.badge-signed` → "CREDITED" | Only shown if `credit_given = true` |
| No coverage logged | — | Omit coverage row; don't show "N/A" |

Cards use `.card` class. Not interactive (no tap target needed unless expanding).

---

## Empty State

```
No past pulls on record.
```
`--text-base`, `--color-text-secondary`, centered. No illustration.

---

## Pagination
Load 10 pulls at a time. "Load more" ghost button at bottom. No infinite scroll (server components, no client state needed for MVP).

---

## What is NOT shown
- Individual items in each pull (item detail is on dashboard only)
- Retail values, loan fees, wholesale prices
- Reliability score
- Contract details for historical pulls
