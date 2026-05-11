/**
 * Safe-mouse polygon — when a sub-menu is open, this component renders a
 * fixed-position overlay between the triggering row's right edge and the
 * child menu's left edge. The overlay is clipped to a quad covering the
 * diagonal travel area, so the cursor can move from parent → child without
 * exiting and dismissing the child.
 *
 * The polygon itself swallows pointer events (via pointer-events: auto) so
 * that any close-on-mouseleave logic on the parent doesn't fire while the
 * cursor crosses the gap.
 */

import { useLayoutEffect, useRef, useState } from 'react';

interface Props {
	triggerRect: DOMRect | undefined;
	floatingEl: HTMLElement | null;
}

export function SafePolygon({ triggerRect, floatingEl }: Props) {
	const [shape, setShape] = useState<{
		left: number;
		top: number;
		width: number;
		height: number;
		clipPath: string;
	} | null>(null);
	const raf = useRef<number | null>(null);

	useLayoutEffect(() => {
		if (!triggerRect || !floatingEl) return;
		const recompute = () => {
			const f = floatingEl.getBoundingClientRect();
			// Decide which side of the trigger the floating sits on. We use
			// the horizontal midpoint — most cascading menus open to the
			// right, but mirror cleanly when shifted left by the runtime.
			const onRight = f.left >= triggerRect.right - 4;

			let left: number;
			let top: number;
			let width: number;
			let height: number;
			let clipPath: string;
			if (onRight) {
				left = triggerRect.right;
				top = Math.min(triggerRect.top, f.top);
				width = Math.max(0, f.left - triggerRect.right);
				height = Math.max(triggerRect.bottom, f.bottom) - top;
				const tt = triggerRect.top - top;
				const tb = triggerRect.bottom - top;
				const ft = f.top - top;
				const fb = f.bottom - top;
				clipPath = `polygon(0 ${tt}px, 0 ${tb}px, 100% ${fb}px, 100% ${ft}px)`;
			} else {
				left = f.right;
				top = Math.min(triggerRect.top, f.top);
				width = Math.max(0, triggerRect.left - f.right);
				height = Math.max(triggerRect.bottom, f.bottom) - top;
				const tt = triggerRect.top - top;
				const tb = triggerRect.bottom - top;
				const ft = f.top - top;
				const fb = f.bottom - top;
				clipPath = `polygon(100% ${tt}px, 100% ${tb}px, 0 ${fb}px, 0 ${ft}px)`;
			}
			setShape({ left, top, width, height, clipPath });
		};

		recompute();
		const onResize = () => {
			if (raf.current) cancelAnimationFrame(raf.current);
			raf.current = requestAnimationFrame(recompute);
		};
		window.addEventListener('resize', onResize);
		window.addEventListener('scroll', onResize, true);
		return () => {
			window.removeEventListener('resize', onResize);
			window.removeEventListener('scroll', onResize, true);
			if (raf.current) cancelAnimationFrame(raf.current);
		};
	}, [triggerRect, floatingEl]);

	if (!shape || shape.width <= 0 || shape.height <= 0) return null;

	return (
		<div
			data-fm-safe-polygon
			aria-hidden
			style={{
				position: 'fixed',
				left: shape.left,
				top: shape.top,
				width: shape.width,
				height: shape.height,
				clipPath: shape.clipPath,
				zIndex: 'var(--fm-z-menu)' as unknown as number,
				pointerEvents: 'auto',
				// Visible only in the playground when devtools query for it.
				background: 'transparent',
			}}
		/>
	);
}
