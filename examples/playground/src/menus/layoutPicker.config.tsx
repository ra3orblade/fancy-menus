/**
 * Layout picker — view-type tile grid with dynamic dependent settings.
 *
 * Exercises:
 *   - composed body: tile grid + dependent form section
 *   - settings re-render based on the selected layout
 *   - mix of switch / select / slider fields in the form
 */

import {
	BodyKind,
	DimmerMode,
	FieldKind,
	Horizontal,
	KeyboardNavigation,
	SourceKind,
	Vertical,
	defineMenu,
} from '@fancy-menus/core';
import { Calendar, Columns, Grid3x3, KanbanSquare, LayoutGrid, List, Network, Rows } from 'lucide-react';

interface LayoutOption {
	id: string;
	label: string;
	icon: any;
}

const LAYOUTS: LayoutOption[] = [
	{ id: 'list', label: 'List', icon: List },
	{ id: 'grid', label: 'Grid', icon: Grid3x3 },
	{ id: 'gallery', label: 'Gallery', icon: LayoutGrid },
	{ id: 'board', label: 'Board', icon: KanbanSquare },
	{ id: 'calendar', label: 'Calendar', icon: Calendar },
	{ id: 'graph', label: 'Graph', icon: Network },
	{ id: 'columns', label: 'Columns', icon: Columns },
	{ id: 'rows', label: 'Rows', icon: Rows },
];

interface LayoutPickerData {
	layout: string;
	settings: Record<string, unknown>;
	onChange: (layout: string, settings: Record<string, unknown>) => void;
}

export const layoutPicker = defineMenu<LayoutPickerData, { layout: string; settings: Record<string, unknown> }>({
	id: 'layoutPicker',
	description: 'View-type tile grid with layout-dependent settings form below.',
	position: { width: 360, vertical: Vertical.Bottom, horizontal: Horizontal.Left },
	chrome: { title: 'Layout', dimmer: DimmerMode.Default },
	body: {
		kind: BodyKind.Composed,
		sections: [
			{
				id: 'tiles',
				kind: BodyKind.Grid,
				source: { kind: SourceKind.Static, items: LAYOUTS },
				columns: 4,
				rowHeight: 72,
				keyboardNav2D: true,
				renderCell: (item: LayoutOption) => {
					const Icon = item.icon;
					return (
						<div className="flex size-full flex-col items-center justify-center gap-1 rounded-md border border-border p-2 hover:bg-accent">
							<Icon className="size-5" />
							<span className="text-xs">{item.label}</span>
						</div>
					);
				},
				onCellClick: (item, ctx) => {
					ctx.updateData({ layout: item.id } as never);
				},
			},
			{
				id: 'settings',
				kind: BodyKind.Form,
				fields: [
					{ name: 'hideIcon', kind: FieldKind.Switch, label: 'Hide icon', defaultValue: false },
					{
						name: 'wrapContent',
						kind: FieldKind.Switch,
						label: 'Wrap text in cells',
						defaultValue: true,
					},
					{
						name: 'pageSize',
						kind: FieldKind.Select,
						label: 'Items per page',
						options: [
							{ id: '25', name: '25' },
							{ id: '50', name: '50' },
							{ id: '100', name: '100' },
						],
						defaultValue: '50',
					},
					{
						name: 'cardSize',
						kind: FieldKind.Select,
						label: 'Card size',
						hidden: (v) => v.layout !== 'gallery' && v.layout !== 'board',
						options: [
							{ id: 'small', name: 'Small' },
							{ id: 'medium', name: 'Medium' },
							{ id: 'large', name: 'Large' },
						],
						defaultValue: 'medium',
					},
				],
				onSubmit: () => {},
				submit: null,
			},
		],
	},
	keyboard: { navigation: KeyboardNavigation.Grid2D, defaults: { closeOnEscape: true } },
});
