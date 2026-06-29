# Division PR Client Portal — Design Brief

**Product:** Division Public Relations Client Portal
**Version:** 1.0 · June 2026
**Stack:** Next.js 14 App Router · Clerk · Tailwind v4 · shadcn/ui · Framer Motion · Lucide React

---

## 1. Product Context

Division Public Relations is a West Hollywood fashion PR showroom owned by Vinny Weathersby. Stylists, editors, and art directors ("clients") pull sample garments for editorial shoots, red carpet, and press coverage. The portal is their window into a live pull — what items they have out, when those items are due back, whether their contract is signed, and what happens if something goes wrong.

The portal is **provisioned automatically** the moment a pull leaves the showroom. The client receives a welcome email with their login. They never sign up themselves.

---

## 2. Brand Identity

**Name:** Division Public Relations
**Short form:** Division PR
**Tone:** Quiet authority. Fashion-industry minimal. No decoration for decoration's sake.

### 2.1 Palette

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#0A0A0A` | Page background |
| `--color-surface` | `#141414` | Card / panel background |
| `--color-surface-raised` | `#1C1C1C` | Elevated card (hover, modal) |
| `--color-border` | `#2A2A2A` | Subtle dividers, card borders |
| `--color-border-strong` | `#3D3D3D` | Interactive border (focus ring base) |
| `--color-text-primary` | `#F5F0E6` | Body text, headings (warm off-white) |
| `--color-text-secondary` | `#8A8478` | Labels, metadata, captions |
| `--color-text-muted` | `#5A5550` | Placeholder, disabled |
| `--color-accent` | `#C9A96E` | Gold — CTAs, active states, key data |
| `--color-accent-hover` | `#B8955A` | Darker gold on hover |
| `--color-danger` | `#C0392B` | Overdue badge, damage warnings |
| `--color-danger-surface` | `#1F0E0C` | Danger banner background |
| `--color-warning` | `#D4A017` | Due Soon badge |
| `--color-warning-surface` | `#1A1508` | Warning banner background |
| `--color-success` | `#4A7C59` | Signed contract, returned |
| `--color-success-surface` | `#0C150F` | Success background |

### 2.2 Typography

| Token | Value | Usage |
|---|---|---|
| `--font-sans` | `'Inter Variable', system-ui, sans-serif` | All UI text |
| `--font-display` | `'Cormorant Garamond', Georgia, serif` | Page title, hero labels only |
| `--text-xs` | `0.75rem / 1rem` | Captions, metadata |
| `--text-sm` | `0.875rem / 1.25rem` | Labels, secondary body |
| `--text-base` | `1rem / 1.5rem` | Body, table rows |
| `--text-lg` | `1.125rem / 1.75rem` | Section headers |
| `--text-xl` | `1.25rem / 1.75rem` | Card titles |
| `--text-2xl` | `1.5rem / 2rem` | Page headings |
| `--text-4xl` | `2.25rem / 2.5rem` | Display / hero (Cormorant) |

**Tracking rules:**
- Display (`--font-display`): `letter-spacing: 0.04em`
- Uppercase labels: `letter-spacing: 0.12em; font-size: --text-xs; font-weight: 500`
- All other text: default tracking

### 2.3 Spacing Scale

4px base unit. Tokens: `--space-1` (4px) through `--space-16` (64px). Tailwind mapping: `p-1` = 4px.

---

## 3. Design Principles

1. **Information before decoration.** Every visual element must earn its place by communicating something. No gradients, no illustrations, no gratuitous animation.
2. **Urgency is visual.** A client with an overdue pull must feel that urgency the moment the page loads — through color, placement, and size, not just text.
3. **One decision per page.** Each screen has a single primary action or piece of information. No cognitive overload.
4. **Earned trust.** The portal represents a luxury brand. Spacing is generous, type is refined, nothing looks cheap.
5. **Mobile is first-class.** Clients check from their phones. The dashboard must work perfectly at 390px.

---

## 4. Layout System

### 4.1 Grid
- **Mobile:** single column, 16px horizontal padding
- **Tablet (768px+):** 12-column grid, 24px gutters, 32px margin
- **Desktop (1280px+):** max-width 1120px centered, same 12-column grid

### 4.2 Shell
```
┌─────────────────────────────────────────┐
│  HEADER  logo · nav · [account]         │  h-14 (56px) sticky
├─────────────────────────────────────────┤
│                                         │
│  PAGE CONTENT                           │  flex-1, overflow-y-auto
│                                         │
└─────────────────────────────────────────┘
```
No sidebar on mobile. Desktop: no sidebar either — linear single-column pages, max-width constrained.

