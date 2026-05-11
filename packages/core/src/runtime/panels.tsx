/**
 * Panel renderers — full-bleed body regions.
 *
 * Implements every panel kind exercised by the example menus.
 * Anything richer (KaTeX, slider drag interactions, code editor) lands
 * incrementally; for now those kinds emit a clean placeholder.
 */

import {
	CaretLeft,
	CaretRight,
	CircleNotch,
	MagnifyingGlass,
	Plus,
	Upload,
	WarningCircle,
	X,
} from '@phosphor-icons/react';
import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MenuCtx } from '../types/context';
import { PanelKind } from '../types/enums';
import type { PanelSpec } from '../types/panel';
import { IconView } from './rows/icon';
import { renderRenderable } from './rows/util';
import { filterItems, useResolvedSource } from './source';

export interface PanelProps {
	spec: PanelSpec;
	ctx: MenuCtx;
}

export function PanelView({ spec, ctx }: PanelProps) {
	switch (spec.kind) {
		case PanelKind.Custom:
			return <>{(spec as any).render(ctx)}</>;
		case PanelKind.Label:
			return <LabelPanel spec={spec as any} ctx={ctx} />;
		case PanelKind.Divider:
			return <hr className="mx-2 my-1 border-border" />;
		case PanelKind.SearchInput:
			return <SearchInputPanel spec={spec as any} ctx={ctx} />;
		case PanelKind.RecentStrip:
			return <RecentStripPanel spec={spec as any} ctx={ctx} />;
		case PanelKind.CategoryJump:
			return <CategoryJumpPanel spec={spec as any} ctx={ctx} />;
		case PanelKind.FileDropZone:
			return <FileDropZonePanel spec={spec as any} ctx={ctx} />;
		case PanelKind.MonthGrid:
			return <MonthGridPanel spec={spec as any} ctx={ctx} />;
		case PanelKind.EmojiGrid:
			return <EmojiGridPanel spec={spec as any} ctx={ctx} />;
		case PanelKind.TileGrid:
			return <TileGridPanel spec={spec as any} ctx={ctx} />;
		case PanelKind.QueryBuilder:
			return <QueryBuilderPanel spec={spec as any} ctx={ctx} />;
		case PanelKind.EmptyState:
			return <EmptyStatePanel spec={spec as any} ctx={ctx} />;
		case PanelKind.Loader:
			return <LoaderPanel spec={spec as any} />;
		case PanelKind.Error:
			return <ErrorPanel spec={spec as any} ctx={ctx} />;
		case PanelKind.Banner:
			return <BannerPanel spec={spec as any} ctx={ctx} />;
		case PanelKind.LinkPreview:
			return <LinkPreviewPanel spec={spec as any} />;
		case PanelKind.TabBar:
			return <TabBarPanel spec={spec as any} ctx={ctx} />;
		case PanelKind.Slider:
			return <SliderPanel spec={spec as any} ctx={ctx} />;
		case PanelKind.MarkdownToolbar:
			return <MarkdownToolbarPanel spec={spec as any} ctx={ctx} />;
		case PanelKind.CodeEditor:
			return <CodeEditorPanel spec={spec as any} ctx={ctx} />;
		case PanelKind.KatexPreview:
			return <KatexPreviewPanel spec={spec as any} />;
		case PanelKind.QrCode:
			return <QrCodePanel spec={spec as any} />;
		default:
			// Unreachable: PanelView handles every PanelKind. If a new kind
			// lands in the enum without a renderer, tsc's exhaustive-switch
			// narrows `spec` to `never` and surfaces it here.
			return null;
	}
}

function LabelPanel({ spec }: any) {
	return (
		<div className={clsx('px-3 py-1 text-xs text-muted-foreground', spec.className)}>
			{renderRenderable(spec.text, undefined as never)}
		</div>
	);
}

