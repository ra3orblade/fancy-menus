/**
 * Position computation — bridges PositionConfig → @floating-ui/react-dom.
 */

import {
	type Placement,
	autoUpdate,
	computePosition,
	flip,
	limitShift,
	offset,
	shift,
	size,
} from '@floating-ui/react-dom';
import { Edge, Horizontal, PositionStrategy, Vertical } from '../types/enums';
import type { PositionConfig } from '../types/position';

export function strategyFor(p: PositionConfig | undefined): PositionStrategy {
	return p?.strategy ?? PositionStrategy.Fixed;
}

/**
 * Shallow-merge a per-open position override over the static config, with the
 * override winning per-key. Keys explicitly set to `undefined` in the override
 * do not clobber the base — so a partial `{ horizontal }` override leaves every
 * other key falling back to `config.position`. Returns `undefined` when both
 * are absent so callers can keep the "no config" fast path.
 */
export function mergePositionConfig(
	base: PositionConfig | undefined,
	override: Partial<PositionConfig> | undefined
): PositionConfig | undefined {
	if (!override) return base;
	if (!base) {
		// Strip undefined keys so the override alone behaves like a clean config.
		const out: Partial<PositionConfig> = {};
		for (const k of Object.keys(override) as (keyof PositionConfig)[]) {
			if (override[k] !== undefined) (out as any)[k] = override[k];
		}
		return out as PositionConfig;
	}
	const merged: PositionConfig = { ...base };
	for (const k of Object.keys(override) as (keyof PositionConfig)[]) {
		if (override[k] !== undefined) (merged as any)[k] = override[k];
	}
	return merged;
}

export function placementFromConfig(p: PositionConfig | undefined): Placement {
	const v = p?.vertical ?? Vertical.Bottom;
	const h = p?.horizontal ?? Horizontal.Left;

	// `stickToElementEdge` overrides the vertical/horizontal anchor entirely:
	// the menu snaps to the named edge of the trigger regardless of the v/h
	// anchor, then flip/shift clamps it on-screen as usual. The perpendicular
	// alignment still reads from the v/h anchor so callers can pick e.g.
	// "right edge, top-aligned".
	const edge = p?.stickToElementEdge;
	if (edge) {
		// Read the *raw* perpendicular anchor (not the v/h defaults) so an edge
		// with no explicit alignment defaults to `start` — the conventional
		// submenu placement — rather than inheriting the bottom/left fallback.
		if (edge === Edge.Top || edge === Edge.Bottom) {
			const align = p?.horizontal === Horizontal.Right ? 'end' : p?.horizontal === Horizontal.Center ? 'center' : 'start';
			return align === 'center' ? edge : (`${edge}-${align}` as Placement);
		}
		// Left / Right edge — align along the vertical axis.
		const align = p?.vertical === Vertical.Bottom ? 'end' : p?.vertical === Vertical.Center ? 'center' : 'start';
		return align === 'center' ? edge : (`${edge}-${align}` as Placement);
	}

	// Decide which side of the trigger the menu sits on, and how it
	// aligns along the perpendicular axis. The two orthogonal cases:
	//
	//   v=Top|Bottom   → menu above/below the trigger; horizontal drives align
	//   v=Center       → menu beside the trigger (left or right based on `h`),
	//                    vertically centered on the trigger
	let side: 'top' | 'bottom' | 'left' | 'right';
	let align: 'start' | 'center' | 'end';
	if (v === Vertical.Top || v === Vertical.Bottom) {
		side = v === Vertical.Top ? 'top' : 'bottom';
		align = h === Horizontal.Left ? 'start' : h === Horizontal.Right ? 'end' : 'center';
	} else {
		// Vertical.Center — flip to a horizontal-side placement, vertically
		// centered on the trigger so cascading sub-menus line up with the
		// row that opened them.
		side = h === Horizontal.Left ? 'left' : 'right';
		align = 'center';
	}

	return align === 'center' ? side : (`${side}-${align}` as Placement);
}

/**
 * Build a zero-area DOMRect at a viewport point. Used to pin a menu to
 * `fixedX/fixedY` coordinates, overriding any element / rect anchor.
 */
export function pointRect(x: number, y: number): DOMRect {
	if (typeof DOMRect !== 'undefined') return new DOMRect(x, y, 0, 0);
	// happy-dom / SSR fallback — a structural DOMRect-shaped literal.
	return {
		x,
		y,
		width: 0,
		height: 0,
		top: y,
		bottom: y,
		left: x,
		right: x,
		toJSON() {
			return this;
		},
	} as DOMRect;
}

