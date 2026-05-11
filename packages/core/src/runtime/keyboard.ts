/**
 * Keyboard hook — wires KeyboardConfig defaults to a target element.
 *
 * Supports:
 *   - 1d nav (ArrowUp / ArrowDown, Home, End, optional ctrl+p/n on macOS)
 *   - 2d-grid nav (ArrowUp/Down moves rows, ArrowLeft/Right moves columns)
 *   - Enter / Tab → select active
 *   - Escape → close
 *   - Custom shortcut bindings
 *   - Veto via onKeyDown returning true
 */

import { useEffect } from 'react';
import type { MenuCtx } from '../types/context';
import { KeyboardNavigation } from '../types/enums';
import type { KeyboardConfig } from '../types/keyboard';

// The DOM-native KeyboardEvent — schema callbacks accept React's
// SyntheticEvent shape, but the runtime listener fires with DOM events.
type DOMKbdEvent = KeyboardEvent;

export interface KeyboardHandlers {
	count: number;
	index: number;
	setIndex: (i: number) => void;
	onSelect: (i: number) => void;
	onClose: () => void;
	/**
	 * Called on ArrowRight when the active row exposes a sub-menu. Return
	 * `true` if a sub-menu was opened (so the key is consumed); `false`
	 * to fall through to default behavior.
	 */
	onSubmenuOpen?: (i: number) => boolean;
	/**
	 * When true, ArrowLeft closes the menu (returning focus to the parent
	 * in a cascading sub-menu chain). Set by `ListBodyView` based on whether
	 * the surrounding menu has a `parentId`.
	 */
	closeOnArrowLeft?: boolean;
	/** Move N positions in the grid (used when navigation === '2d-grid'). */
	columns?: number;
}

const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform || navigator.userAgent || '');

export function useKeyboard(
	target: HTMLElement | null,
	config: KeyboardConfig | undefined,
	handlers: KeyboardHandlers,
	ctx: MenuCtx
) {
	useEffect(() => {
		if (!target || config?.disabled) return;
		const nav = config?.navigation ?? KeyboardNavigation.Linear;
		const d = config?.defaults ?? {};
		const closeOnEscape = d.closeOnEscape ?? true;
		const selectOnEnter = d.selectOnEnter ?? true;
		const selectOnTab = d.selectOnTab ?? false;
		const cycleWrap = d.cycleWrap ?? true;

		const onKeyDown = (e: DOMKbdEvent) => {
			if (config?.onKeyDown?.(e as any, ctx) === true) return;

			// Custom shortcuts first (override defaults).
			if (config?.shortcuts) {
				for (const s of config.shortcuts) {
					if (matchShortcut(e, s.keys)) {
						if (s.preventDefault !== false) e.preventDefault();
						s.handler(e as any);
						return;
					}
				}
			}

			const { count, index, setIndex, onSelect, onClose, columns } = handlers;

			const cycle = (next: number) => {
				if (count === 0) return -1;
				if (cycleWrap) return ((next % count) + count) % count;
				return Math.max(0, Math.min(count - 1, next));
			};

			const k = e.key.toLowerCase();
			const isUp = k === 'arrowup' || (isMac && e.ctrlKey && k === 'p');
			const isDown = k === 'arrowdown' || (isMac && e.ctrlKey && k === 'n');
			const isLeft = k === 'arrowleft';
			const isRight = k === 'arrowright';

			// When nothing's active yet (e.g. a horizontal toolbar that opens
			// with no pre-selection), the first arrow keystroke should
			// activate the first or last row — not jump by one from -1
			// which would wrap to count - 2.
			const bootstrap = (dir: 1 | -1) => (dir === 1 ? 0 : Math.max(0, count - 1));

			if (isUp) {
				e.preventDefault();
				const step = nav === KeyboardNavigation.Grid2D ? (columns ?? 1) : 1;
				setIndex(index < 0 ? bootstrap(-1) : cycle(index - step));
				return;
			}
			if (isDown) {
				e.preventDefault();
				const step = nav === KeyboardNavigation.Grid2D ? (columns ?? 1) : 1;
				setIndex(index < 0 ? bootstrap(1) : cycle(index + step));
				return;
			}
			if (nav === KeyboardNavigation.Grid2D && (isLeft || isRight)) {
				e.preventDefault();
				setIndex(index < 0 ? bootstrap(isLeft ? -1 : 1) : cycle(index + (isLeft ? -1 : 1)));
				return;
			}
			// 1D navigation: ArrowRight opens the active row's sub-menu (if any),
			// ArrowLeft closes the current menu — when this menu is itself a
			// sub-menu, the parent regains focus.
			if (nav !== KeyboardNavigation.Grid2D && isRight) {
				if (handlers.onSubmenuOpen?.(index)) {
					e.preventDefault();
					return;
				}
			}
			if (nav !== KeyboardNavigation.Grid2D && isLeft && handlers.closeOnArrowLeft) {
				e.preventDefault();
				onClose();
				return;
			}
			if (k === 'home') {
				e.preventDefault();
				setIndex(0);
				return;
			}
			if (k === 'end') {
				e.preventDefault();
				setIndex(Math.max(0, count - 1));
				return;
			}
			if (selectOnEnter && k === 'enter') {
				e.preventDefault();
				if (index >= 0) onSelect(index);
				return;
			}
			if (selectOnTab && k === 'tab') {
				e.preventDefault();
				if (index >= 0) onSelect(index);
				return;
			}
			if (closeOnEscape && k === 'escape') {
				e.preventDefault();
				onClose();
			}
		};

		target.addEventListener('keydown', onKeyDown);
		return () => target.removeEventListener('keydown', onKeyDown);
	}, [target, config, handlers, ctx]);
}

function matchShortcut(e: DOMKbdEvent, keys: string): boolean {
	const combos = keys.split(',').map((s) => s.trim().toLowerCase());
	return combos.some((combo) => {
		const parts = combo.split('+').map((s) => s.trim());
		const required = new Set(parts);
		const key = parts[parts.length - 1]!;
		return (
			e.key.toLowerCase() === key &&
			(!required.has('shift') || e.shiftKey) &&
			(!required.has('alt') || e.altKey) &&
			(!required.has('ctrl') || e.ctrlKey) &&
			(!required.has('cmd') || e.metaKey) &&
			(!required.has('meta') || e.metaKey)
		);
	});
}
