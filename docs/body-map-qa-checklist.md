# Body Soreness Map — QA Checklist

Manual verification steps for the anatomical body soreness map feature.

## Selection

- [ ] Click an unselected muscle region on the front view. It should highlight with mild severity color and the severity picker should appear showing 3 pre-selected.
- [ ] Click the same region again. The severity picker should close. The region stays selected.
- [ ] Click a different region. The picker switches to the new region. Both regions remain in the selected list.
- [ ] Verify no duplicate entries appear in the selected areas list when clicking a region multiple times.

## Canonical Key / Front-Back Unity

- [ ] Select L. Shoulder from the front view. Switch to back view. The L. Shoulder region on the back should also be highlighted with the same severity color.
- [ ] Click L. Shoulder on the back view. The severity picker should open for the existing selection, not create a duplicate.
- [ ] Repeat the above for L. Calf and L. Forearm (all three are shared front/back regions).
- [ ] Verify the selected areas list always shows one entry per muscle, not two.

## Severity

- [ ] Select a region, then click severity buttons 1 through 10 in order. The SVG fill color should progress through the 4-band scale: mild (amber) at 1–3, moderate (orange) at 4–6, high (deeper orange) at 7–8, severe (red) at 9–10.
- [ ] The severity number badge in the selected areas list should update in real-time.
- [ ] The severity label text (Mild / Moderate / High / Severe) should match the number.

## Remove

- [ ] Click "Remove" in the severity picker. The region should be deselected and removed from the list.
- [ ] Click the X button on a list item. Same result.
- [ ] After removing all selections, the empty state message should appear: "Select muscle groups with soreness, tightness, or pain".

## Sorting

- [ ] Select 3+ regions with different severities. The selected areas list should show highest severity first.
- [ ] Select 2 regions with the same severity. They should be sorted alphabetically by label.

## Read-Only Mode

- [ ] Open a player detail page with existing body map data (e.g. Liam O'Brien, player 3). The body soreness summary section should appear.
- [ ] Verify the read-only view shows region labels and severity badges but no severity picker, no remove buttons, and no click interaction.

## Responsive Layout

- [ ] **Desktop (>768px):** Front and back body maps should appear side-by-side.
- [ ] **Mobile (<768px):** Only one view visible at a time. Front/Back toggle buttons should appear. Badge counts on the tabs should reflect selections.
- [ ] Switch between Front and Back tabs. Selections should persist across tab switches.

## Hover and Focus

- [ ] **Desktop hover:** Hovering an unselected muscle should brighten its fill and show a subtle stroke outline.
- [ ] **Desktop hover (selected):** Hovering a selected muscle should slightly brighten it.
- [ ] **Tooltip:** Hovering a muscle should show a native tooltip with the muscle label (e.g. "L. Quadriceps").
- [ ] **Keyboard (Tab):** Tab through muscle regions. The focused region should show a blue outline ring (focus-visible only, not on mouse click).
- [ ] **Keyboard (Enter/Space):** Pressing Enter or Space on a focused region should select it.

## Form Integration

- [ ] Navigate to /check-in. Open the "Body Soreness Map" collapsible section.
- [ ] Select 2-3 regions with different severities.
- [ ] Fill out the rest of the wellness form and submit.
- [ ] The success screen should show the count of marked body areas.
- [ ] Click "Submit Another" — body map selections should be cleared.

## Automated Tests

- [ ] Run `npm test` — all 25 tests should pass (16 data model + 9 component).
- [ ] Run `npm run build` — no errors.
- [ ] Run `npm run lint` — no errors.
