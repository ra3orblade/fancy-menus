import clsx from 'clsx';
import { MoreHorizontal } from 'lucide-react';
import type { ObjectRow } from '../../types/row';
import type { RowRenderProps } from './index';
import { evalProp, renderRenderable } from './util';

export function ObjectRowView<TItem>({ item, spec, active, ctx, onActivate, prefix }: RowRenderProps<TItem>) {
	const s = spec as ObjectRow<TItem>;
	const disabled = evalProp(s.disabled, item) ?? false;

	return (
		<div
			role="option"
			aria-selected={active}
			data-active={active || undefined}
			data-disabled={disabled || undefined}
			onMouseEnter={onActivate}
			onClick={(e) => !disabled && s.onClick?.(item, e, ctx)}
			onContextMenu={(e) => {
				if (!s.onContextMenu) return;
				e.preventDefault();
				s.onContextMenu(item, e, ctx);
			}}
			className={clsx('fm-row', s.withDescription && 'fm-row--big')}
		>
			{prefix}
			<span className="fm-row__icon">{s.iconRender(item)}</span>
			<div className="fm-row__name flex flex-col leading-tight">
				<span className="truncate">{renderRenderable(s.name, item)}</span>
				{s.caption != null && !s.withDescription && (
					<span className="truncate text-[length:var(--fm-font-size-caption)] text-[color:var(--fm-muted-fg)]">
						{renderRenderable(s.caption, item)}
					</span>
				)}
			</div>
			{s.caption != null && s.withDescription && (
				<span className="fm-row__caption">{renderRenderable(s.caption, item)}</span>
			)}
			{s.onMore && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						s.onMore?.(item, e, ctx);
					}}
					aria-label="More"
					className="inline-flex size-6 items-center justify-center rounded-md text-[color:var(--fm-muted-fg)] hover:bg-[color:var(--fm-row-hover-bg)]"
				>
					<MoreHorizontal className="size-4" />
				</button>
			)}
		</div>
	);
}
