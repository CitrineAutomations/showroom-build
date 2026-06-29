# Step 4 — Payment

**Route:** state-driven
**Step:** 4 of 5
**Primary action:** Enter card details via Stripe Elements → tap "SAVE CARD" → card saved to Stripe Customer

**Note:** ConflictModal fires on entry to this step if `hasCardOnFile: true` was flagged in Step 1. See `07-conflict-modal.md`.

---

## Layout

```
┌─────────────────────────────────┐
│  DIVISION PR              [wm]  │
├─────────────────────────────────┤
│  ● ● ● ● ○   Step 4 of 5       │
├─────────────────────────────────┤
│                                 │
│  PAYMENT                        │  .section-label
│  Card on File                   │  --text-2xl font-weight:300
│                                 │
│  ┌─────────────────────────┐    │  .card, padding: var(--space-4)
│  │  [Stripe CardElement]   │    │
│  └─────────────────────────┘    │
│                                 │
│  Your card will be saved on     │  --text-sm --color-text-secondary
│  file and only charged if       │  margin-top: var(--space-3)
│  items are damaged or not       │
│  returned.                      │
│                                 │
│  [card brand icons: Visa,       │  32px tall, --color-text-muted
│   Mastercard, Amex, Discover]   │  displayed inline, margin-top: space-4
│                                 │
│  [error banner if Stripe fails] │  .alert .alert-danger, hidden by default
│                                 │
│                 [72px spacer]   │
└─────────────────────────────────┘
├─────────────────────────────────┤
│  [ ← BACK ]    [ SAVE CARD → ] │  primary CTA label changes here
└─────────────────────────────────┘
```

---

## Stripe Elements Integration

### CardElement Container

The Stripe `CardElement` is mounted inside a styled wrapper that matches the portal input aesthetic:

```css
.stripe-card-wrapper {
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  transition: border-color var(--duration-micro) var(--ease-out);
}

.stripe-card-wrapper--focused {
  border-color: var(--color-accent);
  outline: 2px solid color-mix(in srgb, var(--color-accent) 25%, transparent);
  outline-offset: 0;
}

.stripe-card-wrapper--error {
  border-color: var(--color-danger);
}
```

### Stripe Element Appearance Options

Pass these to `CardElement` via the `appearance` prop to match Division PR tokens:

```js
{
  theme: 'night',
  variables: {
    colorPrimary: '#C9A96E',       // --color-accent
    colorBackground: '#141414',    // --color-surface
    colorText: '#F5F0E6',          // --color-text-primary
    colorDanger: '#C0392B',        // --color-danger
    fontFamily: 'Inter Variable, system-ui, sans-serif',
    spacingUnit: '4px',
    borderRadius: '6px',
    colorTextPlaceholder: '#5A5550', // --color-text-muted
  }
}
```

### Focus Detection

Stripe `CardElement` fires `focus` and `blur` events. Toggle `.stripe-card-wrapper--focused` on focus, remove on blur.

Stripe fires a `change` event with `{ error, complete }`. Toggle `.stripe-card-wrapper--error` when `error` is truthy.

---

## CTA Behavior

**"SAVE CARD" button:** `.btn .btn-primary`. Enabled when Stripe Element reports `complete: true`. Disabled (opacity 0.4) otherwise.

On tap:
1. Button enters loading state (Lucide `Loader2` spinner, disabled).
2. `stripe.confirmCardSetup(clientSecret)` is called.
3. **Success:** `paymentMethodId` sent to `/api/stripe/confirm`. On confirm → advance to Step 5.
4. **Stripe error:** show Stripe's `error.message` in `.alert .alert-danger` above nav spacer. Re-enable button.
5. **Network/API error:** show generic error. Re-enable button.

---

## Messaging

**Policy text** (below card field):
> "Your card will be saved on file and only charged if items are damaged or not returned."

This is the only payment-related copy. No mention of amounts, fees, or charge schedules. Calm and matter-of-fact.

**Card brand icons:** SVG sprites or Lucide equivalents for Visa, Mastercard, Amex, Discover. `height: 24px`, `opacity: 0.5`, shown in a horizontal row. Purely decorative (`aria-hidden="true"`).

---

## ConflictModal Entry Point

If `hasCardOnFile === true` when Step 4 is entered:
- Do NOT load the Stripe CardElement yet.
- Immediately render the ConflictModal (see `07-conflict-modal.md`).
- **Keep:** skip Step 4 entirely, advance to Step 5.
- **Replace:** load the Stripe CardElement and proceed normally.

---

## Error States

**Stripe card error** (invalid number, expired, etc.):
- Stripe's own inline error appears inside the CardElement (styled by Stripe, colored with `colorDanger` token above).
- Additionally show `.alert .alert-danger` above nav spacer with Stripe's `error.message`.

**Stripe confirmCardSetup failure:**
- `.alert .alert-danger`: "Unable to save card. Please check the card details and try again."

**API `/api/stripe/confirm` failure:**
- `.alert .alert-danger`: "Card was processed but could not be linked. Contact support."

---

## Accessibility

- Stripe CardElement is an iframe — Stripe handles internal accessibility.
- `.stripe-card-wrapper` has `role="group"` + `aria-label="Credit or debit card"`.
- Error banner: `aria-live="polite"` so screen readers announce it.
- "SAVE CARD" button: `aria-disabled="true"` when incomplete (not HTML `disabled` — preserves focus).
