/**
 * MenuProvider — root context that owns the MenuStore + ProviderOptions
 * and renders the open stack via <MenuStack/>.
 */

import { createContext, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import type { MenuConfig } from '../types';
import type { OpenParam, ProviderOptions } from '../types/context';
import { MenuState } from '../types/enums';
import { MenuStack } from './menu-stack';
import { LocalStorageAdapter } from './storage';
import { MenuStore, type OpenMenu } from './store';

interface ProviderContextValue {
	store: MenuStore;
	options: ProviderOptions;
}

const ProviderContext = createContext<ProviderContextValue | null>(null);

export interface MenuProviderProps {
	/** Pre-register menu configs so they're openable by id. */
	menus?: ReadonlyArray<MenuConfig<any, any, any>>;
	/** Provider-wide options (theme, storage, locale, analytics, …). */
	options?: ProviderOptions;
	/** Optional pre-built store (otherwise the provider creates one). */
	store?: MenuStore;
	children: ReactNode;
}

export function MenuProvider({ menus, options, store: externalStore, children }: MenuProviderProps) {
	const storeRef = useRef<MenuStore | null>(null);
	if (storeRef.current == null) {
		storeRef.current = externalStore ?? new MenuStore();
	}
	const store = storeRef.current;

	// Register menus on mount + whenever the prop changes.
	useEffect(() => {
		if (menus?.length) store.registerMany([...menus]);
	}, [menus, store]);

	const resolvedOptions: ProviderOptions = useMemo(
		() => ({
			storage: options?.storage ?? new LocalStorageAdapter(),
			...options,
		}),
		[options]
	);

	const ctxValue = useMemo<ProviderContextValue>(
		() => ({ store, options: resolvedOptions }),
		[store, resolvedOptions]
	);

	return (
		<ProviderContext.Provider value={ctxValue}>
			{children}
			<MenuStack />
		</ProviderContext.Provider>
	);
}

function useProviderContext(): ProviderContextValue {
	const v = useContext(ProviderContext);
	if (!v) throw new Error('useMenu / useMenuStore must be used inside <MenuProvider>');
	return v;
}

/** Imperative menu API — `open(id, param)`, `close()`, `closeAll()`, etc. */
export function useMenu() {
	const { store } = useProviderContext();
	return useMemo(
		() => ({
			open: (id: string, param?: OpenParam) => store.open(id, param ?? {}),
			close: (id?: string) => store.close(id),
			closeAll: (group?: string) => store.closeAll(group),
			update: (id: string, patch: Partial<OpenParam>) => store.update(id, patch),
			updateData: (id: string, patch: any) => store.updateData(id, patch),
			isOpen: (id?: string) => store.isOpen(id),
			register: (config: MenuConfig<any, any, any>) => store.register(config),
		}),
		[store]
	);
}

/** Reactive subscription to the open-menu stack. */
export function useMenuStack(): readonly OpenMenu[] {
	const { store } = useProviderContext();
	return useSyncExternalStore(
		(cb) => store.subscribe(cb),
		() => store.getAll(),
		() => store.getAll()
	);
}

/**
 * Lifecycle state of a specific menu by id. Returns `MenuState.Closed` when
 * the menu isn't in the open stack at all. Use this to coordinate with
 * menu transitions — disable a trigger while the menu is `Closing`,
 * suppress a side panel until `Open`, etc.
 */
export function useMenuState(id: string): MenuState {
	const { store } = useProviderContext();
	return useSyncExternalStore(
		(cb) => store.subscribe(cb),
		() => store.getState(id),
		() => store.getState(id)
	);
}

/**
 * `true` when at least one menu is in the stack and not in `Closing`. Useful
 * for global "is a menu open?" UI affordances (e.g. dim a trigger button).
 */
export function useIsAnyMenuOpen(): boolean {
	const stack = useMenuStack();
	for (const m of stack) if (m.state !== MenuState.Closing) return true;
	return false;
}

/**
 * `true` when at least one menu is currently in `Opening` or `Closing`. Use
 * this to gate operations that would race with a menu transition (e.g.
 * don't trigger a navigation while a menu is dismissing).
 */
export function useIsAnyMenuTransitioning(): boolean {
	const stack = useMenuStack();
	for (const m of stack) if (m.state !== MenuState.Open) return true;
	return false;
}

export function useProviderOptions(): ProviderOptions {
	return useProviderContext().options;
}

export function useStore(): MenuStore {
	return useProviderContext().store;
}
