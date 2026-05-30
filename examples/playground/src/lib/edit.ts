import type { MenuConfig } from '@react-fancy-menus/core';

/**
 * Per-example config edits. Only the chrome / position fields the editor
 * exposes today; extend as more controls land.
 */
export interface MenuEdits {
	title?: string;
	dimmer?: string;
	withBack?: boolean;
	withClose?: boolean;
	vertical?: string;
	horizontal?: string;
	strategy?: string;
	width?: number;
	noAnimation?: boolean;
}

export function applyEdits(base: MenuConfig<any, any, any>, edits: MenuEdits): MenuConfig<any, any, any> {
	const next: MenuConfig<any, any, any> = {
		...base,
		chrome: { ...(base.chrome ?? {}) },
		position: { ...(base.position ?? {}) },
	};
	const c = next.chrome!;
	const p = next.position!;
	if (edits.title !== undefined) c.title = edits.title || undefined;
	if (edits.dimmer !== undefined) c.dimmer = edits.dimmer as any;
	if (edits.withBack !== undefined) c.withBack = edits.withBack;
	if (edits.withClose !== undefined) c.withClose = edits.withClose;
	if (edits.noAnimation !== undefined) c.noAnimation = edits.noAnimation;
	if (edits.vertical !== undefined) p.vertical = edits.vertical as any;
	if (edits.horizontal !== undefined) p.horizontal = edits.horizontal as any;
	if (edits.strategy !== undefined) p.strategy = edits.strategy as any;
	if (edits.width !== undefined) p.width = edits.width || undefined;
	return next;
}

/** Read the editor's initial state from the base config. */
export function editsFromConfig(base: MenuConfig<any, any, any>): MenuEdits {
	return {
		title: typeof base.chrome?.title === 'string' ? base.chrome.title : '',
		dimmer: (base.chrome?.dimmer as string) ?? 'default',
		withBack: !!base.chrome?.withBack,
		withClose: !!base.chrome?.withClose,
		vertical: (base.position?.vertical as string) ?? 'bottom',
		horizontal: (base.position?.horizontal as string) ?? 'left',
		strategy: (base.position?.strategy as string) ?? 'fixed',
		width: base.position?.width ?? 0,
		noAnimation: !!base.chrome?.noAnimation,
	};
}
