/**
 * Keyboard configuration. Defaults follow common menu conventions:
 *   - ArrowUp / ArrowDown  cycle the active row
 *   - Enter / Tab          select the active row (or open sub-menu if arrow)
 *   - Escape               close the menu
 *   - ArrowLeft            close the current sub-menu (on parent context)
 *   - ArrowRight           open the sub-menu of the active row
 *   - Backspace            remove the active row when row supports it
 *   - Space                toggle the active row's switch (when present)
 *   - Shift+ArrowUp/Down   reorder via sortable hook
 *   - Cmd/Ctrl+P / +N      cycle on macOS
 *
 * Override any of the above through `shortcuts`, or disable defaults via
 * the `defaults` flags.
 */

import type { MenuCtx } from './context';
import { KeyboardNavigation } from './enums';
import type { ShortcutBinding } from './primitives';

export interface KeyboardConfig {
	/** Disable keyboard navigation entirely. */
	disabled?: boolean;
	/** Navigation mode — 1d list (default) or 2d-grid (for grid bodies). */
	navigation?: KeyboardNavigation;
	/** Toggle individual default behaviors. */
	defaults?: {
		closeOnEscape?: boolean;
		selectOnEnter?: boolean;
		selectOnTab?: boolean;
		arrowsToSubmenu?: boolean;
		spaceToSwitch?: boolean;
		backspaceToRemove?: boolean;
		shiftArrowToSort?: boolean;
		cycleWrap?: boolean;
	};
	/** Custom shortcuts — appended to defaults. Conflicts override defaults. */
	shortcuts?: ShortcutBinding[];
	/**
	 * Hook called before any default handling. Return true to suppress
	 * defaults for this event.
	 */
	onKeyDown?: (e: KeyboardEvent, ctx: MenuCtx) => boolean | undefined;
}
