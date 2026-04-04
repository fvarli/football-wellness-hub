# Body Soreness Map — Architecture

## Product Purpose

The body soreness map lets athletes mark which muscles are sore, tight, or painful during a daily wellness check-in. Coaches see the same data in read-only form on player detail screens.

Muscles are modeled as **canonical regions** so that each physical muscle has exactly one identity in the system regardless of which SVG view (front or back) it was selected from. This is critical because:

- The same muscle (e.g. calf) is visible from both front and back views
- Soreness data feeds into future load/risk calculations where one row per muscle per entry is required
- Duplicate entries for the same muscle would corrupt analytics

## Region Modeling

### Canonical Keys

Each muscle has one key. 26 total. Examples:

| Key | Label | Side | Views |
|---|---|---|---|
| `left_quadriceps` | L. Quadriceps | left | front |
| `right_hamstring` | R. Hamstring | right | back |
| `left_calf` | L. Calf | left | front, back |
| `chest` | Chest | center | front |
| `lower_back` | Lower Back | center | back |

Full registry: `src/lib/body-regions.ts` → `MUSCLE_REGIONS` array.

### Laterality

Every bilateral muscle has separate left/right keys (`left_shoulder`, `right_shoulder`). Center muscles (`chest`, `abdominals`, `traps`, `lower_back`) have a single key. This matters because athletes report soreness per side.

### View Is Metadata, Not Identity

Six muscles have SVG paths in both front and back views:

- `left_shoulder` / `right_shoulder`
- `left_forearm` / `right_forearm`
- `left_calf` / `right_calf`

Clicking the shoulder from the front or back SVG writes to the same `left_shoulder` key. The `REGION_VIEWS` map in `body-regions.ts` tracks which views each key appears in. The `view` field in a stored `BodyMapSelection` records which view was used at selection time — it's informational, not a key component.

## Rendering Architecture

### SVG Source

The muscle anatomy comes from a reference anatomical SVG. The original front/back path geometry is preserved in:

- `src/components/male-front-svg.tsx` — viewBox `0 0 180 505`
- `src/components/male-back-svg.tsx` — viewBox `0 0 153 502`

Each file has a non-interactive body outline (`.body-base`) and interactive muscle regions rendered via the `MR` (Muscle Region) component.

### Clickable Region Mapping

```
SVG <path> geometry
  → wrapped in <MR k="canonical_key" ctx={...}>
    → receives selection state via ctx.selections Map
    → fills with severity color via CSS currentColor
    → shows <title> tooltip with human label
    → fires ctx.onRegionClick(key) on click/Enter/Space
```

### Stored Selection Object

```typescript
interface BodyMapSelection {
  regionKey: string;      // canonical key, e.g. "left_calf"
  label: string;          // "L. Calf"
  view: "front" | "back"; // which view was used to select
  side: "left" | "right" | "center" | null;
  severity: number;       // 1–10
}
```

Selections are self-describing so consumers don't need the region registry to render labels.

## Interaction Model

| Action | Result |
|---|---|
| Click unselected muscle | **Focuses** the region and opens the severity picker. No selection is persisted yet. |
| Pick severity 1–10 on focused region | Creates the selection with the chosen severity |
| Click away / click same muscle again | Closes picker. If no severity was chosen, nothing is persisted. |
| Click already-selected muscle | Toggles severity picker open/closed (no duplicate created) |
| Click severity 1–10 on selected region | Updates that region's severity |
| Click "Remove" in picker | Removes the selection entirely |
| Click region in selected-areas list | Opens severity picker for that region |
| Click X on list item | Removes the selection |
| Read-only mode | No click handlers, no picker, no remove buttons; selections render as a static list |

### Front/Back View Same-Key Behavior

If `left_calf` is already selected (from front view) and the user switches to back view and clicks the back calf path, it opens the editor for the existing `left_calf` selection. No duplicate is created.

## Severity System

### Scale

1–10, where 1 = minimal discomfort, 10 = severe pain.

### Color Bands

