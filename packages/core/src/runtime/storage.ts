/**
 * Default StorageAdapter — namespaced localStorage with safe fallbacks for
 * SSR / private-mode browsers where localStorage throws.
 */

import type { StorageAdapter } from '../types/storage';

export class LocalStorageAdapter implements StorageAdapter {
	constructor(private readonly prefix = 'fm:') {}

	get(key: string): unknown {
		if (typeof localStorage === 'undefined') return undefined;
		try {
			const raw = localStorage.getItem(this.prefix + key);
			return raw == null ? undefined : JSON.parse(raw);
		} catch {
			return undefined;
		}
	}

	set(key: string, value: unknown): void {
		if (typeof localStorage === 'undefined') return;
		try {
			localStorage.setItem(this.prefix + key, JSON.stringify(value));
		} catch {
			/* quota exceeded or disabled — ignore */
		}
	}

	remove(key: string): void {
		if (typeof localStorage === 'undefined') return;
		try {
			localStorage.removeItem(this.prefix + key);
		} catch {
			/* ignore */
		}
	}
}

/** In-memory fallback adapter — useful for tests. */
export class MemoryStorageAdapter implements StorageAdapter {
	private map = new Map<string, unknown>();
	get(key: string) {
		return this.map.get(key);
	}
	set(key: string, value: unknown) {
		this.map.set(key, value);
	}
	remove(key: string) {
		this.map.delete(key);
	}
}