/**
 * Resolve the reference rect a menu anchors against, honoring `fixedX/fixedY`.
 * When either fixed coordinate is set, the anchor collapses to a point at
 * those viewport coordinates (the unset axis falls back to the trigger's
 * current edge). Returns `null` when there is no anchor at all.
 */
export function resolveAnchorRect(
	cfg: PositionConfig | undefined,
	reference: Element | DOMRect | null | undefined
): DOMRect | Element | null {
	const hasFixed = cfg?.fixedX != null || cfg?.fixedY != null;
	if (!hasFixed) return reference ?? null;
	const base =
		reference == null
			? undefined
			: 'getBoundingClientRect' in reference
				? reference.getBoundingClientRect()
				: reference;
	const x = cfg?.fixedX ?? base?.left ?? 0;
	const y = cfg?.fixedY ?? base?.top ?? 0;
	return pointRect(x, y);
}

export interface PositionResult {
	x: number;
	y: number;
	placement: Placement;
}

export async function compute(
	reference: Element | DOMRect,
	floating: HTMLElement,
	cfg: PositionConfig | undefined
): Promise<PositionResult> {
	// fixedX/fixedY pin the anchor to viewport coordinates, overriding the
	// element/rect-derived anchor math (flip/shift still run below).
	const anchor = resolveAnchorRect(cfg, reference) ?? reference;
	const ref =
		'getBoundingClientRect' in anchor
			? anchor
			: {
					getBoundingClientRect: () => anchor,
					contextElement: undefined,
				};

	const offX = typeof cfg?.offsetX === 'function' ? cfg.offsetX() : (cfg?.offsetX ?? 0);
	const offY = typeof cfg?.offsetY === 'function' ? cfg.offsetY() : (cfg?.offsetY ?? 0);

	// Default border padding on every side (px). The value is read once per
	// compute, so consumers can tweak it via PositionConfig.border without
	// touching this file.
	const padTop = cfg?.border?.top ?? 8;
	const padBottom = cfg?.border?.bottom ?? 8;
	const padLeft = cfg?.border?.left ?? 8;
	const padRight = cfg?.border?.right ?? 8;

	const middleware = [
		offset({ mainAxis: offY, crossAxis: offX }),
		// Only flip when the alternate placement actually frees up space; if
		// every fallback also clips, stay at the requested side.
		!cfg?.noFlipX && !cfg?.noFlipY
			? flip({
					fallbackStrategy: 'initialPlacement',
					padding: { top: padTop, bottom: padBottom, left: padLeft, right: padRight },
				})
			: undefined,
		// Always run shift so the menu stays inside the viewport even when
		// flipping is disabled. limitShift keeps the menu visually attached
		// to the trigger — it stops shifting once the trigger leaves the
		// floating element's bounds, instead of detaching to the opposite
		// side of the screen.
		shift({
			padding: { top: padTop, bottom: padBottom, left: padLeft, right: padRight },
			limiter: limitShift({ offset: 16 }),
			crossAxis: !cfg?.noBorderX || !cfg?.noBorderY,
		}),
		// fillViewport caps the menu to the available height so long lists
		// scroll inside the menu rather than extending off-screen.
		cfg?.maxHeight || cfg?.fillViewport
			? size({
					padding: { top: padTop, bottom: padBottom },
					apply({ availableHeight, elements }) {
						const cap = cfg?.maxHeight ?? Number.POSITIVE_INFINITY;
						elements.floating.style.maxHeight = `${Math.min(cap, availableHeight)}px`;
					},
				})
			: undefined,
	].filter(Boolean) as any[];

	const result = await computePosition(ref as any, floating, {
		placement: placementFromConfig(cfg),
		strategy: strategyFor(cfg),
		middleware,
	});

	return { x: result.x, y: result.y, placement: result.placement };
}

export function watchPosition(
	reference: Element,
	floating: HTMLElement,
	cfg: PositionConfig | undefined,
	onUpdate: (r: PositionResult) => void
): () => void {
	let cancelled = false;
	const update = async () => {
		const r = await compute(reference, floating, cfg);
		if (!cancelled) onUpdate(r);
	};
	// One-shot mode: compute once then freeze. Useful for menus that should
	// stay where they were opened even if the trigger moves.
	if (cfg?.followAnchor === false) {
		void update();
		return () => {
			cancelled = true;
		};
	}
	const cleanup = autoUpdate(reference, floating, update);
	return () => {
		cancelled = true;
		cleanup();
	};
}
