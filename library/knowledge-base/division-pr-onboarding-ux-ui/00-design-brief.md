# Division PR Client Onboarding — Design Brief

**Product:** Division Public Relations Client Onboarding Webapp
**Version:** 1.0 · June 2026
**Stack:** Next.js 14 App Router · Tailwind v4 · Stripe Elements · Lucide React · Framer Motion
**Governing brief:** `library/knowledge-base/division-pr-portal-ux-ui/00-design-brief.md`
**Token source:** `library/knowledge-base/division-pr-portal-ux-ui/01-master-tokens.css`

---

## 1. Product Context

This webapp is operated by a Division PR rep — not the client. The rep opens it on a tablet or phone, places it in front of a new client sitting at the showroom, and walks them through the 5-step intake form together. Speed and calm matter more than exploration. The rep may do this multiple times per day.

**Not a self-service product.** No login screen. No nav. No discovery. Pure task completion.

---

## 2. Token Inheritance

The onboarding webapp inherits the portal token set **without modification**. All values from `01-master-tokens.css` apply verbatim. No new color, spacing, radius, or motion tokens are introduced.

**Token additions: none required.**

The utility layer `02-surfaces-and-borders.css` is also inherited. Components reference `.card`, `.btn`, `.btn-primary`, `.btn-ghost`, `.section-label`, `.divider`, `.alert-danger` directly.

---

## 3. Layout System

### 3.1 Shell

No header nav. No footer. Single-screen at a time.

```
┌─────────────────────────────────┐
│  WORDMARK          (top, 56px)  │
├─────────────────────────────────┤
│  STEP INDICATOR    (below wm)   │
├─────────────────────────────────┤
│                                 │
│  STEP CONTENT      (flex-1)     │
│  (title + fields/actions)       │
│                                 │
├─────────────────────────────────┤
│  NAV BAR           (bottom, fixed, 72px) │
│  [Back]            [Next / CTA]  │
└─────────────────────────────────┘
```

- **Wordmark bar:** `height: 56px`, `background: var(--color-surface)`, `border-bottom: 1px solid var(--color-border)`. Left-aligned "DIVISION PR" in `--font-display --text-xl --color-accent`. No nav icons (this is not the portal).
- **Step content:** `padding: var(--space-6) var(--page-padding-x)`. Scrollable if content overflows. `max-width: 480px; margin: 0 auto` — constrains to a comfortable column on tablets.
- **Nav bar:** `position: fixed; bottom: 0; left: 0; right: 0; height: 72px; background: var(--color-surface); border-top: 1px solid var(--color-border); padding: 0 var(--page-padding-x); display: flex; align-items: center; justify-content: space-between`. Safe area inset on iOS: `padding-bottom: max(var(--space-4), env(safe-area-inset-bottom))`.

### 3.2 Grid

- **Mobile (390px):** single column, 16px horizontal padding.
- **Tablet (768px+):** single column, 32px horizontal padding, `max-width: 480px` centered.
- No multi-column at any breakpoint. The form is always a single-column stack.

---

## 4. Step Indicator

**Pattern: Dot track with step count label.**

```
● ● ● ○ ○   Step 3 of 5
```

- 5 dots in a row, left-aligned.
- Active dot: 8px diameter, `background: var(--color-accent)`.
- Completed dot: 8px diameter, `background: var(--color-accent)` at 40% opacity.
- Upcoming dot: 8px diameter, `background: var(--color-border-strong)`.
- Gap between dots: `var(--space-2)` (8px).
- "Step X of 5" label: `--text-xs --color-text-secondary --font-sans`, 8px left of the dots… actually right of dots with `var(--space-3)` gap.
- Container: `padding: var(--space-4) var(--page-padding-x)`. Full-width, below wordmark bar.
- No animation between dots — instant state change.

---

## 5. Step Transition Motion

Step transitions use the `page` motion bucket (300ms, `cubic-bezier(0.4, 0, 0.2, 1)`).

**Forward (Next):** exiting step slides `x: 0 → -24px` + `opacity: 1 → 0`. Entering step slides `x: 24px → 0` + `opacity: 0 → 1`.

**Back:** mirror — exiting slides right (+24px), entering slides from left (-24px).

`MotionConfig reducedMotion="user"` wraps the entire app. When reduced motion is preferred, all transitions are instant (`duration: 0`).

No spring, no bounce, no scale. Directional slide is the only affordance.

---

## 6. Photo Upload Pattern

