# Step 3 — Driver's License

**Route:** state-driven
**Step:** 3 of 5
**Primary action:** Capture or upload a driver's license photo → uploads immediately → Next advances to Step 4

---

## Layout — Before Capture

```
┌─────────────────────────────────┐
│  DIVISION PR              [wm]  │
├─────────────────────────────────┤
│  ● ● ● ○ ○   Step 3 of 5       │
├─────────────────────────────────┤
│                                 │
│  IDENTIFICATION                 │  .section-label
│  Driver's License               │  --text-2xl font-weight:300
│                                 │
│  ┌ - - - - - - - - - - - - ┐   │  dashed upload zone (.card variant)
│  |                         |   │
│  |      [Camera 32px]      |   │  --color-text-secondary
│  |   TAP TO TAKE PHOTO     |   │  .section-label
│  |                         |   │  min-height: 200px
│  └ - - - - - - - - - - - - ┘   │
│                                 │
│  Accepted: JPG, PNG, HEIC       │  --text-xs --color-text-muted, center
│  Max size: 10 MB                │
│                                 │
│                 [72px spacer]   │
└─────────────────────────────────┘
├─────────────────────────────────┤
│  [ ← BACK ]    [ NEXT → ]      │  Next disabled until upload completes
└─────────────────────────────────┘
```

---

## Upload Zone Spec

```css
/* Dashed card variant — not in current utility layer, add inline or as modifier */
.upload-zone {
  background: var(--color-surface);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-lg);
  padding: var(--space-8) var(--space-6);
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  position: relative;
  cursor: pointer;
  transition: border-color var(--duration-micro) var(--ease-out),
              background var(--duration-micro) var(--ease-out);
}

.upload-zone:hover {
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 4%, var(--color-surface));
}
```

Hidden file input overlaying entire zone:
```html
<input
  type="file"
  accept="image/*,.heic"
  capture="environment"
  aria-label="Photograph driver's license"
  style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%"
/>
```

`capture="environment"` opens the rear camera on mobile. On desktop, opens file picker.

---

## Layout — Upload In Progress

Upload zone is replaced by:

```
┌─────────────────────────────────┐
│  ┌─────────────────────────┐    │
│  │  [Loader2 spinner 24px] │    │  centered in upload zone area
│  │   Uploading...          │    │  --text-sm --color-text-secondary
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

Next button stays disabled. Back button stays enabled (tapping back discards the in-progress upload).

---

## Layout — After Successful Upload

```
┌─────────────────────────────────┐
│  IDENTIFICATION                 │
│  Driver's License               │
│                                 │
│  ┌─────────────────────────┐    │
│  │  [Photo thumbnail]      │    │  aspect-ratio: 16/9, object-fit: cover
│  │                         │    │  border-radius: var(--radius-lg)
│  │                         │    │  width: 100%
│  └─────────────────────────┘    │
│                                 │
│  ✓ Photo saved               │  Lucide CheckCircle2 16px --color-success
│                                 │  --text-sm --color-success inline
│  [ RETAKE PHOTO ]               │  .btn .btn-ghost full-width, margin-top space-3
│                                 │
└─────────────────────────────────┘
```

- Thumbnail: `width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: var(--radius-lg); border: 1px solid var(--color-border)`.
- "✓ Photo saved" confirmation line: `display: flex; align-items: center; gap: var(--space-2); color: var(--color-success); font-size: var(--text-sm); margin-top: var(--space-3)`.
- RETAKE PHOTO button: `.btn .btn-ghost width: 100%`. Tapping clears the uploaded fileId from form state and returns to the empty upload zone.
- Next button: **enabled** once upload is confirmed.

---

## Upload Error State

If the upload API call fails:

```
┌─────────────────────────────────┐
│  [Upload zone — shown again]    │
│                                 │
│  [AlertCircle 16px] Upload      │  .alert .alert-danger below zone
│  failed. Tap to try again.      │
└─────────────────────────────────┘
```

The upload zone reappears (not the thumbnail). Rep can tap to retry. Next remains disabled.

---

## Interaction Summary

| State | Upload Zone | Next |
|-------|-------------|------|
| Empty | Dashed zone, camera icon | Disabled |
| Uploading | Spinner in zone area | Disabled |
| Success | Thumbnail + retake | **Enabled** |
| Error | Dashed zone + error banner | Disabled |

---

## Accessibility

- Hidden `<input>` has `aria-label="Photograph driver's license"`.
- Upload zone `<div>` has `role="button"` and `tabindex="0"` so keyboard users can trigger it.
- `aria-live="polite"` region announces upload state changes ("Uploading…", "Photo saved", "Upload failed").
- Thumbnail `<img>` has `alt="Driver's license photo preview"`.
- CheckCircle2 icon is `aria-hidden="true"` — success text alone conveys the state.
