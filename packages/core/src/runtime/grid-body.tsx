/**
 * GridBody renderer — virtualized 2D grid via @tanstack/react-virtual rows.
 * Each virtual row hosts N cells side-by-side.
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { GridBody } from '../types/body';
import type { MenuCtx } from '../types/context';
import { GridColumns, KeyboardNavigation } from '../types/enums';
import { useKeyboard } from './keyboard';
import { useResolvedSource } from './source';

interface Props {
	body: GridBody<any, any, any>;
	ctx: MenuCtx;
	filter: string;
	onCloseRequest: () => void;
}

export function GridBodyView({ body, ctx, filter, onCloseRequest }: Props) {
	const { items, loading } = useResolvedSource(body.source, filter, ctx);
	const scrollerRef = useRef<HTMLDivElement | null>(null);
	const [containerWidth, setContainerWidth] = useState(0);
	const [activeIndex, setActiveIndex] = useState(0);

	// Measure container for responsive columns
	useEffect(() => {
		const el = scrollerRef.current;
		if (!el || body.columns !== GridColumns.Auto || !body.responsive) return;
		const obs = new ResizeObserver(() => setContainerWidth(el.clientWidth));
		obs.observe(el);
		setContainerWidth(el.clientWidth);
		return () => obs.disconnect();
	}, [body.columns, body.responsive]);

	const columns = useMemo(() => {
		if (body.columns === GridColumns.Auto) {
			const min = body.responsive?.minCellWidth ?? 64;
			return Math.max(1, Math.floor((containerWidth || 240) / min));
		}
		return body.columns;
	}, [body.columns, body.responsive, containerWidth]);

	const rows = Math.ceil(items.length / columns);

	const virtualizer = useVirtualizer({
		count: rows,
		getScrollElement: () => scrollerRef.current,
		estimateSize: () => body.rowHeight + (body.gap ?? 4),
		overscan: 4,
	});

	useKeyboard(
		scrollerRef.current,
		{ navigation: body.keyboardNav2D ? KeyboardNavigation.Grid2D : KeyboardNavigation.Linear },
		{
			count: items.length,
			index: activeIndex,
			setIndex: (i) => {
				setActiveIndex(i);
				const r = Math.floor(i / columns);
				virtualizer.scrollToIndex(r, { align: 'auto' });
			},
			onSelect: (i) => {
				const item = items[i];
				if (item != null) body.onCellClick?.(item, ctx);
			},
			onClose: onCloseRequest,
			columns,
		},
		ctx
	);

	if (!loading && items.length === 0 && body.emptyState) {
		return (
			<div className="flex flex-col items-center justify-center px-4 py-8 text-sm text-muted-foreground">
				{(typeof body.emptyState.message === 'string' && body.emptyState.message) || 'No items'}
			</div>
		);
	}

	return (
		<div
			ref={scrollerRef}
			className="fm-grid relative max-h-[60vh] min-h-[80px] overflow-y-auto outline-none"
			role="grid"
		>
			<div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
				{virtualizer.getVirtualItems().map((vi) => {
					const start = vi.index * columns;
					const slice = items.slice(start, start + columns);
					return (
						<div
							key={vi.key}
							role="row"
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								transform: `translateY(${vi.start}px)`,
								display: 'grid',
								gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
								gap: body.gap ?? 4,
								padding: body.gap ?? 4,
							}}
						>
							{slice.map((item, i) => {
								const idx = start + i;
								return (
									<div
										key={idx}
										role="gridcell"
										aria-selected={idx === activeIndex}
										onMouseEnter={() => setActiveIndex(idx)}
										onClick={() => body.onCellClick?.(item, ctx)}
										onContextMenu={(e) => {
											if (!body.onCellContextMenu) return;
											e.preventDefault();
											body.onCellContextMenu(item, ctx);
										}}
										className={clsx(
											'flex items-center justify-center rounded-md border border-transparent transition-colors cursor-pointer',
											idx === activeIndex && 'border-border bg-accent'
										)}
										style={{ height: body.rowHeight }}
									>
										{body.renderCell(item, ctx)}
									</div>
								);
							})}
						</div>
					);
				})}
			</div>
			{loading && <div className="px-3 py-2 text-xs text-muted-foreground">Loading…</div>}
		</div>
	);
}
