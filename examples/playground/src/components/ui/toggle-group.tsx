import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { toggleVariants } from './toggle';

interface ToggleGroupContextValue extends VariantProps<typeof toggleVariants> {
	value: string | undefined;
	onValueChange: (value: string) => void;
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue | null>(null);

export interface ToggleGroupProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
		VariantProps<typeof toggleVariants> {
	value?: string;
	onValueChange?: (value: string) => void;
}

export const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
	({ className, variant, size, value, onValueChange, children, ...props }, ref) => (
		<ToggleGroupContext.Provider value={{ variant, size, value, onValueChange: onValueChange ?? (() => {}) }}>
			<div
				ref={ref}
				role="group"
				className={cn('flex flex-wrap items-center justify-start gap-1', className)}
				{...props}
			>
				{children}
			</div>
		</ToggleGroupContext.Provider>
	)
);
ToggleGroup.displayName = 'ToggleGroup';

export interface ToggleGroupItemProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof toggleVariants> {
	value: string;
}

export const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
	({ className, variant, size, value, onClick, children, ...props }, ref) => {
		const ctx = React.useContext(ToggleGroupContext);
		const isPressed = ctx?.value === value;
		return (
			<button
				ref={ref}
				type="button"
				data-state={isPressed ? 'on' : 'off'}
				aria-pressed={isPressed}
				onClick={(e) => {
					ctx?.onValueChange(value);
					onClick?.(e);
				}}
				className={cn(toggleVariants({ variant: variant ?? ctx?.variant, size: size ?? ctx?.size }), className)}
				{...props}
			>
				{children}
			</button>
		);
	}
);
ToggleGroupItem.displayName = 'ToggleGroupItem';
