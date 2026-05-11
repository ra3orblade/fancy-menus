/**
 * Positioning configuration — vertical/horizontal anchoring, viewport
 * flipping, fixed coords, edge stickiness, scroll re-positioning, and an
 * optional arrow indicator. The runtime consumes this and either drives
 * Floating UI middleware or falls back to direct rect math.
 */

import type { PositionStrategy } from './enums';
import type { Edge, Horizontal, Vertical } from './primitives';

export interface PositionConfig {
	/**
	 * `Fixed` (default) pins the menu to the viewport and follows the trigger
	 * via autoUpdate. `Absolute` positions relative to the nearest positioned
	 * ancestor — useful for inline menus that should flow with the document.
	 */
	strategy?: PositionStrategy;

	/** Vertical anchor relative to the trigger element. */
	vertical?: Vertical;
	/** Horizontal anchor relative to the trigger element. */
	horizontal?: Horizontal;

	/** Pixel offsets, or callbacks evaluated at position time. */
	offsetX?: number | (() => number);
	offsetY?: number | (() => number);

	/** Pin to absolute coordinates (overrides anchor math). */
	fixedX?: number;
	fixedY?: number;

	/** Lock body dimensions; otherwise size-to-content. */
	width?: number;
	height?: number;
	minWidth?: number;
	minHeight?: number;
	maxWidth?: number;
	maxHeight?: number;

	/** Disable axis-flipping when the menu would overflow the viewport. */
	noFlipX?: boolean;
	noFlipY?: boolean;

	/** Disable axis-clamping inside the viewport edges. */
	noBorderX?: boolean;
	noBorderY?: boolean;

	/** Snap to a specific edge of the trigger element regardless of anchor. */
	stickToElementEdge?: Edge;

	/**
	 * Re-evaluate the trigger rect on every positioning pass. Use when the
	 * trigger may resize (e.g. inline cell editors).
	 */
	recalcRect?: () => DOMRect | null;

	/** Re-position on scroll of the nearest scroll container. Default: true. */
	rebindOnScroll?: boolean;

	/**
	 * Follow the trigger as it moves (page scroll, ancestor resize, etc).
	 * Default: true. Set false to compute the position once and freeze it.
	 */
	followAnchor?: boolean;

	/**
	 * Auto-cap the menu's max height to the available viewport space.
	 * Useful for long-list menus that would otherwise extend past the
	 * viewport edge — combine with a virtualized body so the list scrolls
	 * inside the cap.
	 */
	fillViewport?: boolean;

	/** Show an arrow pointing at the trigger; positions itself per anchor. */
	withArrow?: boolean;

	/**
	 * Border insets (pixels) inside the viewport. Defaults pulled from theme
	 * CSS vars `--fm-border-{top,bottom,left,right}` if not specified.
	 */
	border?: {
		top?: number;
		bottom?: number;
		left?: number;
		right?: number;
	};
}
