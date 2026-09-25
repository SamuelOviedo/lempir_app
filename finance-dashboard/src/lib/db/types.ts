/**
 * Domain types for persistence layer.
 * Shared shape with store.ts but with persistence metadata.
 */

export interface DBTransaction {
	id: number;
	name: string;
	cat: string | null; // Foreign key → categories.id
	amount: number;
	date: string; // ISO format or "D mon" format
	type: 'income' | 'expense';
	createdAt: number; // Timestamp
	updatedAt: number; // Timestamp
	deleted: boolean; // Soft-delete flag
}

export interface DBCategory {
	id: string; // Primary key: "fixed", "debt", "life", "exit"
	name: string;
	sub: string;
	budget: number;
	icon: string; // SVG path
	hue: string; // Hex color
}

export interface DBPreferences {
	key: 'user_settings'; // Singleton pattern
	mode: 'dark' | 'light';
	accent: 'green' | 'blue' | 'purple' | 'orange';
	toggles: {
		alerts: boolean;
		roundup: boolean;
		weekly: boolean;
		sync: boolean;
	};
	budgets: Record<string, number>;
	updatedAt: number;
}

export interface DBMetadata {
	key: 'app_meta'; // Singleton pattern
	version: number;
	lastSyncAt: number;
	nextId: number;
}

/**
 * Conversion helpers
 */

export function txToDBTransaction(tx: {
	name: string;
	cat: string | null;
	amount: number;
	date: string;
	type: 'income' | 'expense';
}): Omit<DBTransaction, 'id'> {
	return {
		...tx,
		createdAt: Date.now(),
		updatedAt: Date.now(),
		deleted: false
	};
}

export function dbTransactionToUI(tx: DBTransaction) {
	return {
		id: tx.id,
		name: tx.name,
		cat: tx.cat,
		amount: tx.amount,
		date: tx.date,
		type: tx.type
	};
}
