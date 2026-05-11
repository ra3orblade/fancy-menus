import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MenuConfig } from '../types';
import { BodyKind, MenuState, SourceKind } from '../types/enums';
import { MenuStore } from './store';

const cfg = (id: string, group?: string): MenuConfig<any, any, any> => ({
	id,
	group,
	body: { kind: BodyKind.List, source: { kind: SourceKind.Static, items: [] }, rows: [] },
});

describe('MenuStore', () => {
	let store: MenuStore;

	beforeEach(() => {
		vi.useFakeTimers();
		store = new MenuStore();
	});

	afterEach(() => {
		store.dispose();
		vi.useRealTimers();
	});

	it('open() pushes a menu in Opening state, then transitions to Open', () => {
		store.register(cfg('a'));
		store.open('a');
		expect(store.getState('a')).toBe(MenuState.Opening);
		vi.advanceTimersByTime(120);
		expect(store.getState('a')).toBe(MenuState.Open);
	});

	it('close() marks the menu Closing, then removes after the close window', () => {
		store.register(cfg('a'));
		store.open('a');
		vi.advanceTimersByTime(120);
		store.close('a');
		expect(store.getState('a')).toBe(MenuState.Closing);
		vi.advanceTimersByTime(90);
		expect(store.getState('a')).toBe(MenuState.Closed);
		expect(store.isOpen('a')).toBe(false);
	});

	it('isOpen() ignores menus in Closing state', () => {
		store.register(cfg('a'));
		store.open('a');
		store.close('a');
		expect(store.isOpen('a')).toBe(false);
	});

	it('cascade-close: closing a parent closes every descendant', () => {
		store.registerMany([cfg('p'), cfg('c1'), cfg('c2')]);
		store.open('p');
		store.open('c1', { parentId: 'p' });
		store.open('c2', { parentId: 'c1' });
		expect(store.getAll()).toHaveLength(3);

		store.close('p');
		// All three should be Closing now.
		for (const id of ['p', 'c1', 'c2']) {
			expect(store.getState(id)).toBe(MenuState.Closing);
		}
		vi.advanceTimersByTime(90);
		expect(store.getAll()).toHaveLength(0);
	});

	it('opening a sibling under the same parent replaces the previous sibling', () => {
		store.registerMany([cfg('root'), cfg('childA'), cfg('childB')]);
		store.open('root');
		store.open('childA', { parentId: 'root' });
		expect(store.getAll().map((m) => m.id)).toEqual(['root', 'childA']);

		store.open('childB', { parentId: 'root' });
		// childA is dropped immediately (no animation), childB takes its slot.
		expect(store.getAll().map((m) => m.id)).toEqual(['root', 'childB']);
	});

	it('open() while a Closing menu is mid-removal cancels the removal and re-opens', () => {
		store.register(cfg('a'));
		store.open('a');
		vi.advanceTimersByTime(120);
		store.close('a');
		expect(store.getState('a')).toBe(MenuState.Closing);

		store.open('a');
		// Should be back to Open (no more pending removal).
		expect(store.getState('a')).toBe(MenuState.Open);
		vi.advanceTimersByTime(200);
		// Still in the stack — the removal timer was cancelled.
		expect(store.isOpen('a')).toBe(true);
	});

	it('navigateTo() swaps in-place and pushes history; back() restores it', () => {
		store.registerMany([cfg('root'), cfg('detail')]);
		store.open('root', { data: { v: 1 } });
		vi.advanceTimersByTime(120);

		store.navigateTo('root', 'detail', { data: { v: 2 } });
		const all = store.getAll();
		expect(all).toHaveLength(1);
		expect(all[0]!.id).toBe('detail');
		expect((all[0]!.param.data as any).v).toBe(2);
		expect(store.canGoBack('detail')).toBe(true);

		store.back('detail');
		const after = store.getAll();
		expect(after).toHaveLength(1);
		expect(after[0]!.id).toBe('root');
		expect((after[0]!.param.data as any).v).toBe(1);
		expect(store.canGoBack('root')).toBe(false);
	});

	it('closeAll() with a group closes only that group', () => {
		store.registerMany([cfg('a', 'gA'), cfg('b', 'gB'), cfg('c', 'gA')]);
		store.open('a');
		store.open('b');
		store.open('c');
		vi.advanceTimersByTime(120);

		store.closeAll('gA');
		vi.advanceTimersByTime(90);
		const ids = store.getAll().map((m) => m.id);
		expect(ids).toEqual(['b']);
	});

	it('closeChildren() drops descendants without closing the parent', () => {
		store.registerMany([cfg('p'), cfg('c1'), cfg('c2')]);
		store.open('p');
		store.open('c1', { parentId: 'p' });
		store.open('c2', { parentId: 'c1' });

		store.closeChildren('p');
		vi.advanceTimersByTime(90);
		expect(store.getAll().map((m) => m.id)).toEqual(['p']);
	});

	it('isAnyTransitioning() is true while any menu is Opening or Closing', () => {
		store.register(cfg('a'));
		store.open('a');
		expect(store.isAnyTransitioning()).toBe(true);
		vi.advanceTimersByTime(120);
		expect(store.isAnyTransitioning()).toBe(false);
		store.close('a');
		expect(store.isAnyTransitioning()).toBe(true);
	});

	it('subscribers are notified on every mutation', () => {
		const listener = vi.fn();
		store.register(cfg('a'));
		store.subscribe(listener);
		store.open('a');
		store.update('a', { data: { hello: 'world' } });
		store.close('a');
		// At least: open → opening->open transition → update → close. Three+
		// emissions is the floor.
		expect(listener.mock.calls.length).toBeGreaterThanOrEqual(3);
	});
});
