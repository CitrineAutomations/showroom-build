# ConflictModal — Card Already on File

**Triggered:** On entry to Step 4 when `hasCardOnFile: true` (set in Step 1 API response)
**Blocks:** Step 4 content does not render until rep makes a choice

---

## When It Fires

During Step 1, `/api/contact` returns `{ contactId, stripeCustomerId: "cus_xxx" }`. The form state stores `hasCardOnFile: true`. When the step machine advances to Step 4, the ConflictModal renders before the Stripe CardElement loads.

---

## Layout

```
┌─────────────────────────────────────────────┐
│  [Overlay: rgba(0,0,0,0.72) full-screen]    │
│                                             │
│     ┌─────────────────────────────────┐     │
│     │                                 │     │
│     │  PAYMENT ON FILE                │     │  .section-label, centered
│     │  Card already saved             │     │  --text-xl font-weight:300
│     │                                 │     │  margin-bottom: space-4
│     │  Kassandra Bialkowski has a     │     │  --text-base --color-text-primary
│     │  card on file from a previous   │     │  --color-text-secondary for name
│     │  session. Would you like to     │     │
│     │  keep it or replace it?         │     │
│     │                                 │     │
│     │  ┌─────────────────────────┐   │     │
│     │  │  KEEP EXISTING CARD     │   │     │  .btn .btn-ghost full-width
│     │  └─────────────────────────┘   │     │
│     │                                 │     │  --space-3 gap
│     │  ┌─────────────────────────┐   │     │
│     │  │  REPLACE CARD           │   │     │  .btn .btn-primary full-width
│     │  └─────────────────────────┘   │     │
│     │                                 │     │
│     └─────────────────────────────────┘     │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Panel Spec

```css
.conflict-modal-panel {
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  max-width: 360px;
  width: calc(100% - var(--space-8));  /* 16px margin each side */
  margin: auto;
}
```

Overlay: `position: fixed; inset: 0; background: rgba(10, 10, 10, 0.72); display: flex; align-items: center; justify-content: center; z-index: 100`.

---

## Copy

**Heading:** "Card Already on File"
**Body:** "[Client First Name] has a payment method saved from a previous session. Keep the existing card or replace it with a new one?"

Client name rendered in `--color-text-primary font-weight: 600`. Rest in `--color-text-secondary`.

---

## Buttons

| Button | Style | Action |
|--------|-------|--------|
| KEEP EXISTING CARD | `.btn .btn-ghost` full-width | Close modal, skip Step 4 entirely, advance to Step 5. Set `cardKept: true` in form state. |
| REPLACE CARD | `.btn .btn-primary` full-width | Close modal, render Stripe CardElement in Step 4. Proceed normally. |

**No close-on-overlay-click.** No X/dismiss button. Rep must choose one of the two options.

**Button order:** Ghost (Keep) above Primary (Replace). This is intentional — keeping the existing card is the lower-risk default and should be the easier tap for a rep who is uncertain.

---

## Motion

Modal panel: `opacity: 0 → 1` + `scale: 0.96 → 1.0`, `duration: var(--duration-reveal)` (220ms), `ease: var(--ease-ui)`.

Overlay: `opacity: 0 → 1`, `duration: var(--duration-reveal)`.

On dismiss: reverse — `opacity: 1 → 0` + `scale: 1.0 → 0.96`, same duration.

`MotionConfig reducedMotion="user"` respected.

---

## Accessibility

- Dialog: `role="alertdialog"` (requires immediate attention, blocks workflow).
- `aria-labelledby` → modal heading.
- `aria-describedby` → modal body paragraph.
- Focus trap: on open, focus moves to the first button ("KEEP EXISTING CARD"). Tab cycles between the two buttons only. Focus does not escape to the page behind.
- On close: focus returns to the element that was focused before the modal opened (the step content area).
- Escape key: **does NOT close this modal** — rep must make an explicit choice. This prevents accidental dismissal on mobile keyboard events.
