/**
 * ListBody renderer — virtualized via @tanstack/react-virtual, with row
 * dispatch through the row registry and keyboard nav wiring.
 */

import {
	type CollisionDetection,
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	pointerWithin,
	rectIntersection,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ListBody } from '../types/body';
import type { MenuCtx } from '../types/context';
import { Orientation, RowKind, SortAxis } from '../types/enums';
import type { RowSpec } from '../types/row';
import { useKeyboard } from './keyboard';
import { pickSpec, renderRow } from './rows';
import { filterItems, useResolvedSource } from './source';

interface ListBodyViewProps {
	body: ListBody<any, any, any>;
	ctx: MenuCtx;
	filter: string;
	onCloseRequest: () => void;
	isSubMenu?: boolean;
}

const DEFAULT_ROW_HEIGHT = 32;
const DEFAULT_OVERSCAN = 8;

export function ListBodyView({ body, ctx, filter, onCloseRequest, isSubMenu }: ListBodyViewProps) {
	const { items: rawItems, loading, hasMore, loadMore } = useResolvedSource(body.source, filter, ctx);
	// Async / Composite sources receive `filter` directly and curate their
	// own results. Re-filtering them client-side would drop server-ranked
	// items the server intentionally returned. For Static / Prop / Sections /
	// Store sources, apply the substring filter as a convenience.
	const items = useMemo(() => {
		const sk = (body.source as any)?.kind;
		if (sk === 'async' || sk === 'composite') return rawItems;
		return filterItems(rawItems, filter);
	}, [rawItems, filter, body.source]);

	const scrollerRef = useRef<HTMLDivElement | null>(null);
	const [activeIndex, setActiveIndex] = useState(0);

	// Reset active when filter or items change. For horizontal toolbars
	// (icon bars, format strips) we deliberately leave nothing pre-highlighted
	// so a freshly-opened bar doesn't look like the first button is selected.
	useEffect(() => {
		if (body.orientation === Orientation.Horizontal) {
			setActiveIndex(-1);
			return;
		}
		setActiveIndex(items.length > 0 ? firstSelectableIndex(items, body.rows) : -1);
	}, [items, body.rows, body.orientation]);

	// Auto-focus the scroller so ArrowUp/Down/Right/Left work without a
	// click. We defer to next frame so that a chrome filter input (which
	// has its own autoFocus) wins the focus race when present; otherwise
	// the menu body itself takes focus.
	useEffect(() => {
		const id = requestAnimationFrame(() => {
			const el = scrollerRef.current;
			if (!el) return;
			// Don't yank focus from an input the user is in.
			const active = document.activeElement;
			if (active && active.tagName === 'INPUT') return;
			if (el.contains(active)) return;
			el.focus({ preventScroll: true });
		});
		return () => cancelAnimationFrame(id);
	}, [isSubMenu]);

	const rowHeight = useCallback(
		(index: number): number => {
			const v = body.virtualized;
			if (typeof v === 'object' && v.rowHeight) {
				return typeof v.rowHeight === 'function' ? v.rowHeight(items[index], index) : v.rowHeight;
			}
			const spec = pickSpec(body.rows, items[index]);
			if (spec?.kind === RowKind.Section) return 28;
			if (spec?.kind === RowKind.Divider) return 9;
			return DEFAULT_ROW_HEIGHT;
		},
		[body.virtualized, body.rows, items]
	);

	const virtualizer = useVirtualizer({
		count: items.length,
		getScrollElement: () => scrollerRef.current,
		estimateSize: rowHeight,
		overscan:
			typeof body.virtualized === 'object' ? (body.virtualized.overscan ?? DEFAULT_OVERSCAN) : DEFAULT_OVERSCAN,
	});

	// Keyboard wiring against the scroller element.
	useKeyboard(
		scrollerRef.current,
		undefined,
		{
			count: items.length,
			index: activeIndex,
			setIndex: (i) => {
				const next = nextSelectableIndex(i, items, body.rows, activeIndex);
				setActiveIndex(next);
				virtualizer.scrollToIndex(next, { align: 'auto' });
			},
			onSelect: (i) => {
				activateRow(items[i], body.rows, ctx);
			},
			onSubmenuOpen: (i) => {
				const item = items[i];
				const spec = pickSpec(body.rows, item) as any;
				if (!spec || spec.kind !== RowKind.Item || !spec.subMenuId) return false;
				const subId = typeof spec.subMenuId === 'function' ? spec.subMenuId(item) : spec.subMenuId;
				if (!subId) return false;
				const rowEl = scrollerRef.current?.querySelector(`[data-index="${i}"] [data-submenu-id]`);
				const triggerRect = (rowEl as HTMLElement | null)?.getBoundingClientRect();
				const data = spec.subMenuData ? spec.subMenuData(item, ctx) : ctx.data;
				void ctx.open(subId, { element: rowEl ?? undefined, data, triggerRect });
				return true;
			},
			onClose: onCloseRequest,
			closeOnArrowLeft: isSubMenu,
		},
		ctx
	);

	// Infinite scroll trigger — guard against re-firing every render. The
	// virtualizer returns a fresh getVirtualItems() array on each render,
	// which would re-run this effect constantly; instead key off the
	// last-rendered index and remember the last offset we asked to load.
	const lastFetchedOffset = useRef(-1);
	const visibleItems = virtualizer.getVirtualItems();
	const lastVisibleIndex = visibleItems.length ? visibleItems[visibleItems.length - 1]!.index : -1;
	useEffect(() => {
		if (!body.infiniteScroll) return;
		if (lastVisibleIndex < 0) return;
		if (!hasMore || loading) return;
		// Threshold: trigger when we're within 5 of the end and we haven't
		// already requested this offset.
		if (lastVisibleIndex >= items.length - 5 && lastFetchedOffset.current !== items.length) {
			lastFetchedOffset.current = items.length;
			loadMore();
		}
	}, [lastVisibleIndex, items.length, hasMore, loading, body.infiniteScroll, loadMore]);

	// Sortable wiring (must be declared before any early returns to satisfy
	// rules-of-hooks).
	const sortable = body.sortable;
	// SortableContext expects each id in `items` to have a corresponding
	// useSortable() hook mounted. Non-Sortable rows (e.g. pinned rows in
	// columnVisibility) don't mount one, so they must be excluded from the
	// id list — otherwise dnd-kit can't measure them and the drag-detection
	// pipeline silently drops events.
	const sortableIds = useMemo(() => {
		const out: string[] = [];
		for (let i = 0; i < items.length; i++) {
			const it = items[i] as any;
			const spec = pickSpec(body.rows, it);
			if (!spec || spec.kind !== RowKind.Sortable) continue;
			out.push(String((it as { id?: unknown })?.id ?? i));
		}
		return out;
	}, [items, body.rows]);
	// activationConstraint distance:4 means the user must move ≥4px before
	// the drag commits — small enough to feel responsive, large enough that
	// a pure click on the handle still toggles cleanly.
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
	// Track the actively-dragged id so we can render it in the DragOverlay.
	// The overlay is the canonical pattern for combining dnd-kit with a
	// virtualized list — it renders the dragged element separately (cursor-
	// tracked) so the original stays in place and dnd-kit's collision
	// detection sees the cursor over the *other* sortable items naturally.
	const [activeDragId, setActiveDragId] = useState<string | null>(null);
	// Snapshot the dragged row at drag-start so a mid-drag reorder of the
	// underlying items array doesn't flip the overlay to a different row.
	const draggedItemRef = useRef<any>(null);
	const activeDragItem = activeDragId == null ? null : draggedItemRef.current;
	const onDragStart = useCallback(
		(e: DragStartEvent) => {
			document.body.setAttribute('data-fm-dragging', 'true');
			const id = String(e.active.id);
			setActiveDragId(id);
			draggedItemRef.current = items.find(
				(it: any, i: number) => String((it as { id?: unknown })?.id ?? i) === id
			);
		},
		[items]
	);
	const onDragEnd = useCallback(
		(e: DragEndEvent) => {
			setActiveDragId(null);
			if (!sortable) return;
			const { active, over } = e;
			if (!over || active.id === over.id) return;
			// Translate the (sortable-only) ids back to overall item indices
			// so the consumer's onReorder receives indices into the full
			// items array.
			const findItemIndex = (id: string) =>
				items.findIndex((it: any, i: number) => String((it as { id?: unknown })?.id ?? i) === id);
			const oldIndex = findItemIndex(String(active.id));
			const newIndex = findItemIndex(String(over.id));
			if (oldIndex < 0 || newIndex < 0) return;
			sortable.onReorder(oldIndex, newIndex, ctx);
		},
		[sortable, items, ctx]
	);

	// Empty state
	if (!loading && items.length === 0 && body.emptyState) {
		const message =
			(typeof body.emptyState.title === 'string' && body.emptyState.title) ||
			(typeof body.emptyState.message === 'string' && body.emptyState.message) ||
			'No results';
		return (
			<div className="flex flex-col items-center justify-center px-4 py-8 text-sm text-muted-foreground">
				{message}
			</div>
		);
	}

	// Horizontal layout — toolbar / segmented-control style. Skip the
	// virtualizer entirely (these lists are always short) and render rows
	// inline. Selection / hover / keyboard nav still flow through the same
	// row dispatcher.
	if (body.orientation === Orientation.Horizontal) {
		return (
			<div tabIndex={0} className="fm-list fm-list--horizontal" role="listbox">
				{items.map((item: any, idx: number) => {
					const spec = pickSpec(body.rows, item);
					if (!spec) return null;
					const id = (item as { id?: unknown })?.id;
					const key = typeof id === 'string' || typeof id === 'number' ? id : idx;
					return (
						<div key={key} data-index={idx}>
							{renderRow({
								item,
								spec,
								index: idx,
								active: idx === activeIndex,
								ctx,
								onActivate: () => setActiveIndex(idx),
								extra: { filter },
							})}
						</div>
					);
				})}
			</div>
		);
	}

	const list = (
		<div ref={scrollerRef} tabIndex={0} className="fm-list" role="listbox">
			<div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
				{virtualizer.getVirtualItems().map((vi) => {
					const item = items[vi.index];
					const spec = pickSpec(body.rows, item);
					if (!spec) return null;
					return (
						<div
							key={vi.key}
							data-index={vi.index}
							ref={virtualizer.measureElement}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								transform: `translateY(${vi.start}px)`,
							}}
						>
							{renderRow({
								item,
								spec,
								index: vi.index,
								active: vi.index === activeIndex,
								ctx,
								onActivate: () => setActiveIndex(vi.index),
								extra: { filter },
							})}
						</div>
					);
				})}
			</div>
			{loading && <div className="px-3 py-2 text-xs text-muted-foreground">Loading…</div>}
		</div>
	);

	if (!sortable) return list;

	const modifiers = [restrictToParentElement, sortable.axis === SortAxis.X ? null : restrictToVerticalAxis].filter(
		Boolean
	) as any[];

	return (
		<DndContext
			sensors={sensors}
			// Pointer-based detection — the cursor position is the source of
			// truth, not the dragged element's rect (which doesn't move when
			// using DragOverlay). Falls back to rect intersection so the
			// drop still resolves if the pointer is outside any droppable
			// (e.g. user drags fast).
			collisionDetection={
				((args) => {
					const r = pointerWithin(args);
					return r.length ? r : rectIntersection(args);
				}) as CollisionDetection
			}
			modifiers={modifiers}
			onDragStart={onDragStart}
			onDragEnd={(e) => {
				document.body.removeAttribute('data-fm-dragging');
				onDragEnd(e);
			}}
			onDragCancel={() => {
				document.body.removeAttribute('data-fm-dragging');
				// Without clearing here, the overlay clone stays visible after
				// an Escape-cancelled drag until the next drag start.
				setActiveDragId(null);
			}}
		>
			<SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
				{list}
			</SortableContext>
			{/*
			 * DragOverlay — renders the dragged row independently of the list
			 * so the original stays in place. This lets dnd-kit's collision
			 * detection see the cursor over the *other* sortable items as
			 * the user drags, which is what fires onDragOver / picks the
			 * drop target. Without it, the dragged element follows the
			 * cursor and constantly hit-tests as "over itself".
			 */}
			{/* Portal the overlay to document.body so it floats above any
			    overflow:hidden ancestor (and so consumer DOM queries inside
			    the menu don't pick up the overlay clone as a real row). */}
			{typeof document !== 'undefined' &&
				createPortal(
					<DragOverlay>
						{activeDragItem ? (
							<div className="fm-row-overlay" data-fm-drag-overlay>
								{(() => {
									const spec = pickSpec(body.rows, activeDragItem);
									if (!spec) return null;
									return renderRow({
										item: activeDragItem,
										spec,
										index: -1,
										active: true,
										ctx,
										onActivate: () => {},
										extra: { filter },
									});
								})()}
							</div>
						) : null}
					</DragOverlay>,
					document.body
				)}
		</DndContext>
	);
}

