import clsx from 'clsx';
import type { SectionHeaderRow } from '../../types/row';
import type { RowRenderProps } from './index';
import { renderRenderable } from './util';

export function SectionRowView<TItem>({ item, spec }: RowRenderProps<TItem>) {
	const s = spec as SectionHeaderRow<TItem>;
	return (
		<div role="presentation" className={clsx('fm-section', s.className)}>
			{renderRenderable(s.name, item)}
		</div>
	);
}
