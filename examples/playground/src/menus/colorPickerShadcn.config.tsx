/**
 * Color picker — shadcn.io-style 2D picker dropped in as the menu body.
 *
 * Demonstrates the interop pattern: the body is `kind: 'custom'` and renders
 * a self-contained picker — a 2D saturation × value area, a hue slider, and
 * a hex input — built from shadcn primitives plus a small custom canvas.
 * The menu shell still owns positioning, the dimmer, sub-menu stacking,
 * animation, storage, and lifecycle — the picker only owns its own UX.
 *
 * Pair with `themeColorPicker.config.ts` to compare patterns.
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { BodyKind, DimmerMode, Horizontal, Vertical, defineMenu } from '@react-fancy-menus/core';
import { Check } from '@phosphor-icons/react';
import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from 'react';

interface ColorPickerData {
	initial?: string; // hex '#RRGGBB'
	onSelect: (hex: string) => void;
}

// HSV is the natural space for a 2D saturation × value picker — the area's
// horizontal axis maps directly to S and vertical to V at a fixed hue.
function hsvToHex(h: number, s: number, v: number): string {
	const sat = s / 100;
	const val = v / 100;
	const c = val * sat;
	const hh = (h % 360) / 60;
	const x = c * (1 - Math.abs((hh % 2) - 1));
	let r = 0;
	let g = 0;
	let b = 0;
	if (hh < 1) {
		r = c;
		g = x;
	} else if (hh < 2) {
		r = x;
		g = c;
	} else if (hh < 3) {
		g = c;
		b = x;
	} else if (hh < 4) {
		g = x;
		b = c;
	} else if (hh < 5) {
		r = x;
		b = c;
	} else {
		r = c;
		b = x;
	}
	const m = val - c;
	const to = (n: number) =>
		Math.round((n + m) * 255)
			.toString(16)
			.padStart(2, '0');
	return `#${to(r)}${to(g)}${to(b)}`;
}

function hexToHsv(hex: string): { h: number; s: number; v: number } | null {
	const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
	if (!m) return null;
	const int = Number.parseInt(m[1]!, 16);
	const r = ((int >> 16) & 0xff) / 255;
	const g = ((int >> 8) & 0xff) / 255;
	const b = (int & 0xff) / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const d = max - min;
	let h = 0;
	if (d > 0) {
		if (max === r) h = ((g - b) / d) % 6;
		else if (max === g) h = (b - r) / d + 2;
		else h = (r - g) / d + 4;
		h *= 60;
		if (h < 0) h += 360;
	}
	const s = max === 0 ? 0 : d / max;
	return { h: Math.round(h), s: Math.round(s * 100), v: Math.round(max * 100) };
}

function SaturationValueArea({
	h,
	s,
	v,
	onChange,
}: {
	h: number;
	s: number;
	v: number;
	onChange: (s: number, v: number) => void;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const draggingRef = useRef(false);

	const update = useCallback(
		(clientX: number, clientY: number) => {
			const el = ref.current;
			if (!el) return;
			const r = el.getBoundingClientRect();
			const nx = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
			const ny = Math.max(0, Math.min(1, (clientY - r.top) / r.height));
			onChange(Math.round(nx * 100), Math.round((1 - ny) * 100));
		},
		[onChange]
	);

	const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
		if (e.button !== 0) return;
		draggingRef.current = true;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		update(e.clientX, e.clientY);
	};
	const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
		if (!draggingRef.current) return;
		update(e.clientX, e.clientY);
	};
	const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
		draggingRef.current = false;
		try {
			(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		} catch {
			// pointer was never captured (e.g. cancelled drag) — safe to ignore
		}
	};

	return (
		<div
			ref={ref}
			role="slider"
			aria-label="Saturation and value"
			aria-valuetext={`saturation ${s}%, value ${v}%`}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={s}
			className="relative h-36 w-full cursor-crosshair touch-none rounded-md border border-border"
			style={{
				backgroundColor: `hsl(${h} 100% 50%)`,
				backgroundImage:
					'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)',
			}}
			onPointerDown={onDown}
			onPointerMove={onMove}
			onPointerUp={onUp}
			onPointerCancel={onUp}
		>
			<div
				className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
				style={{
					left: `${s}%`,
					top: `${100 - v}%`,
					backgroundColor: hsvToHex(h, s, v),
				}}
			/>
		</div>
	);
}

function ColorPickerBody({
	initial,
	onSelect,
	onCancel,
}: {
	initial?: string;
	onSelect: (hex: string) => void;
	onCancel: () => void;
}) {
	const initialHsv = (initial && hexToHsv(initial)) || { h: 220, s: 80, v: 90 };
	const [h, setH] = useState(initialHsv.h);
	const [s, setS] = useState(initialHsv.s);
	const [v, setV] = useState(initialHsv.v);
	const [hex, setHex] = useState(hsvToHex(initialHsv.h, initialHsv.s, initialHsv.v));

	useEffect(() => setHex(hsvToHex(h, s, v)), [h, s, v]);

	return (
		<div className="flex w-full flex-col gap-3 p-3">
			<SaturationValueArea
				h={h}
				s={s}
				v={v}
				onChange={(ns, nv) => {
					setS(ns);
					setV(nv);
				}}
			/>

			<div
				className="h-3 w-full rounded-full border border-border"
				style={{
					backgroundImage:
						'linear-gradient(to right, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%))',
				}}
			>
				<Slider
					min={0}
					max={360}
					step={1}
					value={[h]}
					onValueChange={([next]) => setH(next ?? 0)}
					className="-mt-0.5"
					aria-label="Hue"
				/>
			</div>

			<Separator />

			<div className="flex items-center gap-2">
				<div
					className="size-7 shrink-0 rounded-md border border-border"
					style={{ backgroundColor: hex }}
					aria-hidden
				/>
				<Input
					value={hex}
					onChange={(e) => {
						const next = e.target.value;
						setHex(next);
						const parsed = hexToHsv(next);
						if (parsed) {
							setH(parsed.h);
							setS(parsed.s);
							setV(parsed.v);
						}
					}}
					spellCheck={false}
					maxLength={7}
					className="font-mono text-xs uppercase"
					aria-label="Hex value"
				/>
			</div>

			<div className="flex justify-end gap-2">
				<Button variant="ghost" size="sm" onClick={onCancel}>
					Cancel
				</Button>
				<Button size="sm" onClick={() => onSelect(hex)}>
					<Check /> Apply
				</Button>
			</div>
		</div>
	);
}

export const colorPickerShadcn = defineMenu<ColorPickerData, string>({
	id: 'colorPickerShadcn',
	description: 'Rich 2D + hue + hex picker built from shadcn primitives, mounted as a custom-body menu.',
	position: { width: 280, vertical: Vertical.Bottom, horizontal: Horizontal.Left },
	chrome: { title: 'Color', dimmer: DimmerMode.Default },
	body: {
		kind: BodyKind.Custom,
		measureHeight: () => 340,
		render: (ctx) => (
			<ColorPickerBody
				initial={ctx.data.initial}
				onSelect={(hex) => {
					ctx.data.onSelect(hex);
					ctx.close();
				}}
				onCancel={() => ctx.close()}
			/>
		),
	},
	keyboard: { defaults: { closeOnEscape: true } },
});
