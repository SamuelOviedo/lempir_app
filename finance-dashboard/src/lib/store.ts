import { writable } from 'svelte/store';

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
  kind: 'Gasto' | 'Ingreso';
  amount: string;
  name: string;
  formCat: string;
  error: string;
  toast: string;
  query: string;
  nextId: number;
  mode: 'dark' | 'light';
  accent: 'green' | 'blue' | 'purple' | 'orange';
  budgets: Record<string, number>;
  toggles: Record<string, boolean>;
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

const SEED: Transaction[] = [
  { id: 1, name: 'Alquiler del apartamento', cat: 'fixed', amount: 1850, date: '1 sep', type: 'expense' },
  { id: 2, name: 'Anticipo de diseño — Northline', cat: null, amount: 4200, date: '1 sep', type: 'income' },
  { id: 3, name: 'Tarjeta Visa — mínimo + extra', cat: 'debt', amount: 620, date: '2 sep', type: 'expense' },
  { id: 4, name: 'Seguro médico', cat: 'fixed', amount: 412, date: '2 sep', type: 'expense' },
  { id: 5, name: 'Supermercado — Mercado Sur', cat: 'life', amount: 186, date: '3 sep', type: 'expense' },
  { id: 6, name: 'Préstamo del auto', cat: 'debt', amount: 388, date: '4 sep', type: 'expense' },
  { id: 7, name: 'Inversión automática — bróker', cat: 'exit', amount: 500, date: '5 sep', type: 'expense' },
  { id: 8, name: 'Nómina — Ostara Studio', cat: null, amount: 3900, date: '5 sep', type: 'income' },
  { id: 9, name: 'Luz + agua', cat: 'fixed', amount: 231, date: '6 sep', type: 'expense' },
  { id: 10, name: 'Cena — Casa Lupe', cat: 'life', amount: 94, date: '6 sep', type: 'expense' },
];

function createDashboardStore() {
  const initial: DashboardState = {
    view: 'dashboard',
    range: 'Este mes',
    txs: SEED,
    open: {},
    insight: 0,
    modal: false,
    kind: 'Gasto',
    amount: '',
    name: '',
    formCat: 'life',
    error: '',
    toast: '',
    query: '',
    nextId: 100,
    mode: 'dark',
    accent: 'green',
    budgets: { fixed: 3200, debt: 1450, life: 1100, exit: 900 },
    toggles: { alerts: true, roundup: true, weekly: false, sync: true }
  };

  const { subscribe, set, update } = writable(initial);

  return {
    subscribe,
    setView: (view: DashboardState['view']) => update(s => ({ ...s, view })),
    setRange: (range: DashboardState['range']) => update(s => ({ ...s, range })),
    setMode: (mode: 'dark' | 'light') => update(s => ({ ...s, mode })),
    setAccent: (accent: 'green' | 'blue' | 'purple' | 'orange') =>
      update(s => ({ ...s, accent })),
    openModal: () => update(s => ({ ...s, modal: true, error: '' })),
    closeModal: () => update(s => ({ ...s, modal: false, error: '' })),
    setKind: (kind: 'Gasto' | 'Ingreso') => update(s => ({ ...s, kind })),
    setAmount: (amount: string) => update(s => ({ ...s, amount, error: '' })),
    setName: (name: string) => update(s => ({ ...s, name })),
    setFormCat: (formCat: string) => update(s => ({ ...s, formCat })),
    setQuery: (query: string) => update(s => ({ ...s, query })),
    setInsight: (offset: number) =>
      update(s => ({ ...s, insight: (s.insight + offset) % 4 })),
    toggleCategory: (catId: string) =>
      update(s => ({ ...s, open: { ...s.open, [catId]: !s.open[catId] } })),
    toggleSetting: (key: string) =>
      update(s => ({
        ...s,
        toggles: { ...s.toggles, [key]: !s.toggles[key] }
      })),
    addTransaction: (tx: Omit<Transaction, 'id'>) =>
      update(s => ({
        ...s,
        txs: [{ ...tx, id: s.nextId }, ...s.txs],
        nextId: s.nextId + 1,
        modal: false,
        amount: '',
        name: '',
        error: ''
      })),
    showToast: (msg: string) => {
      update(s => ({ ...s, toast: msg }));
      setTimeout(() => update(s => ({ ...s, toast: '' })), 3400);
    },
    setError: (error: string) => update(s => ({ ...s, error }))
  };
}

export const dashboard = createDashboardStore();
export { CATEGORIES };
