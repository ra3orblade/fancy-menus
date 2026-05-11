/**
 * Editor — form controls for the most common MenuConfig fields. Edits flow
 * back to the App which re-registers the merged config so the menu reflects
 * the change on the next open (or immediately, if currently open).
 */

import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { MenuEdits } from '@/lib/edit';
import { Label } from '@radix-ui/react-label';

interface EditorProps {
	edits: MenuEdits;
	onChange: (patch: Partial<MenuEdits>) => void;
}

const DIMMER_MODES = ['default', 'none', 'passThrough', 'visible'];
const VERTICALS = ['top', 'center', 'bottom'];
const HORIZONTALS = ['left', 'center', 'right'];
const STRATEGIES = ['fixed', 'absolute'];

export function Editor({ edits, onChange }: EditorProps) {
	return (
		<div className="flex flex-col gap-4 p-4">
			<Section title="Chrome">
				<Field label="Title">
					<Input
						value={edits.title ?? ''}
						onChange={(e) => onChange({ title: e.target.value })}
						placeholder="(none)"
						className="h-8 text-sm"
					/>
				</Field>
				<Field label="Dimmer">
					<Select
						value={edits.dimmer ?? 'default'}
						options={DIMMER_MODES}
						onChange={(v) => onChange({ dimmer: v })}
					/>
				</Field>
				<ToggleField label="Back arrow" value={!!edits.withBack} onChange={(v) => onChange({ withBack: v })} />
				<ToggleField
					label="Close icon"
					value={!!edits.withClose}
					onChange={(v) => onChange({ withClose: v })}
				/>
				<ToggleField
					label="Disable animation"
					value={!!edits.noAnimation}
					onChange={(v) => onChange({ noAnimation: v })}
				/>
			</Section>

			<Section title="Position">
				<Field label="Vertical">
					<Select
						value={edits.vertical ?? 'bottom'}
						options={VERTICALS}
						onChange={(v) => onChange({ vertical: v })}
					/>
				</Field>
				<Field label="Horizontal">
					<Select
						value={edits.horizontal ?? 'left'}
						options={HORIZONTALS}
						onChange={(v) => onChange({ horizontal: v })}
					/>
				</Field>
				<Field label="Strategy">
					<Select
						value={edits.strategy ?? 'fixed'}
						options={STRATEGIES}
						onChange={(v) => onChange({ strategy: v })}
					/>
				</Field>
				<Field label="Width (px, 0 = auto)">
					<Input
						type="number"
						min={0}
						value={edits.width ?? 0}
						onChange={(e) => onChange({ width: Number(e.target.value) || 0 })}
						className="h-8 text-sm"
					/>
				</Field>
			</Section>
		</div>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-2">
			<h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
			<div className="flex flex-col gap-2 rounded-md border border-border bg-card p-3">{children}</div>
		</div>
	);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="grid grid-cols-[auto,1fr] items-center gap-3">
			<Label className="whitespace-nowrap text-xs text-muted-foreground">{label}</Label>
			{children}
		</div>
	);
}

function ToggleField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
	return (
		<div className="flex items-center justify-between">
			<Label className="text-xs">{label}</Label>
			<Switch checked={value} onCheckedChange={onChange} />
		</div>
	);
}

function Select({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
	return (
		<select
			value={value}
			onChange={(e) => onChange(e.target.value)}
			// pr-7 reserves room for the native chevron so it doesn't touch
			// the input's right border on macOS / WebKit.
			className="h-8 rounded-md border border-input bg-transparent pl-2 pr-7 text-sm"
		>
			{options.map((o) => (
				<option key={o} value={o}>
					{o}
				</option>
			))}
		</select>
	);
}
