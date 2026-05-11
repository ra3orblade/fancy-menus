# Recipes

Patterns that aren't single-line schema fields. All snippets are shipped
as runnable examples in `examples/playground/src/menus/`.

## Async picker with infinite scroll

```ts
defineMenu({
	id: 'assigneePicker',
	chrome: { filter: { placeholder: 'Search…' } },
	body: {
		kind: BodyKind.List,
		source: {
			kind: SourceKind.Async,
			pageSize: 20,
			fetch: async ({ offset, limit, filter }) => {
				const res = await api.searchPeople({ offset, limit, q: filter });
				return { items: res.items, hasMore: res.hasMore };
			},
		},
		rows: [{ kind: RowKind.Participant, /* … */ }],
		virtualized: { rowHeight: 44 },
		infiniteScroll: { pageSize: 20, loadMore: async () => [] },
	},
});
```

The runtime cancels in-flight pages when `filter` changes (via a generation
counter), so fast typing doesn't append stale results.

[Full source](../examples/playground/src/menus/assigneePicker.config.tsx)

## Cascading sub-menus with hover-spawn

```ts
defineMenu({
	id: 'rootMenu',
	body: {
		kind: BodyKind.List,
		source: { kind: SourceKind.Static, items: ITEMS },
		rows: [{
			kind: RowKind.Item,
			name: (it) => it.name,
			arrow: (it) => Boolean(it.subId),
			// Declarative sub-menu — runtime spawns on hover (200ms latched)
			// or ArrowRight, with safe-mouse polygon between parent and child.
			subMenuId: (it) => it.subId,
			subMenuTrigger: SubMenuTrigger.ArrowHover,
			subMenuHoverMs: 200,
		}],
	},
});
```

Sub-menus must be registered with the provider too:

```tsx
<MenuProvider menus={[rootMenu, formatMenu, textStyleMenu, ...]}>
```

Behavior contract:
- **Cascade close** — closing the root closes every descendant
- **Sibling replace** — opening a new sub-menu under the same parent
  closes the previous sibling
- **Focus return** — closing a sub-menu re-focuses the parent body
- **ArrowRight** opens / **ArrowLeft** closes the current sub-menu
- **Safe polygon** — a clip-pathed overlay between parent row and child
  menu lets the cursor travel diagonally without dismissing the child

[Full source](../examples/playground/src/menus/cascadingMenu.config.tsx)

## Replace-paged settings wizard

For multi-page navigation that feels like a single menu:

```ts
defineMenu({
	id: 'settings',
	chrome: { title: 'Settings' },
	body: {
		kind: BodyKind.List,
		source: { kind: SourceKind.Static, items: CATEGORIES },
		rows: [{
			kind: RowKind.Item,
			name: (it) => it.name,
			arrow: true,
			onClick: (item, _e, ctx) => {
				ctx.close();
				requestAnimationFrame(() => ctx.open(item.target, {
					element: ctx.data.triggerEl,
					data: ctx.data,
				}));
			},
		}],
	},
});

defineMenu({
	id: 'settingsAppearance',
	chrome: { title: 'Appearance', withBack: true /* wired from lifecycle.onMount */ },
	body: { kind: BodyKind.Form, fields: [...] },
});
```

[Full source](../examples/playground/src/menus/settingsWizard.config.tsx)

## Drag-reorder list with switches

```ts
defineMenu({
	id: 'columns',
	body: {
		kind: BodyKind.List,
		source: { kind: SourceKind.Static, items: COLUMNS },
		rows: [{
			kind: RowKind.Sortable,
			match: (it) => !it.pinned,
			inner: {
				kind: RowKind.Switch,
				name: (it) => it.name,
				switchValue: (it) => it.visible,
				onSwitch: (item, value) => store.setVisible(item.id, value),
			},
			onReorder: (oldIdx, newIdx) => store.reorder(oldIdx, newIdx),
		}, {
			kind: RowKind.Switch,
			match: (it) => Boolean(it.pinned),
			name: (it) => `${it.name} (pinned)`,
			switchValue: (it) => it.visible,
			readonly: true,
			onSwitch: () => {},
		}],
		sortable: { axis: SortAxis.Y, onReorder: (a, b) => store.reorder(a, b) },
	},
});
```