### 4.3 Header
- Left: "DIVISION PR" in `--font-display`, `--text-xl`, `--color-accent`
- Right: icon nav — `Home`, `History`, `Account` (Lucide icons, 20px, `--color-text-secondary`)
- Active nav item: `--color-accent`, 1px underline
- Background: `--color-surface` with 1px `--color-border` bottom

---

## 5. Component Tokens

### 5.1 Cards
```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: var(--space-6); /* 24px */
}

.card:hover {
  background: var(--color-surface-raised);
  border-color: var(--color-border-strong);
}
```
Shadow: **none by default**. Division PR uses border + background shift, not box-shadow, for depth.

### 5.2 Badges

| State | Background | Text | Border |
|---|---|---|---|
| Out | `transparent` | `--color-text-secondary` | `--color-border` |
| Due Soon | `--color-warning-surface` | `--color-warning` | `--color-warning` at 30% opacity |
| Overdue | `--color-danger-surface` | `--color-danger` | `--color-danger` at 30% opacity |
| Signed | `--color-success-surface` | `--color-success` | `--color-success` at 30% opacity |
| Pending | `transparent` | `--color-text-secondary` | `--color-border` |

Badge shape: `border-radius: 4px; padding: 2px 8px; font-size: --text-xs; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase`.

### 5.3 Buttons

**Primary (gold):**
```css
background: var(--color-accent);
color: #0A0A0A;
border: none;
border-radius: 6px;
padding: 10px 20px;
font-size: var(--text-sm);
font-weight: 600;
letter-spacing: 0.04em;
text-transform: uppercase;
```
Hover: `background: var(--color-accent-hover)`.

**Ghost:**
```css
background: transparent;
color: var(--color-text-primary);
border: 1px solid var(--color-border-strong);
```
Hover: `background: var(--color-surface-raised)`.

**Destructive:** same shape as primary, `background: var(--color-danger)`.

### 5.4 Inputs (Login only)
```css
background: var(--color-surface);
border: 1px solid var(--color-border-strong);
border-radius: 6px;
padding: 10px 14px;
color: var(--color-text-primary);
font-size: var(--text-base);
```
Focus: `border-color: var(--color-accent); outline: 2px solid var(--color-accent) at 25% opacity`.

### 5.5 Dividers
`1px solid var(--color-border)`. No decorative rules.

---

## 6. Motion Rules

All motion runs through Framer Motion with `MotionConfig reducedMotion="user"`.

| Bucket | Duration | Easing | Use |
|---|---|---|---|
| `instant` | 0ms | — | State toggles, no visual transition |
| `micro` | 100ms | `ease-out` | Button hover, badge color shift |
| `reveal` | 220ms | `[0.25, 0.1, 0.25, 1]` | Cards entering viewport |
| `page` | 300ms | `[0.4, 0, 0.2, 1]` | Page-level route transitions |
| `expand` | 250ms | `[0.0, 0.0, 0.2, 1]` | Accordion / collapsible open |

No spring animations. No bounce. Nothing that competes with the content.

Page transitions: `opacity 0→1` + `y: 8px→0` on enter. `page` bucket.

---

## 7. Accessibility Floor (WCAG 2.2 + EAA 2025)

- All text: minimum 4.5:1 contrast ratio against its background
- `--color-accent` (#C9A96E) on `--color-bg` (#0A0A0A): 7.2:1 ✓
- `--color-text-primary` (#F5F0E6) on `--color-surface` (#141414): 14.1:1 ✓
- Focus ring: `2px solid var(--color-accent)`, `outline-offset: 2px` — never hidden
- All interactive targets: minimum 44×44px touch target
- Overdue / warning states communicate urgency via color **and** text — never color alone
- Clerk handles accessible authentication (SC 3.3.8)

---

## 8. Screens (overview — detail in `04-screens/`)

| Screen | Route | Primary purpose |
|---|---|---|
| Login | `/login` | Clerk-rendered, Division PR themed |
| Dashboard | `/portal` | Active pull — items, due date, contract status |
| Item Detail | `/portal/items/[id]` | Full item view with photo |
| Return Info | `/portal/return` | Static: process, policy, contact |
| Pull History | `/portal/history` | All closed pulls, newest first |
| Account | `/portal/account` | Name, email, contact rep |

---

## 9. What This Portal Is NOT

- Not an e-commerce experience — no cart, no pricing shown to clients
- Not a dashboard with charts — no graphs, no analytics
- Not a social platform — no comments, no sharing
- Not an admin tool — Vinny's team uses Twenty CRM directly

The portal is a **read-only status window** with one static info page. Keep it that way.
