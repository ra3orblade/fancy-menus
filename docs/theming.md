# Theming

Everything visual in `fancy-menus` is driven by CSS custom properties on
`:root`. Override any of them — globally, per-scope (`.dark`,
`[data-theme='dark']`), or per-menu (apply a class via `chrome.className`).

## Token surface

### Surface

| Token                    | Default                                                    | Meaning                       |
|--------------------------|------------------------------------------------------------|-------------------------------|
| `--fm-surface-bg`        | `hsl(0 0% 100%)`                                           | menu container background     |
| `--fm-surface-fg`        | `hsl(222.2 84% 4.9%)`                                      | text color                    |
| `--fm-surface-border`    | `hsl(214.3 31.8% 91.4%)`                                   | border color                  |
| `--fm-surface-radius`    | `8px`                                                      | corner radius                 |
| `--fm-surface-shadow`    | `0 10px 28px -8px rgb(0 0 0 / 0.18), …`                    | drop shadow                   |

### Stack

| Token                    | Default | Meaning                       |
|--------------------------|---------|-------------------------------|
| `--fm-z-dimmer`          | `1000`  | backdrop z-index              |
| `--fm-z-menu`            | `1001`  | menu z-index                  |

### Density

| Token                       | Default | Meaning                                                          |
|-----------------------------|---------|------------------------------------------------------------------|
| `--fm-body-padding-x`       | `4px`   | inset between body and menu border (keeps row hovers off the edge) |
| `--fm-body-padding-y`       | `4px`   | top/bottom inset                                                 |
| `--fm-row-padding-x`        | `8px`   | horizontal padding inside a row                                  |
| `--fm-row-padding-y`        | `4px`   | vertical padding                                                 |
| `--fm-row-gap`              | `8px`   | gap between icon, name, caption, suffix                          |
| `--fm-row-radius`           | `4px`   | row corner radius                                                |
| `--fm-row-min-h`            | `28px`  | minimum row height                                               |
| `--fm-row-big-min-h`        | `44px`  | minimum height for `isBig` rows                                  |
| `--fm-section-padding-x`    | `8px`   | section header horizontal padding                                |
| `--fm-section-padding-top`  | `8px`   | section header top padding                                       |
| `--fm-section-padding-bot`  | `4px`   | section header bottom padding                                    |
| `--fm-chrome-padding-x`     | `12px`  | header / footer horizontal padding                               |
| `--fm-chrome-padding-y`     | `8px`   | header / footer vertical padding                                 |

### Typography

| Token                       | Default     | Meaning                |
|-----------------------------|-------------|------------------------|
| `--fm-font-size-row`        | `13px`      | row body text          |
| `--fm-font-size-caption`    | `11px`      | row caption / shortcut |
| `--fm-font-size-section`    | `10px`      | section header         |
| `--fm-font-weight-section`  | `600`       | section header weight  |
| `--fm-letter-section`       | `0.06em`    | section letter-spacing |
| `--fm-line-height-row`      | `1.3`       | row line-height        |

### States

| Token                      | Default                              | Meaning                                          |
|----------------------------|--------------------------------------|--------------------------------------------------|
| `--fm-row-hover-bg`        | `hsl(210 40% 96.1% / 0.6)`           | row hover background                             |
| `--fm-row-active-bg`       | `hsl(210 40% 96.1%)`                 | row keyboard-active / aria-selected background   |
| `--fm-row-active-fg`       | `hsl(222.2 47.4% 11.2%)`             | row keyboard-active text                         |
| `--fm-row-disabled-opacity`| `0.5`                                | disabled-row opacity                             |
| `--fm-divider-color`       | `var(--fm-surface-border)`           | row separator                                    |
| `--fm-accent`              | `hsl(222.2 47.4% 11.2%)`             | accent color (switch on, pressed item, check)    |
| `--fm-accent-fg`           | `hsl(210 40% 98%)`                   | text on accent background                        |
| `--fm-destructive`         | `hsl(0 84.2% 60.2%)`                 | destructive action color                         |
| `--fm-muted-fg`            | `hsl(215.4 16.3% 46.9%)`             | muted text (icons, captions)                     |

## Dark mode

`runtime.css` ships a `.dark` / `[data-theme='dark']` block that overrides
the colors. Toggle dark mode by setting one of those on `<html>` or `<body>`:

```ts
document.documentElement.dataset.theme = 'dark';
```

To customize dark mode:

```css
[data-theme='dark'] {
	--fm-surface-bg:   hsl(220 13% 12%);
	--fm-row-hover-bg: hsl(220 13% 18% / 0.7);
	--fm-accent:       hsl(263 70% 60%);
}
```

## Per-menu overrides

Apply a class via `chrome.className` (on the menu element) or
`chrome.classNameWrap` (on the outer wrapper) and target it with CSS:

```css
.menu-tighter {
	--fm-row-padding-y: 2px;
	--fm-row-min-h: 22px;
	--fm-font-size-row: 12px;
}
```

```ts
defineMenu({
	id: 'mySettings',
	chrome: { className: 'menu-tighter' },
	body: { … },
});
```

## Component classes

Target these for finer-grained styling (selector specificity puts them
above the variable defaults):

| Class                      | What it is                              |
|----------------------------|-----------------------------------------|
| `.fm-menu`                 | menu container                          |
| `.fm-menu[data-placement]` | resolved Floating UI placement (e.g. `bottom-start`) |
| `.fm-menu[data-fm-menu-id]`| menu id                                 |
| `.fm-dimmer`               | backdrop                                |
| `.fm-dimmer--passthrough`  | pass-through dimmer variant             |
| `.fm-dimmer--visible`      | explicit-visible dimmer                 |
| `.fm-body`                 | body container                          |
| `.fm-list`                 | scroll viewport for ListBody            |
| `.fm-list--horizontal`     | toolbar variant                         |
| `.fm-row`                  | a single row                            |
| `.fm-row[data-active]`     | keyboard-active row                     |
| `.fm-row[data-pressed]`    | toggle-button-style pressed row         |
| `.fm-row[data-disabled]`   | disabled row                            |
| `.fm-row__name`            | name slot                               |
| `.fm-row__icon`            | leading icon slot                       |
| `.fm-row__caption`         | trailing caption / shortcut             |
| `.fm-row__suffix`          | trailing arrow / more affordance        |
| `.fm-section`              | section header                          |
| `.fm-divider`              | divider line                            |
| `.fm-switch`               | switch widget                           |
| `.fm-switch[data-on]`      | switch on-state                         |
| `.fm-swatch`               | color swatch box                        |

## Overriding the open animation

The default open animation is a small zoom-in keyed off `transform-origin`
(set per-placement so it grows from the trigger edge). Disable it
per-menu:

```ts
defineMenu({ id: '…', chrome: { noAnimation: true }, body: { … } });
```

Or replace it globally — `runtime.css` exposes the keyframes:

```css
.fm-menu { animation-duration: 80ms; }
```
