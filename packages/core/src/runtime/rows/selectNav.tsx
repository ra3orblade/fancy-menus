import { CaretRight } from '@phosphor-icons/react';
import clsx from 'clsx';
import { useRef } from 'react';
import type { SelectNavRow } from '../../types/row';
import { IconView } from './icon';
import type { RowRenderProps } from './index';
import { evalProp, renderRenderable } from './util';

export function SelectNavRowView<TItem>({ item, spec, active, ctx, onActivate, prefix }: RowRenderProps<TItem>) {
	const s = spec as SelectNavRow<TItem>;
	const disabled = evalProp(s.disabled, item) ?? false;
	const readonly = evalProp(s.readonly, item) ?? false;
	const icon = typeof s.icon === 'function' ? s.icon(item) : s.icon;
	const rowRef = useRef<HTMLDivElement | null>(null);

	const spawn = () => {
		if (!s.subMenuId || disabled || readonly) return;
		const rect = rowRef.current?.getBoundingClientRect();
		const triggerRect = rect && rect.width > 0 && rect.height > 0 ? rect : undefined;
		void ctx.open(s.subMenuId, {
			element: rowRef.current ?? undefined,
			data: ctx.data,
			triggerRect,
		});
	};

	return (
		<div
			ref={rowRef}
			role="option"
			aria-haspopup="menu"
			aria-selected={active}
			aria-disabled={disabled || undefined}
			data-active={active || undefined}
			data-submenu-id={s.subMenuId}
			onMouseEnter={onActivate}
			onClick={spawn}
			className={clsx('fm-row', readonly && 'fm-row--readonly')}
		>
			{prefix}
			{icon && (
				<span className="fm-row__icon">
					<IconView icon={icon} defaultSize={16} />
				</span>
			)}
			<span className="fm-row__name">{renderRenderable(s.name, item)}</span>
			<span className="fm-row__caption">{renderRenderable(s.caption, item)}</span>
			<CaretRight className="size-4 shrink-0 text-[color:var(--fm-muted-fg)]" />
		</div>
	);
}
