/**
 * Replace-paged navigation — multi-page menu sharing one shell.
 *
 * Three pages live in the same anchored slot:
 *   • root        — list of categories
 *   • detail      — form for the chosen category (back arrow returns)
 *   • subDetail   — nested page reachable from detail (back walks one step)
 *
 * Exercises:
 *   - `ctx.navigateTo(id, { data })`  — swap menu in-place, push history
 *   - `ctx.back()` / `ctx.canGoBack()` — pop history, restore prior data
 *   - `chrome.withBack` auto-wires to the runtime's back when history exists
 *   - `param.data` round-trips across navigation so transient state (form
 *     values, selected item, scroll position cached as data) survives
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
} from '@fancy-menus/core';
import { Bell, Key, Palette, Translate } from '@phosphor-icons/react';

interface PageRoot {
	values: Record<string, unknown>;
	onCommit?: (path: string, values: Record<string, unknown>) => void;
}

interface CategoryItem {
	id: string;
	icon: any;
	name: string;
	description: string;
	target: 'pagedDetail' | 'pagedSubDetail';
	/** Section the detail form lives under so back-restored values keep their slot. */
	formKey: string;
}

const CATEGORIES: CategoryItem[] = [
	{
		id: 'theme',
		icon: Palette,
		name: 'Theme',
		description: 'Light, dark, accent',
		target: 'pagedDetail',
		formKey: 'theme',
	},
	{
		id: 'notifications',
		icon: Bell,
		name: 'Notifications',
		description: 'Sounds, badges',
		target: 'pagedDetail',
		formKey: 'notifications',
	},
	{
		id: 'language',
		icon: Translate,
		name: 'Language',
		description: 'Interface + region',
		target: 'pagedDetail',
		formKey: 'language',
	},
	{
		id: 'security',
		icon: Key,
		name: 'Security',
		description: '2FA, sessions',
		target: 'pagedSubDetail',
		formKey: 'security',
	},
];

export const replacePagedNav = defineMenu<PageRoot, void, CategoryItem>({
	id: 'replacePagedNav',
	description:
		'In-place page navigation: pick a category, fill its form, navigate back. Form values are preserved across back/forward via param.data.',
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
					// Swap this menu out for the detail page. The current
					// menu (root + its preserved values) is pushed onto a
					// history stack carried over to the detail page; back()
					// pops it.
					ctx.navigateTo(item.target, {
						data: {
							formKey: item.formKey,
							title: item.name,
							values: ctx.data.values,
							onCommit: ctx.data.onCommit,
						},
					});
				},
			},
		],
	},
	keyboard: { defaults: { closeOnEscape: true, selectOnEnter: true, cycleWrap: true } },
});

interface PageDetailData {
	formKey: string;
	title: string;
	values: Record<string, Record<string, unknown>>;
	onCommit?: (path: string, values: Record<string, unknown>) => void;
}

export const pagedDetail = defineMenu<PageDetailData, void>({
	id: 'pagedDetail',
	description:
		'Settings detail page with a small form. Back arrow walks navigation history; form values round-trip via param.data.',
	position: { width: 320 },
	chrome: {
		// Read the per-instance title off ctx.data so a single menu
		// definition can serve every category page.
		title: (ctx) => (ctx.data as PageDetailData)?.title ?? 'Detail',
		dimmer: DimmerMode.Default,
	},
	body: {
		kind: BodyKind.Form,
		fields: [
			{ name: 'enabled', kind: FieldKind.Switch, label: 'Enabled', defaultValue: true },
			{ name: 'verbose', kind: FieldKind.Switch, label: 'Verbose logging', defaultValue: false },
			{
				name: 'mode',
				kind: FieldKind.Select,
				label: 'Mode',
				defaultValue: 'auto',
				options: [
					{ id: 'auto', name: 'Auto' },
					{ id: 'manual', name: 'Manual' },
					{ id: 'off', name: 'Off' },
				],
			},
			{ name: 'note', kind: FieldKind.Text, label: 'Note', placeholder: '(optional)' },
		],
		submit: { id: 'save', label: 'Save', color: 'accent' as any, onClick: () => {} },
		// On submit, persist this page's values into the parent's shared
		// data bag (via updateData on the still-historied current entry)
		// and navigate back. Next time this category opens, the form
		// pre-fills with the saved values via initialValues.
		onSubmit: (values, ctx) => {
			const merged = { ...(ctx.data.values ?? {}), [ctx.data.formKey]: values };
			ctx.data.onCommit?.(ctx.data.formKey, values);
			ctx.updateData({ values: merged });
			if (ctx.canGoBack()) ctx.back();
			else ctx.close();
		},
		// Pre-fill from the page's previously-saved values (round-tripped
		// through param.data) so navigating back-and-forward keeps state.
		initialValues: undefined,
	},
	keyboard: { defaults: { closeOnEscape: true } },
});

interface PageSubDetailData extends PageDetailData {}

export const pagedSubDetail = defineMenu<PageSubDetailData, void>({
	id: 'pagedSubDetail',
	description: 'Two-level deep page — back returns to the root via the same history mechanism.',
	position: { width: 320 },
	chrome: {
		title: 'Security',
		dimmer: DimmerMode.Default,
	},
	body: {
		kind: BodyKind.Composed,
		sections: [
			{
				id: 'list',
				kind: BodyKind.List,
				source: {
					kind: SourceKind.Static,
					items: [
						{ id: 'twoFactor', name: 'Two-factor auth', detail: 'Recovery, devices' },
						{ id: 'sessions', name: 'Active sessions', detail: '3 devices' },
						{ id: 'export', name: 'Export data', detail: 'JSON archive' },
					],
				},
				rows: [
					{
						kind: RowKind.Item,
						name: (it: any) => it.name,
						caption: (it: any) => it.detail,
						arrow: true,
						onClick: (item: any, _e, ctx) => {
							// Drill another level: navigate to detail with a
							// scoped formKey. Back returns here; one more
							// back returns to the root.
							ctx.navigateTo('pagedDetail', {
								data: {
									formKey: `security.${item.id}`,
									title: item.name,
									values: ctx.data.values,
									onCommit: ctx.data.onCommit,
								},
							});
						},
					},
				],
			},
		],
	},
	keyboard: { defaults: { closeOnEscape: true, selectOnEnter: true, cycleWrap: true } },
});
