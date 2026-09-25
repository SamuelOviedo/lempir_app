import { writable, get } from 'svelte/store';
import { dbTransactionToUI } from './db/types';
import type { PreferencesChanges, PreferenceToggles } from './db/repository';
import { financeService } from './services';
import type { FinanceService } from './services';

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
	deleteConfirmation: boolean; // Delete confirmation modal visibility
	deleteConfirmationId: number | null; // Id of tx to delete
	deleteConfirmationName: string; // Name of tx to delete
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

export interface AccentOption {
	id: DashboardState['accent'];
	label: string;
	acc: string;
	accd: string;
}

/** Accent palette shown in the appearance settings (CSS variables live in app.css). */
const ACCENTS: AccentOption[] = [
	{ id: 'green', label: 'Verde', acc: '#5affa0', accd: '#22a865' },
	{ id: 'blue', label: 'Azul', acc: '#6aa8ff', accd: '#2563eb' },
	{ id: 'purple', label: 'Púrpura', acc: '#b48cff', accd: '#7c3aed' },
	{ id: 'orange', label: 'Naranja', acc: '#ffab5e', accd: '#e07a17' }
];

export const MONTHS_ES = [
	'ene',
	'feb',
	'mar',
	'abr',
	'may',
	'jun',
	'jul',
	'ago',
	'sep',
	'oct',
	'nov',
	'dic'
] as const;

/** Formats a date in the "D mon" shape used by stored transactions (e.g. "24 sep"). */
export function formatTxDate(date: Date = new Date()): string {
	return `${date.getDate()} ${MONTHS_ES[date.getMonth()]}`;
}

/** Month index (0-11) of a transaction date ("D mon" or ISO). Returns -1 if unparseable. */
export function txMonthIndex(date: string): number {
	const value = date.trim().toLowerCase();
	const iso = /^\d{4}-(\d{2})/.exec(value);
	if (iso) {
		const m = Number(iso[1]) - 1;
		return m >= 0 && m < 12 ? m : -1;
	}
	const abbr = value.split(/\s+/)[1]?.slice(0, 3);
	return abbr ? MONTHS_ES.indexOf(abbr as (typeof MONTHS_ES)[number]) : -1;
}

/**
 * Whether a transaction date falls inside the selected dashboard range.
 * Stored dates carry no year, so ranges are month-based relative to `now`.
 * Unparseable dates are always included (never hide data).
 */
export function isInRange(
	date: string,
	range: DashboardState['range'],
	now: Date = new Date()
): boolean {
	const m = txMonthIndex(date);
	if (m < 0) return true;
	const current = now.getMonth();
	if (range === 'Este mes') return m === current;
	if (range === 'Trimestre') return (current - m + 12) % 12 < 3;
	return m <= current;
}

