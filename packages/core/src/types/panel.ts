/**
 * Panel primitives — full-bleed body regions that aren't a list of rows.
 *
 * A `BodyConfig` of kind `composed` stacks panels and lists vertically. The
 * runtime ships built-in renderers for every kind below; consumers can also
 * provide a `kind: 'custom'` panel with a render function.
 */

import type { ChangeEvent, DragEvent, ReactNode } from 'react';
import type { MenuCtx } from './context';
import { BannerVariant, PanelKind } from './enums';
import type { ButtonSpec, IconParam, Renderable, TooltipParam } from './primitives';
import type { ItemSource } from './source';

export type PanelSpec =
	| SearchInputPanel
	| TabBarPanel
	| TileGridPanel
	| EmojiGridPanel
	| RecentStripPanel
	| CategoryJumpPanel
	| FileDropZonePanel
	| MonthGridPanel
	| CodeEditorPanel
	| KatexPreviewPanel
	| QrCodePanel
	| SliderPanel
	| LinkPreviewPanel
	| LoaderPanel
	| EmptyStatePanel
	| ErrorPanel
	| MarkdownToolbarPanel
	| AdvancedQueryBuilderPanel
	| LabelPanel
	| DividerPanel
	| BannerPanel
	| CustomPanel;

export interface SearchInputPanel {
	kind: PanelKind.SearchInput;
	placeholder?: string;
	icon?: IconParam;
	debounceMs?: number;
	focusOnMount?: boolean;
	underlined?: boolean;
	onChange: (value: string, ctx: MenuCtx) => void;
	onClear?: (ctx: MenuCtx) => void;
}

export interface TabBarPanel {
	kind: PanelKind.TabBar;
	tabs: Array<{ id: string; label: string; icon?: IconParam }>;
	activeId: string;
	onChange: (id: string, ctx: MenuCtx) => void;
	rightSlot?: ReactNode;
}

export interface TileGridPanel<TItem = any> {
	kind: PanelKind.TileGrid;
	source: ItemSource<TItem>;
	columns: number | 'auto';
	rowHeight: number;
	gap?: number;
	/** Each tile renders fully — return the tile contents. */
	renderTile: (item: TItem, ctx: MenuCtx) => ReactNode;
	/** Enable 2D arrow-key navigation (up/down moves rows, left/right moves cols). */
	keyboardNav2D?: boolean;
	/** Selection state — runtime applies `aria-selected` and a CSS class. */
	selectedId?: (item: TItem) => boolean;
	onSelect?: (item: TItem, ctx: MenuCtx) => void;
	onContextMenu?: (item: TItem, ctx: MenuCtx) => void;
	onLongPress?: (item: TItem, ctx: MenuCtx) => void;
	longPressMs?: number;
	emptyState?: EmptyStatePanel;
	loading?: boolean;
}

export interface EmojiGridPanel<TItem = any> extends Omit<TileGridPanel<TItem>, 'kind'> {
	kind: PanelKind.EmojiGrid;
	/**
	 * Section grouping: items can be tagged with `categoryId` and the panel
	 * draws section headers for each. Categories drive the optional jump bar.
	 */
	groupBy?: (item: TItem) => string;
	/** Show recent items as a synthetic prepended section. */
	recents?: {
		storageKey?: string;
		limit: number;
		label: string;
	};
	/** Skin-tone or color variant chooser opened on long-press / right-click. */
	variantPicker?: VariantPickerSpec<TItem>;
}

export interface VariantPickerSpec<TItem = any> {
	/** Variants for the focused item (e.g. skin-tones 1..6, colors 1..10). */
	getVariants: (item: TItem) => Array<{ id: string; render: () => ReactNode }>;
	onSelect: (item: TItem, variantId: string, ctx: MenuCtx) => void;
}

export interface RecentStripPanel<TItem = any> {
	kind: PanelKind.RecentStrip;
	source: ItemSource<TItem>;
	renderItem: (item: TItem, ctx: MenuCtx) => ReactNode;
	onSelect?: (item: TItem, ctx: MenuCtx) => void;
	emptyMessage?: string;
}

export interface CategoryJumpPanel {
	kind: PanelKind.CategoryJump;
	/** One entry per scrollable section in the body above. */
	categories: Array<{ id: string; icon: IconParam; tooltip?: string }>;
	/** Currently visible category, computed by the runtime from scroll position. */
	activeId?: string;
	onJump: (id: string, ctx: MenuCtx) => void;
	/** Optional trailing slot (e.g. a "shuffle" / random affordance). */
	trailing?: { icon: IconParam; tooltip?: string; onClick: (ctx: MenuCtx) => void };
}

export interface FileDropZonePanel {
	kind: PanelKind.FileDropZone;
	accept?: string; // e.g. 'image/*'
	multiple?: boolean;
	label?: Renderable;
	icon?: IconParam;
	/** Open OS file dialog on click. Default: true. */
	clickToOpen?: boolean;
	onFiles: (files: File[], ctx: MenuCtx) => void | Promise<void>;
	/** Hook arbitrary `paste` events from the document while open. */
	pasteFromClipboard?: boolean;
}

