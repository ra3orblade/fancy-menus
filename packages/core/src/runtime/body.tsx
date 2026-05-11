/**
 * Body dispatcher — picks the right view per BodyKind.
 */

import type { BodyConfig } from '../types/body';
import type { MenuCtx } from '../types/context';
import { BodyKind } from '../types/enums';
import { FormBodyView } from './form-body';
import { GridBodyView } from './grid-body';
import { ListBodyView } from './list-body';
import { PanelView } from './panels';

interface Props {
	body: BodyConfig<any, any, any>;
	ctx: MenuCtx;
	filter: string;
	onCloseRequest: () => void;
	/** True when this body lives inside a sub-menu (`open.param.parentId` set). */
	isSubMenu?: boolean;
}

export function BodyView({ body, ctx, filter, onCloseRequest, isSubMenu }: Props) {
	switch (body.kind) {
		case BodyKind.List:
			return (
				<ListBodyView
					body={body}
					ctx={ctx}
					filter={filter}
					onCloseRequest={onCloseRequest}
					isSubMenu={isSubMenu}
				/>
			);
		case BodyKind.Grid:
			return <GridBodyView body={body} ctx={ctx} filter={filter} onCloseRequest={onCloseRequest} />;
		case BodyKind.Form:
			return <FormBodyView body={body} ctx={ctx} />;
		case BodyKind.Custom:
			return <>{(body as any).render(ctx)}</>;
		case BodyKind.Composed:
			return (
				<ComposedBodyView
					body={body}
					ctx={ctx}
					filter={filter}
					onCloseRequest={onCloseRequest}
					isSubMenu={isSubMenu}
				/>
			);
	}
}

function ComposedBodyView({ body, ctx, filter, onCloseRequest, isSubMenu }: Props) {
	const composed = body as any;
	return (
		<div className="fm-composed flex flex-col" style={{ gap: composed.gap ?? 0 }}>
			{composed.sections.map((section: any) => {
				const key = section.id;
				// Body kinds (list/grid/form/custom) recurse; otherwise it's a panel.
				if (
					section.kind === BodyKind.List ||
					section.kind === BodyKind.Grid ||
					section.kind === BodyKind.Form ||
					section.kind === BodyKind.Custom
				) {
					return (
						<div key={key}>
							<BodyView
								body={section}
								ctx={ctx}
								filter={filter}
								onCloseRequest={onCloseRequest}
								isSubMenu={isSubMenu}
							/>
						</div>
					);
				}
				return (
					<div key={key}>
						<PanelView spec={section} ctx={ctx} />
					</div>
				);
			})}
		</div>
	);
}
