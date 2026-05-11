/**
 * Build a MenuCtx for a given OpenMenu instance, wired to the store and
 * provider options. This is the object passed into every callback in a config.
 */

import type { MenuCtx, OpenParam, ProviderOptions } from '../types/context';
import type { MenuStore, OpenMenu } from './store';

export function makeCtx(
	open: OpenMenu,
	store: MenuStore,
	options: ProviderOptions,
	helpers: {
		setActive: (id?: string, scroll?: boolean) => void;
		setHover: (id?: string) => void;
		position: () => void;
	}
): MenuCtx {
	const storageKey = open.config.storage?.key ?? open.config.id;
	const adapter = open.config.storage?.adapter ?? options.storage;

	const readSnapshot = (): Record<string, unknown> => {
		if (!adapter) return {};
		try {
			const raw = adapter.get(storageKey);
			return (raw as Record<string, unknown>) ?? {};
		} catch {
			return {};
		}
	};

	return {
		id: open.id,
		data: open.param.data,
		storage: {
			get<T = unknown>(key: string): T | undefined {
				return readSnapshot()[key] as T | undefined;
			},
			set<T = unknown>(key: string, value: T): void {
				if (!adapter) return;
				const next = { ...readSnapshot(), [key]: value };
				adapter.set(storageKey, next);
			},
		},
		open: async (id, param) => {
			store.open(id, { ...(param as OpenParam | undefined), parentId: open.id });
		},
		close: () => store.close(open.id),
		closeAll: (group) => store.closeAll(group),
		closeChildren: () => store.closeChildren(open.id),
		navigateTo: (id, param) => store.navigateTo(open.id, id, (param ?? {}) as OpenParam),
		back: () => store.back(open.id),
		canGoBack: () => store.canGoBack(open.id),
		update: (param) => store.update(open.id, param),
		updateData: (patch) => store.updateData(open.id, patch),
		position: helpers.position,
		setActive: helpers.setActive,
		setHover: helpers.setHover,
		updateOther: (id, patch) => store.updateData(id, patch),
		isOpen: (id) => store.isOpen(id),
	};
}
