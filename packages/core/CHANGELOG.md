# Changelog

All notable changes to `@react-fancy-menus/core` are documented here. This
project adheres to [Semantic Versioning](https://semver.org/).

## 0.2.0

The runtime now honors four positioning / accessibility fields that were
declared in the public types but previously ignored, plus a new controlled
list mode for caret typeaheads. **All changes are additive** — configs and
call sites that don't use the new behavior are unaffected; no fields were
removed and no CSS class names or the keyboard model changed.

### Added / now honored

- **Per-open position override (`OpenParam.position`).** The runtime merges
  `param.position` over the static `config.position` at open time (and on
  `update(id, { position })`), with the per-open value winning per-key. One
  registered config can now open at different anchors / alignments instead of
  registering a config per (alignment × label). Unset keys fall back to
  `config.position`.

- **Pinned coordinates (`PositionConfig.fixedX` / `fixedY`).** When set (via
  config or per-open `param.position`), the anchor collapses to those viewport
  coordinates, overriding any `element` / `rect` anchor. Flip/shift clamping
  still applies. Works with no `element`/`rect` anchor at all (cursor-style
  menus no longer need a faked zero-area `DOMRect`).

- **Edge stickiness (`PositionConfig.stickToElementEdge`).** Honored: the menu
  snaps to the named `Edge` of the trigger regardless of the vertical/horizontal
  anchor, then flip/shift clamps it on-screen. The perpendicular alignment reads
  from the v/h anchor (defaulting to `start`).

- **Per-open accessible name (`OpenParam.ariaLabel`).** A new per-open field
  that wins over `config.chrome.ariaLabel`, letting one config carry many
  distinct screen-reader names. `chrome.ariaLabel` is honored on the outer
  shell for all roles (including `role="menu"`); the internal menu id is never
  exposed.

- **Controlled / presentational list mode (Issue 5).** A host (a caret
  `/`-menu, `@`-mention, inline picker) can render a real runtime menu it does
  not own focus for:
  - `ListBody.focusOnMount?: boolean` (default `true`) — when `false`, the list
    body renders + positions but never calls `.focus()`, so DOM focus stays in
    the editor / contenteditable. Mirrors `FilterConfig.focusOnMount`.
  - `OpenParam.activeIndex?: number` — a controlled highlight, updatable live
    via `update(id, { activeIndex })`. The painted active row is pixel-identical
    to keyboard-nav, and is scrolled into view as it moves.
  - The menu's `keyboard` config is now threaded into list bodies, so
    `KeyboardNavigation.None` (and `keyboard.disabled`) take effect — the
    runtime stays out of the host's way for arrow/enter keys. (A stray
    `Grid2D` on a list is coerced to `Linear`; grids drive their own nav.)

### Tests

- `runtime/position.test.ts` — per-open position merge (incl. a regression
  asserting `param.position` overrides `config.position` per-key), `fixedX/Y`
  point-anchoring, and `stickToElementEdge` placement.
- `runtime/menu-aria.test.ts` — per-open vs. config `ariaLabel` precedence.
- `runtime/list-body.test.tsx` — controlled/no-focus list mode: `focusOnMount:
  false` never steals focus, and a controlled `activeIndex` paints (and moves)
  the active row. This doubles as the runnable harness for the new mode
  (Storybook is intentionally not on this project's roadmap).

## 0.1.0

Initial release.
