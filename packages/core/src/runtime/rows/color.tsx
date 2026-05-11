import clsx from 'clsx';
import { Check } from 'lucide-react';
import { ColorScope } from '../../types/enums';
import type { ColorSwatchRow } from '../../types/row';
import type { RowRenderProps } from './index';
import { renderRenderable } from './util';

const PALETTE_TEXT: Record<string, string> = {
	default: 'text-foreground/80',
	red: 'text-red-500',
	orange: 'text-orange-500',
	amber: 'text-amber-500',
	yellow: 'text-yellow-500',
	green: 'text-emerald-500',
	teal: 'text-teal-500',
	blue: 'text-blue-500',
	indigo: 'text-indigo-500',
	purple: 'text-purple-500',
	pink: 'text-pink-500',
};

const PALETTE_BG: Record<string, string> = {
	default: 'bg-muted',
	red: 'bg-red-500',
	orange: 'bg-orange-500',
	amber: 'bg-amber-500',
	yellow: 'bg-yellow-500',
	green: 'bg-emerald-500',
	teal: 'bg-teal-500',
	blue: 'bg-blue-500',
	indigo: 'bg-indigo-500',
	purple: 'bg-purple-500',
	pink: 'bg-pink-500',
};

export function ColorRowView<TItem>({ item, spec, active, ctx, onActivate }: RowRenderProps<TItem>) {
	const s = spec as ColorSwatchRow<TItem>;
	const value = String(s.value(item));
	const isActive = s.active?.(item) ?? false;
	const scope = typeof s.scope === 'function' ? s.scope(item) : s.scope;
	const palette = scope === ColorScope.Bg ? PALETTE_BG : PALETTE_TEXT;
	const swatch = palette[value] ?? 'bg-muted';

	return (
		<div
			role="option"
			aria-selected={active}
			data-active={active || undefined}
			onMouseEnter={onActivate}
			onClick={() => s.onSelect(item, ctx)}
			className="fm-row"
		>
			<span aria-hidden className={clsx('fm-swatch', scope === ColorScope.Bg && swatch)}>
				{scope === ColorScope.Text && <span className={clsx('fm-swatch__letter', swatch)}>A</span>}
			</span>
			<span className="fm-row__name">{renderRenderable(s.name, item)}</span>
			{isActive && <Check className="size-3.5 text-[color:var(--fm-muted-fg)]" />}
		</div>
	);
}
