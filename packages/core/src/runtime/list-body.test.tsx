/**
 * Issue 5 — externally-driven list body for caret typeaheads.
 *
 * Verifies the two runtime guarantees a host needs to render a real menu it
 * doesn't own the focus/keyboard for:
 *   1. `focusOnMount: false` never steals DOM focus from the editor.
 *   2. A controlled `activeIndex` paints the same active treatment as keyboard
 *      nav, so the row is pixel-identical to a standard menu.
 *
 * Rendered with react-dom/client under happy-dom (no testing-library dep).
 */

import { createElement } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MenuCtx } from '../types/context';
import { BodyKind, KeyboardNavigation, Orientation, RowKind, SourceKind } from '../types/enums';
import { ListBodyView } from './list-body';

// Static source needs only ctx.data; the rest of MenuCtx is unused at render.
const ctx = { data: {}, id: 'typeahead' } as unknown as MenuCtx;

const ITEMS = [
	{ id: 'a', label: 'Heading' },
	{ id: 'b', label: 'Bullet list' },
	{ id: 'c', label: 'Code block' },
];

const ROWS = [{ kind: RowKind.Item as const, name: (it: { label: string }) => it.label }];

let container: HTMLElement;
let root: Root;

beforeEach(() => {
	(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
	// Run the body's focus rAF synchronously so the focus effect resolves
	// inside act() rather than on a later frame.
	vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
		cb(0);
		return 1;
	});
	vi.stubGlobal('cancelAnimationFrame', () => {});
	if (typeof (globalThis as any).ResizeObserver === 'undefined') {
		(globalThis as any).ResizeObserver = class {
			observe() {}
			unobserve() {}
			disconnect() {}
		};
	}
	container = document.createElement('div');
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(() => {
	act(() => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

function render(el: ReturnType<typeof createElement>) {
	act(() => {
		root.render(el);
	});
}

describe('controlled list body (Issue 5)', () => {
	it('focusOnMount: false leaves DOM focus where the host put it', () => {
		const editor = document.createElement('div');
		editor.tabIndex = 0; // stand-in for a contenteditable
		document.body.appendChild(editor);
		editor.focus();
		expect(document.activeElement).toBe(editor);

		render(
			createElement(ListBodyView, {
				body: {
					kind: BodyKind.List,
					source: { kind: SourceKind.Static, items: ITEMS },
					rows: ROWS,
					virtualized: false,
					focusOnMount: false,
				} as any,
				ctx,
				filter: '',
				onCloseRequest: () => {},
				keyboard: { navigation: KeyboardNavigation.None },
			})
		);

		// The caret must stay in the editor — the runtime never grabbed focus.
		expect(document.activeElement).toBe(editor);
		editor.remove();
	});

	it('focusOnMount defaults to true (standard menu grabs the list)', () => {
		document.body.focus();
		render(
			createElement(ListBodyView, {
				body: {
					kind: BodyKind.List,
					source: { kind: SourceKind.Static, items: ITEMS },
					rows: ROWS,
					virtualized: false,
				} as any,
				ctx,
				filter: '',
				onCloseRequest: () => {},
			})
		);
		const list = container.querySelector('.fm-list');
		expect(document.activeElement).toBe(list);
	});

	it('controlled activeIndex paints the active row (horizontal, no virtualizer)', () => {
		render(
			createElement(ListBodyView, {
				body: {
					kind: BodyKind.List,
					orientation: Orientation.Horizontal,
					source: { kind: SourceKind.Static, items: ITEMS },
					rows: ROWS,
				} as any,
				ctx,
				filter: '',
				onCloseRequest: () => {},
				controlledActiveIndex: 2,
				keyboard: { navigation: KeyboardNavigation.None },
			})
		);

		expect(container.querySelector('[data-index="2"] [data-active="true"]')).toBeTruthy();
		expect(container.querySelector('[data-index="0"] [data-active="true"]')).toBeNull();
	});

	it('moving the controlled index repaints the highlight', () => {
		const mk = (idx: number) =>
			createElement(ListBodyView, {
				body: {
					kind: BodyKind.List,
					orientation: Orientation.Horizontal,
					source: { kind: SourceKind.Static, items: ITEMS },
					rows: ROWS,
				} as any,
				ctx,
				filter: '',
				onCloseRequest: () => {},
				controlledActiveIndex: idx,
				keyboard: { navigation: KeyboardNavigation.None },
			});
		render(mk(0));
		expect(container.querySelector('[data-index="0"] [data-active="true"]')).toBeTruthy();
		render(mk(1));
		expect(container.querySelector('[data-index="1"] [data-active="true"]')).toBeTruthy();
		expect(container.querySelector('[data-index="0"] [data-active="true"]')).toBeNull();
	});
});
