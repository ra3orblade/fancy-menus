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
import { Horizontal, PositionStrategy, Vertical } from '../types/enums';
import type { PositionConfig } from '../types/position';

export function strategyFor(p: PositionConfig | undefined): PositionStrategy {
	return p?.strategy ?? PositionStrategy.Fixed;
}

export function placementFromConfig(p: PositionConfig | undefined): Placement {
	const v = p?.vertical ?? Vertical.Bottom;
	const h = p?.horizontal ?? Horizontal.Left;

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
	const ref =
		'getBoundingClientRect' in reference
			? reference
			: {
					getBoundingClientRect: () => reference,
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
