# Quickstart

Five steps to a working menu.

## 1. Install

```sh
bun  add @react-fancy-menus/core react react-dom
# or
npm  install @react-fancy-menus/core react react-dom
# or
pnpm add @react-fancy-menus/core react react-dom
```

## 2. Mount the provider + import the stylesheet

```tsx
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MenuProvider } from '@react-fancy-menus/core';
import '@react-fancy-menus/core/runtime/runtime.css';
import { App } from './App';
import { commandPalette } from './menus/commandPalette.config';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<MenuProvider menus={[commandPalette]}>
			<App />
		</MenuProvider>
	</StrictMode>
);
```

> The CSS must be **JS-imported**. CSS `@import` doesn't go through Vite's
> module resolution and the subpath won't be found.

## 3. Author a menu

```ts
// src/menus/commandPalette.config.ts
import {
	defineMenu,
	BodyKind,
	RowKind,
	SourceKind,
	Vertical,
	Horizontal,
} from '@react-fancy-menus/core';
import { FileText, Search, Settings } from 'lucide-react';

interface Cmd {
	id: string;
	name: string;
	icon: any;
	shortcut?: string;
}

const COMMANDS: Cmd[] = [
	{ id: 'new',      name: 'New file',  icon: FileText, shortcut: '⌘N' },
	{ id: 'settings', name: 'Settings',  icon: Settings, shortcut: '⌘,' },
];

export const commandPalette = defineMenu<{ onPick: (id: string) => void }, string, Cmd>({
	id: 'commandPalette',
	position: { width: 480, vertical: Vertical.Bottom, horizontal: Horizontal.Center },
	chrome: {
		filter: { placeholder: 'Type a command…', icon: { icon: Search, size: 16 } },
	},
	body: {
		kind: BodyKind.List,
		source: { kind: SourceKind.Static, items: COMMANDS },
		rows: [{
			kind: RowKind.Item,
			name:    (c) => c.name,
			icon:    (c) => ({ icon: c.icon, size: 16 }),
			caption: (c) => c.shortcut,
			onClick: (item, _e, ctx) => {
				ctx.data.onPick(item.id);
				ctx.close();
			},
		}],
		virtualized: true,
	},
});
```

## 4. Open it

```tsx
// src/App.tsx
import { useRef } from 'react';
import { useMenu } from '@react-fancy-menus/core';

export function App() {
	const triggerRef = useRef<HTMLButtonElement | null>(null);
	const menu = useMenu();
	return (
		<button
			ref={triggerRef}
			onClick={() =>
				menu.open('commandPalette', {
					element: triggerRef.current!,
					data: { onPick: (id) => console.log('picked', id) },
				})
			}
		>
			Open
		</button>
	);
}
```

## 5. Theme it (optional)

Override any `--fm-*` token on `:root` (or under `[data-theme='dark']`):

```css
:root {
	--fm-surface-radius: 12px;
	--fm-row-padding-y: 6px;
	--fm-accent: hsl(263 70% 50%);
}
```

See [theming.md](./theming.md) for the full token surface.

## Next steps

- [Schema reference](./schema.md) — every config field, every primitive
- [Theming](./theming.md) — the `--fm-*` design system
- [Recipes](./recipes.md) — common patterns: cascading sub-menus, async
  pickers, replace-paged wizards, drag-reorder lists
- [Playground](https://github.com/ra3orblade/fancy-menus/tree/main/examples/playground) —
  14 worked examples
