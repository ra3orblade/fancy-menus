# Contributing to fancy-menus

Thanks for considering a contribution. This guide covers the dev loop, the
code conventions the runtime relies on, and what to include in a PR.

## Dev setup

Requirements: **Bun ≥ 1.1**, Node 18+ available on PATH (Vite still uses it
for some plugins).

```sh
bun install
bun --filter '*' typecheck
```

Run the playground with hot-reload:

```sh
cd examples/playground
bun run dev
# open the URL printed (default http://localhost:5174)
```

Run the test suites (the dev server must be up):

```sh
cd examples/playground
bun scripts/smoke.mjs       # all examples mount + render expected content
bun scripts/interact.mjs    # positioning / filter / keyboard nav
bun scripts/cascading.mjs   # cascading sub-menus + safe polygon
bun scripts/visual.mjs      # toolbar pressed-state / horizontal layout
```

A green run is `14/14` smoke, `6/6` interaction, `8/8` cascading, `5/5`
visual, and a clean typecheck on both packages.

## Repo layout

```
packages/core/src/types/      ← schema (no runtime imports)
packages/core/src/runtime/    ← React rendering layer
packages/core/src/runtime/runtime.css ← canonical design-system tokens
examples/playground/          ← Vite + Tailwind + shadcn/ui demo
examples/playground/scripts/  ← puppeteer-based test suites
```

See `CLAUDE.md` for the longer architectural tour.

## Hard rules

These aren't preferences — the runtime depends on them. PRs that break any
of these will get bounced.

1. **All text constants are enums.** Every string-literal type union in the
   schema (`kind` discriminators, modes, axes, anchor names, etc.) lives in
   `packages/core/src/types/enums.ts`. Don't introduce new string literals
   in interfaces — extend the enums.
2. **List / grid bodies must virtualize past ~100 rows.** The runtime never
   wraps a list body in a non-virtualizing scroll container. Radix
   `ScrollArea` is OK for chrome (sidebars, code panels) only.
3. **Tailwind `content` glob (in the playground) must include
   `../../packages/core/src/runtime/**`.** Otherwise Tailwind purges the
   runtime's classes and dialogs render as `position: static`.
4. **`runtime.css` is JS-imported, not `@import`-ed.** Vite's PostCSS
   pipeline doesn't resolve `@react-fancy-menus/core/runtime.css` through
   workspace aliases.
5. **Store mutations produce new array references.**
   `useSyncExternalStore` does shallow snapshot equality. `MenuStore`
   methods all do `this.menus = [...next]`, never `push` / `pop` /
   in-place mutation.
6. **Dialog parent is `document.body`.** Menus portal there to escape
   transformed/clipping ancestors.
7. **Generic defaults are `any`, not `unknown`.** Schema generics
   (`TItem`, `TData`, `TValue`) default to `any` so inline configs get
   usable types in callbacks; consumers wanting strict typing pass them
   to `defineMenu<MyData, MyValue>()`.
8. **Tab indentation everywhere.** `.editorconfig` enforces it. CSS, MD,
   JSON and TS all use tabs.

## Extending the schema

### Adding a new `RowKind`

1. Add the enum member in `packages/core/src/types/enums.ts`.
2. Add the spec interface in `packages/core/src/types/row.ts`,
   discriminated by the new enum member.
3. Implement the renderer in a new file under
   `packages/core/src/runtime/rows/` and register it in the dispatcher in
   `rows/index.tsx`.
4. Style via `.fm-*` classes in `runtime.css`. Don't introduce one-off
   colors / paddings — derive them from the existing `--fm-*` tokens or
   add new tokens if the variant is broadly useful.
5. Add an example menu in `examples/playground/src/menus/` that exercises
   the new row, register it in `examples/playground/src/menus/index.ts`,
   and add a smoke entry in `scripts/smoke.mjs`.

### Adding a new `PanelKind`

Same pattern as rows but in `packages/core/src/types/panel.ts` /
`packages/core/src/runtime/panels.tsx`.

### Adding a new `FieldKind`

Add to `packages/core/src/types/field.ts` / extend the `FieldView` switch
in `packages/core/src/runtime/form-body.tsx`.

## PR checklist

- [ ] `bun --filter '*' typecheck` passes
- [ ] All four playground test suites pass (smoke / interaction /
      cascading / visual)
- [ ] If you added a public-facing config field, README.md's per-field
      tables are updated
- [ ] If your change is user-visible, add or update an example menu
- [ ] No new string-literal type unions; extend enums.ts instead
- [ ] Runtime imports from `lucide-react` directly (don't ship icons via
      a registry layer in core unless that's the change)

## Commit style

We prefer present-tense imperative subjects ("add color row" not "added
color row"). No type prefixes required.

## Filing issues

Bugs: include the exact menu config that reproduces, the runtime version,
and what you expected vs. what happened. A puppeteer / playwright snippet
that reproduces in the playground is gold.

Feature requests: describe the menu pattern you're trying to express
declaratively and why the current row / panel catalogue doesn't fit. If
it does fit, you're probably looking for a new example, not a new
primitive.

## License

By contributing, you agree your contributions are licensed under the
MIT License (see `LICENSE`).