**Pattern: Full-width tap zone with centered camera icon.**

```
┌─────────────────────────────────┐
│                                 │
│         [Camera icon]           │
│     TAP TO TAKE PHOTO           │
│                                 │
└─────────────────────────────────┘
```

- Container: `.card` utility class. `min-height: 160px`. `display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-3)`. Dashed border using `border-style: dashed; border-color: var(--color-border-strong)`.
- Icon: Lucide `Camera`, 32px, `--color-text-secondary`.
- Label below icon: `.section-label` ("TAP TO TAKE PHOTO" on mobile / "CLICK TO UPLOAD" on desktop — detect via pointer media query).
- `<input type="file" accept="image/*" capture="environment">` fills the entire tap zone (opacity: 0, absolute inset).
- **After capture:** tap zone is replaced by a thumbnail grid. See per-screen specs.
- **Dashed border conveys "add here"** — no ambiguity with filled `.card` containers.

---

## 7. Client Type Selection Pattern

**Pattern: Two full-width stacked option cards (not side-by-side).**

Rationale: At 390px, side-by-side leaves ~175px per card — too narrow for comfortable label rendering and thumb reach. Full-width stacked cards ensure 44px minimum height with generous padding.

**Unselected state:**
```css
background: var(--color-surface);
border: 1px solid var(--color-border-strong);
border-radius: var(--radius-lg);
padding: var(--space-5) var(--space-6);
min-height: 64px;
```

**Selected state:**
```css
background: color-mix(in srgb, var(--color-accent) 8%, var(--color-surface));
border: 2px solid var(--color-accent);
```

Label: `--text-base --font-sans font-weight: 600 --color-text-primary`. No icon — label only.
Sublabel (optional, shown below main label): `--text-sm --color-text-secondary`.
Transition: `border-color var(--duration-micro) var(--ease-out), background var(--duration-micro) var(--ease-out)`.

---

## 8. Navigation Bar (Back / Next)

**Back button:** `.btn .btn-ghost`. Label "BACK". Hidden on Step 1 (no back from first step). `min-width: 100px`.

**Next / primary CTA button:** `.btn .btn-primary`. Full-width on mobile up to 100% minus Back button space. `flex: 1; margin-left: var(--space-3)` when Back is present. Full-width when Back is hidden (Step 1).

**Disabled state:** Next is disabled (opacity 0.4, pointer-events: none) until the step's required fields are valid. No validation fires until the user taps Next.

**Step 5 CTA:** "COMPLETE ONBOARDING" (not "NEXT").
**Step 4 CTA:** "SAVE CARD" — triggers Stripe confirmCardSetup.

---

## 9. Error States

Errors are inline — never toast.

**Field error:** `--text-sm --color-danger` text below the input. Input border shifts to `1px solid var(--color-danger)`.

**Step-level error** (e.g., API failure on submit): full-width `.alert .alert-danger` banner inserted above the nav bar, inside the scroll area. Icon: Lucide `AlertCircle` 16px.

**Photo upload error** (per-file): small `--text-xs --color-danger` label below the failed thumbnail (or below the upload zone if no upload happened).

---

## 10. ConflictModal

Uses Radix Dialog primitive (wrapped). Pattern: dark overlay + centered panel.

```
Overlay: background rgba(0,0,0,0.72)
Panel: .card max-width: 360px, margin: auto, padding: var(--space-8)
```

No close-on-overlay-click (rep must make an explicit choice). No X button. Two buttons only.

---

## 11. Accessibility Floor

Inherited from portal brief §7 (WCAG 2.2 + EAA 2025). Additional constraints for this form:

- `<input type="file" capture="environment">` must have an associated `<label>` (visually hidden if needed).
- Step indicator dots: `role="list"` on container, each dot `role="listitem"` with `aria-label="Step N [complete/current/upcoming]"`.
- ConflictModal: `role="alertdialog"`, focus trapped inside, first focusable element receives focus on open.
- Step transitions: announced to screen readers via `aria-live="polite"` region containing the step title.

---

## 12. Screens (overview — detail in `04-screens/`)

| # | Screen | File |
|---|--------|------|
| 1 | Identity | `01-identity.md` |
| 2 | Client Type | `02-client-type.md` |
| 3 | Driver's License | `03-drivers-license.md` |
| 4 | Payment | `04-payment.md` |
| 5 | Item Photos | `05-item-photos.md` |
| — | Success | `06-success.md` |
| — | Conflict Modal | `07-conflict-modal.md` |
