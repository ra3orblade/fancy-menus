/**
 * Menu — single open-menu shell. Renders chrome around a body. Position is
 * computed via Floating UI when an anchor element is supplied; otherwise the
 * menu centers on the viewport.
 */

import clsx from 'clsx';
import { ArrowDown, ArrowLeft, ArrowUp, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DimmerMode, FooterKind, HeaderKind, MenuState, PositionStrategy } from '../types/enums';
import { BodyView } from './body';
import { makeCtx } from './ctx';
import { FilterInput } from './filter-input';
import { compute, watchPosition } from './position';
import { useProviderOptions, useStore } from './provider';
import { SafePolygon } from './safe-polygon';
import type { OpenMenu } from './store';

interface MenuProps {
	open: OpenMenu;
}

export function MenuView({ open }: MenuProps) {
	const store = useStore();
	const options = useProviderOptions();
	// Callback ref: mounting the dialog updates `containerEl` state which
	// triggers a re-render — required so SafePolygon (which depends on the
	// floating element's bounding rect) can lay itself out on first paint.
	const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
	const containerRef = useCallback((el: HTMLDivElement | null) => setContainerEl(el), []);
	const [filter, setFilter] = useState('');
	const [pos, setPos] = useState<{ x: number; y: number; placement?: string } | null>(null);
	const [activeTab, setActiveTab] = useState<string | undefined>(
		open.config.chrome?.tabs?.initialTab ?? open.config.chrome?.tabs?.tabs?.[0]?.id
	);

	const ctx = useMemo(
		() =>
			makeCtx(open, store, options, {
				setActive: () => {},
				setHover: () => {},
				position: () => {},
			}),
		[open, store, options]
	);

	const onClose = useCallback(() => store.close(open.id), [store, open.id]);

	// Position
	useEffect(() => {
		const el = containerEl;
		if (!el) return;
		const cfg = open.config.position;
		const ref = open.param.element ?? open.param.rect;
		if (!ref) {
			const w = el.offsetWidth;
			const h = el.offsetHeight;
			setPos({
				x: Math.max(8, (window.innerWidth - w) / 2),
				y: Math.max(8, (window.innerHeight - h) / 2),
			});
			return;
		}
		const referenceEl = typeof ref === 'string' ? document.querySelector(ref) : (ref as Element | DOMRect);
		if (!referenceEl) return;
		if (referenceEl instanceof Element) {
			return watchPosition(referenceEl, el, cfg, (r) => setPos({ x: r.x, y: r.y, placement: r.placement }));
		}
		void compute(referenceEl, el, cfg).then((r) => setPos({ x: r.x, y: r.y, placement: r.placement }));
	}, [open, containerEl]);

	useEffect(() => {
		// onMount may return a cleanup function (mirrors useEffect's contract)
		// so consumers can wire up subscriptions / event listeners that need
		// torn down when the menu closes.
		const mountCleanup = open.config.lifecycle?.onMount?.(ctx);
		open.config.lifecycle?.onOpen?.(ctx);
		const parentId = open.param.parentId;
		return () => {
			if (typeof mountCleanup === 'function') mountCleanup();
			open.config.lifecycle?.onClose?.(ctx);
			// When a sub-menu closes, return keyboard focus to the parent
			// menu's body so ArrowUp/Down keep working without a re-click.
			if (parentId) {
				const parentBody = document.querySelector<HTMLElement>(`[data-fm-menu-id="${parentId}"] .fm-list`);
				parentBody?.focus({ preventScroll: true });
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (open.config.chrome?.noClose) return;
		// Skip Escape handling once the menu is already closing — a second
		// close() call against a Closing menu would cancel the exit animation
		// timer and remove the menu prematurely.
		if (open.state === MenuState.Closing) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [open.config.chrome?.noClose, open.state, onClose]);

	// Sub-menus default to no dimmer (the parent's dimmer is already on screen).
	const dimmer = open.config.chrome?.dimmer ?? (open.param.parentId ? DimmerMode.None : DimmerMode.Default);
	const showDimmer = dimmer !== DimmerMode.None;
	const passThrough = dimmer === DimmerMode.PassThrough;
	const visibleDimmer = dimmer === DimmerMode.Visible;

	const tabsCfg = open.config.chrome?.tabs;
	const activeTabBody = tabsCfg ? tabsCfg.tabs.find((t) => t.id === activeTab)?.body : undefined;
	const body = activeTabBody ?? open.config.body;

	const isSub = Boolean(open.param.parentId);
	const content = (
		<>
			{/* Safe-mouse polygon connects the trigger row to the child menu so
			    the cursor can travel diagonally without exiting either zone. */}
			{isSub && open.param.triggerRect && (
				<SafePolygon triggerRect={open.param.triggerRect} floatingEl={containerEl} />
			)}
			{showDimmer && (
				<div
					aria-hidden
					data-state={open.state}
					onClick={passThrough ? undefined : onClose}
					className={clsx(
						'fm-dimmer',
						open.state === MenuState.Closing && 'fm-dimmer--closing',
						passThrough && 'fm-dimmer--passthrough',
						visibleDimmer && 'fm-dimmer--visible'
					)}
				/>
			)}
			<div
				ref={containerRef}
				role="dialog"
				aria-label={typeof open.config.chrome?.title === 'string' ? open.config.chrome.title : open.id}
				data-fm-menu-id={open.id}
				data-placement={pos?.placement}
				data-state={open.state}
				className={clsx(
					'fm-menu',
					open.state === MenuState.Closing && 'fm-menu--closing',
					open.config.chrome?.classNameWrap,
					open.config.chrome?.className
				)}
				style={{
					position: open.config.position?.strategy === PositionStrategy.Absolute ? 'absolute' : 'fixed',
					left: pos?.x,
					top: pos?.y,
					width: open.config.position?.width,
					minWidth: open.config.position?.minWidth ?? 220,
					// While position is being measured we use opacity (not visibility)
					// so descendants can still receive autofocus, and pointer-events:none
					// so the invisible menu doesn't capture input. The open animation
					// kicks in once placement is resolved.
					opacity: pos == null ? 0 : 1,
					pointerEvents: pos == null ? 'none' : 'auto',
					...transformOriginFor(pos?.placement),
				}}
			>
				<Header
					open={open}
					onClose={onClose}
					filter={filter}
					setFilter={setFilter}
					onBack={() => store.back(open.id)}
					canBack={Boolean(open.history?.length)}
					ctx={ctx}
				/>

				{tabsCfg && (
					<TabBar
						tabs={tabsCfg.tabs.map((t) => ({ id: t.id, label: t.label, icon: t.icon }))}
						activeId={activeTab!}
						onChange={setActiveTab}
						rightSlot={typeof tabsCfg.rightSlot === 'function' ? tabsCfg.rightSlot() : tabsCfg.rightSlot}
					/>
				)}

				{open.config.chrome?.filter && <FilterInput config={open.config.chrome.filter} onChange={setFilter} />}

				{/* Skip the body wrapper entirely when the body is a Custom one
				    that measures to zero height (e.g. find-in-page, where the
				    chrome carries the entire UI). */}
				{!isEmptyBody(body) && (
					<div className="fm-body">
						<BodyView
							body={body}
							ctx={ctx}
							filter={filter}
							onCloseRequest={onClose}
							isSubMenu={Boolean(open.param.parentId)}
						/>
					</div>
				)}

				<Footer open={open} onClose={onClose} />
			</div>
		</>
	);

	return createPortal(content, document.body);
}

function isEmptyBody(body: { kind: string; measureHeight?: (ctx: any) => number }): boolean {
	// Heuristic: a `kind: Custom` body that explicitly measures to 0 contributes
	// no UI, so suppress the wrapper (and its surrounding border) entirely.
	if ((body as any).kind !== 'custom') return false;
	const measure = (body as any).measureHeight as ((ctx: any) => number) | undefined;
	return typeof measure === 'function' && measure(undefined) === 0;
}

/**
 * Map a Floating UI placement (e.g. 'bottom-start', 'top-end') to a
 * `transform-origin` so the open animation grows from the trigger edge
 * rather than the menu's geometric center.
 */
function transformOriginFor(placement: string | undefined): { transformOrigin?: string } {
	if (!placement) return {};
	const [side, align] = placement.split('-') as ['top' | 'bottom' | 'left' | 'right', 'start' | 'end' | undefined];
	let x: string;
	let y: string;
	if (side === 'top' || side === 'bottom') {
		y = side === 'top' ? 'bottom' : 'top';
		x = align === 'start' ? 'left' : align === 'end' ? 'right' : 'center';
	} else {
		x = side === 'left' ? 'right' : 'left';
		y = align === 'start' ? 'top' : align === 'end' ? 'bottom' : 'center';
	}
	return { transformOrigin: `${x} ${y}` };
}

function Header({
	open,
	onClose,
	filter,
	setFilter,
	onBack,
	canBack,
	ctx,
}: {
	open: OpenMenu;
	onClose: () => void;
	filter: string;
	setFilter: (v: string) => void;
	onBack: () => void;
	canBack: boolean;
	ctx: import('../types/context').MenuCtx;
}) {
	const chrome = open.config.chrome;
	const header = chrome?.header;

	if (header?.kind === HeaderKind.SearchBar) {
		return <SearchBarHeader spec={header} value={filter} onChange={setFilter} onClose={onClose} />;
	}
	if (header?.kind === HeaderKind.Custom) {
		return <>{header.render(ctx)}</>;
	}
	const showBack = chrome?.withBack || canBack;
	if (chrome?.title || showBack || chrome?.withClose) {
		return (
			<header className="flex items-center gap-2 border-b border-border px-3 py-2">
				{showBack && (
					<button
						type="button"
						// chrome.onBack overrides the default if the consumer
						// wants to handle navigation themselves; otherwise the
						// runtime walks the navigation history via ctx.back().
						onClick={chrome?.onBack ?? onBack}
						className="text-muted-foreground hover:text-foreground"
						aria-label="Back"
					>
						<ArrowLeft className="size-4" />
					</button>
				)}
				<h3 className="flex-1 text-sm font-medium">
					{typeof chrome?.title === 'function' ? chrome.title(ctx) : chrome?.title}
				</h3>
				{chrome?.withClose && (
					<button
						type="button"
						onClick={onClose}
						className="text-muted-foreground hover:text-foreground"
						aria-label="Close"
					>
						<X className="size-4" />
					</button>
				)}
			</header>
		);
	}
	return null;
}

function SearchBarHeader({
	spec,
	value,
	onChange,
	onClose,
}: {
	spec: { placeholder?: string; counter?: boolean; prevNext?: boolean; clear?: boolean };
	value: string;
	onChange: (v: string) => void;
	onClose: () => void;
}) {
	return (
		<header className="flex items-center gap-2 border-b border-border px-3 py-2">
			<Search className="size-3.5 text-muted-foreground" />
			<input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={spec.placeholder ?? 'Find'}
				className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
			/>
			{spec.counter && <span className="text-xs text-muted-foreground tabular-nums">0 / 0</span>}
			{spec.prevNext && (
				<div className="flex items-center gap-0.5">
					<button
						type="button"
						aria-label="Previous"
						className="rounded-md p-1 text-muted-foreground hover:bg-accent"
					>
						<ArrowUp className="size-3" />
					</button>
					<button
						type="button"
						aria-label="Next"
						className="rounded-md p-1 text-muted-foreground hover:bg-accent"
					>
						<ArrowDown className="size-3" />
					</button>
				</div>
			)}
			{/*
			 * One trailing X handles both clear (when there's a query) and
			 * close (when the field is empty). This avoids the two-X
			 * stacked-icons situation in the search bar header.
			 */}
			<button
				type="button"
				aria-label={value ? 'Clear' : 'Close'}
				onClick={() => (value ? onChange('') : onClose())}
				className="text-muted-foreground hover:text-foreground"
			>
				<X className="size-3.5" />
			</button>
		</header>
	);
}

function TabBar({
	tabs,
	activeId,
	onChange,
	rightSlot,
}: {
	tabs: Array<{ id: string; label: string; icon?: { icon: any; size?: number } }>;
	activeId: string;
	onChange: (id: string) => void;
	rightSlot?: React.ReactNode;
}) {
	return (
		<div className="flex items-center justify-between border-b border-border px-1 pt-1">
			<div className="flex items-center gap-0.5" role="tablist">
				{tabs.map((t) => {
					const active = t.id === activeId;
					return (
						<button
							key={t.id}
							type="button"
							role="tab"
							aria-selected={active}
							onClick={() => onChange(t.id)}
							className={clsx(
								'inline-flex items-center gap-1 rounded-t-md px-2 py-1 text-xs font-medium',
								active
									? 'border-b-2 border-primary text-foreground'
									: 'text-muted-foreground hover:text-foreground'
							)}
						>
							{t.label}
						</button>
					);
				})}
			</div>
			{rightSlot}
		</div>
	);
}

function Footer({ open, onClose }: { open: OpenMenu; onClose: () => void }) {
	const f = open.config.chrome?.footer;
	if (!f) return null;
	if (f.kind === FooterKind.Buttons) {
		return (
			<footer className="flex items-center justify-end gap-2 border-t border-border px-2 py-2">
				{f.buttons.map((b) => (
					<button
						key={b.id}
						type="button"
						disabled={b.disabled}
						onClick={(e) => {
							const r = b.onClick(e);
							if (r instanceof Promise) void r;
							if (b.id === 'done' || b.id === 'close') onClose();
						}}
						className={clsx(
							'inline-flex h-7 items-center rounded-md px-2.5 text-xs font-medium',
							b.color === 'destructive'
								? 'bg-destructive text-destructive-foreground'
								: b.color === 'accent'
									? 'bg-primary text-primary-foreground'
									: 'border border-border text-foreground hover:bg-accent'
						)}
					>
						{b.label}
					</button>
				))}
			</footer>
		);
	}
	if (f.kind === FooterKind.Add) {
		return (
			<footer className="border-t border-border">
				<button
					type="button"
					onClick={f.onClick}
					className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
				>
					{f.label}
				</button>
			</footer>
		);
	}
	if (f.kind === FooterKind.Custom) {
		return <footer className="border-t border-border">{f.render()}</footer>;
	}
	return null;
}
