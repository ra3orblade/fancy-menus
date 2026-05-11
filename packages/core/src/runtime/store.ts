/**
 * MenuStore — manages the open stack of menus.
 *
 * Lightweight reducer with subscribe semantics; no MobX dependency.
 * The provider holds one store instance and exposes it through context.
 *
 * Each open menu carries a transition state (Opening / Open / Closing)
 * so the host app can observe and coordinate with it via the
 * `useMenuState`, `useIsAnyMenuOpen`, `useIsAnyMenuTransitioning` hooks.
 *
 * `close()` does not remove the menu immediately — it sets state to
 * Closing and schedules removal after the configured close-animation
 * duration so the exit animation has time to play.
 */

import type { MenuConfig } from '../types';
import type { OpenParam } from '../types/context';
import { MenuState } from '../types/enums';

export interface OpenMenu {
	id: string;
	config: MenuConfig<any, any, any>;
	param: OpenParam;
	/** Stack depth — root menu is 0. */
	depth: number;
	/** Lifecycle state — drives mount, animation classes, focus return. */
	state: MenuState;
	/**
	 * Replace-paged navigation history. When `navigateTo(newId)` is called
	 * inside a menu, the current menu is pushed onto this stack and the
	 * new menu takes its slot (same parent / depth). `back()` pops it.
	 * The popped entry's `param.data` is preserved so consumers can
	 * round-trip state across navigation.
	 */
	history?: HistoryEntry[];
}

interface HistoryEntry {
	id: string;
	config: MenuConfig<any, any, any>;
	param: OpenParam;
}

type Listener = () => void;

/**
 * Animation timings — must stay in sync with the keyframe durations in
 * runtime.css. Keep these short: longer transitions feel laggy.
 */
const OPEN_DURATION_MS = 120;
const CLOSE_DURATION_MS = 90;

export class MenuStore {
	private menus: OpenMenu[] = [];
	private listeners = new Set<Listener>();
	private registry = new Map<string, MenuConfig<any, any, any>>();
	/** Per-menu setTimeout handles for opening → open and closing → removed. */
	private timers = new Map<string, number>();

	register(config: MenuConfig<any, any, any>) {
		this.registry.set(config.id, config);
	}

	registerMany(configs: MenuConfig<any, any, any>[]) {
		for (const c of configs) this.register(c);
	}

	getConfig(id: string): MenuConfig<any, any, any> | undefined {
		return this.registry.get(id);
	}

	getAll(): readonly OpenMenu[] {
		return this.menus;
	}

	/** Returns whichever lifecycle state the menu is in (Closed when absent). */
	getState(id: string): MenuState {
		return this.menus.find((m) => m.id === id)?.state ?? MenuState.Closed;
	}

	/** True if any menu is in Opening or Closing state. */
	isAnyTransitioning(): boolean {
		return this.menus.some((m) => m.state !== MenuState.Open);
	}

	isOpen(id?: string): boolean {
		if (id == null) return this.menus.some((m) => m.state !== MenuState.Closing);
		return this.menus.some((m) => m.id === id && m.state !== MenuState.Closing);
	}

