# Screen: Dashboard (Active Pull)
**Route:** `/portal`
**Auth:** Required (Clerk middleware)
**Governed by:** `00-design-brief.md §3, §4, §5`

---

## Purpose
The primary screen. Shows the client's current active pull — what items they have, when they're due, and contract status. If no active pull exists, shows a neutral empty state.

---

## Layout (mobile-first)

```
┌─────────────────────────────────────────┐
│  HEADER                                 │
├─────────────────────────────────────────┤
│                                         │
│  YOUR PULL              [OVERDUE badge] │  section-label + badge
│  DN-256364 — Kassandra Bialkowski       │  --text-xl, --color-text-primary
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  RETURN DATE                    │   │  card
│  │  June 30, 2026                  │   │  --text-2xl, --color-accent
│  │  2 days overdue                 │   │  --text-sm, --color-danger
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  CONTRACT             [Signed ✓]│   │  card
│  │  Sample loan agreement          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ──────────────────────────────────    │  divider
│                                         │
│  ITEMS OUT (3)                          │  section-label
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [photo] Alexander Wang          │   │  item card (see below)
│  │         Mini Dress · Ivory      │   │
│  │         D-882-SU24-025          │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ [photo] Charles & Ron           │   │
│  │         Maxi Dress · Black      │   │
│  │         C&R-894-FW24-018        │   │
│  └─────────────────────────────────┘   │
│  … (all items)                          │
│                                         │
│  ──────────────────────────────────    │  divider
│                                         │
│  ⚠ DAMAGE & RETURN POLICY              │  alert-warning (collapsed)
│  Tap to read →                          │  expand on tap → links to /portal/return
│                                         │
└─────────────────────────────────────────┘
```

---

## Return Date Card — States

| State | Date color | Subtext | Subtext color |
|---|---|---|---|
| Out (future, >2 days) | `--color-text-primary` | "X days remaining" | `--color-text-secondary` |
| Due Soon (≤2 days) | `--color-warning` | "Due in X days" | `--color-warning` |
| Overdue | `--color-danger` | "X days overdue" | `--color-danger` |

When Overdue: show `.alert-danger` banner above the return date card:
```
⚠  Your pull is overdue. Please return items immediately or contact your rep.
   [Contact Rep →]
```

---

## Contract Card — States

| State | Badge | Subtext |
|---|---|---|
| Not sent | none | "Contract not yet issued" |
| Pending signature | `.badge-pending` → "AWAITING SIGNATURE" | "Check your email for the signing link" |
| Signed | `.badge-signed` → "SIGNED ✓" | "Agreement on file" |

---

## Item Card Spec

```
┌──────────────────────────────────────────────────┐
│  ┌────────┐  Alexander Wang                      │
│  │        │  Mini Dress                          │  --text-base, --color-text-primary
│  │ PHOTO  │  Ivory White · SS 2024               │  --text-sm, --color-text-secondary
│  │ 64×64  │  D-882-SU24-025                      │  --text-xs, --color-text-muted
│  └────────┘                                      │
└──────────────────────────────────────────────────┘
```

- Photo: 64×64px, `border-radius: var(--radius-md)`, `object-fit: cover`
- If no photo: placeholder square, `--color-surface-raised`, border `--color-border`
- Tappable → routes to `/portal/items/[item_id]`
- `.card-interactive` class

---

## Empty State (no active pull)

```
┌─────────────────────────────────────────┐
│                                         │
│         No active pull.                 │  --text-xl, --font-display, --color-text-secondary
│                                         │
│   You don't currently have any items    │  --text-sm, --color-text-secondary
│   from the showroom. View your pull     │
│   history below.                        │
│                                         │
│   [ VIEW HISTORY ]                      │  btn-ghost
│                                         │
└─────────────────────────────────────────┘
```

---

## Motion
- Page enter: `opacity 0→1`, `y: 8px→0`, `page` bucket (300ms)
- Cards stagger on enter: each card delays by `index × 40ms`, `reveal` bucket (220ms)
- Badge color transitions: `micro` bucket (100ms)
