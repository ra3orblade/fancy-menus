/**
 * Theme color palette — native pattern.
 *
 * Built entirely from the schema's row catalog: two sections (Text / Background)
 * each populated with `kind: RowKind.Color` swatch rows. No custom render: the
 * runtime composes the layout, keyboard nav, active-state checks, and theming
 * from the declarative config alone.
 *
 * Contrast with `colorPickerShadcn.config.ts`, which expresses a richer
 * picker (HSL sliders + hex input) as a single drop-in shadcn component
 * inside a `kind: 'custom'` body.
 */

import {
	BodyKind,
	ColorScope,
	DimmerMode,
	Horizontal,
	RowKind,
	SourceKind,
	Vertical,
	defineMenu,
} from '@fancy-menus/core';

interface SwatchItem {
	id: string;
	name: string;
	scope: ColorScope.Text | 'bg';
	value: string;
	isSection?: boolean;
}

const SWATCHES: SwatchItem[] = [
	{ id: 'sec-text', name: 'Text color', scope: ColorScope.Text, value: '', isSection: true },
	{ id: 'text-default', name: 'Default', scope: ColorScope.Text, value: 'default' },
	{ id: 'text-red', name: 'Red', scope: ColorScope.Text, value: 'red' },
	{ id: 'text-orange', name: 'Orange', scope: ColorScope.Text, value: 'orange' },
	{ id: 'text-amber', name: 'Amber', scope: ColorScope.Text, value: 'amber' },
	{ id: 'text-green', name: 'Green', scope: ColorScope.Text, value: 'green' },
	{ id: 'text-teal', name: 'Teal', scope: ColorScope.Text, value: 'teal' },
	{ id: 'text-blue', name: 'Blue', scope: ColorScope.Text, value: 'blue' },
	{ id: 'text-purple', name: 'Purple', scope: ColorScope.Text, value: 'purple' },
	{ id: 'text-pink', name: 'Pink', scope: ColorScope.Text, value: 'pink' },

	{ id: 'sec-bg', name: 'Background color', scope: ColorScope.Bg, value: '', isSection: true },
	{ id: 'bg-default', name: 'Default', scope: ColorScope.Bg, value: 'default' },
	{ id: 'bg-red', name: 'Red', scope: ColorScope.Bg, value: 'red' },
	{ id: 'bg-orange', name: 'Orange', scope: ColorScope.Bg, value: 'orange' },
	{ id: 'bg-amber', name: 'Amber', scope: ColorScope.Bg, value: 'amber' },
	{ id: 'bg-green', name: 'Green', scope: ColorScope.Bg, value: 'green' },
	{ id: 'bg-teal', name: 'Teal', scope: ColorScope.Bg, value: 'teal' },
	{ id: 'bg-blue', name: 'Blue', scope: ColorScope.Bg, value: 'blue' },
	{ id: 'bg-purple', name: 'Purple', scope: ColorScope.Bg, value: 'purple' },
	{ id: 'bg-pink', name: 'Pink', scope: ColorScope.Bg, value: 'pink' },
];

interface ThemeColorData {
	current?: { text?: string; bg?: string };
	onSelect: (scope: ColorScope.Text | 'bg', value: string) => void;
}

export const themeColorPicker = defineMenu<ThemeColorData, string, SwatchItem>({
	id: 'themeColorPicker',
	description: 'Native palette menu: section list of color swatch rows.',
	// Defaults to opening below+center on the trigger; override per-call by
	// passing a `position` to ctx.open if a different anchor is wanted.
	position: {
		width: 220,
		vertical: Vertical.Bottom,
		horizontal: Horizontal.Center,
		offsetY: 4,
		fillViewport: true,
	},
	chrome: { dimmer: DimmerMode.None },
	body: {
		kind: BodyKind.List,
		source: { kind: SourceKind.Static, items: SWATCHES },
		rows: [
			{
				kind: RowKind.Section,
				match: (it) => Boolean(it.isSection),
				name: (it) => it.name,
			},
			{
				kind: RowKind.Color,
				match: (it) => !it.isSection,
				// Each item carries its own scope ('text' | 'bg'); the swatch
				// renderer picks the right affordance per row.
				scope: (it) => (it.scope === 'bg' ? ColorScope.Bg : ColorScope.Text),
				value: (it) => it.value,
				name: (it) => it.name,
				active: (_it) => false,
				onSelect: (item, ctx) => {
					ctx.data.onSelect(item.scope, item.value);
					ctx.close();
				},
			},
		],
		virtualized: { rowHeight: (it) => (it.isSection ? 28 : 32) },
	},
	keyboard: { defaults: { closeOnEscape: true, selectOnEnter: true } },
});