/** Number of months covered by a range (used to scale monthly budgets). */
export function rangeMonths(range: DashboardState['range'], now: Date = new Date()): number {
	if (range === 'Este mes') return 1;
	if (range === 'Trimestre') return 3;
	return now.getMonth() + 1;
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Unknown error');

export function createDashboardStore(service: FinanceService = financeService) {
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

	const store = writable(initial);
	const { subscribe, set, update } = store;

	/**
	 * Optimistic preference update: apply patch in memory, persist via service,
	 * roll back the touched fields if persistence fails (dbError is set).
	 */
	async function persistPreferences(changes: PreferencesChanges, patch: Partial<DashboardState>) {
		const before = get(store);
		const rollback = Object.fromEntries(
			Object.keys(patch).map((k) => [k, before[k as keyof DashboardState]])
		) as Partial<DashboardState>;

		update((s) => ({ ...s, ...patch }));

		try {
			await service.savePreferences(changes);
			update((s) => ({ ...s, dbError: '' }));
		} catch (error) {
			const msg = errorMessage(error);
			console.error('[Store] Saving preferences failed:', msg);
			update((s) => ({ ...s, ...rollback, dbError: `Failed to save preferences: ${msg}` }));
		}
	}

	return {
		subscribe,

		// ===== Initialization =====

		async initialize() {
			try {
				const { txs, preferences, nextId } = await service.loadSnapshot();

				set({
					...initial,
					txs: txs.map(dbTransactionToUI),
					mode: preferences?.mode || initial.mode,
					accent: preferences?.accent || initial.accent,
					budgets: preferences?.budgets || initial.budgets,
					toggles: preferences?.toggles || initial.toggles,
					nextId: nextId || initial.nextId,
					initialized: true
				});

				console.log('[Store] Initialization complete. Loaded', txs.length, 'transactions.');
			} catch (error) {
				const msg = errorMessage(error);
				console.error('[Store] Initialization failed:', msg);
				update((s) => ({
					...s,
					dbError: `Failed to initialize: ${msg}`,
					initialized: false
				}));
				throw error;
			}
		},

		// ===== Transaction CRUD (DB-first via service) =====

		async addTransaction(tx: Omit<Transaction, 'id'>) {
			try {
				const created = await service.addTransaction(tx);

				update((s) => ({
					...s,
					txs: [dbTransactionToUI(created), ...s.txs],
					nextId: created.id + 1,
					modal: false,
					amount: '',
					name: '',
					error: '',
					dbError: ''
				}));

				console.log('[Store] Transaction added:', created.id);
			} catch (error) {
				const msg = errorMessage(error);
				console.error('[Store] addTransaction failed:', msg);
				update((s) => ({ ...s, dbError: `Failed to add transaction: ${msg}` }));
				throw error;
			}
		},

		async updateTransaction(id: number, changes: Partial<Omit<Transaction, 'id'>>) {
			try {
				await service.updateTransaction(id, changes);

				update((s) => ({
					...s,
					txs: s.txs.map((t) => (t.id === id ? { ...t, ...changes } : t)),
					dbError: ''
				}));

				console.log('[Store] Transaction updated:', id);
			} catch (error) {
				const msg = errorMessage(error);
				console.error('[Store] updateTransaction failed:', msg);
				update((s) => ({ ...s, dbError: `Failed to update transaction: ${msg}` }));
				throw error;
			}
		},

		async deleteTransaction(id: number) {
			try {
				await service.deleteTransaction(id);

				update((s) => ({
					...s,
					txs: s.txs.filter((t) => t.id !== id),
					dbError: ''
				}));

				console.log('[Store] Transaction soft-deleted:', id);
			} catch (error) {
				const msg = errorMessage(error);
				console.error('[Store] deleteTransaction failed:', msg);
				update((s) => ({ ...s, dbError: `Failed to delete transaction: ${msg}` }));
				throw error;
			}
		},

		// ===== Preferences (persisted in IndexedDB) =====

		async updatePreferences(prefs: PreferencesChanges) {
			try {
				const saved = await service.savePreferences(prefs);

				update((s) => ({
					...s,
					mode: saved.mode,
					accent: saved.accent,
					budgets: saved.budgets,
					toggles: saved.toggles,
					dbError: ''
				}));

				console.log('[Store] Preferences updated');
			} catch (error) {
				const msg = errorMessage(error);
				console.error('[Store] updatePreferences failed:', msg);
				update((s) => ({ ...s, dbError: `Failed to update preferences: ${msg}` }));
				throw error;
			}
		},

		setMode: (mode: DashboardState['mode']) => persistPreferences({ mode }, { mode }),

		setAccent: (accent: DashboardState['accent']) => persistPreferences({ accent }, { accent }),

		toggleSetting: (key: string) => {
			const current = get(store).toggles;
			const value = !current[key];
			return persistPreferences(
				{ toggles: { [key]: value } as Partial<PreferenceToggles> },
				{ toggles: { ...current, [key]: value } }
			);
		},

		// ===== Edit/Delete Modal State =====

		async startEditTransaction(id: number) {
			try {
				const t = await service.getTransaction(id);
				if (!t) return;
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
			} catch (error) {
				const msg = errorMessage(error);
				console.error('[Store] startEditTransaction failed:', msg);
				update((s) => ({ ...s, dbError: `Failed to load transaction: ${msg}` }));
			}
		},

		clearEditingTransaction: () => update((s) => ({ ...s, editingId: null, modalMode: 'create' })),

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

		// ===== UI-only state (not persisted) =====

		setView: (view: DashboardState['view']) => update((s) => ({ ...s, view })),
		setRange: (range: DashboardState['range']) => update((s) => ({ ...s, range })),
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
		showToast: (msg: string) => {
			update((s) => ({ ...s, toast: msg }));
			setTimeout(() => update((s) => ({ ...s, toast: '' })), 3400);
		},
		setError: (error: string) => update((s) => ({ ...s, error })),
		clearDbError: () => update((s) => ({ ...s, dbError: '' }))
	};
}

export const dashboard = createDashboardStore();
export { CATEGORIES, ACCENTS };
