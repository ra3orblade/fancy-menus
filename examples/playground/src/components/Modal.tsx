import { cn } from '@/lib/utils';
import { X } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
	open: boolean;
	onClose: () => void;
	title?: string;
	children: React.ReactNode;
	/** Pixel width. Default 720. */
	width?: number;
	/** Any valid CSS height (e.g. '80vh', '600px'). Default '80vh'. */
	height?: string;
	className?: string;
}

export function Modal({ open, onClose, title, children, width = 720, height = '80vh', className }: ModalProps) {
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [open, onClose]);

	if (!open) return null;

	return createPortal(
		<div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
			<div aria-hidden onClick={onClose} className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
			<div
				role="dialog"
				aria-label={title}
				className={cn(
					'relative flex flex-col overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-2xl',
					className
				)}
				style={{ width, height, maxHeight: '90vh' }}
			>
				{title && (
					<header className="flex items-center justify-between border-b border-border px-4 py-3">
						<h3 className="text-sm font-semibold">{title}</h3>
						<button
							type="button"
							onClick={onClose}
							aria-label="Close"
							className="text-muted-foreground hover:text-foreground"
						>
							<X className="size-4" />
						</button>
					</header>
				)}
				<div className="flex flex-1 flex-col overflow-hidden">{children}</div>
			</div>
		</div>,
		document.body
	);
}
