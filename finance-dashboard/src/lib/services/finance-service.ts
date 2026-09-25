/**
 * Finance service: application use-cases on top of the repository contracts.
 * The store talks to this service only; it never imports Dexie tables.
 * Returns persistence records (DBTransaction); mapping to UI shape is done by the caller
 * via `dbTransactionToUI`.
 */

import { db } from '../db/schema';
import { initializeDatabase } from '../db/migrations';
import {
	DexieTransactionRepository,
	DexiePreferencesRepository,
	DexieMetadataRepository
} from '../db/web-repository';
import type { DBTransaction, DBPreferences } from '../db/types';
import type {
	TransactionRepository,
	PreferencesRepository,
	MetadataRepository,
	NewTransaction,
	TransactionChanges,
	PreferencesChanges
} from '../db/repository';

export interface FinanceSnapshot {
	txs: DBTransaction[];
	preferences: DBPreferences | undefined;
	nextId: number | undefined;
}

export interface FinanceRepositories {
	transactions: TransactionRepository;
	preferences: PreferencesRepository;
	metadata: MetadataRepository;
}

export interface FinanceService {
	/** Runs migrations/seed and loads everything the UI needs at startup. */
	loadSnapshot(): Promise<FinanceSnapshot>;
	/** Active (non soft-deleted) transaction by id. */
	getTransaction(id: number): Promise<DBTransaction | undefined>;
	addTransaction(input: NewTransaction): Promise<DBTransaction>;
	updateTransaction(id: number, changes: TransactionChanges): Promise<void>;
	deleteTransaction(id: number): Promise<void>;
	savePreferences(changes: PreferencesChanges): Promise<DBPreferences>;
}

export function createFinanceService(
	repos: FinanceRepositories,
	init: () => Promise<void> = initializeDatabase
): FinanceService {
	return {
		async loadSnapshot() {
			await init();
			const [txs, preferences, meta] = await Promise.all([
				repos.transactions.getActive(),
				repos.preferences.get(),
				repos.metadata.get()
			]);
			return { txs, preferences, nextId: meta?.nextId };
		},

		async getTransaction(id) {
			const tx = await repos.transactions.getById(id);
			return tx && !tx.deleted ? tx : undefined;
		},

		addTransaction(input) {
			return repos.transactions.create(input);
		},

		updateTransaction(id, changes) {
			return repos.transactions.update(id, changes);
		},

		deleteTransaction(id) {
			return repos.transactions.softDelete(id);
		},

		savePreferences(changes) {
			return repos.preferences.save(changes);
		}
	};
}

/** Default web service bound to the IndexedDB singleton. */
export const financeService = createFinanceService({
	transactions: new DexieTransactionRepository(db),
	preferences: new DexiePreferencesRepository(db),
	metadata: new DexieMetadataRepository(db)
});
