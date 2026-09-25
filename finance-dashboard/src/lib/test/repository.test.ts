import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { db } from '../db/schema';
import { initializeDatabase } from '../db/migrations';
import { DexieTransactionRepository, DexiePreferencesRepository } from '../db/web-repository';
import { createFinanceService } from '../services';
import type { FinanceService } from '../services';
import { dashboard, createDashboardStore } from '../store';

const resetDb = async () => {
	await Promise.all([
		db.transactions.clear(),
		db.categories.clear(),
		db.preferences.clear(),
		db.metadata.clear()
	]);
	await initializeDatabase();
};

describe('Repository layer (web-repository.ts)', () => {
	beforeEach(resetDb);

	it('create() allocates sequential ids and bumps metadata.nextId', async () => {
		const repo = new DexieTransactionRepository(db);
		const a = await repo.create({
			name: 'A',
			cat: 'life',
			amount: 1,
			date: '1 sep',
			type: 'expense'
		});
		const b = await repo.create({ name: 'B', cat: null, amount: 2, date: '1 sep', type: 'income' });

		expect(a.id).toBe(100);
		expect(b.id).toBe(101);
		expect((await db.metadata.get('app_meta'))?.nextId).toBe(102);
		expect(a.deleted).toBe(false);
	});

	it('getActive() excludes soft-deleted rows', async () => {
		const repo = new DexieTransactionRepository(db);
		await repo.softDelete(1);
		const active = await repo.getActive();
		expect(active).toHaveLength(9);
		expect(active.map((t) => t.id)).not.toContain(1);
	});

	it('update() / softDelete() throw on unknown id', async () => {
		const repo = new DexieTransactionRepository(db);
		await expect(repo.update(9999, { name: 'x' })).rejects.toThrow('not found');
		await expect(repo.softDelete(9999)).rejects.toThrow('not found');
	});

	it('preferences save() merges toggles and keeps other fields', async () => {
		const repo = new DexiePreferencesRepository(db);
		const saved = await repo.save({ toggles: { weekly: true } });

		expect(saved.toggles).toEqual({ alerts: true, roundup: true, weekly: true, sync: true });
		expect(saved.mode).toBe('dark');
		expect(saved.accent).toBe('green');
		expect((await repo.get())?.toggles.weekly).toBe(true);
	});
});

describe('Store preference persistence', () => {
	beforeEach(resetDb);

	it('setMode persists to DB and survives re-initialize', async () => {
		await dashboard.initialize();
		await dashboard.setMode('light');

		expect(get(dashboard).mode).toBe('light');
		expect((await db.preferences.get('user_settings'))?.mode).toBe('light');

		await dashboard.initialize();
		expect(get(dashboard).mode).toBe('light');
	});

	it('setAccent persists to DB and survives re-initialize', async () => {
		await dashboard.initialize();
		await dashboard.setAccent('purple');

		expect((await db.preferences.get('user_settings'))?.accent).toBe('purple');

		await dashboard.initialize();
		expect(get(dashboard).accent).toBe('purple');
	});

	it('toggleSetting persists only the toggled key', async () => {
		await dashboard.initialize();
		await dashboard.toggleSetting('alerts');

		const prefs = await db.preferences.get('user_settings');
		expect(prefs?.toggles).toEqual({ alerts: false, roundup: true, weekly: false, sync: true });

		await dashboard.initialize();
		expect(get(dashboard).toggles.alerts).toBe(false);
	});

	it('rolls back in-memory state and sets dbError when persistence fails', async () => {
		const real = createFinanceService({
			transactions: new DexieTransactionRepository(db),
			preferences: new DexiePreferencesRepository(db),
			metadata: { get: () => db.metadata.get('app_meta') }
		});
		const failing: FinanceService = {
			...real,
			savePreferences: vi.fn().mockRejectedValue(new Error('quota exceeded'))
		};
		const store = createDashboardStore(failing);
		await store.initialize();

		await store.setMode('light');

		expect(get(store).mode).toBe('dark');
		expect(get(store).dbError).toContain('quota exceeded');
		expect((await db.preferences.get('user_settings'))?.mode).toBe('dark');
	});
});
