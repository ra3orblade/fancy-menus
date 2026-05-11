/**
 * Atomic types reused throughout the schema.
 */

import type { CSSProperties, ComponentType, KeyboardEvent, MouseEvent, ReactNode, SVGProps } from 'react';
import type { ButtonColor, ButtonSize, TooltipAxisX, TooltipAxisY } from './enums';

/** A renderable value: string, number, ReactNode, or function returning one. */
export type Renderable<TItem = void> = ReactNode | (TItem extends void ? () => ReactNode : (item: TItem) => ReactNode);

/**
 * Phosphor-compatible icon component (https://phosphoricons.com). Accepts a
 * `PhosphorIcon` import directly (e.g. `import { Star } from '@phosphor-icons/react'`)
 * — any component matching this shape works, including custom SVG icons.
 *
 * Plain string names are *not* accepted anywhere icons are used. Strings
 * can't carry per-instance styling intent (size, color, weight) and would
 * force a hidden registry indirection. Pass the component directly, or
 * wrap it in an `IconParam` spec when you need to override style.
 */
export type IconComponent = ComponentType<
	SVGProps<SVGSVGElement> & {
		size?: number | string;
		weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
		mirrored?: boolean;
	}
>;

/**
 * Icon specification — either a bare phosphor icon component, or an
 * object that wraps the component with display overrides.
 */
export interface IconParam {
	/** Phosphor icon component (or any component matching IconComponent). */
	icon: IconComponent;
	color?: string;
	size?: number;
	weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
	className?: string;
	/** Forwarded to the underlying svg / wrapper. */
	'aria-label'?: string;
}

/** Tooltip specification, attachable to most primitives. */
export interface TooltipParam {
	text: string;
	caption?: string;
	delay?: number;
	className?: string;
	typeX?: TooltipAxisX;
	typeY?: TooltipAxisY;
}

/** Generic { id, label } shape used by selects, tabs, etc. */
export interface Option<TValue = string> {
	id: TValue;
	name: string;
	description?: string;
	icon?: IconParam;
	color?: string;
	disabled?: boolean;
}

/** Section grouping inside a list. */
export interface Section<TItem = unknown> {
	id: string;
	name?: string;
	className?: string;
	items: TItem[];
}

/** Button specification used in footers, dialogs, etc. */
export interface ButtonSpec {
	id: string;
	label: string;
	icon?: IconParam;
	color?: ButtonColor;
	size?: ButtonSize;
	disabled?: boolean;
	loading?: boolean;
	onClick: (e: MouseEvent) => void | Promise<void>;
}

/** Keyboard shortcut binding shared by chrome, body, and rows. */
export interface ShortcutBinding {
	/** Key combo string, e.g. `cmd+k`, `shift+enter`, `arrowup, ctrl+p`. */
	keys: string;
	/** Human-readable label for tooltips/captions. */
	caption?: string;
	/** Stop default + propagation by default; set false to keep them. */
	preventDefault?: boolean;
	handler: (e: KeyboardEvent) => void;
}

/**
 * Direction enums for positioning. String-valued so the serialized config
 * stays human-readable, but named so call sites read `Vertical.Bottom`
 * instead of magic `'bottom'`.
 *
 *   - `Vertical`   — vertical anchor (top / center / bottom)
 *   - `Horizontal` — horizontal anchor (left / center / right)
 *   - `Edge`       — any of the four element edges, used by
 *                    `PositionConfig.stickToElementEdge`
 */
export enum Vertical {
	Top = 'top',
	Center = 'center',
	Bottom = 'bottom',
}

export enum Horizontal {
	Left = 'left',
	Center = 'center',
	Right = 'right',
}

export enum Edge {
	Top = 'top',
	Bottom = 'bottom',
	Left = 'left',
	Right = 'right',
}

/** Backwards-aliases so existing literal-typed code keeps compiling. */
export type DirectionV = `${Vertical}`;
export type DirectionH = `${Horizontal}`;
export type DirectionAny = `${Edge}`;

/** Style escape-hatch (use sparingly — prefer CSS variables). */
export interface StyleSlot {
	className?: string;
	style?: CSSProperties;
}
