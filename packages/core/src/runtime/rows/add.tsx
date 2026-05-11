import { Plus } from '@phosphor-icons/react';
import type { AddRow } from '../../types/row';
import { IconView } from './icon';
import type { RowRenderProps } from './index';
import { renderRenderable } from './util';

interface AddRowExtra {
	filter?: string;
}

export function AddRowView<TItem>({
	item,
	spec,
	active,
	ctx,
	onActivate,
	extra,
	prefix,
}: RowRenderProps<TItem> & { extra?: AddRowExtra }) {
	const s = spec as AddRow<TItem>;
	const filter = extra?.filter ?? '';
	const label = s.useFilterAsName && filter ? `Add "${filter}"` : renderRenderable(s.name, item);

	return (
		<div
			role="option"
			aria-selected={active}
			data-active={active || undefined}
			onMouseEnter={onActivate}
			onClick={() => s.onClick(filter || undefined, ctx)}
			className="fm-row"
		>
			{prefix}
			<span className="fm-row__icon">
				{s.icon ? <IconView icon={s.icon} defaultSize={14} /> : <Plus className="size-3.5" />}
			</span>
			<span className="fm-row__name">{label}</span>
		</div>
	);
}