function SearchInputPanel({ spec, ctx }: any) {
	const [value, setValue] = useState('');
	const debounce = useRef<number | undefined>(undefined);
	// Hold the latest ctx via a ref so the debounced callback uses the
	// freshest one (consumer callbacks close over data that may change
	// between keystroke and debounce fire).
	const ctxRef = useRef(ctx);
	ctxRef.current = ctx;
	// Clear any pending debounce on unmount so we don't fire against a
	// stale parent.
	useEffect(() => () => window.clearTimeout(debounce.current), []);
	return (
		<div className="flex items-center gap-2 border-b border-border px-3 py-2">
			<span className="text-muted-foreground">
				{spec.icon ? <IconView icon={spec.icon} defaultSize={14} /> : <MagnifyingGlass className="size-3.5" />}
			</span>
			<input
				value={value}
				placeholder={spec.placeholder ?? 'Search…'}
				onChange={(e) => {
					setValue(e.target.value);
					window.clearTimeout(debounce.current);
					debounce.current = window.setTimeout(
						() => spec.onChange(e.target.value, ctxRef.current),
						spec.debounceMs ?? 200
					);
				}}
				className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
			/>
			{value && (
				<button
					type="button"
					aria-label="Clear"
					onClick={() => {
						setValue('');
						spec.onChange('', ctx);
						spec.onClear?.(ctx);
					}}
					className="text-muted-foreground hover:text-foreground"
				>
					<X className="size-3.5" />
				</button>
			)}
		</div>
	);
}

function RecentStripPanel({ spec, ctx }: any) {
	const { items } = useResolvedSource(spec.source, '', ctx);
	if (!items.length) {
		return spec.emptyMessage ? (
			<div className="px-3 py-1 text-xs text-muted-foreground">{spec.emptyMessage}</div>
		) : null;
	}
	return (
		<div className="flex items-center gap-1 overflow-x-auto px-2 py-1">
			{items.map((it: any, i: number) => (
				<button
					key={i}
					type="button"
					onClick={() => spec.onSelect?.(it, ctx)}
					className="shrink-0 rounded-md p-1 hover:bg-accent"
				>
					{spec.renderItem(it, ctx)}
				</button>
			))}
		</div>
	);
}

function CategoryJumpPanel({ spec, ctx }: any) {
	return (
		<div className="flex items-center justify-between border-t border-border bg-muted/30 px-1 py-1">
			<div className="flex items-center gap-0.5">
				{spec.categories.map((cat: any) => {
					const active = cat.id === spec.activeId;
					return (
						<button
							key={cat.id}
							type="button"
							title={cat.tooltip}
							onClick={() => spec.onJump(cat.id, ctx)}
							className={clsx(
								'inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent',
								active && 'bg-accent text-foreground'
							)}
						>
							<IconView icon={cat.icon} defaultSize={14} />
						</button>
					);
				})}
			</div>
			{spec.trailing && (
				<button
					type="button"
					title={spec.trailing.tooltip}
					onClick={() => spec.trailing.onClick(ctx)}
					className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
				>
					<IconView icon={spec.trailing.icon} defaultSize={14} />
				</button>
			)}
		</div>
	);
}

function FileDropZonePanel({ spec, ctx }: any) {
	const [hover, setHover] = useState(false);
	const inputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		if (!spec.pasteFromClipboard) return;
		const onPaste = (e: ClipboardEvent) => {
			const files = Array.from(e.clipboardData?.files ?? []);
			if (files.length) {
				e.preventDefault();
				spec.onFiles(files, ctx);
			}
		};
		window.addEventListener('paste', onPaste);
		return () => window.removeEventListener('paste', onPaste);
	}, [spec, ctx]);

	return (
		<div
			onClick={() => spec.clickToOpen !== false && inputRef.current?.click()}
			onDragOver={(e) => {
				e.preventDefault();
				setHover(true);
			}}
			onDragLeave={() => setHover(false)}
			onDrop={(e) => {
				e.preventDefault();
				setHover(false);
				const files = Array.from(e.dataTransfer.files);
				if (files.length) spec.onFiles(files, ctx);
			}}
			className={clsx(
				'm-2 flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-sm text-muted-foreground transition-colors cursor-pointer',
				hover ? 'border-primary bg-accent/50 text-foreground' : 'border-border'
			)}
		>
			{spec.icon ? <IconView icon={spec.icon} defaultSize={20} /> : <Upload className="size-5" />}
			<span>{renderRenderable(spec.label, undefined as never) ?? 'Drop files here'}</span>
			<input
				ref={inputRef}
				type="file"
				accept={spec.accept}
				multiple={spec.multiple}
				className="hidden"
				onChange={(e) => {
					const files = Array.from(e.target.files ?? []);
					if (files.length) spec.onFiles(files, ctx);
					e.target.value = '';
				}}
			/>
		</div>
	);
}

