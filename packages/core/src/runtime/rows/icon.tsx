import type { CSSProperties } from 'react';
import type { IconParam } from '../../types/primitives';

export function IconView({ icon, defaultSize = 16 }: { icon?: IconParam; defaultSize?: number }) {
	if (!icon) return null;
	const Cmp = icon.icon;
	const style: CSSProperties = {};
	if (icon.color) style.color = icon.color;
	return (
		<Cmp
			size={icon.size ?? defaultSize}
			weight={icon.weight}
			className={icon.className}
			style={style}
			aria-label={icon['aria-label']}
		/>
	);
}
