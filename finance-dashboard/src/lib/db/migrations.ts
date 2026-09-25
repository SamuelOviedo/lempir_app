/**
 * Database initialization and migration logic.
 * Ensures SEED only runs on first installation.
 */

import { db, DB_VERSION } from './schema';
import type { DBTransaction, DBCategory, DBPreferences, DBMetadata } from './types';

// Reference data (immutable across versions)
const SEED_CATEGORIES: DBCategory[] = [
	{
		id: 'fixed',
		name: 'Compromisos Fijos',
		sub: 'Alquiler, servicios, seguros',
		budget: 3200,
		icon: 'M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1z',
		hue: '#7db9ff'
	},
	{
		id: 'debt',
		name: 'Deudas Críticas',
		sub: 'Tarjetas, préstamo, plan fiscal',
		budget: 1450,
		icon: 'M3 12a9 9 0 1018 0 9 9 0 00-18 0zM12 8v4l3 2',
		hue: '#ff8a8a'
	},
	{
		id: 'life',
		name: 'Estilo de Vida',
		sub: 'Comida, ocio, suscripciones',
		budget: 1100,
		icon: 'M6 3h12l-1 6a5 5 0 01-10 0zM12 15v6M8 21h8',
		hue: '#ffc46b'
	},
	{
		id: 'exit',
		name: 'Metas de Salida / Ahorros',
		sub: 'Colchón + inversión',
		budget: 900,
		icon: 'M12 21s7-4.6 7-10a7 7 0 10-14 0c0 5.4 7 10 7 10zM12 8v6M9 11h6',
		hue: '#8effc0'
	}
];

// Initial transaction seed
const SEED_TRANSACTIONS = [
	{
		id: 1,
		name: 'Alquiler del apartamento',
		cat: 'fixed',
		amount: 1850,
		date: '1 sep',
		type: 'expense' as const
	},
	{
		id: 2,
		name: 'Anticipo de diseño — Northline',
		cat: null,
		amount: 4200,
		date: '1 sep',
		type: 'income' as const
	},
	{
		id: 3,
		name: 'Tarjeta Visa — mínimo + extra',
		cat: 'debt',
		amount: 620,
		date: '2 sep',
		type: 'expense' as const
	},
	{
		id: 4,
		name: 'Seguro médico',
		cat: 'fixed',
		amount: 412,
		date: '2 sep',
		type: 'expense' as const
	},
	{
		id: 5,
		name: 'Supermercado — Mercado Sur',
		cat: 'life',
		amount: 186,
		date: '3 sep',
		type: 'expense' as const
	},
	{
		id: 6,
		name: 'Préstamo del auto',
		cat: 'debt',
		amount: 388,
		date: '4 sep',
		type: 'expense' as const
	},
	{
		id: 7,
		name: 'Inversión automática — bróker',
		cat: 'exit',
		amount: 500,
		date: '5 sep',
		type: 'expense' as const
	},
	{
		id: 8,
		name: 'Nómina — Ostara Studio',
		cat: null,
		amount: 3900,
		date: '5 sep',
		type: 'income' as const
	},
	{
		id: 9,
		name: 'Luz + agua',
		cat: 'fixed',
		amount: 231,
		date: '6 sep',
		type: 'expense' as const
	},
	{
		id: 10,
		name: 'Cena — Casa Lupe',
		cat: 'life',
		amount: 94,
		date: '6 sep',
		type: 'expense' as const
	}
];

/**
 * Initialize database on first load.
 * - Check if DB exists (via metadata.version)
 * - If exists: return (data already there)
 * - If new: seed initial data
 */
export async function initializeDatabase(): Promise<void> {
	try {
		// Check if metadata exists (indicates DB was initialized before)
		const meta = await db.metadata.get('app_meta');

		if (meta && meta.version === DB_VERSION) {
			// DB already initialized, skip seed
			console.log('[DB] Database already initialized. Skipping seed.');
			return;
		}

		// New installation: seed all data
		console.log('[DB] New installation detected. Running seed...');
		await seedDatabase();
		console.log('[DB] Seed completed successfully.');
	} catch (error) {
		console.error('[DB] Failed to initialize database:', error);
		throw error;
	}
}

/**
 * Seed database with initial data (first run only).
 */
async function seedDatabase(): Promise<void> {
	// 1. Clear any partial data (safety measure)
	await Promise.all([
		db.transactions.clear(),
		db.categories.clear(),
		db.preferences.clear(),
		db.metadata.clear()
	]);

	const now = Date.now();

	// 2. Seed categories (reference data)
	await db.categories.bulkAdd(SEED_CATEGORIES);

	// 3. Seed transactions
	const seedTxs: DBTransaction[] = SEED_TRANSACTIONS.map((tx) => ({
		...tx,
		createdAt: now,
		updatedAt: now,
		deleted: false
	}));
	await db.transactions.bulkAdd(seedTxs);

	// 4. Seed preferences (defaults)
	const seedPrefs: DBPreferences = {
		key: 'user_settings',
		mode: 'dark',
		accent: 'green',
		toggles: {
			alerts: true,
			roundup: true,
			weekly: false,
			sync: true
		},
		budgets: {
			fixed: 3200,
			debt: 1450,
			life: 1100,
			exit: 900
		},
		updatedAt: now
	};
	await db.preferences.put(seedPrefs);

	// 5. Seed metadata (version control)
	const seedMeta: DBMetadata = {
		key: 'app_meta',
		version: DB_VERSION,
		lastSyncAt: 0,
		nextId: 100 // SEED.length + 1
	};
	await db.metadata.put(seedMeta);
}

/**
 * Get next transaction ID (auto-increment).
 * Call this before creating a new transaction.
 */
export async function getNextTransactionId(): Promise<number> {
	const meta = await db.metadata.get('app_meta');
	if (!meta) {
		throw new Error('[DB] Metadata not found. Database may not be initialized.');
	}
	return meta.nextId;
}

/**
 * Increment next ID in metadata after creating a transaction.
 */
export async function incrementNextId(): Promise<void> {
	const meta = await db.metadata.get('app_meta');
	if (meta) {
		await db.metadata.put({
			...meta,
			nextId: meta.nextId + 1
		});
	}
}
