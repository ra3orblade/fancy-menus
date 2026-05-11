## What changed

<!-- One paragraph. What does this PR do for users? -->

## Why

<!-- Optional context if it isn't obvious from the title. -->

## Verification

- [ ] `bun --filter '*' typecheck` clean
- [ ] `bun scripts/smoke.mjs` — all examples mount + render
- [ ] `bun scripts/interact.mjs` — positioning / keyboard
- [ ] `bun scripts/cascading.mjs` — sub-menus / safe polygon
- [ ] `bun scripts/visual.mjs` — toolbar pressed-state

## Schema impact

- [ ] No new string-literal type unions (extended `enums.ts` instead)
- [ ] If a public-facing config field changed, README.md tables are updated

## Screenshots

<!-- For visual changes, before/after screenshots. -->
