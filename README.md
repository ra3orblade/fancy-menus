# fancy-menus

A fully-customizable, declarative menu constructor for React. Author menus as
typed configuration objects; the runtime handles positioning (Floating UI),
keyboard navigation, virtualization (`@tanstack/react-virtual`), drag-reorder
(`@dnd-kit`), sub-menu stacking, persistence, lifecycle, and theming.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  defineMenu({ chrome, position, body, sub-menus, keyboard, storage })   │
├─────────────────────────────────────────────────────────────────────────┤
│  Body:  list  │  grid  │  form  │  custom  │  composed (mix anything)   │
│  Rows:  item · section · divider · switch · checkbox · select-nav ·     │
│         color · object · participant · add · sortable · chip · …        │
│  Panels: search · monthGrid · emojiGrid · tileGrid · fileDropZone ·     │
│         queryBuilder · slider · katex · qrCode · markdownToolbar · …    │
└─────────────────────────────────────────────────────────────────────────┘
```

> Status: pre-release. The schema is stable enough to author against; the
> runtime ships a meaningful subset of row / panel / field renderers and
> grows incrementally. See [Open work](#open-work).

## Quickstart

```sh
bun add @fancy-menus/core react react-dom
```

```tsx
// app.tsx
import { MenuProvider } from '@fancy-menus/core';
import '@fancy-menus/core/runtime/runtime.css';

import { commandPalette } from './menus/commandPalette.config';

export function App() {
	return (
		<MenuProvider menus={[commandPalette]}>
			<Toolbar />
		</MenuProvider>
	);
}
```

```tsx
// Toolbar.tsx
import { useRef } from 'react';
import { useMenu } from '@fancy-menus/core';

export function Toolbar() {
	const triggerRef = useRef<HTMLButtonElement | null>(null);
	const menu = useMenu();
	return (
		<button
			ref={triggerRef}
			onClick={() => menu.open('commandPalette', { element: triggerRef.current! })}
		>
			Open
		</button>
	);
}
```

```tsx
// menus/commandPalette.config.ts
import {
	defineMenu, BodyKind, RowKind, SourceKind, Vertical, Horizontal,
} from '@fancy-menus/core';
import { FileText, Settings } from 'lucide-react';

export const commandPalette = defineMenu({
	id: 'commandPalette',
	position: { vertical: Vertical.Bottom, horizontal: Horizontal.Center, width: 480 },
	chrome: {
		filter: { placeholder: 'Type a command…', focusOnMount: true },
	},
	body: {
		kind: BodyKind.List,
		source: { kind: SourceKind.Static, items: [
			{ id: 'open', name: 'Open File', icon: FileText, shortcut: '⌘O' },
			{ id: 'settings', name: 'Settings',  icon: Settings, shortcut: '⌘,' },
		]},
		rows: [{
			kind: RowKind.Item,
			name:    (it) => it.name,
			icon:    (it) => ({ icon: it.icon, size: 16 }),
			caption: (it) => it.shortcut,
			onClick: (item, _e, ctx) => { /* … */ ctx.close(); },
		}],
		virtualized: true,
	},
});
```

## Repo layout

```
fancy-menus/
├── packages/core/                  ← the library (types + runtime)
│   ├── src/types/                  ← schema, no runtime imports
│   │   ├── enums.ts                ← every text constant
│   │   ├── primitives.ts           ← IconParam, ButtonSpec, Vertical, …
│   │   ├── position.ts             ← PositionConfig
│   │   ├── chrome.ts               ← ChromeConfig + Header/Footer slots
│   │   ├── source.ts               ← ItemSource (static/prop/store/async/…)
│   │   ├── row.ts                  ← 15 row variants
│   │   ├── panel.ts                ← 22 panel variants
│   │   ├── field.ts                ← form field specs
│   │   ├── body.ts                 ← list/grid/form/custom/composed
│   │   ├── sub-menu.ts, keyboard.ts, storage.ts, lifecycle.ts,
│   │   ├── context.ts              ← MenuCtx + ProviderOptions
│   │   └── menu-config.ts          ← MenuConfig + defineMenu()
│   └── src/runtime/                ← React rendering layer
│       ├── runtime.css             ← canonical design-system tokens
│       ├── store.ts                ← MenuStore (open stack)
│       ├── provider.tsx            ← MenuProvider + useMenu / useMenuStack
│       ├── menu.tsx                ← single-menu shell (chrome + body)
│       ├── menu-stack.tsx          ← stack renderer
│       ├── body.tsx                ← BodyKind dispatcher
│       ├── list-body.tsx           ← virtualized list (+ dnd-kit)
│       ├── grid-body.tsx           ← virtualized 2D grid
│       ├── form-body.tsx           ← form fields
│       ├── panels.tsx              ← every PanelKind renderer
│       ├── filter-input.tsx, keyboard.ts, position.ts, source.ts,
│       ├── ctx.ts, storage.ts
│       └── rows/                   ← per-RowKind renderers
└── examples/playground/            ← Vite + Tailwind + shadcn/ui
    ├── src/menus/                  ← 10 example MenuConfigs
    └── scripts/                    ← smoke + interaction tests
