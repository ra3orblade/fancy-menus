/**
 * Share menu — composed body mixing several panels.
 *
 * Exercises:
 *   - composed body with banner + custom + form sections
 *   - footer.buttons (Copy / Done)
 *   - mixed-mode UI: link copy + permissions form + recent-recipients list
 */

import {
	BodyKind,
	DimmerMode,
	FieldKind,
	FooterKind,
	Horizontal,
	PanelKind,
	RowKind,
	SourceKind,
	Vertical,
	defineMenu,
} from '@react-fancy-menus/core';
import { Copy, LinkSimple } from '@phosphor-icons/react';

interface ShareMenuData {
	url: string;
	recipients: Array<{ id: string; name: string; email: string }>;
	onCopy: (url: string) => void;
	onSubmit: (values: { audience: string; canEdit: boolean }) => void;
}

export const shareMenu = defineMenu<ShareMenuData, void>({
	id: 'shareMenu',
	description: 'Share dialog: copyable link, audience picker, permission switch, recent recipients.',
	position: {
		width: 380,
		vertical: Vertical.Bottom,
		horizontal: Horizontal.Right,
		fillViewport: true,
	},
	chrome: {
		title: 'Share',
		dimmer: DimmerMode.Default,
		footer: {
			kind: FooterKind.Buttons,
			buttons: [{ id: 'done', label: 'Done', color: 'accent' as any, onClick: () => {} }],
		},
	},
	body: {
		kind: BodyKind.Composed,
		gap: 0,
		sections: [
			{
				id: 'banner',
				kind: PanelKind.Banner,
				icon: { icon: LinkSimple, size: 16 },
				title: 'Anyone with the link can view',
				message: 'Update access below to change who sees this.',
				variant: 'info' as any,
			},
			{
				id: 'urlBar',
				kind: PanelKind.Custom,
				render: (ctx: any) => (
					<div className="flex items-center gap-2 px-3 py-2">
						<input
							readOnly
							value={ctx.data.url}
							onClick={(e) => (e.target as HTMLInputElement).select()}
							className="flex-1 rounded-md border border-[color:var(--fm-surface-border)] bg-transparent px-2 py-1 font-mono text-xs"
						/>
						<button
							type="button"
							onClick={() => ctx.data.onCopy(ctx.data.url)}
							className="inline-flex h-7 items-center gap-1 rounded-md bg-[color:var(--fm-accent)] px-2 text-xs font-medium text-[color:var(--fm-accent-fg)]"
						>
							<Copy className="size-3" /> Copy
						</button>
					</div>
				),
			},
			{
				id: 'permissions',
				kind: BodyKind.Form,
				fields: [
					{
						name: 'audience',
						kind: FieldKind.Select,
						label: 'Audience',
						defaultValue: 'anyone',
						options: [
							{ id: 'anyone', name: 'Anyone with link' },
							{ id: 'workspace', name: 'Members of workspace' },
							{ id: 'restricted', name: 'Specific people only' },
						],
					},
					{ name: 'canEdit', kind: FieldKind.Switch, label: 'Allow editing', defaultValue: false },
				],
				onSubmit: () => {},
				submit: null,
			},
			{
				id: 'recipientsHeader',
				kind: PanelKind.Label,
				text: 'RECENT RECIPIENTS',
			},
			{
				id: 'recipients',
				kind: BodyKind.List,
				source: {
					kind: SourceKind.Prop,
					getItems: (data: ShareMenuData) => data.recipients,
				},
				rows: [
					{
						kind: RowKind.Participant,
						iconRender: (p: any) => (
							<div className="flex size-7 items-center justify-center rounded-full bg-[color:var(--fm-row-active-bg)] text-xs font-medium">
								{String(p.name).slice(0, 2).toUpperCase()}
							</div>
						),
						name: (p: any) => p.name,
						identity: (p: any) => p.email,
						selected: () => false,
						onSelect: () => {},
					},
				],
				virtualized: { rowHeight: 44 },
			},
		],
	},
	keyboard: { defaults: { closeOnEscape: true, cycleWrap: true } },
});
