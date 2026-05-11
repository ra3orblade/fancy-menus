/**
 * Row renderer dispatcher. Picks the matching RowSpec and renders the
 * corresponding component.
 */

import type { ReactNode } from 'react';
import type { MenuCtx } from '../../types/context';
import { RowKind } from '../../types/enums';
import type { RowSpec } from '../../types/row';
import { AddRowView } from './add';
import { CheckboxRowView } from './checkbox';
import { ChipRowView } from './chip';
import { ColorRowView } from './color';
import { DividerRowView } from './divider';
import { FilterRuleRowView } from './filterRule';
import { ItemRowView } from './item';
import { ObjectRowView } from './object';
import { ParticipantRowView } from './participant';
import { SectionRowView } from './section';
import { SelectNavRowView } from './selectNav';
import { SortableRowView } from './sortable';
import { SwitchRowView } from './switch';

export interface RowRenderProps<TItem = any> {
	item: TItem;
	spec: RowSpec<TItem>;
	index: number;
	active: boolean;
	ctx: MenuCtx;
	onActivate: () => void;
	/** Per-row extras passed by the body (e.g. current filter for AddRow). */
	extra?: Record<string, unknown>;
	/**
	 * Optional content rendered at the start of the row, before the icon.
	 * Used by SortableRow to inject a drag handle into the *same* hover area
	 * as the rest of the row.
	 */
	prefix?: ReactNode;
}

export function pickSpec<TItem>(specs: RowSpec<TItem>[], item: TItem): RowSpec<TItem> | undefined {
	for (const spec of specs) {
		if (!spec.match || spec.match(item)) return spec;
	}
	return undefined;
}

export function renderRow(props: RowRenderProps): ReactNode {
	switch (props.spec.kind) {
		case RowKind.Item:
			return <ItemRowView {...(props as any)} />;
		case RowKind.Section:
			return <SectionRowView {...(props as any)} />;
		case RowKind.Divider:
			return <DividerRowView {...(props as any)} />;
		case RowKind.Switch:
			return <SwitchRowView {...(props as any)} />;
		case RowKind.Checkbox:
			return <CheckboxRowView {...(props as any)} />;
		case RowKind.SelectNav:
			return <SelectNavRowView {...(props as any)} />;
		case RowKind.Color:
			return <ColorRowView {...(props as any)} />;
		case RowKind.Add:
			return <AddRowView {...(props as any)} />;
		case RowKind.Object:
			return <ObjectRowView {...(props as any)} />;
		case RowKind.Participant:
			return <ParticipantRowView {...(props as any)} />;
		case RowKind.Sortable:
			return <SortableRowView {...(props as any)} />;
		case RowKind.Chip:
			return <ChipRowView {...(props as any)} />;
		case RowKind.FilterRule:
			return <FilterRuleRowView {...(props as any)} />;
		case RowKind.Custom:
			return (props.spec as any).render(props.item, props.ctx);
		default:
			return (
				<div data-row-kind={props.spec.kind} className="px-3 py-2 text-xs text-muted-foreground">
					[{(props.spec as any).kind} row not yet rendered]
				</div>
			);
	}
}
