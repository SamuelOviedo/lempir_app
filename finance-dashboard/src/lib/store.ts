import { writable } from 'svelte/store';
import { db, initializeDatabase, getNextTransactionId, incrementNextId } from './db';
import type { DBTransaction } from './db';

export interface Transaction {
	id: number;
	name: string;
	cat: string | null;
	amount: number;
	date: string;
	type: 'income' | 'expense';
}

export interface Category {
	id: string;
	name: string;
	sub: string;
	budget: number;
	icon: string;
	hue: string;
}

export interface DashboardState {
	view: 'dashboard' | 'transactions' | 'coach' | 'settings';
	range: 'Este mes' | 'Trimestre' | 'Año';
	txs: Transaction[];
	open: Record<string, boolean>;
	insight: number;
	modal: boolean;
	modalMode: 'create' | 'edit';
	editingId: number | null;
	deleteConfirmation: boolean; // New: delete confirmation modal visibility
	deleteConfirmationId: number | null; // New: id of tx to delete
	deleteConfirmationName: string; // New: name of tx to delete
	kind: 'Gasto' | 'Ingreso';
	amount: string;
	name: string;
	formCat: string;
	error: string;
	dbError: string;
	toast: string;
	query: string;
	nextId: number;
	mode: 'dark' | 'light';
	accent: 'green' | 'blue' | 'purple' | 'orange';
	budgets: Record<string, number>;
	toggles: Record<string, boolean>;
	initialized: boolean;
}

