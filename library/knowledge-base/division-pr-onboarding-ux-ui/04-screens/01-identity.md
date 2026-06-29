# Step 1 — Identity

**Route:** `/` (root, no sub-path needed)
**Step:** 1 of 5
**Primary action:** Enter full name and email → tap Next → API checks Twenty for existing contact

---

## Layout

```
┌─────────────────────────────────┐
│  DIVISION PR              [wm]  │  56px wordmark bar
├─────────────────────────────────┤
│  ● ○ ○ ○ ○   Step 1 of 5       │  step indicator
├─────────────────────────────────┤
│                                 │
│  NEW CLIENT                     │  .section-label, 32px top margin
│  Client Information             │  --text-2xl --font-sans font-weight:300
│                                 │  8px below label
│  Full Name                      │  --text-sm --color-text-secondary, label
│  ┌─────────────────────────┐    │
│  │                         │    │  input, height 48px
│  └─────────────────────────┘    │
│                                 │  --space-5 gap
│  Email Address                  │  --text-sm --color-text-secondary, label
│  ┌─────────────────────────┐    │
│  │                         │    │  input, height 48px
│  └─────────────────────────┘    │
│                                 │
│  [error banner if API fails]    │  .alert .alert-danger, hidden by default
│                                 │
│                 [72px spacer]   │  clears fixed nav bar
└─────────────────────────────────┘
├─────────────────────────────────┤
│  [nav bar fixed bottom]         │
│                    [ NEXT → ]   │  .btn .btn-primary, full-width (no Back)
└─────────────────────────────────┘
```

---

## Fields

### Full Name
- `<input type="text" autocomplete="name" inputmode="text" placeholder="First and Last Name">`
- Required. Min 2 chars. Error: "Please enter the client's full name."
- `--color-text-muted` placeholder.
- Input styling (from §5.4 of portal brief): `background: var(--color-surface); border: 1px solid var(--color-border-strong); border-radius: var(--radius-md); padding: 10px 14px; color: var(--color-text-primary); font-size: var(--text-base); min-height: 48px; width: 100%`.
- Focus: `border-color: var(--color-accent); outline: 2px solid color-mix(in srgb, var(--color-accent) 25%, transparent); outline-offset: 0`.

### Email Address
- `<input type="email" autocomplete="email" inputmode="email" placeholder="client@email.com">`
- Required. Basic email format validation (must contain `@`). Error: "Please enter a valid email address."
- Same input styling as Full Name.
- Autocomplete off is NOT set — allow browser/OS to autofill from contacts on tablet.

---

## Interaction

1. Both fields empty → Next button disabled (opacity 0.4).
2. Both fields have valid values → Next enabled.
3. Rep taps Next → client-side validation fires first.
4. If valid → loading state on Next button (spinner replaces text, button disabled).
5. API call to `/api/contact` with `{ email, fullName }`.
6. **Response: new contact** → advance to Step 2.
7. **Response: existing contact, no stripeCustomerId** → advance to Step 2 (contact data pre-loaded).
8. **Response: existing contact, stripeCustomerId present** → advance to Step 2, but flag `hasCardOnFile: true` in form state. ConflictModal fires at Step 4 entry.
9. **Response: API error** → show `.alert .alert-danger` banner: "Unable to reach the CRM. Check your connection and try again." Next re-enabled for retry.

---

## Loading State (Next button)

```css
/* Next button during API call */
.btn-primary[data-loading] {
  opacity: 0.7;
  pointer-events: none;
}
/* Show Lucide Loader2 icon (16px, animate-spin) replacing label text */
```

---

## Error States

**Full Name empty on Next tap:**
Below the Full Name input:
```
Please enter the client's full name.
```
`--text-sm --color-danger`, `margin-top: var(--space-1)`.
Input border: `1px solid var(--color-danger)`.

**Email invalid on Next tap:**
Below the Email input, same styling.

**API failure:**
`.alert .alert-danger` block above the nav bar spacer. Lucide `AlertCircle` 16px left of text.

---

## Accessibility

- `<label for="fullName">Full Name</label>` and `<label for="email">Email Address</label>` — visible labels, not placeholders.
- `aria-describedby` on each input pointing to its error `<p>` element.
- `aria-invalid="true"` on input when error is active.
- `aria-live="polite"` region wrapping the error paragraph so screen readers announce it.
- Next button: `aria-disabled="true"` when disabled (not `disabled` attribute — preserves focusability).
