/**
 * Row primitives — the atomic shapes a list body can render.
 *
 * A list body declares a list of `RowSpec`s. Each spec has a `match`
 * predicate (default: applies to all items). The runtime walks the specs
 * in order and uses the first one whose predicate matches the current item.
 * This lets one list mix item / divider / section-header / switch / add-row
 * etc. without forcing every item to share a shape.
 */

import type { MouseEvent, ReactNode } from 'react';
import type { MenuCtx } from './context';
import { ColorScope, RowKind, SubMenuTrigger } from './enums';
import type { IconParam, Renderable, TooltipParam } from './primitives';

/** Common slots available to every row variant. */
interface RowBase<TItem = any> {
	/** Predicate selecting which items use this row spec. Default: all. */
	match?: (item: TItem) => boolean;
	/** Apply CSS class to the row element. */
	className?: string | ((item: TItem) => string | undefined);
	/** Tooltip on the entire row. */
	tooltip?: TooltipParam | ((item: TItem) => TooltipParam | undefined);
	/** Disable interaction. */
	disabled?: boolean | ((item: TItem) => boolean);
	/** Read-only renders the row but suppresses click handlers. */
	readonly?: boolean | ((item: TItem) => boolean);
	/** Hide entirely (still occupies index for keyboard nav unless skipOver). */
	hidden?: boolean | ((item: TItem) => boolean);
	/** Skip in keyboard navigation entirely. */
	skipOver?: boolean | ((item: TItem) => boolean);
}

/** Standard text row: optional icon + name + caption + arrow + more. */
export interface ItemRow<TItem = any> extends RowBase<TItem> {
	kind: RowKind.Item;
	icon?: IconParam | ((item: TItem) => IconParam | undefined);
	name: Renderable<TItem>;
	caption?: Renderable<TItem>;
	description?: Renderable<TItem>;
	/** Right-aligned arrow indicating a sub-menu. */
	arrow?: boolean | ((item: TItem) => boolean);
	/** Right-aligned three-dot affordance. */
	withMore?: boolean | ((item: TItem) => boolean);
	/** Render as a "big" row (taller, used for objects with descriptions). */
	isBig?: boolean | ((item: TItem) => boolean);
	/**
	 * Toggle-button "pressed" state for toolbar usage (e.g. an active mark
	 * in a format bar). Surfaces as `data-pressed='true'` which `.fm-row`
	 * styles as a held-down state.
	 */
	pressed?: boolean | ((item: TItem) => boolean);
	/** Larger icon size for big rows. */
	iconSize?: number;
	/**
	 * Declarative sub-menu wiring. When set, the runtime auto-spawns this
	 * sub-menu on the configured trigger (hover by default; ArrowRight on
	 * keyboard). Pair with `arrow: true` to surface the chevron affordance.
	 *
	 * Use this when the relationship is purely "row → child menu". For
	 * dynamic / data-dependent spawning, call `ctx.open(...)` from `onClick`
	 * instead.
	 */
	subMenuId?: string | ((item: TItem) => string | undefined);
	/**
	 * How `subMenuId` opens. Defaults to `ArrowHover` (200ms latched-hover).
	 * Use `ArrowClick` for click-only, or `Replace` to swap the current menu
	 * for the child (paged navigation).
	 */
	subMenuTrigger?: SubMenuTrigger;
	/** Hover-open delay in ms when `subMenuTrigger === ArrowHover`. */
	subMenuHoverMs?: number;
	/** Build the data payload passed to the spawned sub-menu. */
	subMenuData?: (item: TItem, ctx: MenuCtx) => unknown;
	onClick?: (item: TItem, e: MouseEvent, ctx: MenuCtx) => void;
	onMore?: (item: TItem, e: MouseEvent, ctx: MenuCtx) => void;
}

/** Section-header row inside a list. */
export interface SectionHeaderRow<TItem = any> extends RowBase<TItem> {
	kind: RowKind.Section;
	name: Renderable<TItem>;
	className?: string;
}

/** Visual divider — non-interactive, fixed height. */
export interface DividerRow<TItem = any> extends RowBase<TItem> {
	kind: RowKind.Divider;
	height?: number;
}

/** Item + Switch toggle on the right. */
export interface SwitchRow<TItem = any> extends RowBase<TItem> {
	kind: RowKind.Switch;
	icon?: IconParam | ((item: TItem) => IconParam | undefined);
	name: Renderable<TItem>;
	caption?: Renderable<TItem>;
	switchValue: (item: TItem) => boolean;
	onSwitch: (item: TItem, value: boolean, ctx: MenuCtx) => void;
}

/** Item + checkbox on the right (single or multi-select). */
export interface CheckboxRow<TItem = any> extends RowBase<TItem> {
	kind: RowKind.Checkbox;
	icon?: IconParam | ((item: TItem) => IconParam | undefined);
	name: Renderable<TItem>;
	checked: (item: TItem) => boolean;
	onToggle: (item: TItem, checked: boolean, ctx: MenuCtx) => void;
}

/** Item + arrow + caption (current value summary) — opens a select sub-menu. */
export interface SelectNavRow<TItem = any> extends RowBase<TItem> {
	kind: RowKind.SelectNav;
	icon?: IconParam | ((item: TItem) => IconParam | undefined);
	name: Renderable<TItem>;
	/** Current value summary shown to the right of the name. */
	caption: Renderable<TItem>;
	/** Sub-menu id to spawn on click / hover. */
	subMenuId: string;
}