type PickerView = 'days' | 'months' | 'years';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function MonthGridPanel({ spec, ctx }: any) {
	const [cursor, setCursor] = useState(() => new Date(spec.value ?? Date.now()));
	const [view, setView] = useState<PickerView>('days');

	// Combine the calendar's date with the time the user has typed (or the
	// time embedded in spec.value, whichever is fresher).
	const initialTime = (() => {
		const src = spec.value ? new Date(spec.value) : new Date();
		return { hh: src.getHours(), mm: src.getMinutes() };
	})();
	const [time, setTime] = useState(initialTime);

	const commit = (d: Date) => {
		const next = new Date(d);
		if (spec.withTime) {
			next.setHours(time.hh, time.mm, 0, 0);
		}
		spec.onChange(next.getTime(), ctx);
	};

	const today = new Date();
	const isSameDate = (a: Date, b: Date) =>
		a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

	// ─── Header ────────────────────────────────────────────────────────────
	const header = (
		<header className="flex items-center justify-between gap-1 px-1 pb-1.5">
			<button
				type="button"
				onClick={() => {
					if (view === 'days') setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
					else if (view === 'months') setCursor(new Date(cursor.getFullYear() - 1, cursor.getMonth(), 1));
					else setCursor(new Date(cursor.getFullYear() - 12, cursor.getMonth(), 1));
				}}
				className="rounded-md p-1 text-[color:var(--fm-muted-fg)] hover:bg-[color:var(--fm-row-hover-bg)]"
				aria-label="Previous"
			>
				<CaretLeft className="size-4" />
			</button>
			<div className="flex flex-1 items-center justify-center gap-1">
				<button
					type="button"
					onClick={() => setView(view === 'months' ? 'days' : 'months')}
					aria-label="Pick month"
					className="rounded-md px-1.5 py-0.5 text-sm font-medium hover:bg-[color:var(--fm-row-hover-bg)]"
				>
					{MONTH_NAMES[cursor.getMonth()]}
				</button>
				<button
					type="button"
					onClick={() => setView(view === 'years' ? 'days' : 'years')}
					aria-label="Pick year"
					className="rounded-md px-1.5 py-0.5 text-sm font-medium tabular-nums hover:bg-[color:var(--fm-row-hover-bg)]"
				>
					{cursor.getFullYear()}
				</button>
			</div>
			<button
				type="button"
				onClick={() => {
					if (view === 'days') setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
					else if (view === 'months') setCursor(new Date(cursor.getFullYear() + 1, cursor.getMonth(), 1));
					else setCursor(new Date(cursor.getFullYear() + 12, cursor.getMonth(), 1));
				}}
				className="rounded-md p-1 text-[color:var(--fm-muted-fg)] hover:bg-[color:var(--fm-row-hover-bg)]"
				aria-label="Next"
			>
				<CaretRight className="size-4" />
			</button>
		</header>
	);

	// ─── Body ──────────────────────────────────────────────────────────────
	let body: JSX.Element;
	if (view === 'months') {
		body = (
			<div className="grid grid-cols-3 gap-1 px-1">
				{MONTH_NAMES.map((name, i) => {
					const isCur = i === cursor.getMonth();
					return (
						<button
							key={name}
							type="button"
							onClick={() => {
								setCursor(new Date(cursor.getFullYear(), i, 1));
								setView('days');
							}}
							className={clsx(
								'rounded-md py-1.5 text-xs hover:bg-[color:var(--fm-row-hover-bg)]',
								isCur &&
									'bg-[color:var(--fm-accent)] text-[color:var(--fm-accent-fg)] hover:bg-[color:var(--fm-accent)]'
							)}
						>
							{name}
						</button>
					);
				})}
			</div>
		);
	} else if (view === 'years') {
		const cy = cursor.getFullYear();
		const fromYear = spec.yearRange?.from ?? cy - 50;
		const toYear = spec.yearRange?.to ?? cy + 50;
		const cw = Math.floor(cy / 12) * 12;
		const years: number[] = [];
		for (let i = 0; i < 12; i++) years.push(cw + i);
		body = (
			<div className="grid grid-cols-3 gap-1 px-1">
				{years.map((y) => {
					const isCur = y === cy;
					const disabled = y < fromYear || y > toYear;
					return (
						<button
							key={y}
							type="button"
							disabled={disabled}
							onClick={() => {
								setCursor(new Date(y, cursor.getMonth(), 1));
								setView('days');
							}}
							className={clsx(
								'rounded-md py-1.5 text-xs tabular-nums hover:bg-[color:var(--fm-row-hover-bg)]',
								isCur &&
									'bg-[color:var(--fm-accent)] text-[color:var(--fm-accent-fg)] hover:bg-[color:var(--fm-accent)]',
								disabled && 'opacity-30 pointer-events-none'
							)}
						>
							{y}
						</button>
					);
				})}
			</div>
		);
	} else {
		const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
		const startWeekday = (monthStart.getDay() + 6) % 7; // Monday-first
		const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
		const cells: Array<{ day: number; date: Date } | null> = [];
		for (let i = 0; i < startWeekday; i++) cells.push(null);
		for (let d = 1; d <= daysInMonth; d++) {
			cells.push({ day: d, date: new Date(cursor.getFullYear(), cursor.getMonth(), d) });
		}
		while (cells.length % 7 !== 0) cells.push(null);

		body = (
			<>
				<div className="grid grid-cols-7 gap-0.5 text-center text-[10px] text-[color:var(--fm-muted-fg)]">
					{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
						<span key={i} className="py-1">
							{d}
						</span>
					))}
				</div>
				<div className="grid grid-cols-7 gap-0.5">
					{cells.map((cell, i) => {
						if (!cell) return <span key={i} />;
						const selected = spec.value && isSameDate(new Date(spec.value), cell.date);
						const isToday = isSameDate(today, cell.date);
						return (
							<button
								key={i}
								type="button"
								onClick={() => commit(cell.date)}
								onContextMenu={(e) => {
									if (!spec.onDayContextMenu) return;
									e.preventDefault();
									spec.onDayContextMenu(cell.date.getTime(), ctx);
								}}
								className={clsx(
									'flex h-7 items-center justify-center rounded-md text-xs hover:bg-[color:var(--fm-row-hover-bg)]',
									selected &&
										'bg-[color:var(--fm-accent)] text-[color:var(--fm-accent-fg)] hover:bg-[color:var(--fm-accent)]',
									!selected && isToday && 'border border-[color:var(--fm-surface-border)]'
								)}
							>
								{cell.day}
							</button>
						);
					})}
				</div>
			</>
		);
	}

	// ─── Optional time row ─────────────────────────────────────────────────
	// Commit the time edit. If the menu has no value yet, anchor to today
	// at midnight so the consumer's onChange always fires — otherwise time
	// keystrokes would silently disappear until a date is picked.
	const commitTime = (hh: number, mm: number) => {
		const base = spec.value ? new Date(spec.value) : new Date(new Date().setHours(0, 0, 0, 0));
		base.setHours(hh, mm, 0, 0);
		spec.onChange(base.getTime(), ctx);
	};
	const timeRow = spec.withTime ? (
		<div className="mt-2 flex items-center justify-center gap-1 border-t border-[color:var(--fm-surface-border)] pt-2">
			<input
				type="number"
				min={0}
				max={23}
				value={String(time.hh).padStart(2, '0')}
				onChange={(e) => {
					const hh = Math.max(0, Math.min(23, Number(e.target.value) || 0));
					setTime((t) => ({ ...t, hh }));
					commitTime(hh, time.mm);
				}}
				className="w-10 rounded-md border border-[color:var(--fm-surface-border)] bg-transparent px-1 py-0.5 text-center font-mono text-xs tabular-nums"
				aria-label="Hours"
			/>
			<span className="text-[color:var(--fm-muted-fg)]">:</span>
			<input
				type="number"
				min={0}
				max={59}
				value={String(time.mm).padStart(2, '0')}
				onChange={(e) => {
					const mm = Math.max(0, Math.min(59, Number(e.target.value) || 0));
					setTime((t) => ({ ...t, mm }));
					commitTime(time.hh, mm);
				}}
				className="w-10 rounded-md border border-[color:var(--fm-surface-border)] bg-transparent px-1 py-0.5 text-center font-mono text-xs tabular-nums"
				aria-label="Minutes"
			/>
		</div>
	) : null;

	return (
		<div className="px-2 py-2 text-sm">
			{header}
			{body}
			{timeRow}
		</div>
	);
}