dnd-kit drives the drag; the handle is injected into the row's `prefix`
slot so hover states cover the entire row.

[Full source](../examples/playground/src/menus/columnVisibility.config.ts)

## Tabbed media picker

Each tab owns its own body — list / grid / form / composed all work:

```ts
defineMenu({
	id: 'mediaPicker',
	chrome: {
		tabs: {
			initialTab: 'library',
			persist: true, // saves last-active tab to storage
			tabs: [
				{ id: 'library', label: 'Library', body: { kind: BodyKind.Composed, sections: [...] } },
				{ id: 'upload',  label: 'Upload',  body: { kind: BodyKind.Composed, sections: [
					{ id: 'drop', kind: PanelKind.FileDropZone, accept: 'image/*', multiple: true,
					  pasteFromClipboard: true, onFiles: (files) => upload(files) },
				] } },
				{ id: 'url',     label: 'URL',     body: { kind: BodyKind.Form, fields: [...] } },
			],
		},
	},
	body: { kind: BodyKind.Custom, render: () => null }, // ignored when tabs are set
});
```

[Full source](../examples/playground/src/menus/mediaPicker.config.tsx)

## Custom body — drop in any React component

When the row catalog doesn't fit (a color picker with HSL sliders, a chart,
a code editor), use `BodyKind.Custom` and render whatever you want. You
keep the menu shell, positioning, keyboard shortcuts, animation, and
storage:

```ts
defineMenu({
	id: 'colorPicker',
	chrome: { title: 'Color' },
	body: {
		kind: BodyKind.Custom,
		measureHeight: () => 320,
		render: (ctx) => <HslColorPicker initial={ctx.data.initial} onApply={(hex) => {
			ctx.data.onSelect(hex);
			ctx.close();
		}} />,
	},
});
```

[Full source](../examples/playground/src/menus/colorPickerShadcn.config.tsx)

## Find-in-page (chrome-only menu)

When the entire UI lives in a custom header, set `body` to a
`Custom` panel that returns `null` — the runtime suppresses the body
wrapper (no empty bordered strip):

```ts
defineMenu({
	id: 'findInPage',
	chrome: {
		header: {
			kind: HeaderKind.SearchBar,
			placeholder: 'Find',
			counter: true, prevNext: true, clear: true,
		},
		dimmer: DimmerMode.None,
	},
	body: { kind: BodyKind.Custom, measureHeight: () => 0, render: () => null },
});
```

[Full source](../examples/playground/src/menus/findInPage.config.ts)

## Toolbar / format bar

`orientation: Horizontal` lays rows side-by-side (toolbar style). Pair
with `RowKind.Item` + `pressed` for toggle buttons:

```ts
defineMenu({
	id: 'textFormatter',
	chrome: { dimmer: DimmerMode.None },
	body: {
		kind: BodyKind.List,
		orientation: Orientation.Horizontal,
		source: {
			kind: SourceKind.Prop,
			getItems: (data) => ACTIONS.map((a) => ({
				...a,
				active: data.activeMarks.includes(a.id),
			})),
		},
		rows: [{
			kind: RowKind.Item,
			name: (it) => it.label,
			icon: (it) => ({ icon: it.icon, size: 14 }),
			tooltip: (it) => ({ text: it.label, caption: it.shortcut }),
			pressed: (it) => Boolean(it.active),
			onClick: (item, _e, ctx) => ctx.data.onToggleMark(item.id),
		}],
	},
});
```

[Full source](../examples/playground/src/menus/textFormatter.config.tsx)
