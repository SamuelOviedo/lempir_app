/**
 * IndexedDB (Dexie) implementations of the repository contracts.
 * Only this layer (plus schema/migrations) touches Dexie tables.
 */

import type { LempirDatabase } from './schema';
import type { DBTransaction, DBPreferences, DBMetadata } from './types';
import { txToDBTransaction } from './types';
import { DEFAULT_PREFERENCES, getNextTransactionId, incrementNextId } from './migrations';
import type {
	TransactionRepository,
	PreferencesRepository,
	MetadataRepository,
	NewTransaction,
	TransactionChanges,
	PreferencesChanges
} from './repository';

export class DexieTransactionRepository implements TransactionRepository {
	private readonly database: LempirDatabase;

	constructor(database: LempirDatabase) {
		this.database = database;
	}

	async getActive(): Promise<DBTransaction[]> {
		// Boolean fields are not indexable in IndexedDB: filter in memory
		const all = await this.database.transactions.toArray();
		return all.filter((t) => !t.deleted);
	}

	getById(id: number): Promise<DBTransaction | undefined> {
		return this.database.transactions.get(id);
	}

	create(input: NewTransaction): Promise<DBTransaction> {
		const db = this.database;
		// Single rw transaction: id allocation + insert + counter bump succeed or fail together
		return db.transaction('rw', db.transactions, db.metadata, async () => {
			const id = await getNextTransactionId(db);
			const record: DBTransaction = { ...txToDBTransaction(input), id };
			await db.transactions.add(record);
			await incrementNextId(db);
			return record;
		});
	}

	async update(id: number, changes: TransactionChanges): Promise<void> {
		const updated = await this.database.transactions.update(id, {
			...changes,
			updatedAt: Date.now()
		});
		if (updated === 0) {
			throw new Error(`[DB] Transaction ${id} not found.`);
		}
	}

	async softDelete(id: number): Promise<void> {
		const updated = await this.database.transactions.update(id, {
			deleted: true,
			updatedAt: Date.now()
		});
		if (updated === 0) {
			throw new Error(`[DB] Transaction ${id} not found.`);
		}
	}
}

export class DexiePreferencesRepository implements PreferencesRepository {
	private readonly database: LempirDatabase;

	constructor(database: LempirDatabase) {
		this.database = database;
	}

	get(): Promise<DBPreferences | undefined> {
		return this.database.preferences.get('user_settings');
	}

	save(changes: PreferencesChanges): Promise<DBPreferences> {
		const db = this.database;
		return db.transaction('rw', db.preferences, async () => {
			const current = (await db.preferences.get('user_settings')) ?? DEFAULT_PREFERENCES;
			const next: DBPreferences = {
				key: 'user_settings',
				mode: changes.mode ?? current.mode,
				accent: changes.accent ?? current.accent,
				budgets: { ...(changes.budgets ?? current.budgets) },
				toggles: { ...current.toggles, ...changes.toggles },
				updatedAt: Date.now()
			};
			await db.preferences.put(next);
			return next;
		});
	}
}

export class DexieMetadataRepository implements MetadataRepository {
	private readonly database: LempirDatabase;

	constructor(database: LempirDatabase) {
		this.database = database;
	}

	get(): Promise<DBMetadata | undefined> {
		return this.database.metadata.get('app_meta');
	}
}
