import { Check } from '@phosphor-icons/react';
import clsx from 'clsx';
import type { CheckboxRow } from '../../types/row';
import { IconView } from './icon';
import type { RowRenderProps } from './index';
import { evalProp, renderRenderable } from './util';

export function CheckboxRowView<TItem>({ item, spec, active, ctx, onActivate, prefix }: RowRenderProps<TItem>) {
	const s = spec as CheckboxRow<TItem>;
	const checked = s.checked(item);
	const disabled = evalProp(s.disabled, item) ?? false;
	const readonly = evalProp(s.readonly, item) ?? false;
	const icon = typeof s.icon === 'function' ? s.icon(item) : s.icon;
	const toggle = () => {
		if (disabled || readonly) return;
		s.onToggle(item, !checked, ctx);
	};

	return (
		<div
			role="option"
			aria-selected={active}
			aria-checked={checked}
			aria-disabled={disabled || undefined}
			data-active={active || undefined}
			data-checked={checked || undefined}
			data-disabled={disabled || undefined}
			onMouseEnter={onActivate}
			onClick={toggle}
			className={clsx('fm-row', readonly && 'fm-row--readonly')}
		>
			{prefix}
			{icon && (
				<span className="fm-row__icon">
					<IconView icon={icon} defaultSize={16} />
				</span>
			)}
			<span className="fm-row__name">{renderRenderable(s.name, item)}</span>
			{/* Visual-only check badge — the surrounding option already carries
			    aria-checked, so the badge is aria-hidden to avoid SR
			    double-announcement of the checked state. */}
			<span aria-hidden data-checked={checked || undefined} className="fm-checkbox">
				{checked && <Check weight="bold" />}
			</span>
		</div>
	);
}
