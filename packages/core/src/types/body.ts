/**
 * BodyConfig — the main content area of a menu.
 *
 * Five top-level kinds, plus `composed` for stacked body sections:
 *   list      — sectioned, optionally virtualized list of rows
 *   grid      — 2D tile grid (2D keyboard nav, paste handler, etc.)
 *   form      — labelled fields with submit
 *   custom    — single render function
 *   composed  — vertical stack of any mix of the above (plus panels)
 */

import type { ReactNode } from 'react';
import type { MenuCtx } from './context';
import { BodyKind, ComposedScroll, FormLayout, GridColumns, Orientation, SelectionMode, SortAxis } from './enums';
import type { FieldSpec } from './field';
import type { EmptyStatePanel, LoaderPanel, PanelSpec } from './panel';
import type { ButtonSpec } from './primitives';
import type { RowSpec } from './row';
import type { ItemSource } from './source';

export type BodyConfig<TItem = any, TValue = any, TData = any> =
	| ListBody<TItem, TValue, TData>
	| GridBody<TItem, TValue, TData>
	| FormBody<TValue>
	| CustomBody<TData>
	| ComposedBody<TItem, TValue, TData>;

export interface ListBody<TItem = any, TValue = any, TData = any> {
	kind: BodyKind.List;
	source: ItemSource<TItem, TData>;
	/** Row variants the list may render. The first matching spec wins. */
	rows: RowSpec<TItem>[];
	/**
	 * Layout direction. `Vertical` (default) stacks rows top-to-bottom and
	 * supports virtualization. `Horizontal` flows rows left-to-right (toolbar
	 * style) and bypasses virtualization — use for short fixed-size lists like
	 * format-icon bars.
	 */
	orientation?: Orientation;
	/**
	 * Virtualize via windowed rendering. **Required** past ~100 rows — the
	 * runtime never wraps a list body in a non-virtualizing scroll container,
	 * because doing so degrades quickly under realistic data sizes.
	 *
	 * Setting `true` selects sensible defaults (overscan 8, row height read
	 * from the row spec or theme `--fm-row-height`). Provide an object to
	 * pin variable heights or override overscan.
	 */
	virtualized?:
		| boolean
		| {
				rowHeight: number | ((item: TItem, index: number) => number);
				overscan?: number;
				/** Measure rows after first paint when heights aren't known up-front. */
				measureRows?: boolean;
		  };
	/** Pagination — invoked when the user scrolls near the end of loaded rows. */
	infiniteScroll?: {
		pageSize: number;
		loadMore: (offset: number, ctx: MenuCtx) => Promise<TItem[]>;
	};
	/** Drag-reorder the entire list. */
	sortable?: SortableConfig<TItem>;
	/** Single- or multi-select. */
	selection?: SelectionConfig<TItem, TValue>;
	/** Empty / loading / error states. */
	emptyState?: EmptyStatePanel;
	loading?: LoaderPanel | boolean;
	/** Fired when the user changes the filter input (chrome-supplied). */
	onFilterChange?: (value: string, ctx: MenuCtx) => void;
}

export interface SortableConfig<TItem = any> {
	/** Keyboard shortcut to enter drag mode. Default: shift+arrowup/arrowdown. */
	keyboardShortcut?: string;
	/** Disable drag for items matching this predicate. */
	isDraggable?: (item: TItem) => boolean;
	onReorder: (oldIndex: number, newIndex: number, ctx: MenuCtx) => void;
	/** Restrict axis: 'y' (vertical), 'x' (horizontal), or 'both'. */
	axis?: SortAxis;
}

export interface SelectionConfig<TItem = any, TValue = any> {
	mode: SelectionMode;
	/** Currently selected ids/values. */
	value?: TValue;
	isSelected?: (item: TItem) => boolean;
	onChange: (value: TValue, ctx: MenuCtx) => void;
	/** Close the menu after selection (single mode default: true; multi: false). */
	closeOnSelect?: boolean;
	/** Maximum number of selected items in multi mode. */
	maxCount?: number;
}

export interface GridBody<TItem = any, TValue = any, TData = any> {
	kind: BodyKind.Grid;
	source: ItemSource<TItem, TData>;
	columns: number | GridColumns.Auto;
	rowHeight: number;
	gap?: number;
	/** Each cell renders fully. */
	renderCell: (item: TItem, ctx: MenuCtx) => ReactNode;
	/** Variable column count based on container width. */
	responsive?: { minCellWidth: number };
	virtualized?: boolean;
	keyboardNav2D?: boolean;
	selection?: SelectionConfig<TItem, TValue>;
	emptyState?: EmptyStatePanel;
	loading?: LoaderPanel | boolean;
	/** Drag and drop files into the grid (e.g. upload). */
	acceptDrop?: {
		accept?: string;
		multiple?: boolean;
		onFiles: (files: File[], ctx: MenuCtx) => void | Promise<void>;
	};
	pasteFromClipboard?: boolean;
	onCellClick?: (item: TItem, ctx: MenuCtx) => void;
	onCellContextMenu?: (item: TItem, ctx: MenuCtx) => void;
	onCellLongPress?: (item: TItem, ctx: MenuCtx) => void;
	longPressMs?: number;
}

export interface FormBody<TValue = Record<string, unknown>> {
	kind: BodyKind.Form;
	fields: FieldSpec[];
	initialValues?: Partial<TValue>;
	validate?: (values: TValue) => Partial<Record<keyof TValue, string>> | null;
	onSubmit: (values: TValue, ctx: MenuCtx) => void | Promise<void>;
	/** Submit button — set to null to suppress and submit programmatically. */
	submit?: ButtonSpec | null;
	/** Layout: one column (default) or two-column with field.span overrides. */
	layout?: FormLayout;
	/** Fire onChange at this debounce (ms). */
	debounceMs?: number;
}

export interface CustomBody<TData = any> {
	kind: BodyKind.Custom;
	render: (ctx: MenuCtx<TData>) => ReactNode;
	measureHeight?: (ctx: MenuCtx<TData>) => number;
}

export interface ComposedBody<TItem = any, TValue = any, TData = any> {
	kind: BodyKind.Composed;
	/** Ordered sections — list / grid / form / panel / custom in any combination. */
	sections: Array<
		| (ListBody<TItem, TValue, TData> & { id: string })
		| (GridBody<TItem, TValue, TData> & { id: string })
		| (FormBody<TValue> & { id: string })
		| (CustomBody<TData> & { id: string })
		| (PanelSpec & { id: string })
	>;
	/** Inter-section spacing (px). */
	gap?: number;
	/** Whether the entire composition scrolls (or each section independently). */
	scroll?: ComposedScroll;
}
