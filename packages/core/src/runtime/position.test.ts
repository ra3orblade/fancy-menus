import { describe, expect, it } from 'vitest';
import { Edge, Horizontal, PositionStrategy, Vertical } from '../types/enums';
import { mergePositionConfig, placementFromConfig, resolveAnchorRect, strategyFor } from './position';

describe('placementFromConfig', () => {
	it('defaults to bottom-start when nothing is supplied', () => {
		expect(placementFromConfig(undefined)).toBe('bottom-start');
		expect(placementFromConfig({})).toBe('bottom-start');
	});

	it('maps Vertical.Top + Horizontal.Right → top-end', () => {
		expect(placementFromConfig({ vertical: Vertical.Top, horizontal: Horizontal.Right })).toBe('top-end');
	});

	it('maps Vertical.Bottom + Horizontal.Center → bottom (no align suffix)', () => {
		expect(placementFromConfig({ vertical: Vertical.Bottom, horizontal: Horizontal.Center })).toBe('bottom');
	});

	it('Vertical.Center + Horizontal.Right → right (vertically centered, not right-end)', () => {
		// This was a real bug — earlier code returned right-end which puts
		// the sub-menu's bottom edge at the trigger's bottom edge.
		expect(placementFromConfig({ vertical: Vertical.Center, horizontal: Horizontal.Right })).toBe('right');
	});

	it('Vertical.Center + Horizontal.Left → left (vertically centered)', () => {
		expect(placementFromConfig({ vertical: Vertical.Center, horizontal: Horizontal.Left })).toBe('left');
	});

	it('Vertical.Center + Horizontal.Center → right (default side)', () => {
		expect(placementFromConfig({ vertical: Vertical.Center, horizontal: Horizontal.Center })).toBe('right');
	});

	it('Vertical.Top + Horizontal.Left → top-start', () => {
		expect(placementFromConfig({ vertical: Vertical.Top, horizontal: Horizontal.Left })).toBe('top-start');
	});

	it('Vertical.Bottom + Horizontal.Right → bottom-end', () => {
		expect(placementFromConfig({ vertical: Vertical.Bottom, horizontal: Horizontal.Right })).toBe('bottom-end');
	});
});

describe('strategyFor', () => {
	it('defaults to Fixed', () => {
		expect(strategyFor(undefined)).toBe(PositionStrategy.Fixed);
		expect(strategyFor({})).toBe(PositionStrategy.Fixed);
	});

	it('honors explicit Absolute', () => {
		expect(strategyFor({ strategy: PositionStrategy.Absolute })).toBe(PositionStrategy.Absolute);
	});
});

// Issue 1 — per-open position override merges over the static config.
describe('mergePositionConfig', () => {
	it('returns the base untouched when there is no override', () => {
		const base = { horizontal: Horizontal.Left };
		expect(mergePositionConfig(base, undefined)).toBe(base);
	});

	it('returns the override (sans undefined keys) when there is no base', () => {
		expect(mergePositionConfig(undefined, { horizontal: Horizontal.Right, vertical: undefined })).toEqual({
			horizontal: Horizontal.Right,
		});
	});

	it('lets the per-open value win per-key', () => {
		const merged = mergePositionConfig(
			{ horizontal: Horizontal.Left, vertical: Vertical.Bottom, offsetX: 4 },
			{ horizontal: Horizontal.Right }
		);
		// horizontal overridden, everything else falls back to the base.
		expect(merged).toEqual({ horizontal: Horizontal.Right, vertical: Vertical.Bottom, offsetX: 4 });
	});

	it('does not clobber a base key with an explicit `undefined` override', () => {
		const merged = mergePositionConfig({ horizontal: Horizontal.Left }, { horizontal: undefined });
		expect(merged).toEqual({ horizontal: Horizontal.Left });
	});

	it('regression: same config opened left vs right yields opposite alignment', () => {
		const cfg = { vertical: Vertical.Bottom, horizontal: Horizontal.Left };
		const left = mergePositionConfig(cfg, { horizontal: Horizontal.Left });
		const right = mergePositionConfig(cfg, { horizontal: Horizontal.Right });
		expect(placementFromConfig(left)).toBe('bottom-start');
		expect(placementFromConfig(right)).toBe('bottom-end');
	});
});

// Issue 3 — stickToElementEdge overrides the vertical/horizontal anchor.
describe('placementFromConfig + stickToElementEdge', () => {
	it('snaps to the named edge regardless of v/h anchor', () => {
		expect(placementFromConfig({ stickToElementEdge: Edge.Right, vertical: Vertical.Center })).toBe('right');
		expect(placementFromConfig({ stickToElementEdge: Edge.Left })).toBe('left-start');
		expect(placementFromConfig({ stickToElementEdge: Edge.Top, horizontal: Horizontal.Right })).toBe('top-end');
	});

	it('aligns a left/right edge along the vertical anchor', () => {
		expect(placementFromConfig({ stickToElementEdge: Edge.Right, vertical: Vertical.Top })).toBe('right-start');
		expect(placementFromConfig({ stickToElementEdge: Edge.Right, vertical: Vertical.Bottom })).toBe('right-end');
	});
});

// Issue 2 — fixedX/fixedY collapse the anchor to a viewport point.
describe('resolveAnchorRect (fixedX/fixedY)', () => {
	it('passes the reference through untouched when no fixed coords are set', () => {
		const rect = { left: 10, top: 20 } as DOMRect;
		expect(resolveAnchorRect({}, rect)).toBe(rect);
		expect(resolveAnchorRect(undefined, null)).toBeNull();
	});

	it('pins to the fixed point even with no element/rect anchor', () => {
		const r = resolveAnchorRect({ fixedX: 100, fixedY: 200 }, null) as DOMRect;
		expect(r.left).toBe(100);
		expect(r.top).toBe(200);
		expect(r.width).toBe(0);
		expect(r.height).toBe(0);
	});

	it('falls back to the trigger edge for the unset axis', () => {
		const base = { left: 10, top: 20 } as DOMRect;
		const r = resolveAnchorRect({ fixedX: 100 }, base) as DOMRect;
		expect(r.left).toBe(100);
		expect(r.top).toBe(20);
	});
});
