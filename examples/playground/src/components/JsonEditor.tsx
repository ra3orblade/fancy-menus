/**
 * JsonEditor — editable JSON view of the menu's editable fields.
 *
 * The full MenuConfig contains React components and callbacks that can't
 * round-trip through JSON. So we only round-trip the editor's writable
 * surface (MenuEdits): editing the JSON updates the same state the form
 * controls update.
 *
 * The full read-only view (function bodies serialized as `ƒ name()`
 * placeholders) lives in the "Snapshot" tab.
 */

import type { MenuEdits } from '@/lib/edit';
import { CircleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface JsonEditorProps {
	value: MenuEdits;
	onChange: (next: MenuEdits) => void;
}

export function JsonEditor({ value, onChange }: JsonEditorProps) {
	const [text, setText] = useState(() => JSON.stringify(value, null, 2));
	const [error, setError] = useState<string | null>(null);
	// Reset the buffer when the underlying edits change from elsewhere (form
	// controls, reset button) — but only when the parsed text differs to avoid
	// overwriting the user's in-flight typing.
	const lastParsed = useRef<string>(JSON.stringify(value));
	useEffect(() => {
		const incoming = JSON.stringify(value);
		if (incoming !== lastParsed.current) {
			setText(JSON.stringify(value, null, 2));
			setError(null);
			lastParsed.current = incoming;
		}
	}, [value]);

	const handleChange = (next: string) => {
		setText(next);
		try {
			const parsed = JSON.parse(next) as MenuEdits;
			lastParsed.current = JSON.stringify(parsed);
			setError(null);
			onChange(parsed);
		} catch (e) {
			setError((e as Error).message);
		}
	};

	return (
		<div className="flex h-full flex-col">
			<textarea
				spellCheck={false}
				value={text}
				onChange={(e) => handleChange(e.target.value)}
				className="flex-1 resize-none border-0 bg-background p-4 font-mono text-xs leading-relaxed outline-none focus:ring-0"
				style={{ tabSize: 2 }}
			/>
			{error && (
				<div className="flex items-start gap-2 border-t border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
					<CircleAlert className="size-3.5 shrink-0" />
					<span className="font-mono">{error}</span>
				</div>
			)}
		</div>
	);
}
