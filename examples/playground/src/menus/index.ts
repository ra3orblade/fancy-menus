/**
 * Registry of all example menu configs the playground demonstrates.
 *
 * Each entry combines:
 *   - the MenuConfig itself (the declarative spec)
 *   - sample `data` to drive the live preview
 *   - a short blurb explaining which schema features the example exercises
 */

import type { MenuConfig } from '@fancy-menus/core';
import { assigneePicker } from './assigneePicker.config';
import {
	cascadingExport,
	cascadingFormat,
	cascadingMenu,
	cascadingMoveTo,
	cascadingTextStyle,
} from './cascadingMenu.config';
import { colorPickerShadcn } from './colorPickerShadcn.config';
import { columnVisibility } from './columnVisibility.config';
import { commandPalette } from './commandPalette.config';
import { datePicker } from './datePicker.config';
import { findInPage } from './findInPage.config';
import { layoutPicker } from './layoutPicker.config';
import { mediaPicker } from './mediaPicker.config';
import { queryBuilder } from './queryBuilder.config';
import { pagedDetail, pagedSubDetail, replacePagedNav } from './replacePagedNav.config';
import { settingsAppearance, settingsShortcuts, settingsWizard } from './settingsWizard.config';
import { shareMenu } from './shareMenu.config';
import { textFormatter } from './textFormatter.config';
import { themeColorPicker } from './themeColorPicker.config';

export interface MenuExample {
	config: MenuConfig<any, any, any>;
	exercises: string[];
	sampleData?: unknown;
}

export const examples: Record<string, MenuExample> = {
	commandPalette: {
		config: commandPalette,
		exercises: ['filter input', 'sectioned list', 'item rows', 'persisted recents', 'keyboard nav'],
		sampleData: { recents: [] },
	},
	themeColorPicker: {
		config: themeColorPicker,
		exercises: ['section list', 'color swatch rows', 'native palette pattern'],
		sampleData: { current: { text: undefined, bg: undefined }, onSelect: () => {} },
	},
	colorPickerShadcn: {
		config: colorPickerShadcn,
		exercises: ['kind: custom body', 'shadcn Slider + Input + Button as menu body'],
		sampleData: { initial: '#3366ff', onSelect: () => {} },
	},
	columnVisibility: {
		config: columnVisibility,
		exercises: ['sortable rows (dnd-kit)', 'switch row variant', 'pinned/readonly rows', 'footer button'],
		sampleData: {
			columns: [
				{ id: 'name', name: 'Name', visible: true, pinned: true },
				{ id: 'status', name: 'Status', visible: true },
				{ id: 'owner', name: 'Owner', visible: true },
				{ id: 'priority', name: 'Priority', visible: false },
				{ id: 'created', name: 'Created at', visible: true },
				{ id: 'updated', name: 'Updated at', visible: false },
				{ id: 'tags', name: 'Tags', visible: true },
				{ id: 'effort', name: 'Effort', visible: false },
			],
			onApply: () => {},
		},
	},
	datePicker: {
		config: datePicker,
		exercises: ['composed body', 'monthGrid panel', 'custom action footer'],
		sampleData: { onSelect: () => {}, canClear: true, withToday: true },
	},
	findInPage: {
		config: findInPage,
		exercises: ['searchBar header', 'counter + prev/next + clear', 'no list body'],
		sampleData: { search: () => ({ current: 0, total: 0 }), next: () => {}, prev: () => {} },
	},
	mediaPicker: {
		config: mediaPicker,
		exercises: ['tabs', 'grid body', 'async paginated grid', 'drag-drop upload', 'form body for URL'],
		sampleData: {
			onSelectUrl: () => {},
			onUploadFiles: async () => {},
		},
	},
	queryBuilder: {
		config: queryBuilder,
		exercises: ['queryBuilder panel', 'recursive nested groups', 'operator selector'],
		sampleData: { onChange: () => {} },
	},
	assigneePicker: {
		config: assigneePicker,
		exercises: ['async source', 'infinite scroll', 'participant row', 'multi-select', 'inline invite'],
		sampleData: { selectedIds: [], onChange: () => {}, onInvite: () => {} },
	},
	layoutPicker: {
		config: layoutPicker,
		exercises: ['composed body', 'tile grid', 'dependent form fields', 'switch / select fields'],
		sampleData: { layout: 'list', settings: {}, onChange: () => {} },
	},
	textFormatter: {
		config: textFormatter,
		exercises: ['horizontal list (toolbar)', 'icon-only Item rows', 'tooltip captions', 'opens color sub-menu'],
		sampleData: {
			activeMarks: ['bold'],
			onToggleMark: () => {},
			onOpenLink: () => {},
			onPickColor: () => {},
		},
	},
	settingsWizard: {
		config: settingsWizard,
		exercises: ['multi-page nav', 'arrow rows + child menus', 'fillViewport', 'back button'],
		sampleData: { onCommit: () => {} },
	},
	shareMenu: {
		config: shareMenu,
		exercises: [
			'composed body',
			'banner panel',
			'custom URL bar',
			'form fields',
			'participant list',
			'footer buttons',
		],
		sampleData: {
			url: 'https://example.com/share/abc123',
			recipients: [
				{ id: '1', name: 'Riya Patel', email: 'riya@example.com' },
				{ id: '2', name: 'Marc Dubois', email: 'marc@example.com' },
				{ id: '3', name: 'Léa Costa', email: 'lea@example.com' },
			],
			onCopy: () => {},
			onSubmit: () => {},
		},
	},
	cascadingMenu: {
		config: cascadingMenu,
		exercises: [
			'cascading sub-menus',
			'hover-spawn (200ms)',
			'safe-mouse polygon',
			'ArrowRight opens · ArrowLeft closes child',
			'3 levels deep',
		],
		sampleData: { onSelect: () => {} },
	},
	replacePagedNav: {
		config: replacePagedNav,
		exercises: [
			'ctx.navigateTo / back / canGoBack',
			'replace-paged in-shell navigation',
			'auto back arrow when history exists',
			'param.data round-trips across pages',
			'dynamic chrome.title from ctx.data',
		],
		sampleData: { values: {}, onCommit: () => {} },
	},
};

// Sub-page / cascading-child menus aren't selectable from the sidebar but
// must be registered with the provider so their parents can spawn them.
export const additionalRegistrations: MenuConfig<any, any, any>[] = [
	settingsAppearance,
	settingsShortcuts,
	cascadingFormat,
	cascadingTextStyle,
	cascadingMoveTo,
	cascadingExport,
	pagedDetail,
	pagedSubDetail,
];

export const exampleIds = Object.keys(examples) as Array<keyof typeof examples>;
