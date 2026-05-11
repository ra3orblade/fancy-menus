/**
 * Image picker — three-tab media insertion.
 *
 * Exercises:
 *   - chrome.tabs (per-tab body)
 *   - composed body (search + grid)
 *   - grid body with async pagination
 *   - file drop zone with paste-from-clipboard
 *   - form body (paste a URL)
 */

import {
	BodyKind,
	DimmerMode,
	FieldKind,
	GridColumns,
	Horizontal,
	KeyboardNavigation,
	PanelKind,
	SourceKind,
	Vertical,
	defineMenu,
} from '@fancy-menus/core';
import { Image as ImageIcon, Link, Upload } from 'lucide-react';

interface ImagePickerData {
	onSelectUrl: (url: string) => void;
	onUploadFiles: (files: File[]) => Promise<void>;
}

interface LibraryItem {
	id: string;
	url: string;
	alt: string;
	author?: string;
}

export const mediaPicker = defineMenu<ImagePickerData, string>({
	id: 'mediaPicker',
	description: 'Three-tab image picker: library, upload, paste URL.',
	position: { width: 360, height: 420, vertical: Vertical.Bottom, horizontal: Horizontal.Left },
	chrome: {
		title: 'Insert image',
		dimmer: DimmerMode.Default,
		tabs: {
			initialTab: 'library',
			persist: true,
			tabs: [
				{
					id: 'library',
					label: 'Library',
					icon: { icon: ImageIcon, size: 14 },
					body: {
						kind: BodyKind.Composed,
						sections: [
							{
								id: 'search',
								kind: PanelKind.SearchInput,
								placeholder: 'Search the library…',
								focusOnMount: true,
								debounceMs: 150,
								onChange: () => {},
							},
							{
								id: 'grid',
								kind: BodyKind.Grid,
								source: {
									kind: SourceKind.Async,
									pageSize: 24,
									fetch: async ({ offset, limit, filter }) => {
										// Demo data — replace with a real fetcher.
										const items: LibraryItem[] = Array.from({ length: limit }, (_, i) => ({
											id: `${offset + i}`,
											url: `https://picsum.photos/seed/${offset + i}/120/120`,
											alt: filter ?? 'image',
										}));
										return { items, hasMore: true };
									},
								},
								columns: 3,
								rowHeight: 96,
								virtualized: true,
								renderCell: (item: LibraryItem) => (
									<img
										src={item.url}
										alt={item.alt}
										loading="lazy"
										className="size-full rounded-md object-cover"
									/>
								),
								onCellClick: (item, ctx) => {
									ctx.data.onSelectUrl(item.url);
									ctx.close();
								},
								emptyState: { kind: PanelKind.EmptyState, message: 'Nothing here yet.' },
								loading: { kind: PanelKind.Loader, overlay: false },
							},
						],
					},
				},
				{
					id: 'upload',
					label: 'Upload',
					icon: { icon: Upload, size: 14 },
					body: {
						kind: BodyKind.Composed,
						sections: [
							{
								id: 'drop',
								kind: PanelKind.FileDropZone,
								accept: 'image/*',
								multiple: true,
								label: 'Drop images here, or click to browse',
								icon: { icon: Upload, size: 24 },
								pasteFromClipboard: true,
								onFiles: async (files, ctx) => {
									await ctx.data.onUploadFiles(files);
									ctx.close();
								},
							},
						],
					},
				},
				{
					id: 'url',
					label: 'URL',
					icon: { icon: Link, size: 14 },
					body: {
						kind: BodyKind.Form,
						fields: [
							{
								name: 'url',
								kind: FieldKind.Text,
								label: 'Image URL',
								placeholder: 'https://…',
								type: 'url' as any,
							},
						],
						onSubmit: (values: any, ctx) => {
							if (typeof values.url === 'string' && values.url) {
								ctx.data.onSelectUrl(values.url);
								ctx.close();
							}
						},
						submit: { id: 'insert', label: 'Insert', color: 'accent' as any, onClick: () => {} },
					},
				},
			],
		},
	},
	body: {
		kind: BodyKind.Custom,
		render: () => null,
	},
	keyboard: {
		navigation: KeyboardNavigation.Grid2D,
		defaults: { closeOnEscape: true, selectOnEnter: true, selectOnTab: true },
	},
	storage: { fields: ['activeTab', 'lastQuery'] },
});
