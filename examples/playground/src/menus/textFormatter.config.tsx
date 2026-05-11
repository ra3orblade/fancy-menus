/**
 * Text formatter — horizontal icon toolbar.
 *
 * Exercises:
 *   - ListBody with `orientation: Horizontal` (toolbar layout)
 *   - icon-only Item rows with `pressed` toggle visualization
 *   - row that opens a sub-menu programmatically (color picker)
 *   - tooltips on icons
 *   - source.kind: Prop — items derived from data.activeMarks at render
 */

import {
	BodyKind,
	DimmerMode,
	Horizontal,
	Orientation,
	RowKind,
	SourceKind,
	Vertical,
	defineMenu,
} from '@fancy-menus/core';
import { Code, Link, Palette, TextB, TextItalic, TextStrikethrough, TextUnderline } from '@phosphor-icons/react';

interface FormatItem {
	id: string;
	icon: any;
	label: string;
	shortcut?: string;
	active?: boolean;
}

interface TextFormatterData {
	activeMarks: string[];
	onToggleMark: (id: string) => void;
	onOpenLink: () => void;
	onPickColor: (color: string) => void;
}

const ACTIONS: ReadonlyArray<Omit<FormatItem, 'active'>> = [
	{ id: 'bold', icon: TextB, label: 'Bold', shortcut: '⌘B' },
	{ id: 'italic', icon: TextItalic, label: 'Italic', shortcut: '⌘I' },
	{ id: 'underline', icon: TextUnderline, label: 'Underline', shortcut: '⌘U' },
	{ id: 'strikethrough', icon: TextStrikethrough, label: 'Strikethrough', shortcut: '⌘⇧X' },
	{ id: 'code', icon: Code, label: 'Code', shortcut: '⌘E' },
	{ id: 'link', icon: Link, label: 'Link', shortcut: '⌘K' },
	{ id: 'color', icon: Palette, label: 'Color' },
];

export const textFormatter = defineMenu<TextFormatterData, string, FormatItem>({
	id: 'textFormatter',
	description: 'Inline text formatter — horizontal icon toolbar with active-mark highlighting and a color sub-menu.',
	position: { vertical: Vertical.Top, horizontal: Horizontal.Center, offsetY: 8 },
	chrome: { dimmer: DimmerMode.None },
	body: {
		kind: BodyKind.List,
		orientation: Orientation.Horizontal,
		// Each render rebuilds the items so the `active` flag reflects the
		// current data.activeMarks — the toolbar updates as marks toggle.
		source: {
			kind: SourceKind.Prop,
			getItems: (data: TextFormatterData) =>
				ACTIONS.map((a) => ({ ...a, active: data.activeMarks.includes(a.id) })),
		},
		rows: [
			{
				kind: RowKind.Item,
				name: (it) => it.label,
				icon: (it) => ({ icon: it.icon, size: 14 }),
				tooltip: (it) => ({ text: it.label, caption: it.shortcut }),
				pressed: (it) => Boolean(it.active),
				onClick: (item, e, ctx) => {
					if (item.id === 'link') {
						ctx.data.onOpenLink();
						return;
					}
					if (item.id === 'color') {
						// Anchor the color picker to the clicked row so it
						// opens directly under the palette icon, not in the
						// viewport corner.
						const triggerEl = e.currentTarget as Element;
						ctx.open('themeColorPicker', {
							element: triggerEl,
							triggerRect: triggerEl.getBoundingClientRect(),
							data: {
								current: { text: undefined, bg: undefined },
								onSelect: (_scope: 'text' | 'bg', value: string) => ctx.data.onPickColor(value),
							},
						});
						return;
					}
					ctx.data.onToggleMark(item.id);
				},
			},
		],
	},
	keyboard: { defaults: { closeOnEscape: true } },
});
