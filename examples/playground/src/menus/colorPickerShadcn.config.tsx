/**
 * Color picker — shadcn component dropped in as the menu body.
 *
 * Demonstrates the interop pattern: the body is `kind: 'custom'` and renders
 * a self-contained picker built from shadcn primitives (Slider, Input,
 * Button). The menu shell still owns positioning, the dimmer, sub-menu
 * stacking, animation, storage, and lifecycle — the picker only owns its
 * own UX.
 *
 * Pair with `themeColorPicker.config.ts` to compare patterns.
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { BodyKind, DimmerMode, Horizontal, Vertical, defineMenu } from '@fancy-menus/core';
import { Check, Pipette } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ColorPickerData {
	initial?: string; // hex '#RRGGBB'
	onSelect: (hex: string) => void;
}

function hslToHex(h: number, s: number, l: number): string {
	const lightness = l / 100;
	const a = (s * Math.min(lightness, 1 - lightness)) / 100;
	const f = (n: number) => {
		const k = (n + h / 30) % 12;
		const c = lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
		return Math.round(255 * c)
			.toString(16)
			.padStart(2, '0');
	};
	return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
	const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
	if (!m) return null;
	const int = Number.parseInt(m[1]!, 16);
	const r = ((int >> 16) & 0xff) / 255;
	const g = ((int >> 8) & 0xff) / 255;
	const b = (int & 0xff) / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	let h = 0;
	let s = 0;
	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}
	return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
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
	const initialHsl = (initial && hexToHsl(initial)) || { h: 220, s: 80, l: 55 };
	const [h, setH] = useState(initialHsl.h);
	const [s, setS] = useState(initialHsl.s);
	const [l, setL] = useState(initialHsl.l);
	const [hex, setHex] = useState(hslToHex(initialHsl.h, initialHsl.s, initialHsl.l));

	useEffect(() => setHex(hslToHex(h, s, l)), [h, s, l]);

	return (
		<div className="flex w-full flex-col gap-3 p-3">
			<div
				className="h-16 w-full rounded-md border border-border shadow-inner"
				style={{ backgroundColor: hex }}
				aria-label="Preview"
			/>

			<div className="space-y-2">
				<label className="flex items-center justify-between text-xs text-muted-foreground">
					<span>Hue</span>
					<span>{h}°</span>
				</label>
				<Slider min={0} max={360} step={1} value={[h]} onValueChange={([v]) => setH(v ?? 0)} />

				<label className="flex items-center justify-between text-xs text-muted-foreground">
					<span>Saturation</span>
					<span>{s}%</span>
				</label>
				<Slider min={0} max={100} step={1} value={[s]} onValueChange={([v]) => setS(v ?? 0)} />

				<label className="flex items-center justify-between text-xs text-muted-foreground">
					<span>Lightness</span>
					<span>{l}%</span>
				</label>
				<Slider min={0} max={100} step={1} value={[l]} onValueChange={([v]) => setL(v ?? 0)} />
			</div>

			<Separator />

			<div className="flex items-center gap-2">
				<Pipette className="size-4 text-muted-foreground" />
				<Input
					value={hex}
					onChange={(e) => {
						const v = e.target.value;
						setHex(v);
						const parsed = hexToHsl(v);
						if (parsed) {
							setH(parsed.h);
							setS(parsed.s);
							setL(parsed.l);
						}
					}}
					spellCheck={false}
					maxLength={7}
					className="font-mono text-xs uppercase"
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
	description: 'Rich HSL/hex picker built from shadcn primitives, mounted as a custom-body menu.',
	position: { width: 320, vertical: Vertical.Bottom, horizontal: Horizontal.Left },
	chrome: { title: 'Color', dimmer: DimmerMode.Default },
	body: {
		kind: BodyKind.Custom,
		measureHeight: () => 320,
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