```

## Top-level config: `MenuConfig`

```ts
defineMenu<TData = any, TValue = any, TItem = any>({ … }): MenuConfig
```

| field          | type                                | what it does |
|----------------|-------------------------------------|--------------|
| `id`           | `string`                            | unique registry key (used by `open(id)` and sub-menu wiring) |
| `kind`         | `MenuKind`                          | `Menu` (default), `Tooltip`, `Context`, `Inline` |
| `description`  | `string`                            | shown in dev-tools / playground |
| `position`     | [`PositionConfig`](#positionconfig) | where the menu opens, sizing, viewport behavior |
| `chrome`       | [`ChromeConfig`](#chromeconfig)     | title bar, tabs, filter, dimmer, header/footer |
| `body`         | [`BodyConfig`](#bodyconfig)         | the main content (list / grid / form / custom / composed) |
| `subMenus`     | `Record<string, SubMenuSpec>`       | declarative sub-menu wiring |
| `keyboard`     | [`KeyboardConfig`](#keyboardconfig) | nav defaults, custom shortcuts |
| `storage`      | [`StorageConfig`](#storageconfig)   | per-menu persistence |
| `lifecycle`    | [`LifecycleConfig`](#lifecycleconfig)| onOpen / onClose / onSelect / etc. |
| `group`        | `string`                            | use with `closeAll(group)` to close menu families together |
| `tags`         | `string[]`                          | metadata for analytics / dev tools |

Generic defaults are `any`; pass them explicitly when you want strict typing
on `MenuCtx<TData>` callbacks: `defineMenu<MyData, MyValue>({ … })`.

### `PositionConfig`

| field                     | type                              | default      | what it does |
|---------------------------|-----------------------------------|--------------|--------------|
| `strategy`                | `PositionStrategy`                | `Fixed`      | `Fixed` pins to viewport, `Absolute` flows with the document |
| `vertical`                | `Vertical`                        | `Bottom`     | `Top` / `Center` / `Bottom` anchor |
| `horizontal`              | `Horizontal`                      | `Left`       | `Left` / `Center` / `Right` anchor |
| `offsetX`, `offsetY`      | `number \| () => number`          | `0`          | pixel offset from the anchor |
| `fixedX`, `fixedY`        | `number`                          | —            | pin to absolute coords |
| `width`, `height`         | `number`                          | content      | lock body dimensions |
| `minWidth`, `maxWidth`    | `number`                          | `220` / —    | bounds |
| `minHeight`, `maxHeight`  | `number`                          | —            | bounds; combine `maxHeight` with a virtualized body |
| `noFlipX`, `noFlipY`      | `boolean`                         | `false`      | disable axis flipping when the menu would overflow |
| `noBorderX`, `noBorderY`  | `boolean`                         | `false`      | disable axis clamping inside the viewport |
| `stickToElementEdge`      | `Edge`                            | —            | snap to a specific edge of the trigger |
| `border`                  | `{top,bottom,left,right: number}` | `8`          | viewport padding for flip + shift + size |
| `recalcRect`              | `() => DOMRect \| null`           | —            | re-evaluate the trigger rect on every pass |
| `rebindOnScroll`          | `boolean`                         | `true`       | re-position on scroll |
| `followAnchor`            | `boolean`                         | `true`       | follow trigger movement; `false` = compute once and freeze |
| `fillViewport`            | `boolean`                         | `false`      | auto-cap maxHeight to available space |
| `withArrow`               | `boolean`                         | `false`      | draw an arrow pointing at the trigger |

Flip uses `fallbackStrategy: 'initialPlacement'` — the menu only flips when
the alternate side actually frees up space, so it never "flips then clips
again". Shift always runs (with `limitShift`) so the menu stays attached to
the trigger inside the viewport.

### `ChromeConfig`

| field          | type                              | what it does |
|----------------|-----------------------------------|--------------|
| `title`        | `string \| () => string`          | title bar |
| `withBack`     | `boolean`                         | back arrow + `onBack` |
| `withClose`    | `boolean`                         | close X in the title |
| `ariaLabel`    | `string`                          | accessible name fallback when `title` is a function or absent |
| `role`         | `'dialog' \| 'menu' \| 'listbox'` | ARIA role for the shell (default `dialog`) |
| `filter`       | [`FilterConfig`](#filterconfig)   | search input in the chrome |
| `tabs`         | [`TabsConfig`](#tabsconfig)       | tab strip; each tab owns its body |
| `dimmer`       | `DimmerMode`                      | `Default`, `None`, `PassThrough`, `Visible` |
| `passThrough`  | `boolean`                         | clicks reach the underlying page |
| `noAnimation`  | `boolean`                         | disable open/close animation |
| `noClose`      | `boolean`                         | disable dimmer-click and Escape |
| `header`       | `HeaderSlot`                      | replace the default title bar (`SearchBar`, `Custom`) |
| `footer`       | `FooterSlot`                      | `Buttons`, `Add`, `JumpBar`, `Sidebar`, `Custom` |
| `satellite`    | `ReactNode \| () => ReactNode`    | inline slot between header and body |
| `className`    | `string`                          | applied to the menu container |
| `classNameWrap`| `string`                          | applied to the outer wrapper |

#### `FilterConfig`

`placeholder`, `icon`, `focusOnMount` (default `true`), `debounceMs` (default
`250`), `underlined`, `showWhen` (`Always` / `Auto`), `threshold`, `onChange`.

#### `TabsConfig`

`initialTab`, `tabs: Array<{ id, label, icon?, body }>`, `rightSlot`,
`persist` (saves active tab to storage).

### `BodyConfig`

Five top-level kinds — discriminated by `kind`:

#### `kind: BodyKind.List`

| field             | type                            | what it does |
|-------------------|---------------------------------|--------------|
| `source`          | `ItemSource`                    | how items are fetched |
| `rows`            | `RowSpec[]`                     | row variants; first matching `match` predicate wins |
| `virtualized`     | `boolean \| { rowHeight, overscan?, measureRows? }` | required past ~100 rows |
| `infiniteScroll`  | `{ pageSize, loadMore }`        | pagination on scroll-near-end |
| `sortable`        | `{ axis?, isDraggable?, onReorder, keyboardShortcut? }` | drag-reorder via dnd-kit |
| `selection`       | `{ mode, value?, isSelected?, onChange, closeOnSelect?, maxCount? }` | single / multi |
| `emptyState`      | `EmptyStatePanel`               | shown when list is empty |
| `loading`         | `LoaderPanel \| boolean`        | overlay or inline |
| `onFilterChange`  | `(value, ctx) => void`          | called when chrome filter changes |

#### `kind: BodyKind.Grid`

`source`, `columns: number | GridColumns.Auto`, `rowHeight`, `gap?`,
`renderCell`, `responsive: { minCellWidth }`, `virtualized?`,
`keyboardNav2D?`, `selection?`, `emptyState?`, `loading?`,
`acceptDrop?: { accept, multiple, onFiles }`, `pasteFromClipboard?`,
`onCellClick`, `onCellContextMenu`, `onCellLongPress`, `longPressMs`.

#### `kind: BodyKind.Form`

`fields: FieldSpec[]`, `initialValues?`, `validate?`, `onSubmit`,
`submit?: ButtonSpec | null`, `layout?: FormLayout`, `debounceMs?`.

#### `kind: BodyKind.Custom`

`render: (ctx) => ReactNode`, `measureHeight?: (ctx) => number`. Use this
for full visual control while keeping the menu shell, positioning, keyboard,
storage, and lifecycle. A `measureHeight` returning `0` suppresses the body
wrapper entirely (e.g. for find-in-page where the chrome carries the UI).

#### `kind: BodyKind.Composed`

`sections: Array<(ListBody | GridBody | FormBody | CustomBody | PanelSpec) & { id }>`,
`gap?`, `scroll?: ComposedScroll`. Stack any mix of bodies and panels
vertically.

### Rows (`RowSpec`)

Discriminated by `kind: RowKind.*`. Common base fields: `match?`, `className?`,
`tooltip?`, `disabled?`, `readonly?`, `hidden?`, `skipOver?`.

| RowKind         | what it renders |
|-----------------|-----------------|
| `Item`          | icon + name + caption + arrow + more |
| `Section`       | uppercased section header |
| `Divider`       | thin horizontal line |
| `Switch`        | item + Switch toggle on the right |
| `Checkbox`      | item + checkbox |
| `SelectNav`     | item + caption (current value) + arrow → opens sub-menu |
| `Color`         | colored swatch + name + active check |
| `Object`        | rendered icon + name + type caption (+ `withDescription` for inline caption) |
| `Add`           | "+" inline add row; `useFilterAsName` injects the current filter |
| `Sortable`      | wraps an inner row spec; injects a drag handle into the inner row's `prefix` slot |
| `Chip`          | pill-style chip with optional trailing icon (sort rules) |
| `FilterRule`    | composite: relation icon + condition label + value preview |
| `Participant`   | avatar + name + identity + selection check |
| `Empty`         | empty-state pseudo-row |
| `Custom`        | full render control (`render(item, ctx)`) |

### Panels (`PanelSpec`) — used inside `Composed` bodies

`SearchInput`, `TabBar`, `TileGrid`, `EmojiGrid`, `RecentStrip`,
`CategoryJump`, `FileDropZone`, `MonthGrid`, `CodeEditor`, `KatexPreview`,
`QrCode`, `Slider`, `LinkPreview`, `Loader`, `EmptyState`, `Error`,
`MarkdownToolbar`, `QueryBuilder` (recursive AND/OR), `Label`, `Divider`,
`Banner`, `Custom`.

### Form fields (`FieldSpec`)

`Text`, `TextArea`, `Switch`, `Checkbox`, `Select`, `Color`, `Date`, `Icon`,
`File`, `Button`, `Custom`. Common base: `name`, `label`, `description`,
`required`, `disabled`, `hidden`, `validate`, `defaultValue`.

### Sources (`ItemSource`)

| `SourceKind` | shape |
|--------------|-------|
| `Static`     | `{ items: TItem[] }` |
| `Prop`       | `{ getItems: (data) => TItem[] }` |
| `Store`      | `{ selector: () => TItem[]; deps? }` |
| `Async`      | `{ pageSize, fetch: ({ offset, limit, filter, signal }) => Promise<{ items, hasMore? }>; cacheKey?; refetchOn? }` |
| `Sections`   | `{ getSections: (data) => Section[] }` |
| `Composite`  | `{ sources, dedupeBy? }` |

### Sub-menus (`SubMenuSpec`)

`menuId`, `trigger: SubMenuTrigger` (`ArrowHover`, `ArrowClick`, `MoreIcon`,
`RightClick`, `LongPress`, `Replace`, `Programmatic`), `longPressMs?`,
`getData?`, `passThrough?`, `noFlipX/Y?`,
`anchor: SubMenuAnchor.Parent | Item | Cursor | (ctx, item) => Element|DOMRect|null`,
`forwardValue?`, `keepOpenOnSelect?`.

### `KeyboardConfig`

`disabled?`, `navigation: KeyboardNavigation` (`None`, `Linear`, `Grid2D`),
`defaults: { closeOnEscape?, selectOnEnter?, selectOnTab?, arrowsToSubmenu?,
spaceToSwitch?, backspaceToRemove?, shiftArrowToSort?, cycleWrap? }`,
`shortcuts: ShortcutBinding[]`, `onKeyDown(e, ctx) => boolean | void` (return
`true` to suppress defaults).

### `StorageConfig`

`key?` (defaults to menu id), `fields?: string[]` (which body-state keys to
persist), `adapter?: StorageAdapter`, `version?` + `migrate?`.

### `LifecycleConfig`

`onBeforeOpen` (veto) → `onMount` (return cleanup) → `onOpen` →
`onChange` / `onSelect` / `onSubmit` → `onBeforeClose` (veto) → `onClose`.
`onError` for unhandled exceptions in any hook.

### `MenuCtx` (passed to every callback)

```ts
{
	id, data, storage: { get, set },
	open, close, closeAll, update, updateData,
	position, setActive, setHover, updateOther, isOpen,
}
```

### `ProviderOptions`

`storage?: StorageAdapter`, `iconRegistry?: Record<string, IconComponent>`
(resolves string-named icons), `theme?: ThemeTokens`, `locale?: LocaleStrings`,
`onError`, `onAnalytics`, `isAboveOverlay`.

## Theming — the `--fm-*` design system

`runtime.css` defines the public token surface. Override on `:root` or under
a `.dark` / `[data-theme='dark']` selector.

| token | purpose |
|-------|---------|
| `--fm-surface-bg / -fg / -border / -radius / -shadow` | menu container |
| `--fm-z-dimmer` / `--fm-z-menu` | z-index stack |
| `--fm-body-padding-x / -y` | inset between body and menu border |
| `--fm-row-padding-x / -y / -gap / -radius / -min-h / -big-min-h` | row geometry |
| `--fm-section-padding-x / -top / -bot` | section header |
| `--fm-chrome-padding-x / -y` | header / footer / filter |
| `--fm-font-size-row / -caption / -section` | typography |
| `--fm-row-hover-bg / -active-bg / -active-fg / -disabled-opacity` | row states |
| `--fm-divider-color` | separators |
| `--fm-accent / -fg / --fm-destructive / --fm-muted-fg` | accents |

Built-in component classes consumers can target for finer control:
`.fm-menu`, `.fm-dimmer`, `.fm-body`, `.fm-chrome`, `.fm-list`, `.fm-row`,
`.fm-row__name`, `.fm-row__icon`, `.fm-row__caption`, `.fm-row__suffix`,
`.fm-section`, `.fm-divider`, `.fm-switch`, `.fm-switch__thumb`, `.fm-swatch`.
Variants via attribute selectors: `.fm-row[data-active='true']`,
`.fm-switch[data-on='true']`, `.fm-dimmer--passthrough`,
`.fm-dimmer--visible`.

## Playground

```sh
bun install
cd examples/playground
bun run dev
```

Sidebar | Editor | Preview layout. Each example exposes its config as
form controls (Edit tab) and as live JSON (JSON tab); changes re-register
the menu and re-open it so you can see the effect immediately.

Smoke and interaction tests:

```sh
cd examples/playground
bun scripts/smoke.mjs
bun scripts/interact.mjs
```

## Open work

- More row variants in the runtime: `chip`, `selectNav`, `filterRule`, `checkbox`
- Sub-menu spawning lifecycle (the `subMenus` registry exists; runtime
  currently treats children as plain `useMenu().open()` calls)
- Horizontal list orientation + buttons row primitive
- Richer panels: `codeEditor`, `katexPreview`, `qrCode`, `slider`,
  `markdownToolbar`, `tabBar` (as a panel, not just chrome)
- IconRegistry resolution in `IconView` (string-name icons currently render
  the literal string)
- More complex example menus (replace-paged settings wizard, cascading
  context menu with hover-spawned sub-menus, share-flow)

See `CLAUDE.md` for repo conventions.

## License

MIT
