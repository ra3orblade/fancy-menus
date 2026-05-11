import type { ReactNode } from 'react';
import type { Renderable } from '../../types/primitives';

export function renderRenderable<TItem>(value: Renderable<TItem> | undefined, item: TItem): ReactNode {
	if (value == null) return null;
	if (typeof value === 'function') return (value as (i: TItem) => ReactNode)(item);
	return value as ReactNode;
}

export function evalProp<T, R>(value: ((item: T) => R) | R | undefined, item: T): R | undefined {
	if (typeof value === 'function') return (value as (i: T) => R)(item);
	return value;
}
