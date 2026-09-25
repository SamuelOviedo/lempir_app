/**
 * Dexie database schema definition.
 * Version 1: Initial schema with transactions, categories, preferences, metadata.
 */

import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { DBTransaction, DBCategory, DBPreferences, DBMetadata } from './types';

export const DB_VERSION = 1;

export class LempirDatabase extends Dexie {
	transactions!: Table<DBTransaction>;
	categories!: Table<DBCategory>;
	preferences!: Table<DBPreferences>;
	metadata!: Table<DBMetadata>;

	constructor() {
		super('lempir_db');
		this.version(DB_VERSION).stores({
			transactions: 'id, date, cat, type, createdAt, deleted', // Indices for querying
			categories: 'id', // Primary key only
			preferences: 'key', // Singleton: "user_settings"
			metadata: 'key' // Singleton: "app_meta"
		});
	}
}

export const db = new LempirDatabase();