function activateRow<TItem>(item: TItem | undefined, rows: RowSpec<TItem>[], ctx: any): void {
	if (item == null) return;
	const spec = pickSpec(rows, item) as any;
	if (!spec) return;
	if (spec.kind === RowKind.Item) {
		spec.onClick?.(item, new MouseEvent('click') as any, ctx);
	} else if (spec.kind === RowKind.Switch) {
		spec.onSwitch?.(item, !spec.switchValue?.(item), ctx);
	} else if (spec.kind === RowKind.Color) {
		spec.onSelect?.(item, ctx);
	} else if (spec.kind === RowKind.Participant) {
		spec.onSelect?.(item, ctx);
	} else if (spec.kind === RowKind.Add) {
		spec.onClick?.(undefined, ctx);
	}
}

function isSelectable<TItem>(item: TItem, rows: RowSpec<TItem>[]): boolean {
	const spec = pickSpec(rows, item);
	if (!spec) return false;
	return spec.kind !== RowKind.Section && spec.kind !== RowKind.Divider && spec.kind !== RowKind.Empty;
}

function firstSelectableIndex<TItem>(items: TItem[], rows: RowSpec<TItem>[]): number {
	for (let i = 0; i < items.length; i++) if (isSelectable(items[i] as TItem, rows)) return i;
	return -1;
}

function nextSelectableIndex<TItem>(
	candidate: number,
	items: TItem[],
	rows: RowSpec<TItem>[],
	current: number
): number {
	const direction = candidate > current ? 1 : -1;
	let i = candidate;
	let guard = items.length;
	while (guard-- > 0) {
		if (i < 0) i = items.length - 1;
		if (i >= items.length) i = 0;
		if (isSelectable(items[i] as TItem, rows)) return i;
		i += direction;
	}
	return current;
}
