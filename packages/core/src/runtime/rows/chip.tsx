import { X } from '@phosphor-icons/react';
import clsx from 'clsx';
import type { ChipRow } from '../../types/row';
import { IconView } from './icon';
import type { RowRenderProps } from './index';
import { evalProp, renderRenderable } from './util';

export function ChipRowView<TItem>({ item, spec, active, ctx, onActivate, prefix }: RowRenderProps<TItem>) {
	const s = spec as ChipRow<TItem>;
	const disabled = evalProp(s.disabled, item) ?? false;
	const icon = typeof s.icon === 'function' ? s.icon(item) : s.icon;
	const trailingIcon = typeof s.trailing?.icon === 'function' ? s.trailing.icon(item) : s.trailing?.icon;

	return (
		<div
			role="option"
			aria-selected={active}
			aria-disabled={disabled || undefined}
			data-active={active || undefined}
			onMouseEnter={onActivate}
			onClick={(e) => !disabled && s.onClick?.(item, e, ctx)}
			className={clsx('fm-row fm-row--chip')}
		>
			{prefix}
			{icon && (
				<span className="fm-row__icon">
					<IconView icon={icon} defaultSize={14} />
				</span>
			)}
			<span className="fm-row__name">{renderRenderable(s.name, item)}</span>
			{s.trailing && trailingIcon && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						s.trailing?.onClick?.(item, ctx);
					}}
					className="fm-row__chip-trailing"
					aria-label="Toggle"
				>
					<IconView icon={trailingIcon} defaultSize={12} />
				</button>
			)}
			{s.onDelete && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						s.onDelete?.(item, ctx);
					}}
					className="fm-row__chip-delete"
					aria-label="Remove"
				>
					<X weight="bold" />
				</button>
			)}
		</div>
	);
}
