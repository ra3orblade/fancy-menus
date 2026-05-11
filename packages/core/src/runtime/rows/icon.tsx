import type { CSSProperties } from 'react';
import type { IconParam } from '../../types/primitives';

export function IconView({ icon, defaultSize = 16 }: { icon?: IconParam; defaultSize?: number }) {
	if (!icon) return null;
	if (typeof icon.icon === 'string') {
		// Registry-resolved name — for the foundation we just render a placeholder
		// glyph and let consumers wire iconRegistry through ProviderOptions later.
		return (
			<span aria-hidden className={icon.className}>
				{icon.icon}
			</span>
		);
	}
	const Cmp = icon.icon;
	const style: CSSProperties = {};
	if (icon.color) style.color = icon.color;
	return (
		<Cmp
			size={icon.size ?? defaultSize}
			strokeWidth={icon.strokeWidth}
			className={icon.className}
			style={style}
			aria-label={icon['aria-label']}
		/>
	);
}
