/**
 * Sortable row — renders the inner row spec unchanged but injects a drag
 * handle into the inner row's `prefix` slot. This keeps the handle inside
 * the same hover container as the rest of the row.
 *
 * The drag wiring (DndContext + SortableContext) is set up by the list body
 * when `body.sortable` is present; this row only needs to call `useSortable`
 * for its own id and forward the listeners to the handle.
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DotsSixVertical } from '@phosphor-icons/react';
import clsx from 'clsx';
import type * as React from 'react';
import { RowKind } from '../../types/enums';
import type { SortableRow } from '../../types/row';
import type { RowRenderProps } from './index';
import { ItemRowView } from './item';
import { ObjectRowView } from './object';
import { ParticipantRowView } from './participant';
import { SwitchRowView } from './switch';

function rowId(item: any, index: number): string {
	if (item == null) return String(index);
	return String((item as { id?: unknown })?.id ?? index);
}

export function SortableRowView<TItem>(props: RowRenderProps<TItem>) {
	const s = props.spec as SortableRow<TItem>;
	const id = rowId(props.item, props.index);
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id,
	});

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.4 : 1,
		zIndex: isDragging ? 10 : undefined,
		// While being dragged, let the cursor pass through to whatever drop
		// target is underneath — otherwise dnd-kit's collision detection
		// always reports the dragged element as "over" itself.
		pointerEvents: isDragging ? 'none' : undefined,
	};

	const innerProps = {
		...props,
		spec: s.inner,
		prefix: <DragHandle dragListeners={listeners} dragAttributes={attributes} />,
	};

	const inner = (() => {
		switch (s.inner.kind) {
			case RowKind.Item:
				return <ItemRowView {...(innerProps as any)} />;
			case RowKind.Object:
				return <ObjectRowView {...(innerProps as any)} />;
			case RowKind.Switch:
				return <SwitchRowView {...(innerProps as any)} />;
			case RowKind.Participant:
				return <ParticipantRowView {...(innerProps as any)} />;
			case RowKind.Custom:
				return <>{(s.inner as any).render(props.item, props.ctx)}</>;
			default:
				return null;
		}
	})();

	return (
		<div ref={setNodeRef} style={style}>
			{inner}
		</div>
	);
}

function DragHandle({
	dragListeners,
	dragAttributes,
}: {
	dragListeners: Record<string, any> | undefined;
	dragAttributes: Record<string, any>;
}) {
	// Compose dnd-kit's pointerdown with stopPropagation. We must:
	//   1) call dnd-kit's onPointerDown so the drag actually starts
	//   2) stop propagation so the parent row's onPointerDown (e.g. a
	//      Switch row's toggle, which calls preventDefault and would
	//      cancel the drag) never fires
	const dndPointerDown = dragListeners?.onPointerDown;
	const dndKeyDown = dragListeners?.onKeyDown;
	return (
		<span
			{...dragAttributes}
			{...dragListeners}
			onPointerDown={(e) => {
				e.stopPropagation();
				dndPointerDown?.(e);
			}}
			onKeyDown={(e) => {
				e.stopPropagation();
				dndKeyDown?.(e);
			}}
			onClick={(e) => e.stopPropagation()}
			aria-label="Drag to reorder"
			role="button"
			tabIndex={0}
			className={clsx(
				'shrink-0 cursor-grab text-[color:var(--fm-muted-fg)] opacity-50 transition-opacity',
				'hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none active:cursor-grabbing'
			)}
			data-fm-drag-handle
		>
			<DotsSixVertical className="size-3.5" />
		</span>
	);
}
