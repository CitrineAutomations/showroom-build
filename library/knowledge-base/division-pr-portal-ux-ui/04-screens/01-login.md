# Screen: Login
**Route:** `/login`
**Auth:** Public (pre-auth)
**Governed by:** `00-design-brief.md §4, §5.3, §5.4`

---

## Purpose
Entry point for all clients. Clerk handles authentication. This screen wraps Clerk's `<SignIn />` component inside the Division PR shell — minimal, branded, no distraction.

---

## Layout

```
┌─────────────────────────────────────────┐
│                                         │
│         DIVISION PR          (logo)     │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Welcome back.                          │  --text-2xl, --font-display
│  Sign in to view your pull.             │  --text-sm, --color-text-secondary
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  Email                            │  │  input
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  Password                         │  │  input + show/hide toggle
│  └───────────────────────────────────┘  │
│                                         │
│  [         SIGN IN          ]           │  btn-primary, full width
│                                         │
│  Forgot password? →                     │  --text-sm, --color-accent
│                                         │
└─────────────────────────────────────────┘
```

**Container:** centered card, max-width 400px, padding `--space-10`, `.card` class.
**Page background:** `--color-bg`.
**Full-height centering:** `min-height: 100dvh; display: flex; align-items: center; justify-content: center`.

---

## States
- **Default:** empty inputs
- **Error:** Clerk renders inline error below field — style to `--color-danger`, `--text-sm`
- **Loading:** button disabled, label → "SIGNING IN…", opacity 0.6

---

## Notes
- No "Sign Up" link — accounts are created automatically, not by client request
- Magic link option: if Clerk is configured for it, show "Email me a link instead" below the form in `--color-text-secondary`
- Logo at top: `DIVISION PR` in `--font-display`, `--text-2xl`, `--color-accent`, centered
