/**
 * Public DB interface.
 * Export schema, initialization, and helpers.
 */

export { db, DB_VERSION } from './schema';
export type { DBTransaction, DBCategory, DBPreferences, DBMetadata } from './types';
export {
	initializeDatabase,
	getNextTransactionId,
	incrementNextId,
	DEFAULT_PREFERENCES
} from './migrations';
export { txToDBTransaction, dbTransactionToUI } from './types';
export type {
	TransactionRepository,
	PreferencesRepository,
	MetadataRepository,
	NewTransaction,
	TransactionChanges,
	PreferencesChanges,
	PreferenceToggles
} from './repository';
export {
	DexieTransactionRepository,
	DexiePreferencesRepository,
	DexieMetadataRepository
} from './web-repository';