function EmojiGridPanel({ spec, ctx }: any) {
	// Foundation rendering: flat grid of cells (categories / variant picker land
	// with the smile-runtime work).
	const { items } = useResolvedSource(spec.source, '', ctx);
	const filtered = items;
	const cols = spec.columns;
	return (
		<div
			className="grid p-1"
			style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: spec.gap ?? 2 }}
		>
			{filtered.map((it: any, i: number) => (
				<button
					key={i}
					type="button"
					onClick={() => spec.onSelect?.(it, ctx)}
					onContextMenu={(e) => {
						if (!spec.onLongPress) return;
						e.preventDefault();
						spec.onLongPress(it, ctx);
					}}
					className="flex items-center justify-center rounded-md hover:bg-accent"
					style={{ height: spec.rowHeight }}
				>
					{spec.renderTile(it, ctx)}
				</button>
			))}
		</div>
	);
}

function TileGridPanel({ spec, ctx }: any) {
	// Mirror EmojiGrid for the foundation; differentiation lands as needed.
	// Render via JSX so React tracks hooks under TileGridPanel's fiber.
	return <EmojiGridPanel spec={spec} ctx={ctx} />;
}

function QueryBuilderPanel({ spec, ctx }: any) {
	const renderNode = (node: any, depth = 0): JSX.Element => {
		const op = spec.getOperator(node);
		return (
			<div className={clsx('flex flex-col gap-1 rounded-md border border-border p-2', depth > 0 && 'ml-4')}>
				<div className="flex items-center justify-between">
					<select
						value={op}
						onChange={(e) => spec.onOperatorChange(node, e.target.value, ctx)}
						className="h-6 rounded-md border border-input bg-transparent px-1 text-xs"
					>
						{spec.operatorOptions.map((opt: any) => (
							<option key={opt.id} value={opt.id}>
								{opt.label}
							</option>
						))}
					</select>
					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={() => spec.onAddRule(node, ctx)}
							className="rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent"
						>
							+ Rule
						</button>
						<button
							type="button"
							onClick={() => spec.onAddGroup(node, ctx)}
							className="rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent"
						>
							+ Group
						</button>
					</div>
				</div>
				<div className="flex flex-col gap-1">
					{spec
						.getChildren(node)
						.map((child: any, i: number) =>
							child.kind === 'rule' ? (
								<div key={i}>{spec.renderRule(child.data, ctx)}</div>
							) : (
								<div key={i}>{renderNode(child.data, depth + 1)}</div>
							)
						)}
				</div>
			</div>
		);
	};
	return <div className="p-2">{renderNode(spec.root)}</div>;
}

