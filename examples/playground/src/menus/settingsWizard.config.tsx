/**
 * Settings wizard — replace-paged navigation.
 *
 * Three menus that share a parent/child stack: the root opens a category;
 * each category has a back arrow that closes itself and re-opens the root.
 *
 * Exercises:
 *   - chrome.title + withBack
 *   - sub-menu spawning via ctx.open with data.parentTriggerEl forwarded
 *   - composed body (header section + form fields)
 */

import {
	BodyKind,
	DimmerMode,
	FieldKind,
	Horizontal,
	RowKind,
	SourceKind,
	Vertical,
	defineMenu,
} from '@react-fancy-menus/core';
import { Bell, Keyboard, Palette, Shield, User } from '@phosphor-icons/react';

interface SettingsCategory {
	id: string;
	icon: any;
	name: string;
	description: string;
	target: string;
}

interface SettingsRootData {
	triggerEl?: Element | null;
	onCommit: (path: string, value: unknown) => void;
}

const CATEGORIES: SettingsCategory[] = [
	{
		id: 'appearance',
		icon: Palette,
		name: 'Appearance',
		description: 'Theme, density, accent',
		target: 'settingsAppearance',
	},
	{
		id: 'account',
		icon: User,
		name: 'Account',
		description: 'Profile, sign-in',
		target: 'settingsAccount',
	},
	{
		id: 'shortcuts',
		icon: Keyboard,
		name: 'Shortcuts',
		description: 'Keyboard bindings',
		target: 'settingsShortcuts',
	},
	{
		id: 'notifications',
		icon: Bell,
		name: 'Notifications',
		description: 'Alerts and digests',
		target: 'settingsNotifications',
	},
	{
		id: 'security',
		icon: Shield,
		name: 'Security',
		description: 'Two-factor, sessions',
		target: 'settingsSecurity',
	},
];

export const settingsWizard = defineMenu<SettingsRootData, string, SettingsCategory>({
	id: 'settingsWizard',
	description: 'Multi-page settings menu using replace-paged navigation through the menu stack.',
	position: {
		width: 320,
		vertical: Vertical.Bottom,
		horizontal: Horizontal.Left,
		fillViewport: true,
	},
	chrome: { title: 'Settings', dimmer: DimmerMode.Default },
	body: {
		kind: BodyKind.List,
		source: { kind: SourceKind.Static, items: CATEGORIES },
		rows: [
			{
				kind: RowKind.Item,
				name: (it) => it.name,
				caption: (it) => it.description,
				icon: (it) => ({ icon: it.icon, size: 16 }),
				arrow: true,
				onClick: (item, _e, ctx) => {
					ctx.close();
					// requestAnimationFrame so the parent close commits before
					// the child opens — keeps the stack clean.
					requestAnimationFrame(() => {
						ctx.open(item.target, {
							element: ctx.data.triggerEl ?? undefined,
							data: { onCommit: ctx.data.onCommit, triggerEl: ctx.data.triggerEl },
						});
					});
				},
			},
		],
	},
	keyboard: { defaults: { closeOnEscape: true, selectOnEnter: true, cycleWrap: true } },
});

interface SettingsPageData {
	triggerEl?: Element | null;
	onCommit: (path: string, value: unknown) => void;
}

function backToRoot(ctx: {
	close: () => void;
	open: (id: string, p?: any) => void;
	data: SettingsPageData;
}) {
	ctx.close();
	requestAnimationFrame(() =>
		ctx.open('settingsWizard', { element: ctx.data.triggerEl ?? undefined, data: ctx.data })
	);
}

export const settingsAppearance = defineMenu<SettingsPageData, void>({
	id: 'settingsAppearance',
	description: 'Settings → Appearance.',
	position: { width: 320, vertical: Vertical.Bottom, horizontal: Horizontal.Left },
	chrome: {
		title: 'Appearance',
		withBack: true,
		dimmer: DimmerMode.Default,
		// onBack is wired at lifecycle.onMount because we need access to ctx.
	},
	body: {
		kind: BodyKind.Form,
		fields: [
			{
				name: 'theme',
				kind: FieldKind.Select,
				label: 'Theme',
				defaultValue: 'system',
				options: [
					{ id: 'system', name: 'System' },
					{ id: 'light', name: 'Light' },
					{ id: 'dark', name: 'Dark' },
				],
			},
			{
				name: 'density',
				kind: FieldKind.Select,
				label: 'Density',
				defaultValue: 'comfortable',
				options: [
					{ id: 'compact', name: 'Compact' },
					{ id: 'comfortable', name: 'Comfortable' },
					{ id: 'spacious', name: 'Spacious' },
				],
			},
			{ name: 'reduceMotion', kind: FieldKind.Switch, label: 'Reduce motion', defaultValue: false },
			{ name: 'showHints', kind: FieldKind.Switch, label: 'Show inline hints', defaultValue: true },
		],
		onSubmit: (values, ctx) => {
			ctx.data.onCommit('appearance', values);
			backToRoot(ctx as any);
		},
		submit: { id: 'save', label: 'Save', color: 'accent' as any, onClick: () => {} },
	},
	lifecycle: {
		onMount: (ctx) => {
			// Wire the back button to return to the root page.
			(ctx as any).update?.({ chrome: { onBack: () => backToRoot(ctx as any) } });
		},
	},
	keyboard: { defaults: { closeOnEscape: true } },
});

export const settingsShortcuts = defineMenu<SettingsPageData, void, { id: string; name: string; binding: string }>({
	id: 'settingsShortcuts',
	description: 'Settings → Keyboard shortcuts.',
	position: {
		width: 360,
		vertical: Vertical.Bottom,
		horizontal: Horizontal.Left,
		fillViewport: true,
	},
	chrome: { title: 'Shortcuts', withBack: true, dimmer: DimmerMode.Default },
	body: {
		kind: BodyKind.List,
		source: {
			kind: SourceKind.Static,
			items: [
				{ id: 'toggle-sidebar', name: 'Toggle sidebar', binding: '⌘\\' },
				{ id: 'command', name: 'Command palette', binding: '⌘K' },
				{ id: 'find', name: 'Find in file', binding: '⌘F' },
				{ id: 'find-all', name: 'Find in project', binding: '⌘⇧F' },
				{ id: 'new-tab', name: 'New tab', binding: '⌘T' },
				{ id: 'close-tab', name: 'Close tab', binding: '⌘W' },
				{ id: 'next-tab', name: 'Next tab', binding: '⌘⌥→' },
				{ id: 'prev-tab', name: 'Previous tab', binding: '⌘⌥←' },
			],
		},
		rows: [
			{
				kind: RowKind.Item,
				name: (it) => it.name,
				caption: (it) => it.binding,
			},
		],
		virtualized: true,
	},
	lifecycle: {
		onMount: (ctx) => {
			(ctx as any).update?.({ chrome: { onBack: () => backToRoot(ctx as any) } });
		},
	},
	keyboard: { defaults: { closeOnEscape: true, cycleWrap: true } },
});
