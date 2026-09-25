/**
 * Repository contracts (platform-agnostic).
 * Web implements them with Dexie (web-repository.ts); mobile will mirror them with Drift.
 * Store and services depend on these interfaces, never on Dexie directly.
 */

import type { DBTransaction, DBPreferences, DBMetadata } from './types';

/** Fields a caller provides to create a transaction (persistence metadata is added by the repository). */
export type NewTransaction = Pick<DBTransaction, 'name' | 'cat' | 'amount' | 'date' | 'type'>;

/** Editable transaction fields. */
export type TransactionChanges = Partial<NewTransaction>;

export type PreferenceToggles = DBPreferences['toggles'];

/** Partial preference update. Toggles are merged; other fields replace the stored value. */
export interface PreferencesChanges {
	mode?: DBPreferences['mode'];
	accent?: DBPreferences['accent'];
	budgets?: Record<string, number>;
	toggles?: Partial<PreferenceToggles>;
}

export interface TransactionRepository {
	/** All non soft-deleted transactions. */
	getActive(): Promise<DBTransaction[]>;
	/** Raw record by id (includes soft-deleted rows). */
	getById(id: number): Promise<DBTransaction | undefined>;
	/** Allocates the next id and inserts atomically. */
	create(input: NewTransaction): Promise<DBTransaction>;
	/** Throws if the transaction does not exist. */
	update(id: number, changes: TransactionChanges): Promise<void>;
	/** Marks as deleted (kept for future sync). Throws if the transaction does not exist. */
	softDelete(id: number): Promise<void>;
}

export interface PreferencesRepository {
	get(): Promise<DBPreferences | undefined>;
	/** Merges changes into the stored preferences (or defaults) and returns the saved record. */
	save(changes: PreferencesChanges): Promise<DBPreferences>;
}

export interface MetadataRepository {
	get(): Promise<DBMetadata | undefined>;
}
