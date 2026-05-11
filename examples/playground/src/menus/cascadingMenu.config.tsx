/**
 * Cascading context menu — multi-level nested menus.
 *
 * Exercises:
 *   - ItemRow.subMenuId for declarative sub-menu wiring
 *   - hover-spawn (200ms latched) AND keyboard ArrowRight
 *   - safe-mouse polygon between parent row and child menu
 *   - ArrowLeft closes the child and returns focus to the parent
 *   - 3 nesting levels (root → format → text-style)
 */

import { BodyKind, DimmerMode, Horizontal, RowKind, SourceKind, Vertical, defineMenu } from '@fancy-menus/core';
import {
	ArrowDownToLine,
	ArrowUpToLine,
	Bold,
	Code,
	Copy,
	FileDown,
	Italic,
	MoveRight,
	Scissors,
	Share2,
	Star,
	Trash2,
	Type,
	Underline,
} from 'lucide-react';

interface MenuItemSpec {
	id: string;
	name: string;
	icon?: any;
	caption?: string;
	subMenuId?: string;
	destructive?: boolean;
}

// ─── Root context menu ───────────────────────────────────────────────────
const ROOT_ITEMS: MenuItemSpec[] = [
	{ id: 'cut', name: 'Cut', icon: Scissors, caption: '⌘X' },
	{ id: 'copy', name: 'Copy', icon: Copy, caption: '⌘C' },
	{ id: 'star', name: 'Star', icon: Star, caption: '⌘D' },
	{ id: 'format', name: 'Format', icon: Type, subMenuId: 'cascadingFormat' },
	{ id: 'moveTo', name: 'Move to', icon: MoveRight, subMenuId: 'cascadingMoveTo' },
	{ id: 'export', name: 'Export as', icon: FileDown, subMenuId: 'cascadingExport' },
	{ id: 'share', name: 'Share', icon: Share2 },
	{ id: 'delete', name: 'Delete', icon: Trash2, caption: '⌫', destructive: true },
];

interface CascadingData {
	onSelect: (path: string[]) => void;
}

export const cascadingMenu = defineMenu<CascadingData, void, MenuItemSpec>({
	id: 'cascadingMenu',
	description:
		'Multi-level cascading context menu — hover/arrow to dive, ArrowLeft to back out, safe-polygon mouse travel.',
	position: {
		width: 220,
		vertical: Vertical.Bottom,
		horizontal: Horizontal.Left,
		fillViewport: true,
	},
	chrome: { dimmer: DimmerMode.Default },
	body: {
		kind: BodyKind.List,
		source: { kind: SourceKind.Static, items: ROOT_ITEMS },
		rows: [
			{
				kind: RowKind.Item,
				name: (it) => it.name,
				icon: (it) => (it.icon ? { icon: it.icon, size: 14 } : undefined),
				caption: (it) => it.caption,
				arrow: (it) => Boolean(it.subMenuId),
				subMenuId: (it) => it.subMenuId,
				className: (it) => (it.destructive ? 'text-[color:var(--fm-destructive)]' : undefined),
				onClick: (item, _e, ctx) => {
					if (item.subMenuId) return;
					ctx.data.onSelect([item.id]);
					ctx.close();
				},
			},
		],
	},
	keyboard: { defaults: { closeOnEscape: true, selectOnEnter: true, cycleWrap: true } },
});

// ─── Sub-menu: Format ────────────────────────────────────────────────────
const FORMAT_ITEMS: MenuItemSpec[] = [
	{ id: 'bold', name: 'Bold', icon: Bold, caption: '⌘B' },
	{ id: 'italic', name: 'Italic', icon: Italic, caption: '⌘I' },
	{ id: 'underline', name: 'Underline', icon: Underline, caption: '⌘U' },
	{ id: 'code', name: 'Code', icon: Code, caption: '⌘E' },
	{ id: 'textStyle', name: 'Text style', icon: Type, subMenuId: 'cascadingTextStyle' },
];

