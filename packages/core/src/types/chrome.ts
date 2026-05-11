/**
 * Chrome configuration — everything that wraps the body: title bar, tabs,
 * filter, dimmer, header/footer slots, animation settings.
 *
 * Concrete shapes supported:
 *   - title bar (with optional back arrow, close icon, info tooltip)
 *   - tab strip (each tab owns its own body)
 *   - filter / search input (debounced; auto-show by item-count threshold)
 *   - search-bar with match counter + prev/next + clear (find-in-page style)
 *   - dimmer modes (default | none | pass-through | explicit visible)
 *   - footer slots (buttons row, add affordance, jump bar, sidebar action,
 *     fully custom)
 */

import type { ReactNode } from 'react';
import type { BodyConfig } from './body';
import type { MenuCtx } from './context';
import { DimmerMode, FilterShowWhen, FooterKind, HeaderKind } from './enums';
import type { ButtonSpec, IconParam } from './primitives';
export { DimmerMode } from './enums';

export interface ChromeConfig {
	/** Static title or computed from the current MenuCtx (data + helpers). */
	title?: string | ((ctx: MenuCtx) => string);

	/** Show a back arrow in the title bar. Wired to onBack. */
	withBack?: boolean;
	onBack?: () => void;

	/** Show a close icon in the title bar (independent of dimmer). */
	withClose?: boolean;

	/** Filter / search input in the chrome. */
	filter?: FilterConfig;

	/** Tab strip — each tab owns its own body. */
	tabs?: TabsConfig;

	/** Backdrop mode. */
	dimmer?: DimmerMode;

	/** Allow pointer events to pass through the wrapper to underlying page. */
	passThrough?: boolean;

	/** Disable open/close animations. */
	noAnimation?: boolean;

	/** Disable closing on dimmer-click and ESC (caller controls lifetime). */
	noClose?: boolean;

	/** Custom CSS classes applied to the menu and its outer wrapper. */
	className?: string;
	classNameWrap?: string;

	/**
	 * Replace the entire header. If provided, `title`, `withBack`, `withClose`
	 * are ignored. Used for chat search bar, smile head, custom designs.
	 */
	header?: HeaderSlot;

	/**
	 * Footer slot — appears below the body, outside scroll area.
	 */
	footer?: FooterSlot;

	/**
	 * Arbitrary slot rendered between header and body — useful for inline
	 * banners, help text, or upsell prompts.
	 */
	satellite?: ReactNode | (() => ReactNode);
}

export interface FilterConfig {
	/** Placeholder text. */
	placeholder?: string;
	icon?: IconParam;
	/** Focus the input on mount. Default: true. */
	focusOnMount?: boolean;
	/** Debounce in ms before firing onChange. Default: 250. */
	debounceMs?: number;
	/** Render in the underlined style (used inside compact menus). */
	underlined?: boolean;
	/**
	 * 'always' shows the input unconditionally; 'auto' shows it only when item
	 * count exceeds `threshold`.
	 */
	showWhen?: FilterShowWhen;
	threshold?: number;
	onChange?: (value: string) => void;
}

export interface TabsConfig {
	initialTab?: string;
	tabs: TabSpec[];
	/** Right-aligned slot in the tab strip (e.g. a "Remove" or "More" affordance). */
	rightSlot?: ReactNode | (() => ReactNode);
	/** Persist active tab to storage. */
	persist?: boolean;
}

export interface TabSpec {
	id: string;
	label: string;
	icon?: IconParam;
	/** Each tab's own body — full BodyConfig recursion. */
	body: BodyConfig;
	/** Optional per-tab CSS class on the body wrapper. */
	className?: string;
}

export type HeaderSlot =
	| {
			kind: HeaderKind.Default;
			title?: string;
			withBack?: boolean;
			withClose?: boolean;
			info?: { tooltip: string };
	  }
	| {
			kind: HeaderKind.SearchBar;
			placeholder?: string;
			counter?: boolean;
			prevNext?: boolean;
			clear?: boolean;
	  }
	| { kind: HeaderKind.Custom; render: (ctx: MenuCtx) => ReactNode };

export type FooterSlot =
	| { kind: FooterKind.Buttons; buttons: ButtonSpec[] }
	| { kind: FooterKind.Add; label: string; icon?: IconParam; onClick: () => void }
	| {
			kind: FooterKind.JumpBar;
			items: JumpBarItem[];
			activeId?: string;
			onJump?: (id: string) => void;
			rightSlot?: ReactNode;
	  }
	| { kind: FooterKind.Sidebar; label: string; icon?: IconParam; onClick: () => void }
	| { kind: FooterKind.Custom; render: () => ReactNode };

export interface JumpBarItem {
	id: string;
	icon: IconParam;
	tooltip?: string;
}