function EmptyStatePanel({ spec }: any) {
	return (
		<div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
			{spec.icon && <IconView icon={spec.icon} defaultSize={20} />}
			{spec.title && <div className="text-foreground">{renderRenderable(spec.title, undefined as never)}</div>}
			{spec.message && <div>{renderRenderable(spec.message, undefined as never)}</div>}
			{spec.action && (
				<button
					type="button"
					onClick={(e) => spec.action.onClick(e)}
					className="mt-1 inline-flex h-7 items-center rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
				>
					{spec.action.label}
				</button>
			)}
		</div>
	);
}

function LoaderPanel({ spec }: any) {
	return (
		<div className="flex items-center justify-center gap-2 px-3 py-3 text-xs text-muted-foreground">
			<CircleNotch className="size-3.5 animate-spin" />
			{spec.message ? renderRenderable(spec.message, undefined as never) : 'Loading…'}
		</div>
	);
}

function ErrorPanel({ spec, ctx }: any) {
	return (
		<div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
			<WarningCircle className="size-3.5 shrink-0" />
			<div className="flex-1">{renderRenderable(spec.message, undefined as never)}</div>
			{spec.retry && (
				<button
					type="button"
					onClick={() => spec.retry.onClick(ctx)}
					className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-destructive hover:bg-destructive/20"
				>
					{spec.retry.label ?? 'Retry'}
				</button>
			)}
		</div>
	);
}

