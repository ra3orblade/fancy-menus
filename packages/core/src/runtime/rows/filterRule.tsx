import { DotsThree } from '@phosphor-icons/react';
import clsx from 'clsx';
import type { FilterRuleRow } from '../../types/row';
import { IconView } from './icon';
import type { RowRenderProps } from './index';
import { evalProp } from './util';

export function FilterRuleRowView<TItem>({ item, spec, active, ctx, onActivate, prefix }: RowRenderProps<TItem>) {
	const s = spec as FilterRuleRow<TItem>;
	const disabled = evalProp(s.disabled, item) ?? false;
	const icon = s.icon(item);
	const relation = s.relationName(item);
	const condition = s.conditionLabel(item);
	const value = s.valuePreview(item);
	const showMore = s.withMore ?? Boolean(s.onMore);

	return (
		<div
			role="option"
			aria-selected={active}
			aria-disabled={disabled || undefined}
			data-active={active || undefined}
			onMouseEnter={onActivate}
			onClick={() => !disabled && s.onClick?.(item, ctx)}
			className={clsx('fm-row fm-row--rule')}
		>
			{prefix}
			<span className="fm-row__icon">
				<IconView icon={icon} defaultSize={14} />
			</span>
			<span className="fm-row__name flex min-w-0 items-baseline gap-1.5">
				<span className="truncate font-medium">{relation}</span>
				<span className="shrink-0 text-[color:var(--fm-muted-fg)]">{condition}</span>
				<span className="truncate text-[color:var(--fm-muted-fg)]">{value}</span>
			</span>
			{showMore && (
				<button
					type="button"
					aria-label="More"
					onClick={(e) => {
						e.stopPropagation();
						s.onMore?.(item, ctx);
					}}
					className="inline-flex size-6 items-center justify-center rounded-md text-[color:var(--fm-muted-fg)] hover:bg-[color:var(--fm-row-hover-bg)]"
				>
					<DotsThree className="size-4" />
				</button>
			)}
		</div>
	);
}
