import { cn } from '@/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';

const toggleVariants = cva(
	'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 gap-2',
	{
		variants: {
			variant: {
				default: 'bg-transparent',
				outline: 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
			},
			size: {
				default: 'h-9 px-3',
				sm: 'h-8 px-2',
				lg: 'h-10 px-3',
			},
		},
		defaultVariants: { variant: 'default', size: 'default' },
	}
);

export interface ToggleProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof toggleVariants> {
	pressed?: boolean;
	onPressedChange?: (pressed: boolean) => void;
}

export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
	({ className, variant, size, pressed, onPressedChange, onClick, ...props }, ref) => (
		<button
			ref={ref}
			type="button"
			data-state={pressed ? 'on' : 'off'}
			aria-pressed={pressed}
			onClick={(e) => {
				onPressedChange?.(!pressed);
				onClick?.(e);
			}}
			className={cn(toggleVariants({ variant, size, className }))}
			{...props}
		/>
	)
);
Toggle.displayName = 'Toggle';

export { toggleVariants };
