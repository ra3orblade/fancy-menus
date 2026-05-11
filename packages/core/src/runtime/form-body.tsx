/**
 * FormBody renderer — basic form with switch + select fields.
 * Other field kinds (date, color, file, icon, custom) emit placeholders
 * and will land as runtime support grows.
 */

import clsx from 'clsx';
import { useState } from 'react';
import type { FormBody } from '../types/body';
import type { MenuCtx } from '../types/context';
import { FieldKind } from '../types/enums';
import type { FieldSpec } from '../types/field';

interface Props {
	body: FormBody<any>;
	ctx: MenuCtx;
}

export function FormBodyView({ body, ctx }: Props) {
	const [values, setValues] = useState<Record<string, unknown>>(() => {
		const init: Record<string, unknown> = { ...(body.initialValues as object) };
		for (const f of body.fields) {
			if (f.kind !== FieldKind.Button && f.name && init[f.name] === undefined && 'defaultValue' in f) {
				init[f.name] = (f as any).defaultValue;
			}
		}
		return init;
	});

	const setValue = (name: string, v: unknown) => setValues((prev) => ({ ...prev, [name]: v }));

	const onSubmit = () => body.onSubmit(values, ctx);

	return (
		<form
			className="fm-form flex flex-col gap-2 px-2 py-2"
			onSubmit={(e) => {
				e.preventDefault();
				onSubmit();
			}}
		>
			{body.fields.map((field, i) => (
				<FieldView key={(field as any).name ?? i} field={field} values={values} setValue={setValue} ctx={ctx} />
			))}
			{body.submit !== null && (
				<button
					type="submit"
					className="mt-2 inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					{body.submit?.label ?? 'Save'}
				</button>
			)}
		</form>
	);
}

interface FieldProps {
	field: FieldSpec;
	values: Record<string, unknown>;
	setValue: (name: string, v: unknown) => void;
	ctx: MenuCtx;
}

function FieldView({ field, values, setValue, ctx }: FieldProps) {
	if (field.kind === FieldKind.Button) {
		return (
			<button
				type="button"
				onClick={() => field.onClick(values, ctx)}
				className="inline-flex h-8 items-center justify-center rounded-md bg-secondary px-3 text-sm font-medium hover:bg-secondary/80"
			>
				{typeof field.label === 'function' ? field.label() : field.label}
			</button>
		);
	}

	const name = field.name;
	if (!name) return null;
	const hidden = typeof field.hidden === 'function' ? field.hidden(values) : field.hidden;
	if (hidden) return null;

	const labelEl =
		field.label != null ? (
			<label className="text-xs text-muted-foreground">
				{typeof field.label === 'function' ? field.label() : field.label}
			</label>
		) : null;

	switch (field.kind) {
		case FieldKind.Switch: {
			const value = !!values[name];
			return (
				<div className="flex items-center justify-between gap-2 rounded-md px-1 py-1.5">
					<span className="text-sm">{typeof field.label === 'function' ? field.label() : field.label}</span>
					<button
						type="button"
						role="switch"
						aria-checked={value}
						onClick={() => setValue(name, !value)}
						className={clsx(
							'inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors',
							value ? 'bg-primary' : 'bg-muted'
						)}
					>
						<span
							className={clsx(
								'block h-3 w-3 rounded-full bg-background shadow transition-transform',
								value ? 'translate-x-3.5' : 'translate-x-0.5'
							)}
						/>
					</button>
				</div>
			);
		}

		case FieldKind.Checkbox: {
			const value = !!values[name];
			return (
				<label className="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={value}
						onChange={(e) => setValue(name, e.target.checked)}
						className="size-4 rounded border-border"
					/>
					{typeof field.label === 'function' ? field.label() : field.label}
				</label>
			);
		}

		case FieldKind.Text:
		case FieldKind.TextArea: {
			const value = (values[name] as string) ?? '';
			const Tag = field.kind === FieldKind.TextArea ? 'textarea' : 'input';
			return (
				<div className="flex flex-col gap-1">
					{labelEl}
					<Tag
						value={value}
						placeholder={(field as any).placeholder}
						onChange={(e: any) => setValue(name, e.target.value)}
						className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
					/>
				</div>
			);
		}

		case FieldKind.Select: {
			const value = (values[name] as string) ?? '';
			const options = typeof field.options === 'function' ? field.options() : field.options;
			return (
				<div className="flex items-center justify-between gap-2 rounded-md px-1 py-1.5">
					<span className="text-sm">{typeof field.label === 'function' ? field.label() : field.label}</span>
					<select
						value={value as string}
						onChange={(e) => setValue(name, e.target.value)}
						className="h-7 rounded-md border border-input bg-transparent px-2 text-sm"
					>
						{options.map((opt) => (
							<option key={String(opt.id)} value={String(opt.id)}>
								{opt.name}
							</option>
						))}
					</select>
				</div>
			);
		}

		case FieldKind.Custom:
			return (field as any).render({
				value: values[name],
				setValue: (next: unknown) => setValue(name, next),
				ctx,
			});

		default:
			return <div className="text-xs text-muted-foreground">[{field.kind} field not yet rendered]</div>;
	}
}
