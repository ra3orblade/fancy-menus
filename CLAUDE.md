# fancy-menus — project conventions

A fully-customizable React menu constructor. Consumers declare a typed
`MenuConfig` (chrome + body + sub-menus + keyboard + storage + lifecycle)
and the runtime renders + positions + handles input.

## Repo layout

```
fancy-menus/
├── packages/
│   └── core/                     ← the library (types + runtime)
│       ├── src/
│       │   ├── types/            ← schema (no runtime imports)
│       │   │   ├── enums.ts      ← every text constant lives here
│       │   │   ├── primitives.ts ← IconParam, ButtonSpec, Vertical, …
│       │   │   ├── position.ts   ← PositionConfig
│       │   │   ├── chrome.ts     ← ChromeConfig + Header/Footer slots
│       │   │   ├── source.ts     ← ItemSource (static/prop/store/async/…)
│       │   │   ├── row.ts        ← 15 row variants
│       │   │   ├── panel.ts      ← 22 panel variants
│       │   │   ├── field.ts      ← form field specs
│       │   │   ├── body.ts       ← list / grid / form / custom / composed
│       │   │   ├── sub-menu.ts   ← SubMenuSpec
│       │   │   ├── keyboard.ts   ← KeyboardConfig
│       │   │   ├── storage.ts    ← StorageAdapter contract
│       │   │   ├── lifecycle.ts  ← hooks
│       │   │   ├── context.ts    ← MenuCtx + ProviderOptions
│       │   │   └── menu-config.ts← MenuConfig + defineMenu()
│       │   └── runtime/          ← React rendering layer
│       │       ├── runtime.css   ← canonical design-system tokens
│       │       ├── store.ts      ← MenuStore (open stack)
│       │       ├── provider.tsx  ← MenuProvider + useMenu / useMenuStack
│       │       ├── ctx.ts        ← MenuCtx factory
│       │       ├── storage.ts    ← LocalStorage / Memory adapters
│       │       ├── position.ts   ← Floating UI bridge
│       │       ├── keyboard.ts   ← key handler hook
│       │       ├── source.ts     ← useResolvedSource + filterItems
│       │       ├── menu.tsx      ← Menu shell (chrome + body)
│       │       ├── menu-stack.tsx← stack renderer
│       │       ├── body.tsx      ← BodyKind dispatcher
│       │       ├── list-body.tsx ← virtualized list (tanstack-virtual)
│       │       ├── grid-body.tsx ← virtualized 2D grid
│       │       ├── form-body.tsx ← form runtime
│       │       ├── filter-input.tsx
│       │       ├── panels.tsx    ← every PanelKind renderer
│       │       └── rows/         ← per-RowKind renderers
│       │           ├── index.tsx ← dispatcher + RowRenderProps
│       │           ├── icon.tsx
│       │           ├── util.ts   ← renderRenderable, evalProp
│       │           ├── item.tsx
│       │           ├── section.tsx
│       │           ├── divider.tsx
│       │           ├── switch.tsx
│       │           ├── color.tsx
│       │           ├── add.tsx
│       │           ├── object.tsx
│       │           ├── participant.tsx
│       │           └── sortable.tsx
│       └── package.json          ← exports './', './types', './runtime',
│                                    './runtime.css'
└── examples/
		└── playground/               ← Vite + Tailwind + shadcn/ui
				├── src/
				│   ├── menus/            ← 10 example MenuConfigs
				│   ├── components/ui/    ← shadcn primitives
				│   ├── lib/utils.ts      ← cn()
				│   ├── styles/globals.css← Tailwind base + shadcn vars
				│   ├── App.tsx
				│   └── main.tsx          ← imports runtime.css
				├── scripts/
				│   ├── smoke.mjs         ← all examples mount + render
				│   └── interact.mjs      ← position + filter + keyboard nav
				├── tailwind.config.ts    ← scans BOTH src/ and core/runtime/
				├── components.json       ← shadcn config
				└── vite.config.ts        ← workspace alias to core/src
```

## Tech

- **Package manager:** Bun (`bun install`, `bun --filter '*' typecheck`)
- **Build / dev:** Vite (playground), tsc --noEmit for the library
- **Styling:** Tailwind CSS in the playground; `runtime.css` ships from core
	with a CSS custom-property design-system surface (`--fm-*`)
- **UI primitives in the demo:** shadcn/ui (Button, Toggle, Slider, Switch,
	Tabs, Input, Separator, ScrollArea) + lucide-react icons
- **Runtime deps in core:** `@floating-ui/react-dom`, `@tanstack/react-virtual`,
	`clsx`, `lucide-react`. No MobX, no Radix in core itself.

## Hard rules

1. **All text constants must be enums.** Every string-literal type union in
	 the schema (kind discriminators, modes, axes, anchor names, etc.) lives
	 in `packages/core/src/types/enums.ts` and is referenced from there.
	 Don't introduce new string literals in interfaces — extend the enums.
