# Step 2 — Client Type

**Route:** state-driven (no URL change between steps)
**Step:** 2 of 5
**Primary action:** Select one of two client types → Next advances to Step 3

---

## Layout

```
┌─────────────────────────────────┐
│  DIVISION PR              [wm]  │  56px wordmark bar
├─────────────────────────────────┤
│  ● ● ○ ○ ○   Step 2 of 5       │  step indicator
├─────────────────────────────────┤
│                                 │
│  CLIENT TYPE                    │  .section-label, 32px top margin
│  Select account type            │  --text-2xl --font-sans font-weight:300
│                                 │  24px below heading
│  ┌─────────────────────────┐    │
│  │  Rental                 │    │  option card — see §5 of brief
│  │  Items rented to client │    │  sublabel
│  └─────────────────────────┘    │
│                                 │  --space-3 gap between cards
│  ┌─────────────────────────┐    │
│  │  Public Relations       │    │  option card
│  │  PR samples and pulls   │    │  sublabel
│  └─────────────────────────┘    │
│                                 │
│                 [72px spacer]   │
└─────────────────────────────────┘
├─────────────────────────────────┤
│  [ ← BACK ]       [ NEXT → ]   │  nav bar
└─────────────────────────────────┘
```

---

## Option Cards

### Unselected State
```css
background: var(--color-surface);
border: 1px solid var(--color-border-strong);
border-radius: var(--radius-lg);
padding: var(--space-5) var(--space-6);
min-height: 72px;
width: 100%;
display: flex;
flex-direction: column;
justify-content: center;
cursor: pointer;
transition: border-color var(--duration-micro) var(--ease-out),
            background var(--duration-micro) var(--ease-out);
```

### Selected State
```css
background: color-mix(in srgb, var(--color-accent) 8%, var(--color-surface));
border: 2px solid var(--color-accent);
/* padding compensates for extra border pixel to prevent layout shift */
padding: calc(var(--space-5) - 1px) calc(var(--space-6) - 1px);
```

### Labels
- Main label: `--text-base --font-sans font-weight: 600 --color-text-primary`
- Sublabel: `--text-sm --color-text-secondary margin-top: var(--space-1)`

### Option Values
| Display Label | Sublabel | Value stored |
|---|---|---|
| Rental | Items rented to client | `RENTAL` |
| Public Relations | PR samples and pulls | `PUBLIC_RELATIONS` |

---

## Interaction

1. No card selected → Next button disabled.
2. Rep taps a card → that card enters selected state. Other card goes to unselected state (radio group behavior).
3. Selection is immediate — no confirmation needed.
4. Next enabled as soon as one card is selected.
5. Rep taps Back → returns to Step 1. Selection is preserved in form state.

---

## Implementation Note

Use `role="radiogroup"` on the container, `role="radio"` + `aria-checked` on each card. Cards are `<button>` elements (not `<input type="radio">`) so they can be styled freely, with ARIA applied manually.

```html
<div role="radiogroup" aria-labelledby="client-type-heading">
  <button role="radio" aria-checked="false" class="option-card" data-value="RENTAL">
    <span class="option-label">Rental</span>
    <span class="option-sublabel">Items rented to client</span>
  </button>
  <button role="radio" aria-checked="true" class="option-card option-card--selected" data-value="PUBLIC_RELATIONS">
    <span class="option-label">Public Relations</span>
    <span class="option-sublabel">PR samples and pulls</span>
  </button>
</div>
```

Keyboard: arrow keys move between options (standard radio group pattern per ARIA APG).

---

## Accessibility

- `role="radiogroup"` + `aria-labelledby` pointing to the step heading.
- Each card: `role="radio"` + `aria-checked`.
- Focus visible on cards via global `:focus-visible` rule (2px gold outline).
- Touch target: `min-height: 72px` — exceeds 44px minimum.