	open(id: string, param: OpenParam = {}): void {
		const config = this.registry.get(id);
		if (!config) {
			console.warn(`[fancy-menus] No menu registered with id "${id}"`);
			return;
		}
		// If a menu with this id is mid-close, cancel the removal timer and
		// reuse it (avoids an open → flicker → reopen flash).
		const closingTimer = this.timers.get(`close:${id}`);
		if (closingTimer) {
			window.clearTimeout(closingTimer);
			this.timers.delete(`close:${id}`);
		}

		const existing = this.menus.findIndex((m) => m.id === id);
		if (existing >= 0) {
			const next = this.menus.slice();
			next[existing] = {
				...next[existing]!,
				param: { ...next[existing]!.param, ...param },
				state: next[existing]!.state === MenuState.Closing ? MenuState.Open : next[existing]!.state,
			};
			this.menus = next;
			this.emit();
			return;
		}

		// Cascading menus replace — opening a new sub-menu under a given
		// parent first closes any existing sibling (and its descendants), so
		// hovering across rows in a cascading list swaps the visible child
		// instead of stacking unrelated menus on top of each other.
		let working = this.menus;
		if (param.parentId) {
			const siblingIds = new Set<string>();
			for (const m of working) {
				if (m.param.parentId === param.parentId && m.id !== id) {
					siblingIds.add(m.id);
				}
			}
			if (siblingIds.size) {
				let grew = true;
				while (grew) {
					grew = false;
					for (const m of working) {
						if (m.param.parentId && siblingIds.has(m.param.parentId) && !siblingIds.has(m.id)) {
							siblingIds.add(m.id);
							grew = true;
						}
					}
				}
				working = working.filter((m) => !siblingIds.has(m.id));
				// Cancel any pending removal timers for siblings we just dropped.
				for (const sid of siblingIds) {
					const t = this.timers.get(`close:${sid}`);
					if (t) {
						window.clearTimeout(t);
						this.timers.delete(`close:${sid}`);
					}
				}
			}
		}

		this.menus = [
			...working,
			{
				id,
				config,
				param,
				depth: param.parentId ? (working.find((m) => m.id === param.parentId)?.depth ?? 0) + 1 : working.length,
				state: MenuState.Opening,
			},
		];
		this.emit();

		// After the open animation, flip Opening → Open. Tracked so a
		// subsequent close() call within the open window can clear it.
		const t = window.setTimeout(() => {
			this.timers.delete(`open:${id}`);
			const i = this.menus.findIndex((m) => m.id === id);
			if (i < 0) return;
			if (this.menus[i]!.state !== MenuState.Opening) return;
			const next = this.menus.slice();
			next[i] = { ...next[i]!, state: MenuState.Open };
			this.menus = next;
			this.emit();
		}, OPEN_DURATION_MS);
		this.timers.set(`open:${id}`, t);
	}

	close(id?: string): void {
		const targetId = id ?? this.menus.at(-1)?.id;
		if (!targetId) return;

		// Build the cascade-close set — the target plus every descendant.
		const toClose = new Set<string>([targetId]);
		let grew = true;
		while (grew) {
			grew = false;
			for (const m of this.menus) {
				if (m.param.parentId && toClose.has(m.param.parentId) && !toClose.has(m.id)) {
					toClose.add(m.id);
					grew = true;
				}
			}
		}

		// Mark each as Closing, cancel their open-timer, and schedule removal.
		const next = this.menus.slice();
		let mutated = false;
		for (let i = 0; i < next.length; i++) {
			if (!toClose.has(next[i]!.id)) continue;
			if (next[i]!.state === MenuState.Closing) continue;
			next[i] = { ...next[i]!, state: MenuState.Closing };
			mutated = true;
			const cid = next[i]!.id;
			const openTimer = this.timers.get(`open:${cid}`);
			if (openTimer) {
				window.clearTimeout(openTimer);
				this.timers.delete(`open:${cid}`);
			}
			const t = window.setTimeout(() => {
				this.timers.delete(`close:${cid}`);
				this.menus = this.menus.filter((m) => m.id !== cid);
				this.emit();
			}, CLOSE_DURATION_MS);
			this.timers.set(`close:${cid}`, t);
		}
		if (!mutated) return;
		this.menus = next;
		this.emit();
	}

	/**
	 * Close every menu whose parentId matches `parentId` (cascading down).
	 * Useful when hovering away from a row that opened a sub-menu — the
	 * parent UI wants to retire the stale child without closing itself.
	 */
	closeChildren(parentId: string): void {
		const toClose = new Set<string>();
		let grew = true;
		while (grew) {
			grew = false;
			for (const m of this.menus) {
				const isDirectChild = m.param.parentId === parentId;
				const isDescendant = m.param.parentId && toClose.has(m.param.parentId);
				if ((isDirectChild || isDescendant) && !toClose.has(m.id)) {
					toClose.add(m.id);
					grew = true;
				}
			}
		}
		if (toClose.size === 0) return;
		// Re-route through close() so the same exit-animation path runs.
		for (const cid of toClose) this.close(cid);
	}

	closeAll(group?: string): void {
		const targets =
			group == null
				? this.menus.map((m) => m.id)
				: this.menus.filter((m) => m.config.group === group).map((m) => m.id);
		for (const id of targets) this.close(id);
	}

