import { Editor } from '@/components/Editor';
import { JsonEditor } from '@/components/JsonEditor';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type MenuEdits, applyEdits, editsFromConfig } from '@/lib/edit';
import { cn } from '@/lib/utils';
import { useMenu, useStore } from '@fancy-menus/core';
import type { MenuConfig } from '@fancy-menus/core';
import { ChevronRight, Code2, FileJson, Github, ScrollText, Settings2, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { exampleIds, examples } from './menus';

function configToJson(value: unknown): string {
	return JSON.stringify(value, replacer, 2);
}

function replacer(_key: string, value: unknown): unknown {
	if (typeof value === 'function') return `ƒ ${(value as Function).name || 'anonymous'}()`;
	if (typeof value === 'symbol') return value.toString();
	if (value && typeof value === 'object' && '$$typeof' in value) return '<ReactComponent>';
	return value;
}

export default function App() {
	const [activeId, setActiveId] = useState<string>(exampleIds[0]!);
	const example = examples[activeId] ?? examples[exampleIds[0]!]!;
	const triggerRef = useRef<HTMLButtonElement | null>(null);
	const menu = useMenu();
	const store = useStore();
	const [modalOpen, setModalOpen] = useState(false);

	const [editsByExample, setEditsByExample] = useState<Record<string, MenuEdits>>({});
	const edits = editsByExample[activeId] ?? editsFromConfig(example.config);

	const editedConfig = useMemo<MenuConfig<any, any, any>>(
		() => applyEdits(example.config, edits),
		[example.config, edits]
	);

	// Re-register on edit so the next open uses the merged config; if a menu is
	// already open, close + reopen to apply the change live.
	useEffect(() => {
		store.register(editedConfig);
		if (menu.isOpen(activeId)) {
			menu.close(activeId);
			requestAnimationFrame(() =>
				menu.open(activeId, { element: triggerRef.current ?? undefined, data: example.sampleData })
			);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [editedConfig, activeId]);

	const handleEdit = (patch: Partial<MenuEdits>) => {
		setEditsByExample((prev) => ({
			...prev,
			[activeId]: { ...(prev[activeId] ?? edits), ...patch },
		}));
	};

	const reset = () =>
		setEditsByExample((prev) => {
			const { [activeId]: _, ...rest } = prev;
			return rest;
		});

	const openMenu = () => menu.open(activeId, { element: triggerRef.current ?? undefined, data: example.sampleData });

	return (
		<div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
			{/* Sidebar */}
			<aside className="flex w-56 shrink-0 flex-col border-r border-border">
				<header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
					<ScrollText className="size-4" />
					<h1 className="text-sm font-semibold tracking-tight">fancy-menus</h1>
					<span className="ml-auto rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
						v0.0.0
					</span>
				</header>
				<ScrollArea className="flex-1">
					<nav className="flex flex-col gap-0.5 p-2">
						{exampleIds.map((id) => (
							<button
								key={id}
								type="button"
								onClick={() => setActiveId(id)}
								className={cn(
									'group flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors',
									id === activeId
										? 'bg-accent text-accent-foreground'
										: 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
								)}
							>
								<span>{id}</span>
								<ChevronRight
									className={cn(
										'size-3 transition-opacity',
										id === activeId ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
									)}
								/>
							</button>
						))}
					</nav>
				</ScrollArea>
				<Separator />
				<footer className="flex items-center justify-between px-4 py-3 text-[11px] text-muted-foreground">
					<span>Edit fields, then Open menu.</span>
					<a
						href="https://github.com/ra3orblade/fancy-menus"
						target="_blank"
						rel="noreferrer"
						aria-label="GitHub"
						className="inline-flex items-center gap-1 hover:text-foreground"
					>
						<Github className="size-3.5" />
						GitHub
					</a>
				</footer>
			</aside>

			{/* Editor */}
			<section className="flex w-72 shrink-0 flex-col border-r border-border">
				<header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
					<div className="min-w-0 flex-1">
						<h2 className="truncate text-sm font-semibold leading-tight">{activeId}</h2>
						<p className="truncate text-[11px] leading-tight text-muted-foreground">
							{example.config.description ?? 'No description.'}
						</p>
					</div>
					<button
						type="button"
						onClick={reset}
						className="shrink-0 text-[11px] text-muted-foreground hover:text-foreground"
					>
						reset
					</button>
				</header>
				<ScrollArea className="flex-1">
					<Editor edits={edits} onChange={handleEdit} />
					<div className="px-4 pb-4">
						<h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
							Schema features
						</h4>
						<ul className="flex flex-wrap gap-1.5">
							{example.exercises.map((feat) => (
								<li
									key={feat}
									className="rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px]"
								>
									{feat}
								</li>
							))}
						</ul>
					</div>
				</ScrollArea>
			</section>

			{/* Preview area — trigger pinned to the top so menus have the
			    entire pane to open downward without clipping. */}
			<main className="relative flex flex-1 flex-col overflow-hidden bg-[radial-gradient(circle_at_center,hsl(var(--muted))_0%,hsl(var(--background))_60%)]">
				<header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-6">
					<h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Preview</h3>
					<div className="flex items-center gap-2">
						<Button ref={triggerRef} variant="default" size="sm" onClick={openMenu}>
							<Sparkles /> Open menu
						</Button>
						<Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>
							<Code2 /> View config
						</Button>
					</div>
				</header>
				<div className="flex flex-1 items-start justify-center pt-12 text-xs text-muted-foreground">
					Click <span className="mx-1 font-medium text-foreground">Open menu</span> to launch
				</div>
			</main>

			{/* Config modal — Edit form, editable JSON, full snapshot, sample data */}
			<Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`${activeId} — config`}>
				<Tabs defaultValue="edit" className="flex min-h-0 flex-1 flex-col overflow-hidden">
					<div className="shrink-0 border-b border-border px-4 py-2">
						<TabsList>
							<TabsTrigger value="edit">
								<Settings2 className="size-3.5" /> Edit
							</TabsTrigger>
							<TabsTrigger value="json">
								<FileJson className="size-3.5" /> JSON
							</TabsTrigger>
							<TabsTrigger value="snapshot">
								<Code2 className="size-3.5" /> Snapshot
							</TabsTrigger>
							<TabsTrigger value="data">Sample data</TabsTrigger>
						</TabsList>
					</div>
					<TabsContent value="edit" className="m-0 min-h-0 flex-1 overflow-auto">
						<Editor edits={edits} onChange={handleEdit} />
					</TabsContent>
					<TabsContent value="json" className="m-0 min-h-0 flex-1 overflow-hidden">
						<JsonEditor
							value={edits}
							onChange={(next) => setEditsByExample((prev) => ({ ...prev, [activeId]: next }))}
						/>
					</TabsContent>
					<TabsContent value="snapshot" className="m-0 min-h-0 flex-1 overflow-auto">
						<pre className="whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed">
							{configToJson(editedConfig)}
						</pre>
					</TabsContent>
					<TabsContent value="data" className="m-0 min-h-0 flex-1 overflow-auto">
						<pre className="whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed">
							{configToJson(example.sampleData)}
						</pre>
					</TabsContent>
				</Tabs>
				<footer className="shrink-0 flex items-center justify-end gap-2 border-t border-border px-4 py-3">
					<Button variant="ghost" size="sm" onClick={reset}>
						Reset edits
					</Button>
					<Button
						size="sm"
						onClick={() => {
							setModalOpen(false);
							openMenu();
						}}
					>
						<Sparkles /> Open with config
					</Button>
				</footer>
			</Modal>
		</div>
	);
}
