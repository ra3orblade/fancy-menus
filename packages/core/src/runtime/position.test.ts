import { describe, expect, it } from 'vitest';
import { Horizontal, PositionStrategy, Vertical } from '../types/enums';
import { placementFromConfig, strategyFor } from './position';

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
