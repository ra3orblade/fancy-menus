import { describe, expect, it } from 'vitest';
import type { OpenMenu } from './store';
// resolveAriaLabel lives in menu.tsx alongside React code, but is a pure
// function — import it directly and feed minimal OpenMenu-shaped objects.
import { resolveAriaLabel } from './menu';

// Issue 4 — per-open / config ariaLabel for the outer shell.
function fakeOpen(partial: {
	ariaLabel?: string;
	title?: string | (() => string);
	chromeAriaLabel?: string;
}): OpenMenu {
	return {
		id: 'm',
		config: { id: 'm', body: {} as any, chrome: { title: partial.title, ariaLabel: partial.chromeAriaLabel } },
		param: { ariaLabel: partial.ariaLabel },
		depth: 0,
		state: 'open',
	} as unknown as OpenMenu;
}

describe('resolveAriaLabel', () => {
	it('per-open param.ariaLabel wins over everything', () => {
		expect(resolveAriaLabel(fakeOpen({ ariaLabel: 'Sort by', chromeAriaLabel: 'Menu' }))).toBe('Sort by');
		expect(resolveAriaLabel(fakeOpen({ ariaLabel: 'Note actions', title: 'Whatever' }))).toBe('Note actions');
	});

	it('mirrors a string title when no per-open override', () => {
		expect(resolveAriaLabel(fakeOpen({ title: 'Settings' }))).toBe('Settings');
	});

	it('falls back to config.chrome.ariaLabel for a title-less menu shell', () => {
		expect(resolveAriaLabel(fakeOpen({ chromeAriaLabel: 'Sort by' }))).toBe('Sort by');
	});

	it('does not mirror a function title (would need ctx); uses ariaLabel instead', () => {
		expect(resolveAriaLabel(fakeOpen({ title: () => 'dynamic', chromeAriaLabel: 'Actions' }))).toBe('Actions');
	});

	it('never leaks the internal menu id', () => {
		expect(resolveAriaLabel(fakeOpen({}))).toBeUndefined();
	});
});