| Range | Label | SVG Fill | Picker Button | List Badge |
|---|---|---|---|---|
| 1–3 | Mild | `#fde68a` | amber-300 | amber bg |
| 4–6 | Moderate | `#fb923c` | orange-400 | orange bg |
| 7–8 | High | `#f97316` | orange-500 | darker orange bg |
| 9–10 | Severe | `#dc2626` | red-600 | red bg |

All surfaces (SVG fill, picker, list badge, read-only summary) use the same 4-band scale defined in `body-map.tsx`.

## Accessibility and Responsiveness

### Desktop vs Mobile

- **Desktop (md+):** Front and back SVGs rendered side-by-side
- **Mobile (<md):** Tabbed toggle between front and back. Tab badges show count of selected regions per view.

Both layouts always exist in the DOM (mobile hidden via CSS). jsdom tests must use `getAllBy*` queries to handle this.

### Hover and Focus

- **Hover (unselected):** Fill brightens, subtle stroke appears around paths
- **Hover (selected):** Slight brightness increase
- **focus-visible (keyboard):** Blue stroke ring (`#3b82f6`). Only on keyboard navigation, not mouse.
- **Active (editor open):** Blue outline glow via `.active-region` CSS class

### Tooltips

Native SVG `<title>` elements inside each `<g>` show the muscle label on hover. Also set as `aria-label` for screen readers.

### Keyboard

Each muscle region has `role="button"`, `tabIndex={0}`, and responds to Enter/Space. Tab order follows DOM order (top-to-bottom, left-to-right within the SVG).

## Known Limitations / Deferred Work

| Item | Status |
|---|---|
| Backend persistence | Not implemented. Selections live in client state only. |
| ACWR / load calculations | Deferred. `regionKey` is the planned join key. |
| Injury risk engine | Deferred. |
| Female body map | Not implemented. Male only. |
| Advanced analytics | No charts, trends, or historical comparison. |
| Exercise recommendations | Out of scope for this feature. |

## Developer Notes

### Key Files

| File | Purpose |
|---|---|
| `src/lib/types.ts` | `BodyMapSelection`, `BodyMapView`, `BodySide` types |
| `src/lib/body-regions.ts` | `MUSCLE_REGIONS`, `REGION_VIEWS`, helpers (`getRegionMeta`, `getPrimaryView`, `getRegionViews`) |
| `src/components/body-map.tsx` | Main component: state, severity picker, selection list, layout |
| `src/components/male-front-svg.tsx` | Front SVG with `MR` region wrappers |
| `src/components/male-back-svg.tsx` | Back SVG with `MR` region wrappers |
| `src/components/body-map-summary.tsx` | Read-only summary list for player detail pages |
| `src/components/wellness-form.tsx` | Integrates body map into the check-in form (collapsible section) |
| `src/app/globals.css` | `.muscle-region` CSS for hover/focus/active states |
| `src/test/body-regions.test.ts` | Data model tests |
| `src/test/body-map.test.tsx` | Component interaction tests |

### Adding a New Region

1. Add the key to `MUSCLE_REGIONS` in `body-regions.ts`
2. Add its view(s) to `REGION_VIEWS`
3. Add the SVG `<path>` wrapped in `<MR k="new_key" ctx={c}>` in the appropriate SVG component
4. Run tests — the "no duplicate keys" test catches collisions automatically

### Things to Be Careful About

- **Never create view-specific keys** like `left_calf_back`. Use a single canonical key and list both views in `REGION_VIEWS`.
- **The `MR` component must be at module scope**, not inside a render function. React's `react-hooks/static-components` rule enforces this.
- **Both mobile and desktop SVG containers render in the DOM simultaneously.** Tests must use `getAllBy*` queries, not `getBy*`, to avoid duplicate-element errors.
- **Severity color functions** (`sevFill`, `sevStroke`, `sevBadgeBg`, `sevLabel`) in `body-map.tsx` must stay in sync with `severityColor`/`severityLabel` in `body-map-summary.tsx`. Both use the same 4-band scale.