function BannerPanel({ spec }: any) {
	return (
		<div className="m-2 flex items-start gap-2 rounded-md border border-border bg-muted/30 p-2 text-xs">
			{spec.icon && <IconView icon={spec.icon} defaultSize={14} />}
			<div className="flex-1">
				{spec.title && <div className="font-medium">{renderRenderable(spec.title, undefined as never)}</div>}
				{spec.message && (
					<div className="text-muted-foreground">{renderRenderable(spec.message, undefined as never)}</div>
				)}
			</div>
			{spec.action && (
				<button
					type="button"
					onClick={(e) => spec.action.onClick(e)}
					className="rounded-md bg-primary px-1.5 py-0.5 text-primary-foreground"
				>
					{spec.action.label}
				</button>
			)}
		</div>
	);
}

function LinkPreviewPanel({ spec }: any) {
	return (
		<div className="m-2 flex gap-3 rounded-md border border-border p-2">
			{spec.image && <img src={spec.image} alt="" className="size-12 shrink-0 rounded object-cover" />}
			<div className="flex-1">
				{spec.title && <div className="text-sm font-medium">{spec.title}</div>}
				{spec.description && <div className="text-xs text-muted-foreground">{spec.description}</div>}
				<div className="text-[10px] text-muted-foreground">{spec.url}</div>
			</div>
		</div>
	);
}

function TabBarPanel({ spec, ctx }: any) {
	return (
		<div className="flex items-center justify-between border-b border-border px-1 pt-1">
			<div className="flex items-center gap-0.5" role="tablist">
				{spec.tabs.map((t: any) => {
					const active = t.id === spec.activeId;
					return (
						<button
							key={t.id}
							type="button"
							role="tab"
							aria-selected={active}
							onClick={() => spec.onChange(t.id, ctx)}
							className={clsx(
								'inline-flex items-center gap-1 rounded-t-md px-2 py-1 text-xs font-medium',
								active ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground'
							)}
						>
							{t.icon && <IconView icon={t.icon} defaultSize={12} />}
							{t.label}
						</button>
					);
				})}
			</div>
			{spec.rightSlot}
		</div>
	);
}

function SliderPanel({ spec, ctx }: any) {
	// Snaps: when provided, the input snaps to the nearest discrete point on
	// release. Live value during drag remains continuous so the consumer can
	// preview without commit-on-every-pixel noise.
	const snap = (v: number): number => {
		const snaps = spec.snaps as number[] | undefined;
		if (!snaps || snaps.length === 0) return v;
		return snaps.reduce((acc, s) => (Math.abs(s - v) < Math.abs(acc - v) ? s : acc), snaps[0]!);
	};
	return (
		<div className="flex flex-col gap-1.5 px-3 py-2">
			{(spec.label || spec.showValue) && (
				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<span>{renderRenderable(spec.label, undefined as never)}</span>
					{spec.showValue && <span className="font-mono tabular-nums">{spec.value}</span>}
				</div>
			)}
			<input
				type="range"
				min={spec.min}
				max={spec.max}
				step={spec.step ?? 1}
				value={spec.value}
				onChange={(e) => spec.onChange(Number(e.target.value), ctx)}
				onPointerUp={(e) => {
					const next = snap(Number((e.target as HTMLInputElement).value));
					if (next !== spec.value) spec.onChange(next, ctx);
				}}
				className="w-full accent-[color:var(--fm-accent)]"
				aria-label={typeof spec.label === 'string' ? spec.label : undefined}
			/>
		</div>
	);
}

function MarkdownToolbarPanel({ spec, ctx }: any) {
	const active = new Set<string>(spec.activeMarks ?? []);
	return (
		<div className="flex items-center gap-0.5 border-b border-border px-1 py-1">
			{spec.styleSwitcher && (
				<>
					<button
						type="button"
						onClick={() => spec.styleSwitcher.onClick(ctx)}
						className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-xs text-muted-foreground hover:bg-accent"
						aria-label={`Style: ${spec.styleSwitcher.activeStyle}`}
					>
						<IconView icon={spec.styleSwitcher.icon} defaultSize={12} />
						<span className="font-medium">{spec.styleSwitcher.activeStyle}</span>
					</button>
					<span className="mx-0.5 h-4 w-px bg-border" aria-hidden />
				</>
			)}
			{spec.buttons.map((b: any) => {
				const isActive = b.mark ? active.has(b.mark) : false;
				return (
					<button
						key={b.id}
						type="button"
						onClick={() => b.onClick(ctx)}
						aria-pressed={isActive || undefined}
						title={typeof b.tooltip?.text === 'string' ? b.tooltip.text : undefined}
						className={clsx(
							'inline-flex size-6 items-center justify-center rounded-md hover:bg-accent',
							isActive ? 'bg-accent text-foreground' : 'text-muted-foreground'
						)}
					>
						<IconView icon={b.icon} defaultSize={14} />
					</button>
				);
			})}
		</div>
	);
}

