/**
 * Persistence configuration. The runtime calls `adapter.get(key)` on mount
 * and `adapter.set(key, value)` on body-state changes whose names are listed
 * in `fields`.
 *
 * Default adapter: `localStorage` namespaced by menu id. Provide a custom
 * adapter via the MenuProvider (e.g. async IndexedDB, Electron disk, server-
 * synced settings).
 */

export interface StorageAdapter {
	get(key: string): unknown | Promise<unknown>;
	set(key: string, value: unknown): void | Promise<void>;
	remove?(key: string): void | Promise<void>;
}

export interface StorageConfig {
	/** Namespace key. Defaults to the menu id. */
	key?: string;
	/**
	 * Names of body-state keys to persist. The runtime exposes a `storage`
	 * object on MenuCtx; values written through it are persisted automatically.
	 * Examples of state worth persisting:
	 *   - active tab
	 *   - last-typed filter value
	 *   - recent items list
	 *   - skin-tone / color preference
	 *   - "with content" toggle
	 */
	fields?: string[];
	/** Override the provider-supplied adapter for this menu only. */
	adapter?: StorageAdapter;
	/** Migrate stored values when the schema version changes. */
	version?: number;
	migrate?: (stored: unknown, fromVersion: number) => unknown;
}
