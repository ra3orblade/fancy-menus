/**
 * MenuConfig — the top-level configuration object for a menu.
 *
 * A consumer composes a menu by writing one literal value of this type and
 * registering it with the runtime (or passing it directly to `<Menu>`).
 *
 * Type parameters:
 *   TData   — shape of the data passed in via `open(id, { data })`
 *   TValue  — shape of the value produced by selection / submission
 *   TItem   — element shape of the body's items (when applicable)
 *
 * Example sketch (full examples live in the playground package):
 *
 *   const cmdK: MenuConfig<{ recents: string[] }, string> = {
 *     id: 'commandPalette',
 *     chrome: {
 *       filter: { placeholder: 'Type a command…', focusOnMount: true },
 *     },
 *     body: {
 *       kind: 'list',
 *       source: { kind: 'static', items: COMMANDS },
 *       rows: [
 *         { kind: 'section', match: it => it.isSection, name: it => it.name },
 *         { kind: 'item', name: it => it.name, icon: it => it.icon, caption: it => it.shortcut, onClick: ... },
 *       ],
 *     },
 *     keyboard: { defaults: { selectOnEnter: true, closeOnEscape: true } },
 *   };
 */

import type { BodyConfig } from './body';
import type { ChromeConfig } from './chrome';
import type { KeyboardConfig } from './keyboard';
import type { LifecycleConfig } from './lifecycle';
import type { PositionConfig } from './position';
import type { StyleSlot } from './primitives';
import type { StorageConfig } from './storage';
import type { SubMenuSpec } from './sub-menu';

export { MenuKind } from './enums';
import { MenuKind } from './enums';

export interface MenuConfig<TData = any, TValue = any, TItem = any> extends StyleSlot {
	/** Unique id used by the runtime registry and by sub-menu wiring. */
	id: string;

	/** Default category. Callers can override at open time. */
	kind?: MenuKind;

	/** Optional human-readable description (used by docs / dev tools). */
	description?: string;

	/** Default position; merged with the per-open override. */
	position?: PositionConfig;

	/** Title bar / tabs / filter / dimmer / footer. */
	chrome?: ChromeConfig;

	/** The main content. */
	body: BodyConfig<TItem, TValue, TData>;

	/** Sub-menus this menu can spawn. */
	subMenus?: Record<string, SubMenuSpec<TItem>>;

	/** Keyboard handling. */
	keyboard?: KeyboardConfig;

	/** Persistence. */
	storage?: StorageConfig;

	/** Lifecycle hooks. */
	lifecycle?: LifecycleConfig<TData, TValue>;

	/**
	 * Group key used by `closeAll(group)`. Menus sharing a group close together
	 * — useful for cell-editor stacks, inline toolbars, and similar families.
	 */
	group?: string;

	/** Tag the menu so devtools and analytics can categorise it. */
	tags?: string[];
}

/**
 * Helper for declaring a config with strong inference. Equivalent to a typed
 * literal but reads better at the call site:
 *
 *   export const myMenu = defineMenu({ id: 'foo', body: { kind: 'list', ... } });
 */
export function defineMenu<TData = any, TValue = any, TItem = any>(
	config: MenuConfig<TData, TValue, TItem>
): MenuConfig<TData, TValue, TItem> {
	return config;
}
