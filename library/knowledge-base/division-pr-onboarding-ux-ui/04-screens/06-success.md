# Success Screen

**Shown:** After Step 5 "COMPLETE ONBOARDING" completes successfully
**Primary action:** "START NEW CLIENT" (resets form) or rep closes/navigates away

---

## Layout

```
┌─────────────────────────────────┐
│  DIVISION PR              [wm]  │  wordmark only — no step indicator
├─────────────────────────────────┤
│                                 │
│                                 │
│                                 │  ~80px top padding (vertically center)
│  ✓                              │  Lucide CheckCircle2, 48px
│                                 │  --color-success
│                                 │  centered
│  Client Added                   │  --text-2xl --font-sans font-weight:300
│                                 │  --color-text-primary, centered
│                                 │  margin-top: var(--space-3)
│  Kassandra Bialkowski           │  --text-lg --color-accent --font-display
│  Public Relations               │  --text-sm --color-text-secondary
│                                 │  margin-top: var(--space-2), centered
│                                 │
│  ─────────────────────────────  │  .divider, margin: var(--space-8) 0
│                                 │
│  WHAT WAS SAVED                 │  .section-label, left-aligned
│                                 │
│  ┌─────────────────────────┐    │  .card
│  │ ✓  Contact in CRM       │    │  each row: Lucide Check 16px --color-success
│  │ ✓  Client type set      │    │  + --text-sm --color-text-primary
│  │ ✓  ID photo saved       │    │  gap: var(--space-3) between rows
│  │ ✓  Card on file         │    │
│  │ ✓  3 condition photos   │    │  dynamic count
│  └─────────────────────────┘    │
│                                 │
│  [ START NEW CLIENT ]           │  .btn .btn-primary full-width
│                                 │  margin-top: var(--space-6)
│                                 │
└─────────────────────────────────┘
```

---

## Content Rules

### Client name
Display the full name returned from the API (or entered in Step 1 if the API response included it).
`--text-lg --color-accent --font-display letter-spacing: 0.04em`

### Client type
Display the human-readable label ("Public Relations" or "Rental"), not the enum value.
`--text-sm --color-text-secondary`

### "What Was Saved" checklist

Dynamic — only show rows for things that actually completed:

| Row | Shown when |
|-----|------------|
| ✓ Contact in CRM | Always (contact was created or updated) |
| ✓ Client type set | Always |
| ✓ ID photo saved | DL upload completed in Step 3 |
| ✓ Card on file | Stripe step completed OR existing card was kept |
| ✓ N condition photo(s) | At least 1 item photo was attached. "1 condition photo" / "3 condition photos" |
| — No condition photos | If 0 photos. Show as `--color-text-muted` row with dash instead of check. |

Card kept (from ConflictModal "Keep"): show "✓ Existing card on file kept" instead.

### "START NEW CLIENT" button
Resets all form state to Step 1, empty. Does not navigate away — same URL, same page shell.

---

## Motion

Success screen enters with `opacity: 0 → 1`, `y: 16px → 0`, `duration: var(--duration-page)`, `ease: var(--ease-page)`.

CheckCircle2 icon enters with a 100ms delay after the screen fade-in (subtle cascade).

`MotionConfig reducedMotion="user"` respected — instant if preference is set.

---

## Accessibility

- CheckCircle2 icon: `aria-hidden="true"`. The heading "Client Added" conveys success.
- `role="status"` on the main content block so screen readers announce it as a live region result.
- "START NEW CLIENT" button receives focus automatically on mount (allows keyboard users to trigger reset without re-navigating).
