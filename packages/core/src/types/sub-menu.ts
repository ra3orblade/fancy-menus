/**
 * Sub-menu wiring — declarative description of how this menu spawns children.
 *
 * Triggers observed across the inventory:
 *   arrowHover  — auto-open when the cursor lingers on an item with arrow=true
 *   arrowClick  — open on explicit click of an item with arrow=true
 *   moreIcon    — three-dot affordance on a row opens a context menu
 *   rightClick  — context menu via secondary click
 *   longPress   — N ms press-and-hold opens a variant picker (skin tones, etc.)
 *   replace     — swap the current menu's content for the child (paged nav,
 *                 typically with a back button in the chrome)
 *   programmatic — opened by user code via ctx.open() with no row trigger
 */

import type { MenuCtx } from './context';
import { SubMenuAnchor, SubMenuTrigger as Trigger } from './enums';

export { SubMenuTrigger } from './enums';

export interface SubMenuSpec<TItem = any> {
	/** Id of the menu to open (must be registered with the provider). */
	menuId: string;
	/** What gesture spawns the sub-menu. */
	trigger: Trigger;
	/** For `longPress` — hold duration in ms. Default: 200. */
	longPressMs?: number;
	/**
	 * Compute the data payload handed to the child menu. Receives the row item
	 * (when the trigger originates on a row) and the parent context.
	 */
	getData?: (item: TItem | undefined, ctx: MenuCtx) => unknown;
	/** Pass clicks through the child's dimmer to the parent body. */
	passThrough?: boolean;
	/** Disable axis flipping for the child positioning. */
	noFlipX?: boolean;
	noFlipY?: boolean;
	/**
	 * Anchor strategy:
	 *   'parent'    — anchor to the parent menu's right edge (default)
	 *   'item'      — anchor to the row element that triggered it
	 *   'cursor'    — anchor at the cursor position (right-click style)
	 *   custom fn   — return an element or DOMRect at runtime
	 */
	anchor?: SubMenuAnchor | ((ctx: MenuCtx, item?: TItem) => Element | DOMRect | null);
	/** Forward the parent's selection / value to the child. */
	forwardValue?: boolean;
	/** Keep the child menu open after a selection (for repeated picks). */
	keepOpenOnSelect?: boolean;
}