export interface MonthGridPanel {
	kind: PanelKind.MonthGrid;
	/** Currently focused date (timestamp ms). */
	value?: number;
	onChange: (timestamp: number, ctx: MenuCtx) => void;
	onClear?: (ctx: MenuCtx) => void;
	canEdit?: boolean;
	/** Activity dots per day (e.g. count of records on that date). */
	getDotMap?: (year: number, month: number) => Map<string, number>;
	/** Right-click on a day. */
	onDayContextMenu?: (timestamp: number, ctx: MenuCtx) => void;
	/** Disable keyboard navigation for the grid. */
	noKeyboard?: boolean;
	/** Show a footer (Today / Clear) when canEdit is true. */
	showFooter?: boolean;
	/**
	 * Render an HH:MM time input below the calendar so the value carries
	 * a time component. Selecting a date preserves the chosen time;
	 * editing the time updates the timestamp without changing the date.
	 */
	withTime?: boolean;
	/**
	 * Range of years selectable from the year picker (inclusive).
	 * Defaults to ±50 years from the current cursor year.
	 */
	yearRange?: { from: number; to: number };
}

export interface CodeEditorPanel {
	kind: PanelKind.CodeEditor;
	language?: string;
	value: string;
	placeholder?: string;
	minRows?: number;
	maxRows?: number;
	onChange: (value: string, ctx: MenuCtx) => void;
	onSave?: (value: string, ctx: MenuCtx) => void;
	/** Auto-detect language from pasted content. */
	detectOnPaste?: (text: string) => string | undefined;
}

export interface KatexPreviewPanel {
	kind: PanelKind.KatexPreview;
	expression: string;
	/** Show an example caption below the rendered formula. */
	caption?: string;
	/** Use display mode (block) rather than inline. Default: true. */
	displayMode?: boolean;
}

export interface QrCodePanel {
	kind: PanelKind.QrCode;
	value: string;
	size?: number;
	logo?: string;
	/** Trailing button row (Copy / Download). */
	buttons?: ButtonSpec[];
}

export interface SliderPanel {
	kind: PanelKind.Slider;
	label?: Renderable;
	min: number;
	max: number;
	step?: number;
	value: number;
	/** Discrete snaps; if provided, value snaps to these points. */
	snaps?: number[];
	/** Show the live numeric value alongside the label. */
	showValue?: boolean;
	onChange: (value: number, ctx: MenuCtx) => void;
}

export interface LinkPreviewPanel {
	kind: PanelKind.LinkPreview;
	url: string;
	title?: string;
	description?: string;
	image?: string;
	/** True while the preview is being fetched. */
	loading?: boolean;
}

export interface LoaderPanel {
	kind: PanelKind.Loader;
	message?: Renderable;
	/** Render as full-area overlay. Default: false (inline). */
	overlay?: boolean;
}

export interface EmptyStatePanel {
	kind: PanelKind.EmptyState;
	icon?: IconParam;
	title?: Renderable;
	message?: Renderable;
	action?: ButtonSpec;
}

export interface ErrorPanel {
	kind: PanelKind.Error;
	message: Renderable;
	/** Show a retry action. */
	retry?: { label?: string; onClick: (ctx: MenuCtx) => void };
}

export interface MarkdownToolbarPanel {
	kind: PanelKind.MarkdownToolbar;
	/** Active marks for highlighting toolbar buttons. */
	activeMarks?: string[];
	buttons: Array<{
		id: string;
		icon: IconParam;
		tooltip?: TooltipParam;
		/** Mark id used for active-state lookup. */
		mark?: string;
		onClick: (ctx: MenuCtx) => void;
	}>;
	/** Optional leading style switcher. */
	styleSwitcher?: {
		activeStyle: string;
		icon: IconParam;
		onClick: (ctx: MenuCtx) => void;
	};
}

/** Recursive AND/OR query builder — unbounded nesting of groups and rules. */
export interface AdvancedQueryBuilderPanel<TRule = any, TGroup = any> {
	kind: PanelKind.QueryBuilder;
	/** Root group node. */
	root: TGroup;
	operatorOptions: Array<{ id: string; label: string }>;
	/** Render one rule row inside a group. */
	renderRule: (rule: TRule, ctx: MenuCtx) => ReactNode;
	/** How to traverse a group's children. */
	getChildren: (group: TGroup) => Array<{ kind: 'rule'; data: TRule } | { kind: 'group'; data: TGroup }>;
	getOperator: (group: TGroup) => string;
	onOperatorChange: (group: TGroup, operator: string, ctx: MenuCtx) => void;
	onAddRule: (group: TGroup, ctx: MenuCtx) => void;
	onAddGroup: (group: TGroup, ctx: MenuCtx) => void;
	onDeleteNode: (path: number[], ctx: MenuCtx) => void;
}

/** Plain text label — section title outside a list. */
export interface LabelPanel {
	kind: PanelKind.Label;
	text: Renderable;
	className?: string;
}

/** Horizontal divider line. */
export interface DividerPanel {
	kind: PanelKind.Divider;
	className?: string;
}

/** Banner (informational / promo / upsell). */
export interface BannerPanel {
	kind: PanelKind.Banner;
	variant?: BannerVariant;
	icon?: IconParam;
	title?: Renderable;
	message?: Renderable;
	action?: ButtonSpec;
	dismissible?: boolean;
	onDismiss?: (ctx: MenuCtx) => void;
}

/** Custom panel — full render control. */
export interface CustomPanel {
	kind: PanelKind.Custom;
	render: (ctx: MenuCtx) => ReactNode;
	/** Estimated height (informs the layout / scroll container). */
	measureHeight?: (ctx: MenuCtx) => number;
}
