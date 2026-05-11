import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FilterConfig } from '../types/chrome';
import { IconView } from './rows/icon';

interface Props {
	config: FilterConfig;
	onChange: (value: string) => void;
}

export function FilterInput({ config, onChange }: Props) {
	const [value, setValue] = useState('');
	const inputRef = useRef<HTMLInputElement | null>(null);
	const debounce = useRef<number | undefined>(undefined);

	useEffect(() => {
		if (config.focusOnMount !== false) inputRef.current?.focus();
	}, [config.focusOnMount]);

	// Clear any pending debounced onChange when the filter unmounts so we
	// don't fire against a stale parent (the menu may have closed).
	useEffect(() => () => window.clearTimeout(debounce.current), []);

	const fire = (v: string) => {
		setValue(v);
		window.clearTimeout(debounce.current);
		debounce.current = window.setTimeout(() => {
			onChange(v);
			config.onChange?.(v);
		}, config.debounceMs ?? 250);
	};

	return (
		<div className="fm-filter flex items-center gap-2 border-b border-border px-3 py-2">
			<span className="text-muted-foreground">
				{config.icon ? <IconView icon={config.icon} defaultSize={14} /> : <Search className="size-3.5" />}
			</span>
			<input
				ref={inputRef}
				value={value}
				placeholder={config.placeholder ?? 'Search…'}
				onChange={(e) => fire(e.target.value)}
				className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
			/>
			{value && (
				<button
					type="button"
					onClick={() => fire('')}
					aria-label="Clear"
					className="text-muted-foreground hover:text-foreground"
				>
					<X className="size-3.5" />
				</button>
			)}
		</div>
	);
}