/** Color swatch row — colored square + name + active check. */
export interface ColorSwatchRow<TItem = any> extends RowBase<TItem> {
	kind: RowKind.Color;
	/**
	 * `Text` renders the swatch as a letter A in the chosen color (matches
	 * the typical text-color picker affordance); `Bg` renders a solid
	 * colored square. Pass a function to switch per item — useful when the
	 * same list mixes both scopes.
	 */
	scope: ColorScope | ((item: TItem) => ColorScope);
	/** Color identifier (e.g. 'red', 'blue', 1..10). */
	value: (item: TItem) => string | number;
	name: Renderable<TItem>;
	active?: (item: TItem) => boolean;
	onSelect: (item: TItem, ctx: MenuCtx) => void;
}

/** Object row — icon (avatar / object icon) + name + type caption. */
export interface ObjectRow<TItem = any> extends RowBase<TItem> {
	kind: RowKind.Object;
	/** Render the object's icon. Provide a function that returns IconParam. */
	iconRender: (item: TItem) => ReactNode;
	/** Object name (often a typography component honoring plural / pronoun). */
	name: Renderable<TItem>;
	/** Type / secondary line. */
	caption?: Renderable<TItem>;
	/** Show the type caption inline (true) or below the name (false). */
	withDescription?: boolean;
	iconSize?: number;
	onClick?: (item: TItem, e: MouseEvent, ctx: MenuCtx) => void;
	onContextMenu?: (item: TItem, e: MouseEvent, ctx: MenuCtx) => void;
	onMore?: (item: TItem, e: MouseEvent, ctx: MenuCtx) => void;
}

/** Inline "+ Add" row — usually lives at the top or bottom of the list. */
export interface AddRow<TItem = any> extends RowBase<TItem> {
	kind: RowKind.Add;
	icon?: IconParam;
	name: Renderable<TItem>;
	/** When the filter has text, use the filter value as the new name. */
	useFilterAsName?: boolean;
	onClick: (filter: string | undefined, ctx: MenuCtx) => void;
}

/** Sortable / drag-reorderable row. */
export interface SortableRow<TItem = any> extends RowBase<TItem> {
	kind: RowKind.Sortable;
	/** Inner row spec the sortable handle wraps. */
	inner:
		| ItemRow<TItem>
		| ObjectRow<TItem>
		| ChipRow<TItem>
		| SwitchRow<TItem>
		| CheckboxRow<TItem>
		| ParticipantRow<TItem>
		| FilterRuleRow<TItem>
		| CustomRow<TItem>;
	onReorder: (oldIndex: number, newIndex: number, ctx: MenuCtx) => void;
}

/** Chip row — pill-style with optional asc/desc toggle (sort rules). */
export interface ChipRow<TItem = any> extends RowBase<TItem> {
	kind: RowKind.Chip;
	icon?: IconParam | ((item: TItem) => IconParam | undefined);
	name: Renderable<TItem>;
	/** Trailing chip showing sort direction or a status. */
	trailing?: {
		icon: IconParam | ((item: TItem) => IconParam);
		onClick?: (item: TItem, ctx: MenuCtx) => void;
	};
	onClick?: (item: TItem, e: MouseEvent, ctx: MenuCtx) => void;
	onDelete?: (item: TItem, ctx: MenuCtx) => void;
}

/** Filter rule row — relation icon + condition label + value preview. */
export interface FilterRuleRow<TItem = any> extends RowBase<TItem> {
	kind: RowKind.FilterRule;
	icon: (item: TItem) => IconParam;
	relationName: (item: TItem) => string;
	conditionLabel: (item: TItem) => string;
	/** Format value-preview per rule (date string, option chips, etc.). */
	valuePreview: (item: TItem) => ReactNode;
	onClick?: (item: TItem, ctx: MenuCtx) => void;
	onMore?: (item: TItem, ctx: MenuCtx) => void;
	withMore?: boolean;
}

/** Participant row — avatar + name + identity + selection check. */
export interface ParticipantRow<TItem = any> extends RowBase<TItem> {
	kind: RowKind.Participant;
	iconRender: (item: TItem) => ReactNode;
	name: Renderable<TItem>;
	identity?: Renderable<TItem>;
	selected?: (item: TItem) => boolean;
	onSelect: (item: TItem, ctx: MenuCtx) => void;
}

/** Empty-state pseudo-row injected into the list. */
export interface EmptyRow<TItem = any> extends RowBase<TItem> {
	kind: RowKind.Empty;
	message: Renderable<TItem>;
	height?: number;
}

/** Custom row — full render control. */
export interface CustomRow<TItem = any> extends RowBase<TItem> {
	kind: RowKind.Custom;
	/** Estimated row height (used by the virtualizer). */
	height?: number | ((item: TItem) => number);
	render: (item: TItem, ctx: MenuCtx) => ReactNode;
}

export type RowSpec<TItem = any> =
	| ItemRow<TItem>
	| SectionHeaderRow<TItem>
	| DividerRow<TItem>
	| SwitchRow<TItem>
	| CheckboxRow<TItem>
	| SelectNavRow<TItem>
	| ColorSwatchRow<TItem>
	| ObjectRow<TItem>
	| AddRow<TItem>
	| SortableRow<TItem>
	| ChipRow<TItem>
	| FilterRuleRow<TItem>
	| ParticipantRow<TItem>
	| EmptyRow<TItem>
	| CustomRow<TItem>;
