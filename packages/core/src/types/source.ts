/**
 * ItemSource — how a body finds the items / sections it renders.
 *
 * Variants observed across the inventory:
 *   static    — inline literal array (color picker, layout picker)
 *   prop      — derive from data passed in via the open() call
 *   store     — reactive selector backed by mobx / signals / zustand
 *   async     — paginated fetcher with offset, returning items + total
 *   sections  — pre-grouped sections (used when grouping is non-trivial)
 *   composite — merge multiple sources into one stream (e.g. recents + all)
 */

import { RefetchTrigger, SourceKind } from './enums';
import type { Section } from './primitives';

export interface FetchParams {
	offset: number;
	limit: number;
	filter?: string;
	signal?: AbortSignal;
}

export interface FetchResult<TItem> {
	items: TItem[];
	total?: number;
	hasMore?: boolean;
}

export type ItemSource<TItem = any, TData = any> =
	| StaticSource<TItem>
	| PropSource<TItem, TData>
	| StoreSource<TItem>
	| AsyncSource<TItem>
	| SectionsSource<TItem, TData>
	| CompositeSource<TItem>;

export interface StaticSource<TItem> {
	kind: SourceKind.Static;
	items: TItem[];
}

export interface PropSource<TItem, TData> {
	kind: SourceKind.Prop;
	/** Pull items off the data payload supplied at open time. */
	getItems: (data: TData) => TItem[];
}

export interface StoreSource<TItem> {
	kind: SourceKind.Store;
	/** Reactive selector — runtime re-renders the body when this changes. */
	selector: () => TItem[];
	/** Optional dependency keys for non-reactive stores. */
	deps?: ReadonlyArray<unknown>;
}

export interface AsyncSource<TItem> {
	kind: SourceKind.Async;
	/** Page size used for the initial fetch and for infinite-scroll pages. */
	pageSize: number;
	/** Fetcher invoked on mount and on filter / pagination changes. */
	fetch: (params: FetchParams) => Promise<FetchResult<TItem>>;
	/** Cache key — fetches sharing a key share their result cache. */
	cacheKey?: string | ((params: FetchParams) => string);
	/** Re-fetch on these triggers. */
	refetchOn?: RefetchTrigger[];
}

export interface SectionsSource<TItem, TData> {
	kind: SourceKind.Sections;
	getSections: (data: TData) => Section<TItem>[];
}

export interface CompositeSource<TItem> {
	kind: SourceKind.Composite;
	/** Sources merged in order; first non-empty filter result wins per item id. */
	sources: ItemSource<TItem>[];
	/** De-duplicate merged items by this key. */
	dedupeBy?: (item: TItem) => string;
}
