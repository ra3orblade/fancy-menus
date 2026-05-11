/**
 * MenuCtx — passed into every callback. Provides access to the menu's data,
 * persisted storage, position re-computation, sub-menu spawning, and active /
 * hover row management.
 */

import type { AnalyticsEventName } from './enums';
import type { PositionConfig } from './position';

export interface OpenParam<TData = any> {
	data?: TData;
	position?: Partial<PositionConfig>;
	element?: Element | string;
	rect?: DOMRect;
	/** Mark as a sub-menu of `parentId`. */
	parentId?: string;
	/**
	 * Rect of the row / trigger that spawned this menu. Used to draw the
	 * safe-mouse polygon between the trigger and the child menu so the
	 * cursor can travel diagonally through without dismissing the child.
	 */
	triggerRect?: DOMRect;
}

// Default TData to `any` so consumers writing inline configs get usable types
// in callbacks without having to repeat the data shape on every spec. Consumers
// that want strict typing pass `MenuCtx<MyData>` explicitly.
export interface MenuCtx<TData = any> {
	/** Menu id (registered name). */
	readonly id: string;
	/** Data payload supplied at open time. */
	readonly data: TData;
	/**
	 * Persisted state — read/written via the configured StorageAdapter.
	 * Returns undefined for unknown keys.
	 */
	readonly storage: {
		get<T = unknown>(key: string): T | undefined;
		set<T = unknown>(key: string, value: T): void;
	};
	/** Open another menu by id. Returns when the child has mounted. */
	open<TChild = unknown>(menuId: string, param?: OpenParam<TChild>): Promise<void>;
	/** Close this menu (and any of its descendant sub-menus). */
	close(): void;
	/** Close every menu in the open stack (or limit to a group). */
	closeAll(group?: string): void;
	/**
	 * Close any sub-menus this menu spawned (descendants whose parentId
	 * chain leads back to this menu). Doesn't close this menu itself.
	 */
	closeChildren(): void;
	/**
	 * Replace-paged navigation: swap this menu out for a different one in
	 * the same slot. The current menu (id, config, param) is pushed onto a
	 * history stack carried over to the new one. Use `back()` to pop.
	 *
	 * Useful when one menu visually transitions into another inside the
	 * same shell (settings → detail page). The new menu's chrome can show
	 * a back arrow via `chrome.withBack` — the runtime auto-wires it.
	 */
	navigateTo<TChild = unknown>(menuId: string, param?: OpenParam<TChild>): void;
	/**
	 * Pop the navigation history and restore the previous menu in this
	 * slot. The restored menu's `param.data` is preserved across the
	 * round-trip so consumers can keep transient state.
	 */
	back(): void;
	/** True when there's at least one history entry to pop via `back()`. */
	canGoBack(): boolean;
	/** Update this menu's param (chrome / position / data). */
	update(param: Partial<OpenParam>): void;
	/** Patch the data payload (shallow merge). */
	updateData(patch: Partial<TData>): void;
	/** Re-run positioning (after the body resized). */
	position(): void;
	/** Active row (keyboard-navigated). */
	setActive(itemId: string | undefined, scroll?: boolean): void;
	/** Hover row (mouse-driven). */
	setHover(itemId: string | undefined): void;
	/** Cross-menu state sync. */
	updateOther(menuId: string, patch: unknown): void;
	/** True if another menu in the stack is open. */
	isOpen(menuId?: string): boolean;
}

/**
 * Options provided to the MenuProvider at the application root.
 */
export interface ProviderOptions {
	/** Default storage adapter. */
	storage?: import('./storage').StorageAdapter;
	/** Resolver for string-named icons (when a menu uses `icon: 'search'`). */
	iconRegistry?: Record<string, import('./primitives').IconComponent>;
	/** Theme tokens — emitted as CSS custom properties on the menu root. */
	theme?: ThemeTokens;
	/** Localized strings (overrideable per-menu via the locale option). */
	locale?: LocaleStrings;
	/** Global onError handler. */
	onError?: (error: unknown, ctx: { menuId: string }) => void;
	/** Telemetry hook (menu opened, item selected, etc.). */
	onAnalytics?: (event: AnalyticsEvent) => void;
	/** Predicate: is the menu rendered above an existing modal/popup? */
	isAboveOverlay?: () => boolean;
}

export interface ThemeTokens {
	'--fm-bg'?: string;
	'--fm-fg'?: string;
	'--fm-border'?: string;
	'--fm-radius'?: string;
	'--fm-shadow'?: string;
	'--fm-z'?: string | number;
	'--fm-row-height'?: string;
	'--fm-row-height-big'?: string;
	'--fm-row-height-section'?: string;
	'--fm-accent'?: string;
	'--fm-destructive'?: string;
	[key: `--${string}`]: string | number | undefined;
}

export interface LocaleStrings {
	search?: string;
	empty?: string;
	loading?: string;
	add?: string;
	done?: string;
	cancel?: string;
	back?: string;
	close?: string;
	noResults?: string;
	[key: string]: string | undefined;
}

export interface AnalyticsEvent {
	name: AnalyticsEventName | (string & {});
	menuId: string;
	payload?: Record<string, unknown>;
}
