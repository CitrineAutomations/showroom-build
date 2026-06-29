# Step 5 — Item Photos

**Route:** state-driven
**Step:** 5 of 5
**Primary action:** Capture condition photos of items leaving the showroom → "COMPLETE ONBOARDING"

---

## Layout — No Photos Yet

```
┌─────────────────────────────────┐
│  DIVISION PR              [wm]  │
├─────────────────────────────────┤
│  ● ● ● ● ●   Step 5 of 5       │
├─────────────────────────────────┤
│                                 │
│  ITEM PHOTOS                    │  .section-label
│  Condition Documentation        │  --text-2xl font-weight:300
│                                 │
│  Photograph items before they   │  --text-sm --color-text-secondary
│  leave the showroom.            │  margin-bottom: var(--space-5)
│                                 │
│  ┌ - - - - - - - - - - - - ┐   │  .upload-zone (dashed, from brief §6)
│  |                         |   │  min-height: 200px
│  |      [Camera 32px]      |   │
│  |   TAP TO ADD PHOTOS     |   │  .section-label
│  |                         |   │
│  └ - - - - - - - - - - - - ┘   │
│                                 │
│  Optional — skip if all items   │  --text-xs --color-text-muted center
│  are already in inventory       │
│                                 │
│                 [72px spacer]   │
└─────────────────────────────────┘
├─────────────────────────────────┤
│  [ ← BACK ]  [ COMPLETE → ]    │  "COMPLETE ONBOARDING" fits if truncated
└─────────────────────────────────┘
```

**This step is optional.** "COMPLETE ONBOARDING" is enabled immediately — the rep can skip if all items are in inventory.

---

## Layout — Photos Added

```
┌─────────────────────────────────┐
│  ITEM PHOTOS                    │
│  Condition Documentation        │
│                                 │
│  Photograph items before they   │
│  leave the showroom.            │
│                                 │
│  ┌───────┐ ┌───────┐           │  2-column thumbnail grid
│  │[Photo]│ │[Photo]│           │  gap: var(--space-3)
│  │   [×] │ │   [×] │           │  × button top-right corner of each
│  └───────┘ └───────┘           │
│                                 │
│  ┌───────┐ ┌ - - - ┐           │  3rd photo + add-more zone side by side
│  │[Photo]│ |       |           │
│  │   [×] │ |  [+]  |           │  plus icon, --color-text-secondary
│  └───────┘ └ - - - ┘           │
│                                 │
│  [error if any upload failed]   │
│                                 │
└─────────────────────────────────┘
```

---

## Thumbnail Grid

- 2 columns, `gap: var(--space-3)`.
- Each thumbnail: `aspect-ratio: 1/1; object-fit: cover; border-radius: var(--radius-md); border: 1px solid var(--color-border); width: 100%`.
- Each thumbnail is wrapped in a `position: relative` container.
- **Remove button (×):** `position: absolute; top: var(--space-1); right: var(--space-1)`. Size: 28px × 28px. `background: rgba(10,10,10,0.72); border-radius: 50%; color: var(--color-text-primary)`. Lucide `X` 14px. Tapping removes photo from form state (does NOT call a delete API — already uploaded fileId is simply dropped from the list sent on submit).

### Add-More Zone (inline)

After the first photo, an "add more" tile appears in the grid alongside the existing thumbnails:

```css
.add-more-tile {
  aspect-ratio: 1/1;
  background: var(--color-surface);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
}
```

Lucide `Plus` 24px, `--color-text-secondary`. Hidden file input covers the tile.

**Max photos: 20.** When 20 reached, add-more tile is hidden. Show: `--text-xs --color-text-muted "20 photo limit reached"` below the grid.

---

## Upload States Per Photo

Each photo goes through its own upload lifecycle independently:

| State | Thumbnail Appearance |
|-------|---------------------|
| Uploading | Thumbnail dims to 50% opacity + `Loader2` spinner overlay centered |
| Success | Full opacity, × button shown |
| Error | Red dashed border `var(--color-danger)`, Lucide `AlertCircle` 16px overlay centered |

**On per-photo error:** small `--text-xs --color-danger` label below that thumbnail: "Upload failed. Tap × to remove and retry."

**"COMPLETE ONBOARDING" stays enabled** even if some uploads failed — the error photos are simply not included in the final fileId list. Rep decides whether to skip or retry.

---

## Step Complete Behavior

On tapping "COMPLETE ONBOARDING":
1. Button enters loading state.
2. `/api/attach-photos` called with all successfully uploaded fileIds.
3. On success → navigate to Success screen.
4. On error → `.alert .alert-danger`: "Onboarding saved, but photos could not be attached. Check the CRM record manually." Still advances to Success screen (non-blocking).

---

## Accessibility

- Hidden `<input type="file" accept="image/*" capture="environment" multiple>` on the main upload zone.
- `multiple` attribute allows selecting multiple files at once from the file picker (on desktop/Android).
- `aria-label="Add item photos"` on the hidden input.
- Add-more tile: `role="button"` + `tabindex="0"` + `aria-label="Add another photo"`.
- Remove buttons: `aria-label="Remove photo [N]"` (numbered).
- `aria-live="polite"` region announces per-photo upload completion/failure.
