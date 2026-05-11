import clsx from 'clsx';
import type { PointerEvent } from 'react';
import type { SwitchRow } from '../../types/row';
import { IconView } from './icon';
import type { RowRenderProps } from './index';
import { evalProp, renderRenderable } from './util';

export function SwitchRowView<TItem>({ item, spec, active, ctx, onActivate, prefix }: RowRenderProps<TItem>) {
	const s = spec as SwitchRow<TItem>;
	const disabled = evalProp(s.disabled, item) ?? false;
	const readonly = evalProp(s.readonly, item) ?? false;
	const value = s.switchValue(item);
	const icon = typeof s.icon === 'function' ? s.icon(item) : s.icon;
	const className = evalProp(s.className, item);

	const toggle = (e: PointerEvent) => {
		if (disabled || readonly) return;
		// Only respond to the primary button; ignore right-click etc.
		if (e.button !== 0) return;
		// Suppress the synthetic click that follows so handlers don't double-fire.
		e.preventDefault();
		s.onSwitch(item, !value, ctx);
	};

	return (
		<div
			role="option"
			aria-selected={active}
			data-active={active || undefined}
			data-disabled={disabled || readonly || undefined}
			onMouseEnter={onActivate}
			// Fire on pointerdown for instant feedback (onClick fires on mouseup
			// which adds a perceptible delay).
			onPointerDown={toggle}
			className={clsx('fm-row', (disabled || readonly) && 'fm-row--readonly', className)}
		>
			{prefix}
			{icon && (
				<span className="fm-row__icon">
					<IconView icon={icon} defaultSize={16} />
				</span>
			)}
			<span className="fm-row__name">{renderRenderable(s.name, item)}</span>
			{s.caption != null && <span className="fm-row__caption">{renderRenderable(s.caption, item)}</span>}
			<span
				role="switch"
				aria-checked={value}
				aria-disabled={disabled || readonly || undefined}
				className="fm-switch"
				data-on={value || undefined}
			>
				<span className="fm-switch__thumb" />
			</span>
		</div>
	);
}