2. **List / grid bodies must virtualize.** The runtime never wraps a list
	 body in a non-virtualizing scroll container; @tanstack/react-virtual is
	 required past ~100 rows. Radix `ScrollArea` is OK for chrome (sidebar,
	 code panels, fixed-height popovers) only.
3. **Tailwind `content` glob must include `../../packages/core/src/runtime/**`.**
	 Otherwise Tailwind purges the runtime's classes (positioning,
	 z-index, etc.) and dialogs render as `position: static` flowing into the
	 document.
4. **Stylesheet is JS-imported, not @import-ed.** Vite's PostCSS pipeline
	 doesn't resolve `@fancy-menus/core/runtime.css` through workspace aliases;
	 the consumer must `import '@fancy-menus/core/runtime/runtime.css'` in JS.
5. **Store mutations produce new array references.** `useSyncExternalStore`
	 does shallow snapshot equality. `MenuStore` methods all do
	 `this.menus = [...next]`, never `push`/`pop`/in-place mutation.
6. **Dialog parent is `document.body`.** Menus portal there to escape
	 transformed/clipping ancestors.
7. **Generic defaults are `any`, not `unknown`.** Schema generics
	 (`TItem`, `TData`, `TValue`) default to `any` so inline configs get usable
	 types in callbacks; consumers that want strict typing pass them explicitly
	 to `defineMenu<MyData, MyValue>()`.

## Design-system token surface

`runtime.css` defines the public API for theming. Override any of these on
`:root` (or under `.dark` / `[data-theme='dark']`):

```
--fm-surface-bg / -fg / -border / -radius / -shadow
--fm-z-dimmer / --fm-z-menu
--fm-body-padding-x / -y          ← outer inset between body and menu border
--fm-row-padding-x / -y / -gap / -radius / -min-h / -big-min-h
--fm-section-padding-x / -top / -bot
--fm-chrome-padding-x / -y
--fm-font-size-row / -caption / -section
--fm-row-hover-bg / -active-bg / -active-fg / -disabled-opacity
--fm-divider-color
--fm-accent / -fg / --fm-destructive / --fm-muted-fg
```

Built-in component classes (consumers can target these for finer-grained
styling): `.fm-menu`, `.fm-dimmer`, `.fm-body`, `.fm-chrome`, `.fm-list`,
`.fm-row`, `.fm-row__name`, `.fm-row__icon`, `.fm-row__caption`,
`.fm-row__suffix`, `.fm-section`, `.fm-divider`, `.fm-switch`,
`.fm-switch__thumb`, `.fm-swatch`. Variants via attribute selectors:
`.fm-row[data-active='true']`, `.fm-switch[data-on='true']`,
`.fm-dimmer--passthrough`, `.fm-dimmer--visible`.

## Daily commands

```bash
# typecheck both packages
bun --filter '*' typecheck

# run the playground (Vite)
cd examples/playground && bun run dev

# smoke + interaction tests (require dev server running)
cd examples/playground && bun scripts/smoke.mjs
cd examples/playground && bun scripts/interact.mjs

# production build of the playground
cd examples/playground && bun run build
```

Both smoke scripts auto-detect the dev URL when `URL` env is unset (default
`http://localhost:5174`).

## Adding a new menu example

1. Author `examples/playground/src/menus/<name>.config.ts(x)`. Use
	 `defineMenu<TData, TValue>({ … })` and reference enums from
	 `@fancy-menus/core` (never string literals).
2. Register it in `examples/playground/src/menus/index.ts` with a one-line
	 description and sample data.
3. Add a smoke entry: `{ id, expect: '<css selector inside the dialog>' }`
	 in `scripts/smoke.mjs`.
4. The menu auto-appears in the playground sidebar.

## Adding a new RowKind / PanelKind / FieldKind

1. Add the enum member in `packages/core/src/types/enums.ts`.
2. Add the spec interface in `row.ts` / `panel.ts` / `field.ts`,
	 discriminated by the new enum member.
3. Implement the renderer:
	 - rows: new file under `packages/core/src/runtime/rows/`, register in
		 the dispatcher in `rows/index.tsx`
	 - panels: add a function in `runtime/panels.tsx`, register in `PanelView`
	 - fields: extend `runtime/form-body.tsx`'s `FieldView` switch
4. Style via `.fm-*` classes in `runtime.css` (do not introduce one-off
	 colors / paddings — derive them from the existing tokens or add new
	 tokens if the variant is broadly useful).

## Open work

- `7` — Storybook setup (one story per example config)
- More row kinds wired to the runtime: `chip`, `selectNav`, `filterRule`,
	`checkbox`
- Sub-menu spawning lifecycle (the `subMenus` registry exists but the
	runtime currently treats children as plain `useMenu().open()` calls)
- Drag-and-drop for `SortableRow` (dnd-kit; visual handle is in place)
- Richer panels: `codeEditor`, `katexPreview`, `qrCode`, `slider`,
	`markdownToolbar`, `tabBar` (as a panel, not just chrome)
- IconRegistry resolution in `IconView` (string-name icons currently
	render the literal string)
