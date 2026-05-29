/**
 * @react-fancy-menus/core
 *
 * The configuration object schema for the menu constructor. This entry-point
 * re-exports every type a consumer needs to declare a menu.
 *
 * Design goals:
 *   1. Express any menu shape declaratively, including stress cases that
 *      defeat naive "list of items" abstractions:
 *        - tabbed pickers with drag-drop upload + image library + emoji grid
 *        - 2D-keyboard tile grids with paste handlers
 *        - recursive AND/OR query builders
 *        - large icon-card pickers with dynamic dependent settings
 *        - full-page tooltips with DOM target overlays
 *
 *   2. Be fully customizable at every layer:
 *        - Replace any built-in row / panel / chrome element via `kind: 'custom'`
 *        - Plug a custom storage adapter, async data source, or icon set
 *        - Override the positioning math (Floating UI by default; raw rect math
 *          escape hatch)
 *        - Theme via CSS custom properties; no SCSS dependency at the consumer
 *
 *   3. Stay typed end-to-end. `MenuConfig<TData, TValue>` carries the caller's
 *      data shape and the value shape produced by selection through every
 *      callback.
 */

export * from './types';
export * from './runtime';
