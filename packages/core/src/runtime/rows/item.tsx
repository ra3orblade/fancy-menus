import clsx from 'clsx';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { type MouseEvent as ReactMouseEvent, useEffect, useRef } from 'react';
import { SubMenuTrigger } from '../../types/enums';
import type { ItemRow } from '../../types/row';
import { IconView } from './icon';
import type { RowRenderProps } from './index';
import { evalProp, renderRenderable } from './util';

export function ItemRowView<TItem>({ item, spec, active, ctx, onActivate, prefix }: RowRenderProps<TItem>) {
	const s = spec as ItemRow<TItem>;
	const disabled = evalProp(s.disabled, item) ?? false;
	const readonly = evalProp(s.readonly, item) ?? false;
	const hidden = evalProp(s.hidden, item) ?? false;
	if (hidden) return null;
	const arrow = evalProp(s.arrow, item) ?? false;
	const withMore = evalProp(s.withMore, item) ?? false;
	const isBig = evalProp(s.isBig, item) ?? false;
	const pressed = evalProp(s.pressed, item) ?? false;
	const icon = typeof s.icon === 'function' ? s.icon(item) : s.icon;
	const className = evalProp(s.className, item);

	const subMenuId = typeof s.subMenuId === 'function' ? s.subMenuId(item) : s.subMenuId;
	const subTrigger = s.subMenuTrigger ?? SubMenuTrigger.ArrowHover;
	const hoverMs = s.subMenuHoverMs ?? 200;

	const rowRef = useRef<HTMLDivElement | null>(null);
	const hoverTimer = useRef<number | null>(null);

	const spawnSubMenu = () => {
		if (!subMenuId || disabled || readonly) return;
		const data = s.subMenuData ? s.subMenuData(item, ctx) : ctx.data;
		// A row that just got recycled by the virtualizer (or hasn't laid
		// out yet) can return a zero-area rect — skip the rect in that case
		// so positioning measures off the live element on the next paint
		// instead of anchoring to (0,0).
		const rect = rowRef.current?.getBoundingClientRect();
		const triggerRect = rect && rect.width > 0 && rect.height > 0 ? rect : undefined;
		void ctx.open(subMenuId, {
			element: rowRef.current ?? undefined,
			data,
			triggerRect,
		});
	};

	const cancelHover = () => {
		if (hoverTimer.current != null) {
			window.clearTimeout(hoverTimer.current);
			hoverTimer.current = null;
		}
	};

	// Cancel a pending hover-spawn when the row unmounts OR when the row
	// receives a different `item` (virtualized recycling, list filtered).
	// Otherwise the timer would fire spawnSubMenu against a stale item.
	useEffect(() => () => cancelHover(), [item]);

	// When the active row gains keyboard focus, scheduling a hover-spawn or
	// firing on ArrowRight is covered by the menu-level keyboard handler;
	// the row itself only handles mouse-based spawning.
	const onMouseEnter = () => {
		onActivate();
		// Hovering a row without a sub-menu (or a different row mid-spawn)
		// retires any stale child this menu spawned. Without this, moving
		// the cursor from a row with `subMenuId` to a row without one
		// would leave the previous sub-menu hanging until dismissed.
		if (!subMenuId || disabled || readonly) {
			cancelHover();
			ctx.closeChildren();
			return;
		}
		if (subTrigger !== SubMenuTrigger.ArrowHover) return;
		cancelHover();
		// Hovering the same row that already spawned the visible child is
		// a no-op; for any other row, scheduling the spawn lets the store's
		// sibling-replace logic swap the visible child on open.
		hoverTimer.current = window.setTimeout(spawnSubMenu, hoverMs);
	};

	const onMouseLeave = () => {
		cancelHover();
	};

	const onClick = (e: ReactMouseEvent) => {
		if (disabled || readonly) return;
		if (subMenuId && (subTrigger === SubMenuTrigger.ArrowClick || subTrigger === SubMenuTrigger.Replace)) {
			cancelHover();
			spawnSubMenu();
			return;
		}
		s.onClick?.(item, e, ctx);
	};

	return (
		<div
			ref={rowRef}
			role="option"
			aria-selected={active}
			aria-pressed={pressed || undefined}
			aria-disabled={disabled || undefined}
			aria-haspopup={subMenuId ? 'menu' : undefined}
			data-active={active || undefined}
			data-pressed={pressed || undefined}
			data-disabled={disabled || undefined}
			data-submenu-id={subMenuId}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			onClick={onClick}
			className={clsx('fm-row', isBig && 'fm-row--big', readonly && 'fm-row--readonly', className)}
		>
			{prefix}
			{icon && (
				<span className="fm-row__icon">
					<IconView icon={icon} defaultSize={s.iconSize ?? 16} />
				</span>
			)}
			<span className="fm-row__name">{renderRenderable(s.name, item)}</span>
			{s.caption != null && <span className="fm-row__caption">{renderRenderable(s.caption, item)}</span>}
			{(withMore || arrow) && (
				<span className="fm-row__suffix">
					{withMore && (
						<button
							type="button"
							aria-label="More"
							onClick={(e) => {
								e.stopPropagation();
								s.onMore?.(item, e, ctx);
							}}
							className="inline-flex size-6 items-center justify-center rounded-md text-[color:var(--fm-muted-fg)] hover:bg-[color:var(--fm-row-hover-bg)]"
						>
							<MoreHorizontal className="size-4" />
						</button>
					)}
					{arrow && <ChevronRight className="size-4 text-[color:var(--fm-muted-fg)]" />}
				</span>
			)}
		</div>
	);
}
