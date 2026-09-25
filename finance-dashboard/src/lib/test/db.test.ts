import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db/schema';
import { initializeDatabase, getNextTransactionId, incrementNextId } from '../db/migrations';
import type { DBTransaction, DBMetadata } from '../db/types';

describe('Database Layer (migrations.ts)', () => {
	beforeEach(async () => {
		// Reset DB for each test (clear tables without destroying connection)
		await Promise.all([
			db.transactions.clear(),
			db.categories.clear(),
			db.preferences.clear(),
			db.metadata.clear()
		]);
	});

	describe('initializeDatabase()', () => {
		it('creates metadata on first run', async () => {
			await initializeDatabase();
			const meta = await db.metadata.get('app_meta');
			expect(meta).toBeDefined();
			expect(meta?.version).toBe(1);
			expect(meta?.nextId).toBe(100);
		});

		it('creates seed transactions on first run', async () => {
			await initializeDatabase();
			const txs = await db.transactions.toArray();
			expect(txs.length).toBe(10);
		});

		it('seeds 4 categories correctly', async () => {
			await initializeDatabase();
			const cats = await db.categories.toArray();
			expect(cats.length).toBe(4);
			expect(cats.map((c) => c.id)).toContain('fixed');
			expect(cats.map((c) => c.id)).toContain('debt');
			expect(cats.map((c) => c.id)).toContain('life');
			expect(cats.map((c) => c.id)).toContain('exit');
		});

		it('creates preferences with defaults', async () => {
			await initializeDatabase();
			const prefs = await db.preferences.get('user_settings');
			expect(prefs).toBeDefined();
			expect(prefs?.mode).toBe('dark');
			expect(prefs?.accent).toBe('green');
		});

		it('skips re-seeding on second run', async () => {
			// Clean before first init (fresh start)
			await Promise.all([
				db.transactions.clear(),
				db.categories.clear(),
				db.preferences.clear(),
				db.metadata.clear()
			]);

			// First initialization — seeds data
			await initializeDatabase();
			const txsFirst = await db.transactions.toArray();
			const firstCount = txsFirst.length;
			expect(firstCount).toBe(10);

			// Second initialization WITHOUT clearing — should skip re-seed
			await initializeDatabase();
			const txsSecond = await db.transactions.toArray();

			// Should still be 10 (not duplicated or cleared)
			expect(txsSecond.length).toBe(firstCount);
		});
	});

	describe('getNextTransactionId()', () => {
		it('returns nextId from metadata', async () => {
			await initializeDatabase();
			const nextId = await getNextTransactionId();
			expect(nextId).toBe(100);
		});

		it('throws if database not initialized', async () => {
			await expect(getNextTransactionId()).rejects.toThrow('Metadata not found');
		});
	});

	describe('incrementNextId()', () => {
		it('increments nextId in metadata', async () => {
			await initializeDatabase();
			const before = await getNextTransactionId();
			await incrementNextId();
			const after = await getNextTransactionId();
			expect(after).toBe(before + 1);
		});
	});

	describe('Persistence', () => {
		it('inserted transaction persists after re-read', async () => {
			await initializeDatabase();
			const tx: DBTransaction = {
				id: 100,
				name: 'Test Transaction',
				cat: 'life',
				amount: 99.99,
				date: '22 sep',
				type: 'expense',
				createdAt: Date.now(),
				updatedAt: Date.now(),
				deleted: false
			};

			await db.transactions.add(tx);
			const retrieved = await db.transactions.get(100);
			expect(retrieved).toEqual(tx);
		});

		it('soft-deleted transactions remain in DB but excluded from queries', async () => {
			await initializeDatabase();
			const txId = 1;

			// Mark as deleted
			await db.transactions.update(txId, { deleted: true });

			// Transaction still exists
			const tx = await db.transactions.get(txId);
			expect(tx?.deleted).toBe(true);

			// But query excludes it (filter in memory — boolean not indexable)
			const allActive = await db.transactions.toArray();
			const active = allActive.filter((t) => !t.deleted);
			expect(active.map((t) => t.id)).not.toContain(txId);
		});
	});

	describe('ID Integrity', () => {
		it('does not produce ID collisions with seed', async () => {
			await initializeDatabase();
			const seedIds = (await db.transactions.toArray()).map((t) => t.id);
			expect(seedIds).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

			// Next ID should be 100 (after 10 seed items)
			const nextId = await getNextTransactionId();
			expect(nextId).toBe(100);
			expect(seedIds).not.toContain(nextId);
		});
	});
});