	/**
	 * Replace-paged navigation: swaps the menu at `currentId` for `newId`
	 * in-place. The current OpenMenu (id, config, param) is pushed onto a
	 * history stack carried over to the new one — `back(newId)` restores it
	 * with `param.data` intact so consumers can round-trip form state.
	 *
	 * Use this when one menu visually transitions into another inside the
	 * same shell (settings page → detail page). `withBack: true` in chrome
	 * surfaces the back arrow; the runtime auto-wires it to `back()`.
	 */
	navigateTo(currentId: string, newId: string, param: OpenParam = {}): void {
		const i = this.menus.findIndex((m) => m.id === currentId);
		if (i < 0) return;
		const newConfig = this.registry.get(newId);
		if (!newConfig) {
			console.warn(`[fancy-menus] No menu registered with id "${newId}"`);
			return;
		}
		const cur = this.menus[i]!;
		const history: HistoryEntry[] = [...(cur.history ?? []), { id: cur.id, config: cur.config, param: cur.param }];
		const next = this.menus.slice();
		next[i] = {
			id: newId,
			config: newConfig,
			// Inherit parentId / element / triggerRect from the predecessor so
			// positioning still tracks the original anchor.
			param: { ...cur.param, ...param, parentId: cur.param.parentId },
			depth: cur.depth,
			state: MenuState.Opening,
			history,
		};
		this.menus = next;
		this.emit();

		const t = window.setTimeout(() => {
			this.timers.delete(`open:${newId}`);
			const idx = this.menus.findIndex((m) => m.id === newId);
			if (idx < 0) return;
			if (this.menus[idx]!.state !== MenuState.Opening) return;
			const n = this.menus.slice();
			n[idx] = { ...n[idx]!, state: MenuState.Open };
			this.menus = n;
			this.emit();
		}, OPEN_DURATION_MS);
		this.timers.set(`open:${newId}`, t);
	}

	/** True when the menu at `id` has at least one history entry to pop. */
	canGoBack(id: string): boolean {
		const m = this.menus.find((m) => m.id === id);
		return Boolean(m?.history && m.history.length > 0);
	}

	/**
	 * Undo a `navigateTo` — pops the history stack and restores the previous
	 * menu in this slot, with its preserved `param.data`. No-op if no
	 * history is available.
	 */
	back(id: string): void {
		const i = this.menus.findIndex((m) => m.id === id);
		if (i < 0) return;
		const cur = this.menus[i]!;
		const history = cur.history ?? [];
		if (history.length === 0) return;
		const prev = history[history.length - 1]!;
		const newHistory = history.slice(0, -1);
		const next = this.menus.slice();
		next[i] = {
			id: prev.id,
			config: prev.config,
			param: prev.param,
			depth: cur.depth,
			state: MenuState.Opening,
			history: newHistory.length ? newHistory : undefined,
		};
		this.menus = next;
		this.emit();

		const t = window.setTimeout(() => {
			this.timers.delete(`open:${prev.id}`);
			const idx = this.menus.findIndex((m) => m.id === prev.id);
			if (idx < 0) return;
			if (this.menus[idx]!.state !== MenuState.Opening) return;
			const n = this.menus.slice();
			n[idx] = { ...n[idx]!, state: MenuState.Open };
			this.menus = n;
			this.emit();
		}, OPEN_DURATION_MS);
		this.timers.set(`open:${prev.id}`, t);
	}

	update(id: string, patch: Partial<OpenParam>): void {
		const i = this.menus.findIndex((m) => m.id === id);
		if (i < 0) return;
		const next = this.menus.slice();
		next[i] = { ...next[i]!, param: { ...next[i]!.param, ...patch } };
		this.menus = next;
		this.emit();
	}

	updateData(id: string, patch: any): void {
		const i = this.menus.findIndex((m) => m.id === id);
		if (i < 0) return;
		const next = this.menus.slice();
		const prev = next[i]!;
		next[i] = {
			...prev,
			param: { ...prev.param, data: { ...(prev.param.data ?? {}), ...patch } },
		};
		this.menus = next;
		this.emit();
	}

	subscribe(listener: Listener): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	/** Clean up pending timers — call when the provider unmounts. */
	dispose(): void {
		for (const t of this.timers.values()) window.clearTimeout(t);
		this.timers.clear();
		this.listeners.clear();
	}

	private emit(): void {
		for (const l of this.listeners) l();
	}
}
