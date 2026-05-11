import type { DividerRow } from '../../types/row';
import type { RowRenderProps } from './index';

export function DividerRowView<TItem>({ spec }: RowRenderProps<TItem>) {
	const s = spec as DividerRow<TItem>;
	return <div role="separator" className="fm-divider" style={s.height ? { height: s.height } : undefined} />;
}
