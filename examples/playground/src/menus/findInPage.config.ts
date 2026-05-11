/**
 * Find in page — search bar with match counter and prev/next.
 *
 * Exercises:
 *   - custom header slot (`kind: HeaderKind.SearchBar`) with counter + arrows + clear
 *   - body is a thin status panel (no list)
 *   - persisted last query via storage
 */

import { BodyKind, DimmerMode, HeaderKind, Horizontal, Vertical, defineMenu } from '@fancy-menus/core';

interface FindInPageData {
	search: (query: string) => { current: number; total: number };
	next: () => void;
	prev: () => void;
}

export const findInPage = defineMenu<FindInPageData, string>({
	id: 'findInPage',
	description: 'Cmd/Ctrl+F find-in-page bar with counter and prev/next.',
	position: {
		// Anchor below the trigger and right-align; allow shift to keep the bar
		// inside the viewport on narrow screens.
		width: 360,
		vertical: Vertical.Bottom,
		horizontal: Horizontal.Right,
		offsetY: 8,
	},
	chrome: {
		header: {
			kind: HeaderKind.SearchBar,
			placeholder: 'Find',
			counter: true,
			prevNext: true,
			clear: true,
		},
		dimmer: DimmerMode.None,
		noAnimation: false,
	},
	body: {
		kind: BodyKind.Custom,
		measureHeight: () => 0,
		render: () => null,
	},
	keyboard: {
		defaults: { closeOnEscape: true },
		shortcuts: [
			{
				keys: 'enter, f3',
				caption: 'Next match',
				handler: () => {
					/* runtime invokes data.next via ctx in the wired version */
				},
			},
			{
				keys: 'shift+enter, shift+f3',
				caption: 'Previous match',
				handler: () => {},
			},
		],
	},
	storage: { fields: ['lastQuery'] },
});
