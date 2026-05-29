/**
 * Command palette — Cmd/Ctrl+K style menu.
 *
 * Exercises:
 *   - filter input (focused on mount, debounced)
 *   - sectioned list (Recents, Actions, Navigation)
 *   - item rows with icon + name + caption (shortcut hint)
 *   - keyboard nav with Enter to select, Escape to close
 *   - persisted "recents" via storage
 */

import {
	BodyKind,
	DimmerMode,
	FilterShowWhen,
	Horizontal,
	PanelKind,
	RowKind,
	SourceKind,
	Vertical,
	defineMenu,
} from '@react-fancy-menus/core';
import {
	ArrowRight,
	ClockCounterClockwise,
	FileText,
	FolderOpen,
	Gear,
	GitBranch,
	Keyboard,
	MagnifyingGlass,
	SquaresFour,
	Sun,
	Trash,
} from '@phosphor-icons/react';

interface CommandItem {
	id: string;
	name: string;
	shortcut?: string;
	icon?: any;
	isSection?: boolean;
	group?: string;
}

const COMMANDS: CommandItem[] = [
	{ id: 'recents', name: 'Recent', isSection: true },
	{ id: 'open-readme', name: 'Open README.md', icon: FileText, shortcut: '↵', group: 'recents' },
	{ id: 'open-pkg', name: 'Open package.json', icon: FileText, shortcut: '↵', group: 'recents' },

	{ id: 'actions', name: 'Actions', isSection: true },
	{ id: 'new-file', name: 'New File', icon: FileText, shortcut: '⌘N', group: 'actions' },
	{ id: 'new-folder', name: 'New Folder', icon: FolderOpen, shortcut: '⌘⇧N', group: 'actions' },
	{ id: 'toggle-theme', name: 'Toggle theme', icon: Sun, shortcut: '⌘⇧L', group: 'actions' },
	{ id: 'clear-cache', name: 'Clear cache', icon: Trash, shortcut: '', group: 'actions' },

	{ id: 'nav', name: 'Navigation', isSection: true },
	{
		id: 'go-dashboard',
		name: 'Go to Dashboard',
		icon: SquaresFour,
		shortcut: '⌘1',
		group: 'nav',
	},
	{ id: 'go-branches', name: 'Go to Branches', icon: GitBranch, shortcut: '⌘2', group: 'nav' },
	{ id: 'go-history', name: 'Go to History', icon: ClockCounterClockwise, shortcut: '⌘3', group: 'nav' },
	{ id: 'go-settings', name: 'Go to Settings', icon: Gear, shortcut: '⌘,', group: 'nav' },
	{ id: 'go-shortcuts', name: 'Keyboard shortcuts', icon: Keyboard, shortcut: '⌘/', group: 'nav' },
];

export const commandPalette = defineMenu<{ recents: string[] }, string, CommandItem>({
	id: 'commandPalette',
	description: 'A Cmd-K style searchable command palette.',
	position: { width: 560, vertical: Vertical.Bottom, horizontal: Horizontal.Center },
	chrome: {
		filter: {
			placeholder: 'Type a command or search…',
			icon: { icon: MagnifyingGlass, size: 16 },
			focusOnMount: true,
			debounceMs: 100,
			showWhen: FilterShowWhen.Always,
		},
		dimmer: DimmerMode.Default,
	},
	body: {
		kind: BodyKind.List,
		source: { kind: SourceKind.Static, items: COMMANDS },
		rows: [
			{
				kind: RowKind.Section,
				match: (it) => Boolean(it.isSection),
				name: (it) => it.name,
			},
			{
				kind: RowKind.Item,
				name: (it) => it.name,
				icon: (it) => (it.icon ? { icon: it.icon, size: 16 } : undefined),
				caption: (it) => it.shortcut ?? '',
				onClick: (item, _e, ctx) => {
					const recents = ctx.storage.get<string[]>('recents') ?? [];
					ctx.storage.set('recents', [item.id, ...recents.filter((id) => id !== item.id)].slice(0, 5));
					ctx.close();
				},
			},
		],
		virtualized: { rowHeight: (it) => (it.isSection ? 28 : 36) },
		emptyState: {
			kind: PanelKind.EmptyState,
			icon: { icon: MagnifyingGlass, size: 24 },
			title: 'No matches',
			message: 'Try a different search term.',
		},
	},
	keyboard: {
		defaults: {
			closeOnEscape: true,
			selectOnEnter: true,
			selectOnTab: false,
			cycleWrap: true,
		},
	},
	storage: { fields: ['recents'] },
});
