/**
 * Resolve an ItemSource to a current snapshot of items.
 * Foundation supports `static`, `prop`, `sections`, and `async` (initial page).
 * `store` and `composite` are stubbed for follow-up work.
 */

import { useEffect, useRef, useState } from 'react';
import type { MenuCtx } from '../types/context';
import { SourceKind } from '../types/enums';
import type { ItemSource } from '../types/source';

export interface ResolvedSource<TItem> {
	items: TItem[];
	loading: boolean;
	hasMore: boolean;
	loadMore: () => void;
}

export function useResolvedSource<TItem>(
	source: ItemSource<TItem>,
	filter: string,
	ctx: MenuCtx
): ResolvedSource<TItem> {
	const [state, setState] = useState<{ items: TItem[]; loading: boolean; hasMore: boolean }>({
		items: [],
		loading: false,
		hasMore: false,
	});
	const offsetRef = useRef(0);
	// Generation counter — incremented when source/filter change so that any
	// in-flight `loadMore()` can detect it raced and discard its result.
	const genRef = useRef(0);

	// Static / prop / sections resolve synchronously each render.
	useEffect(() => {
		if (source.kind === SourceKind.Static) {
			setState({ items: source.items as TItem[], loading: false, hasMore: false });
			return;
		}
		if (source.kind === SourceKind.Prop) {
			setState({ items: source.getItems(ctx.data) as TItem[], loading: false, hasMore: false });
			return;
		}
		if (source.kind === SourceKind.Sections) {
			const sections = source.getSections(ctx.data);
			const flat = sections.flatMap((s) => [
				// Section header is delegated to the row spec via `match` predicate.
				...s.items,
			]);
			setState({ items: flat as TItem[], loading: false, hasMore: false });
			return;
		}
		if (source.kind === SourceKind.Async) {
			offsetRef.current = 0;
			genRef.current += 1;
			const myGen = genRef.current;
			setState((s) => ({ ...s, loading: true, items: [] }));
			source
				.fetch({ offset: 0, limit: source.pageSize, filter })
				.then((res) => {
					if (myGen !== genRef.current) return;
					setState({
						items: res.items as TItem[],
						loading: false,
						hasMore: res.hasMore ?? false,
					});
					offsetRef.current = res.items.length;
				})
				.catch(() => {
					if (myGen !== genRef.current) return;
					setState((s) => ({ ...s, loading: false }));
				});
			return () => {
				// Bumping the generation invalidates the in-flight promise's
				// state writes — same effect as the previous `cancelled` flag
				// but it also covers `loadMore` calls (which also check myGen).
				genRef.current += 1;
			};
		}
		if (source.kind === SourceKind.Store) {
			// Snapshot the selector once; consumers wanting reactive updates
			// pair this with a hook in their own selector that triggers a
			// re-render of the menu (e.g. mobx-react-lite, zustand). Future
			// work: hook the runtime up to a generic subscribe API.
			setState({ items: (source.selector() as TItem[]) ?? [], loading: false, hasMore: false });
			return;
		}
		// (Composite handled below) — falls through.
		if (source.kind === SourceKind.Composite) {
			// Resolve each sub-source synchronously (static / prop / store /
			// sections) and concatenate. Async sub-sources fire their own
			// promises; their initial resolutions kick a re-render.
			const collected: TItem[] = [];
			for (const sub of source.sources) {
				if (sub.kind === SourceKind.Static) {
					collected.push(...(sub.items as TItem[]));
				} else if (sub.kind === SourceKind.Prop) {
					collected.push(...(sub.getItems(ctx.data) as TItem[]));
				} else if (sub.kind === SourceKind.Sections) {
					for (const sec of sub.getSections(ctx.data)) collected.push(...(sec.items as TItem[]));
				} else if (sub.kind === SourceKind.Store) {
					collected.push(...((sub.selector() as TItem[]) ?? []));
				}
				// Async / nested-composite sub-sources are not resolved here
				// to keep the synchronous path simple. Use a top-level Async
				// source for paginated data instead.
			}
			const dedup = source.dedupeBy;
			const items = dedup ? Array.from(new Map(collected.map((it) => [dedup(it), it])).values()) : collected;
			setState({ items, loading: false, hasMore: false });
			return;
		}
		// `ctx.data` is included so Prop/Sections/Composite sources re-resolve
		// when the consumer mutates the data via `ctx.updateData(...)` (e.g.
		// drag-reorder or filter-state edits).
	}, [source, filter, ctx.data]);

	const loadMore = () => {
		if (source.kind !== SourceKind.Async || state.loading || !state.hasMore) return;
		const myGen = genRef.current;
		setState((s) => ({ ...s, loading: true }));
		source
			.fetch({ offset: offsetRef.current, limit: source.pageSize, filter })
			.then((res) => {
				if (myGen !== genRef.current) return;
				setState((s) => ({
					items: [...s.items, ...(res.items as TItem[])],
					loading: false,
					hasMore: res.hasMore ?? false,
				}));
				offsetRef.current += res.items.length;
			})
			.catch(() => {
				if (myGen !== genRef.current) return;
				setState((s) => ({ ...s, loading: false }));
			});
	};

	return { ...state, loadMore };
}

/** Lightweight filter — case-insensitive substring against `name` or stringified item. */
export function filterItems<TItem>(items: TItem[], query: string): TItem[] {
	if (!query) return items;
	const q = query.toLowerCase();
	return items.filter((it) => {
		const name = (it as any)?.name;
		const haystack = typeof name === 'string' ? name : JSON.stringify(it);
		return haystack.toLowerCase().includes(q);
	});
}