export const cascadingFormat = defineMenu<CascadingData, void, MenuItemSpec>({
	id: 'cascadingFormat',
	description: 'Sub-menu — formatting options, with a nested Text style menu.',
	position: { width: 200, vertical: Vertical.Center, horizontal: Horizontal.Right, offsetX: 6 },
	body: {
		kind: BodyKind.List,
		source: { kind: SourceKind.Static, items: FORMAT_ITEMS },
		rows: [
			{
				kind: RowKind.Item,
				name: (it) => it.name,
				icon: (it) => (it.icon ? { icon: it.icon, size: 14 } : undefined),
				caption: (it) => it.caption,
				arrow: (it) => Boolean(it.subMenuId),
				subMenuId: (it) => it.subMenuId,
				onClick: (item, _e, ctx) => {
					if (item.subMenuId) return;
					ctx.data.onSelect(['format', item.id]);
					ctx.closeAll();
				},
			},
		],
	},
	keyboard: { defaults: { closeOnEscape: true, selectOnEnter: true, cycleWrap: true } },
});

// ─── Sub-sub-menu: Text style ────────────────────────────────────────────
const TEXT_STYLE_ITEMS: MenuItemSpec[] = [
	{ id: 'h1', name: 'Heading 1', caption: '⌘⌥1' },
	{ id: 'h2', name: 'Heading 2', caption: '⌘⌥2' },
	{ id: 'h3', name: 'Heading 3', caption: '⌘⌥3' },
	{ id: 'paragraph', name: 'Paragraph', caption: '⌘⌥0' },
	{ id: 'quote', name: 'Quote' },
];

export const cascadingTextStyle = defineMenu<CascadingData, void, MenuItemSpec>({
	id: 'cascadingTextStyle',
	description: 'Sub-sub-menu — text style picker (3 levels deep).',
	position: { width: 180, vertical: Vertical.Center, horizontal: Horizontal.Right, offsetX: 6 },
	body: {
		kind: BodyKind.List,
		source: { kind: SourceKind.Static, items: TEXT_STYLE_ITEMS },
		rows: [
			{
				kind: RowKind.Item,
				name: (it) => it.name,
				caption: (it) => it.caption,
				onClick: (item, _e, ctx) => {
					ctx.data.onSelect(['format', 'textStyle', item.id]);
					ctx.closeAll();
				},
			},
		],
	},
	keyboard: { defaults: { closeOnEscape: true, selectOnEnter: true, cycleWrap: true } },
});

// ─── Sub-menu: Move to ───────────────────────────────────────────────────
const MOVE_FOLDERS: MenuItemSpec[] = [
	{ id: 'inbox', name: 'Inbox' },
	{ id: 'archive', name: 'Archive' },
	{ id: 'projects', name: 'Projects' },
	{ id: 'trash', name: 'Trash' },
];

export const cascadingMoveTo = defineMenu<CascadingData, void, MenuItemSpec>({
	id: 'cascadingMoveTo',
	description: 'Sub-menu — destination folder picker.',
	position: { width: 180, vertical: Vertical.Center, horizontal: Horizontal.Right, offsetX: 6 },
	body: {
		kind: BodyKind.List,
		source: { kind: SourceKind.Static, items: MOVE_FOLDERS },
		rows: [
			{
				kind: RowKind.Item,
				name: (it) => it.name,
				onClick: (item, _e, ctx) => {
					ctx.data.onSelect(['moveTo', item.id]);
					ctx.closeAll();
				},
			},
		],
	},
	keyboard: { defaults: { closeOnEscape: true, selectOnEnter: true, cycleWrap: true } },
});

// ─── Sub-menu: Export ────────────────────────────────────────────────────
const EXPORT_FORMATS: MenuItemSpec[] = [
	{ id: 'pdf', name: 'PDF', icon: ArrowDownToLine },
	{ id: 'markdown', name: 'Markdown', icon: ArrowDownToLine },
	{ id: 'html', name: 'HTML', icon: ArrowDownToLine },
	{ id: 'image', name: 'Image', icon: ArrowDownToLine },
	{ id: 'plain', name: 'Plain text', icon: ArrowUpToLine },
];

export const cascadingExport = defineMenu<CascadingData, void, MenuItemSpec>({
	id: 'cascadingExport',
	description: 'Sub-menu — export format picker.',
	position: { width: 200, vertical: Vertical.Center, horizontal: Horizontal.Right, offsetX: 6 },
	body: {
		kind: BodyKind.List,
		source: { kind: SourceKind.Static, items: EXPORT_FORMATS },
		rows: [
			{
				kind: RowKind.Item,
				name: (it) => it.name,
				icon: (it) => (it.icon ? { icon: it.icon, size: 14 } : undefined),
				onClick: (item, _e, ctx) => {
					ctx.data.onSelect(['export', item.id]);
					ctx.closeAll();
				},
			},
		],
	},
	keyboard: { defaults: { closeOnEscape: true, selectOnEnter: true, cycleWrap: true } },
});
