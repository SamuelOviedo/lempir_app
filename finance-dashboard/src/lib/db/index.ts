/**
 * Public DB interface.
 * Export schema, initialization, and helpers.
 */

export { db, DB_VERSION } from './schema';
export type { DBTransaction, DBCategory, DBPreferences, DBMetadata } from './types';
export { initializeDatabase, getNextTransactionId, incrementNextId } from './migrations';
export { txToDBTransaction, dbTransactionToUI } from './types';