const CATEGORIES: Category[] = [
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

function createDashboardStore() {
	const initial: DashboardState = {
		view: 'dashboard',
		range: 'Este mes',
		txs: [],
		open: {},
		insight: 0,
		modal: false,
		modalMode: 'create',
		editingId: null,
		deleteConfirmation: false,
		deleteConfirmationId: null,
		deleteConfirmationName: '',
		kind: 'Gasto',
		amount: '',
		name: '',
		formCat: 'life',
		error: '',
		dbError: '',
		toast: '',
		query: '',
		nextId: 100,
		mode: 'dark',
		accent: 'green',
		budgets: { fixed: 3200, debt: 1450, life: 1100, exit: 900 },
		toggles: { alerts: true, roundup: true, weekly: false, sync: true },
		initialized: false
	};

	const { subscribe, set, update } = writable(initial);

	return {
		subscribe,

		// ===== Initialization (NEW) =====

		async initialize() {
			try {
				// Initialize DB (seed if needed)
				await initializeDatabase();

				// Load data from IndexedDB (boolean not indexable in Dexie, filter in memory)
				const allTxs = await db.transactions.toArray();
				const txs = allTxs.filter((t) => !t.deleted);
				const prefs = await db.preferences.get('user_settings');
				const meta = await db.metadata.get('app_meta');

				// Update store with loaded data
				set({
					...initial,
					txs: txs.map(txToUI),
					mode: prefs?.mode || 'dark',
					accent: prefs?.accent || 'green',
					budgets: prefs?.budgets || initial.budgets,
					toggles: prefs?.toggles || initial.toggles,
					nextId: meta?.nextId || 100,
					initialized: true
				});

				console.log('[Store] Initialization complete. Loaded', txs.length, 'transactions.');
			} catch (error) {
				const msg = error instanceof Error ? error.message : 'Unknown error';
				console.error('[Store] Initialization failed:', msg);
				update((s) => ({
					...s,
					dbError: `Failed to initialize: ${msg}`,
					initialized: false
				}));
				throw error;
			}
		},

		// ===== Transaction CRUD (NEW: async, DB-first) =====

		async addTransaction(tx: Omit<Transaction, 'id'>) {
			try {
				// Get next ID from metadata
				const id = await getNextTransactionId();

				// Create DB transaction
				const dbTx: DBTransaction = {
					...tx,
					id,
					createdAt: Date.now(),
					updatedAt: Date.now(),
					deleted: false
				};

				// Write to DB first
				await db.transactions.add(dbTx);

				// Increment ID in metadata
				await incrementNextId();

				// Update store
				update((s) => ({
					...s,
					txs: [txToUI(dbTx), ...s.txs],
					nextId: id + 1,
					modal: false,
					amount: '',
					name: '',
					error: '',
					dbError: ''
				}));

				console.log('[Store] Transaction added:', id);
			} catch (error) {
				const msg = error instanceof Error ? error.message : 'Unknown error';
				console.error('[Store] addTransaction failed:', msg);
				update((s) => ({
					...s,
					dbError: `Failed to add transaction: ${msg}`
				}));
				throw error;
			}
		},

		async updateTransaction(id: number, changes: Partial<Transaction>) {
			try {
				// Update in DB
				await db.transactions.update(id, {
					...changes,
					updatedAt: Date.now()
				});

				// Update store
				update((s) => ({
					...s,
					txs: s.txs.map((t) => (t.id === id ? { ...t, ...changes } : t)),
					dbError: ''
				}));

				console.log('[Store] Transaction updated:', id);
			} catch (error) {
				const msg = error instanceof Error ? error.message : 'Unknown error';
				console.error('[Store] updateTransaction failed:', msg);
				update((s) => ({
					...s,
					dbError: `Failed to update transaction: ${msg}`
				}));
				throw error;
			}
		},

		async deleteTransaction(id: number) {
			try {
				// Soft-delete in DB
				await db.transactions.update(id, {
					deleted: true,
					updatedAt: Date.now()
				});

				// Update store
				update((s) => ({
					...s,
					txs: s.txs.filter((t) => t.id !== id),
					dbError: ''
				}));

				console.log('[Store] Transaction soft-deleted:', id);
			} catch (error) {
				const msg = error instanceof Error ? error.message : 'Unknown error';
				console.error('[Store] deleteTransaction failed:', msg);
				update((s) => ({
					...s,
					dbError: `Failed to delete transaction: ${msg}`
				}));
				throw error;
			}
		},

		// ===== Preferences (NEW: async) =====

		async updatePreferences(prefs: Partial<DashboardState>) {
			try {
				const now = Date.now();
				const dbPrefs = {
					key: 'user_settings' as const,
					mode: (prefs.mode || (await db.preferences.get('user_settings'))?.mode) as
						'dark' | 'light',
					accent: (prefs.accent || (await db.preferences.get('user_settings'))?.accent) as
						'green' | 'blue' | 'purple' | 'orange',
					budgets: prefs.budgets || (await db.preferences.get('user_settings'))?.budgets || {},
					toggles: prefs.toggles || (await db.preferences.get('user_settings'))?.toggles || {},
					updatedAt: now
				};

				await db.preferences.put(dbPrefs);

				update((s) => ({
					...s,
					mode: dbPrefs.mode,
					accent: dbPrefs.accent,
					budgets: dbPrefs.budgets,
					toggles: dbPrefs.toggles,
					dbError: ''
				}));

				console.log('[Store] Preferences updated');
			} catch (error) {
				const msg = error instanceof Error ? error.message : 'Unknown error';
				console.error('[Store] updatePreferences failed:', msg);
				update((s) => ({
					...s,
					dbError: `Failed to update preferences: ${msg}`
				}));
				throw error;
			}
		},

		// ===== Edit/Delete Modal State (NEW) =====

		startEditTransaction: (id: number) => {
			const tx = db.transactions.get(id);
			tx.then((t) => {
				if (t) {
					update((s) => ({
						...s,
						modal: true,
						modalMode: 'edit',
						editingId: id,
						kind: t.type === 'income' ? 'Ingreso' : 'Gasto',
						amount: t.amount.toString(),
						name: t.name,
						formCat: t.cat || 'life',
						error: ''
					}));
				}
			});
		},

		clearEditingTransaction: () =>
			update((s) => ({
				...s,
				editingId: null,
				modalMode: 'create'
			})),

		openDeleteConfirmation: (id: number, name: string) =>
			update((s) => ({
				...s,
				deleteConfirmation: true,
				deleteConfirmationId: id,
				deleteConfirmationName: name
			})),

		closeDeleteConfirmation: () =>
			update((s) => ({
				...s,
				deleteConfirmation: false,
				deleteConfirmationId: null,
				deleteConfirmationName: ''
			})),

		// ===== Existing methods (unchanged) =====

		setView: (view: DashboardState['view']) => update((s) => ({ ...s, view })),
		setRange: (range: DashboardState['range']) => update((s) => ({ ...s, range })),
		setMode: (mode: 'dark' | 'light') => {
			update((s) => ({ ...s, mode }));
		},
		setAccent: (accent: 'green' | 'blue' | 'purple' | 'orange') => {
			update((s) => ({ ...s, accent }));
		},
		openModal: () =>
			update((s) => ({ ...s, modal: true, error: '', modalMode: 'create', editingId: null })),
		closeModal: () =>
			update((s) => ({
				...s,
				modal: false,
				error: '',
				modalMode: 'create',
				editingId: null,
				amount: '',
				name: '',
				kind: 'Gasto',
				formCat: 'life'
			})),
		setKind: (kind: 'Gasto' | 'Ingreso') => update((s) => ({ ...s, kind })),
		setAmount: (amount: string) => update((s) => ({ ...s, amount, error: '' })),
		setName: (name: string) => update((s) => ({ ...s, name })),
		setFormCat: (formCat: string) => update((s) => ({ ...s, formCat })),
		setQuery: (query: string) => update((s) => ({ ...s, query })),
		setInsight: (offset: number) => update((s) => ({ ...s, insight: (s.insight + offset) % 4 })),
		toggleCategory: (catId: string) =>
			update((s) => ({ ...s, open: { ...s.open, [catId]: !s.open[catId] } })),
		toggleSetting: (key: string) =>
			update((s) => ({
				...s,
				toggles: { ...s.toggles, [key]: !s.toggles[key] }
			})),
		showToast: (msg: string) => {
			update((s) => ({ ...s, toast: msg }));
			setTimeout(() => update((s) => ({ ...s, toast: '' })), 3400);
		},
		setError: (error: string) => update((s) => ({ ...s, error }))
	};
}

export const dashboard = createDashboardStore();
export { CATEGORIES };

// Helper: Convert DBTransaction to UI Transaction
function txToUI(tx: DBTransaction): Transaction {
	return {
		id: tx.id,
		name: tx.name,
		cat: tx.cat,
		amount: tx.amount,
		date: tx.date,
		type: tx.type
	};
}