function CodeEditorPanel({ spec, ctx }: any) {
	// Lightweight textarea — consumers who want a real syntax-highlighted
	// editor (monaco / codemirror) can swap in a `kind: Custom` panel and
	// keep the rest of the menu schema unchanged.
	const ctxRef = useRef(ctx);
	ctxRef.current = ctx;
	const minRows = spec.minRows ?? 4;
	const maxRows = spec.maxRows ?? 16;
	const lines = Math.min(maxRows, Math.max(minRows, (spec.value?.split('\n').length ?? 0) || minRows));
	return (
		<div className="px-2 py-2">
			{spec.language && (
				<div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{spec.language}</div>
			)}
			<textarea
				value={spec.value ?? ''}
				placeholder={spec.placeholder}
				rows={lines}
				spellCheck={false}
				onChange={(e) => spec.onChange(e.target.value, ctxRef.current)}
				onKeyDown={(e) => {
					if (spec.onSave && (e.metaKey || e.ctrlKey) && e.key === 'Enter') {
						e.preventDefault();
						spec.onSave?.((e.target as HTMLTextAreaElement).value, ctxRef.current);
					}
				}}
				className="w-full resize-none rounded-md border border-border bg-transparent p-2 font-mono text-xs leading-relaxed outline-none"
			/>
		</div>
	);
}

function KatexPreviewPanel({ spec }: any) {
	// Render the raw TeX as a styled code block. Real KaTeX rendering would
	// pull in a ~280KB dep — consumers who need it can swap to a Custom panel
	// and call katex.renderToString themselves.
	const displayMode = spec.displayMode ?? true;
	return (
		<div className="px-3 py-2">
			<div
				className={clsx(
					'rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-xs',
					displayMode ? 'text-center' : 'inline-block'
				)}
				aria-label="LaTeX expression"
			>
				{spec.expression}
			</div>
			{spec.caption && <div className="mt-1 text-[10px] text-muted-foreground">{spec.caption}</div>}
		</div>
	);
}

function QrCodePanel({ spec }: any) {
	// Placeholder square — encodes only the value's character count visually
	// (4-bit checksum sample). Consumers who need a scannable QR can swap to
	// a Custom panel and use `qrcode.react` or similar.
	const size = spec.size ?? 128;
	const checksum = Array.from(spec.value as string)
		.reduce((acc, ch) => (acc + ch.charCodeAt(0)) % 4096, 0)
		.toString(2)
		.padStart(12, '0');
	return (
		<div className="flex flex-col items-center gap-2 px-3 py-3">
			<div
				role="img"
				aria-label={`QR placeholder for ${spec.value}`}
				className="grid place-items-center rounded-md border border-border bg-foreground/5"
				style={{ width: size, height: size }}
			>
				<div className="grid grid-cols-6 gap-px font-mono text-[8px] text-muted-foreground">
					{checksum.split('').map((b, i) => (
						<span
							key={i}
							className={clsx('size-3 rounded-sm', b === '1' ? 'bg-foreground' : 'bg-transparent')}
						/>
					))}
				</div>
			</div>
			<code className="max-w-full break-all text-center text-[10px] text-muted-foreground">{spec.value}</code>
			{spec.buttons && (
				<div className="flex items-center gap-1">
					{spec.buttons.map((b: any) => (
						<button
							key={b.id}
							type="button"
							onClick={b.onClick}
							className="inline-flex h-6 items-center rounded-md border border-border px-2 text-[11px] text-muted-foreground hover:bg-accent"
						>
							{b.icon && <IconView icon={b.icon} defaultSize={10} />}
							{b.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
