# @react-fancy-menus/core

A fully-customizable React menu constructor. Declare a typed `MenuConfig`
(chrome + body + sub-menus + keyboard + storage + lifecycle) and the runtime
renders, positions, and handles input for you.

## Install

```bash
npm install @react-fancy-menus/core
# or: bun add @react-fancy-menus/core
```

Peer dependencies: `react` and `react-dom` (`^18 || ^19`).

## Usage

```tsx
import { defineMenu } from '@react-fancy-menus/core';
import { MenuProvider } from '@react-fancy-menus/core/runtime';
import '@react-fancy-menus/core/runtime.css';

const menu = defineMenu({
  // chrome, body, subMenus, keyboard, storage, lifecycle…
});
```

> **Note:** import the stylesheet from JavaScript
> (`import '@react-fancy-menus/core/runtime.css'`) rather than via CSS `@import` —
> bundler PostCSS pipelines don't resolve the package export through CSS.

## Entry points

| Import | Contents |
|---|---|
| `@react-fancy-menus/core` | `defineMenu()` + the full config schema (types) |
| `@react-fancy-menus/core/types` | schema types only (no runtime) |
| `@react-fancy-menus/core/runtime` | React rendering layer (`MenuProvider`, hooks, store) |
| `@react-fancy-menus/core/runtime.css` | canonical design-system tokens + component classes |

## Theming

`runtime.css` exposes a CSS custom-property surface (`--fm-*`). Override any
token on `:root` (or `.dark` / `[data-theme='dark']`) — for example
`--fm-surface-bg`, `--fm-accent`, `--fm-row-padding-x`, `--fm-z-menu`. Built-in
component classes (`.fm-menu`, `.fm-row`, `.fm-switch`, …) are stable targets
for finer-grained styling.

## License

MIT © Andrew Simachev
