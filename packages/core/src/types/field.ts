/**
 * Field primitives — used by `FormBody` for inputs that the runtime wires
 * to a form-state object and submits as one payload.
 */

import type { ReactNode } from 'react';
import type { MenuCtx } from './context';
import { ButtonFieldVariant, ColorScope, FieldKind, FileFieldVariant, TextFieldType, TextFieldVariant } from './enums';
import type { IconParam, Option, Renderable } from './primitives';

interface FieldBase<TValue = any> {
	/** Unique key in the form's value object. */
	name: string;
	label?: Renderable;
	description?: Renderable;
	required?: boolean;
	disabled?: boolean | ((values: Record<string, unknown>) => boolean);
	hidden?: boolean | ((values: Record<string, unknown>) => boolean);
	/** Field-level validation; returns an error string or null. */
	validate?: (value: TValue, values: Record<string, unknown>) => string | null;
	/** Default value applied at mount. */
	defaultValue?: TValue;
}

export interface TextField extends FieldBase<string> {
	kind: FieldKind.Text;
	placeholder?: string;
	icon?: IconParam;
	/** Visual variant: bare input or input wrapped in a labelled card. */
	variant?: TextFieldVariant;
	/** Mask the value (passwords, secrets). */
	type?: TextFieldType;
	maxLength?: number;
	/** Run onChange at this debounce (ms). */
	debounceMs?: number;
}

export interface TextAreaField extends FieldBase<string> {
	kind: FieldKind.TextArea;
	placeholder?: string;
	minRows?: number;
	maxRows?: number;
	autoSize?: boolean;
}

export interface SwitchField extends FieldBase<boolean> {
	kind: FieldKind.Switch;
	/** Inline icon + label, with switch on the right. */
	icon?: IconParam;
}

export interface CheckboxField extends FieldBase<boolean> {
	kind: FieldKind.Checkbox;
}

export interface SelectField<TValue = string> extends FieldBase<TValue> {
	kind: FieldKind.Select;
	options: Option<TValue>[] | (() => Option<TValue>[]);
	/** Render as a sub-menu picker rather than a native <select>. */
	asSubMenu?: boolean;
	subMenuId?: string;
}

export interface ColorField extends FieldBase<string> {
	kind: FieldKind.Color;
	/** Palette: list of color tokens. */
	palette: Array<{ id: string; label?: string }>;
	scope?: ColorScope;
}

export interface DateField extends FieldBase<number /* ms */> {
	kind: FieldKind.Date;
	withTime?: boolean;
}

export interface IconField extends FieldBase<IconParam | undefined> {
	kind: FieldKind.Icon;
	/** Icons available for selection — registry name or component. */
	options: IconParam[] | (() => IconParam[]);
}

export interface FileField extends FieldBase<File[] | string[]> {
	kind: FieldKind.File;
	accept?: string;
	multiple?: boolean;
	/** Render as drop zone (default) or inline button. */
	variant?: FileFieldVariant;
}

export interface ButtonField {
	kind: FieldKind.Button;
	/** Not part of the value payload — pure action. */
	name?: undefined;
	label: Renderable;
	icon?: IconParam;
	variant?: ButtonFieldVariant;
	onClick: (values: Record<string, unknown>, ctx: MenuCtx) => void | Promise<void>;
}

export interface CustomField<TValue = any> extends FieldBase<TValue> {
	kind: FieldKind.Custom;
	render: (props: {
		value: TValue;
		setValue: (next: TValue) => void;
		error?: string;
		ctx: MenuCtx;
	}) => ReactNode;
}

export type FieldSpec =
	| TextField
	| TextAreaField
	| SwitchField
	| CheckboxField
	| SelectField
	| ColorField
	| DateField
	| IconField
	| FileField
	| ButtonField
	| CustomField;
