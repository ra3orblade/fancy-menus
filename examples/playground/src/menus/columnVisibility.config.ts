/**
 * Column visibility — sortable list with per-row switches.
 *
 * Exercises:
 *   - sortable rows (drag handle + drag-reorder via dnd-kit)
 *   - switch row variant (toggle per row)
 *   - pinned rows (rendered without drag handle, read-only)
 *   - footer "Done" button via chrome.footer
 *   - keyboard: Space toggles focused row's switch
 *
 * Implementation note: the column list lives in the menu's `data` payload
 * (Prop source) so reorder + visibility toggles can update it through
 * `ctx.updateData` and the runtime re-renders with the new order.
 */

import {
	BodyKind,
	ButtonColor,
	FooterKind,
	Horizontal,
	RowKind,
	SortAxis,
	SourceKind,
	Vertical,
	defineMenu,
} from '@react-fancy-menus/core';

interface ColumnItem {
	id: string;
	name: string;
	visible: boolean;
	pinned?: boolean;
}

interface ColumnVisibilityData {
	columns: ColumnItem[];
	onApply: (cols: ColumnItem[]) => void;
}

export const columnVisibility = defineMenu<ColumnVisibilityData, ColumnItem[], ColumnItem>({
	id: 'columnVisibility',
	description: 'Drag-reorderable column list with per-row visibility toggles.',
	position: { width: 280, vertical: Vertical.Bottom, horizontal: Horizontal.Right },
	chrome: {
		title: 'Columns',
		footer: {
			kind: FooterKind.Buttons,
			buttons: [{ id: 'done', label: 'Done', color: ButtonColor.Accent, onClick: () => {} }],
		},
	},
	body: {
		kind: BodyKind.List,
		// Items live on `data.columns` so the runtime can re-read them after
		// every ctx.updateData call (reorder / toggle visibility).
		source: {
			kind: SourceKind.Prop,
			getItems: (data: ColumnVisibilityData) => data.columns,
		},
		rows: [
			{
				kind: RowKind.Sortable,
				match: (it) => !it.pinned,
				inner: {
					kind: RowKind.Switch,
					name: (it) => it.name,
					switchValue: (it) => it.visible,
					onSwitch: (item, value, ctx) => {
						const cols = (ctx.data as ColumnVisibilityData).columns;
						const next = cols.map((c) => (c.id === item.id ? { ...c, visible: value } : c));
						ctx.updateData({ columns: next });
					},
				},
				onReorder: () => {
					// Body-level sortable.onReorder handles the reorder; the
					// row-level callback would also work but the body one
					// fires once for the whole list.
				},
			},
			{
				kind: RowKind.Switch,
				match: (it) => Boolean(it.pinned),
				name: (it) => `${it.name} (pinned)`,
				switchValue: (it) => it.visible,
				readonly: true,
				onSwitch: () => {},
			},
		],
		virtualized: { rowHeight: 36 },
		sortable: {
			axis: SortAxis.Y,
			isDraggable: (it) => !it.pinned,
			onReorder: (oldIndex, newIndex, ctx) => {
				const cols = (ctx.data as ColumnVisibilityData).columns;
				const next = cols.slice();
				const [moved] = next.splice(oldIndex, 1);
				if (moved) next.splice(newIndex, 0, moved);
				ctx.updateData({ columns: next });
			},
		},
	},
	keyboard: {
		defaults: {
			closeOnEscape: true,
			spaceToSwitch: true,
			shiftArrowToSort: true,
		},
	},
});
