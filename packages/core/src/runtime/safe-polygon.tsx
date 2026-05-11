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
	/** Element that opened the sub-menu — measured each recompute so the
	 *  polygon tracks scroll / layout shifts. Falls back to `triggerRect`
	 *  when the element isn't known. */
	triggerEl?: Element | null;
	triggerRect: DOMRect | undefined;
	floatingEl: HTMLElement | null;
}

export function SafePolygon({ triggerEl, triggerRect, floatingEl }: Props) {
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
			// Prefer measuring the live element so the polygon follows
			// scroll / layout changes; fall back to the captured rect.
			const t = triggerEl?.getBoundingClientRect() ?? triggerRect;
			const f = floatingEl.getBoundingClientRect();
			// Re-bind names so the math below reads off `t` (the live rect).
			const triggerLive = t;
			// Decide which side of the trigger the floating sits on. We use
			// the horizontal midpoint — most cascading menus open to the
			// right, but mirror cleanly when shifted left by the runtime.
			const onRight = f.left >= triggerLive.right - 4;

			let left: number;
			let top: number;
			let width: number;
			let height: number;
			let clipPath: string;
			if (onRight) {
				left = triggerLive.right;
				top = Math.min(triggerLive.top, f.top);
				width = Math.max(0, f.left - triggerLive.right);
				height = Math.max(triggerLive.bottom, f.bottom) - top;
				const tt = triggerLive.top - top;
				const tb = triggerLive.bottom - top;
				const ft = f.top - top;
				const fb = f.bottom - top;
				clipPath = `polygon(0 ${tt}px, 0 ${tb}px, 100% ${fb}px, 100% ${ft}px)`;
			} else {
				left = f.right;
				top = Math.min(triggerLive.top, f.top);
				width = Math.max(0, triggerLive.left - f.right);
				height = Math.max(triggerLive.bottom, f.bottom) - top;
				const tt = triggerLive.top - top;
				const tb = triggerLive.bottom - top;
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
	}, [triggerEl, triggerRect, floatingEl]);

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
