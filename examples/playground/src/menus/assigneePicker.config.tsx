/**
 * Assignee picker — async-paginated participant list with multi-select.
 *
 * Exercises:
 *   - async source with infinite scroll
 *   - participant row primitive (avatar + name + identity + check)
 *   - multi-select with closeOnSelect: false
 *   - "create new" inline add row
 */

import {
	BodyKind,
	DimmerMode,
	Horizontal,
	PanelKind,
	RowKind,
	SelectionMode,
	SourceKind,
	Vertical,
	defineMenu,
} from '@react-fancy-menus/core';
import { Plus, UserCircle } from '@phosphor-icons/react';

interface Person {
	id: string;
	name: string;
	identity: string;
	avatar?: string;
}

interface AssigneePickerData {
	selectedIds: string[];
	onChange: (ids: string[]) => void;
	onInvite?: (name: string) => void;
}

export const assigneePicker = defineMenu<AssigneePickerData, string[], Person>({
	id: 'assigneePicker',
	description: 'Async paginated person picker with multi-select and inline invite.',
	position: { width: 320, vertical: Vertical.Bottom, horizontal: Horizontal.Left },
	chrome: {
		filter: { placeholder: 'Search people…', focusOnMount: true, debounceMs: 200 },
		dimmer: DimmerMode.Default,
	},
	body: {
		kind: BodyKind.List,
		source: {
			kind: SourceKind.Async,
			pageSize: 20,
			fetch: async ({ offset, limit, filter }) => {
				const items: Person[] = Array.from({ length: limit }, (_, i) => ({
					id: `${offset + i}`,
					name: `${filter ?? 'User'} ${offset + i + 1}`,
					identity: `user${offset + i + 1}@example.com`,
				}));
				return { items, hasMore: offset < 100 };
			},
		},
		rows: [
			{
				kind: RowKind.Participant,
				iconRender: (p) => (
					<div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
						{p.name.slice(0, 2).toUpperCase()}
					</div>
				),
				name: (p) => p.name,
				identity: (p) => p.identity,
				selected: (_p) => false, // wired by selection.value in real use
				onSelect: (p, ctx) => {
					const next = ctx.data.selectedIds.includes(p.id)
						? ctx.data.selectedIds.filter((id: string) => id !== p.id)
						: [...ctx.data.selectedIds, p.id];
					ctx.data.onChange(next);
				},
			},
			{
				kind: RowKind.Add,
				match: () => false, // toggled to true by the runtime when filter has text and no exact match
				icon: { icon: Plus, size: 14 },
				name: 'Invite by email',
				useFilterAsName: true,
				onClick: (filter, ctx) => {
					if (filter && ctx.data.onInvite) ctx.data.onInvite(filter);
				},
			},
		],
		virtualized: { rowHeight: 44 },
		infiniteScroll: { pageSize: 20, loadMore: async () => [] },
		selection: {
			mode: SelectionMode.Multi,
			isSelected: (_p) => false,
			onChange: () => {},
			closeOnSelect: false,
		},
		emptyState: {
			kind: PanelKind.EmptyState,
			icon: { icon: UserCircle, size: 24 },
			message: 'No people match.',
		},
	},
	keyboard: { defaults: { closeOnEscape: true, selectOnEnter: true, cycleWrap: true } },
});
