import { Check } from '@phosphor-icons/react';
import type { ParticipantRow } from '../../types/row';
import type { RowRenderProps } from './index';
import { renderRenderable } from './util';

export function ParticipantRowView<TItem>({ item, spec, active, ctx, onActivate, prefix }: RowRenderProps<TItem>) {
	const s = spec as ParticipantRow<TItem>;
	const selected = s.selected?.(item) ?? false;

	return (
		<div
			role="option"
			aria-selected={active}
			data-active={active || undefined}
			onMouseEnter={onActivate}
			onClick={() => s.onSelect(item, ctx)}
			className="fm-row fm-row--big"
		>
			{prefix}
			<span className="fm-row__icon">{s.iconRender(item)}</span>
			<div className="fm-row__name flex flex-col leading-tight">
				<span className="truncate">{renderRenderable(s.name, item)}</span>
				{s.identity != null && (
					<span className="truncate text-[length:var(--fm-font-size-caption)] text-[color:var(--fm-muted-fg)]">
						{renderRenderable(s.identity, item)}
					</span>
				)}
			</div>
			{selected && <Check className="size-4 text-[color:var(--fm-accent)]" />}
		</div>
	);
}
