# FASE 2 — DISEÑO DE PERSISTENCIA LOCAL-FIRST

**Fecha:** 2026-09-22  
**Estado:** Diseño (sin implementación)  
**Objetivo:** Transición de SEED hardcodeado → IndexedDB con Dexie → Store sincronizado

---

## 1. ARQUITECTURA PROPUESTA

### Flujo Actual (Fase 1)
```
SEED (hardcoded)
    ↓
Svelte writable store
    ↓
Componentes (Modal, Dashboard, TransactionList)
    ↓
UI re-render
    ↓
❌ Recarga = datos perdidos
```

### Flujo Futuro (Fase 2)
```
IndexedDB (Dexie)
    ↑↓ (sync bidireccional)
Svelte writable store (caché en memoria)
    ↓
Componentes (sin cambios)
    ↓
UI re-render
    ↓
✅ Recarga = datos persisten
```

### Arquitectura de Capas

```
┌─────────────────────────────────┐
│     Componentes Svelte          │
│  (Modal, Dashboard, Settings)   │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│   Store API (enhanced)          │
│  loadData()                     │
│  addTransaction()               │
│  updateTransaction()            │
│  deleteTransaction()            │
│  updatePreferences()            │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│  Persistence Layer (new)        │
│  - IndexedDB operations         │
│  - Error handling               │
│  - Migration strategy           │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│  IndexedDB (Dexie)              │
│  - transactions table           │
│  - preferences table            │
│  - metadata table               │
└─────────────────────────────────┘
```

**Principios:**
- Store sigue siendo caché en memoria (no cambia API de componentes)
- IndexedDB es source of truth
- Componentes no saben de DB directamente
- Sincronización bidireccional: UI ↔ Store ↔ DB
- Sin polling, event-driven donde posible

---

## 2. CAMBIOS NECESARIOS

### Archivos a Crear

```
src/lib/db/
├── index.ts              (Dexie setup + schema)
├── schema.ts             (table definitions, indexes)
├── migrations.ts         (version control, data upgrades)
├── types.ts              (DomainTransaction, UserPreferences, etc.)
├── repository.ts         (abstract interface for CQRS-like pattern)
└── web-repository.ts     (IndexedDB implementation)
```

### Archivos a Modificar

```
src/lib/
├── store.ts              (add load/save methods, enhance API)
├── types.ts or store.ts  (export types for better typing)
└── +layout.svelte        (call loadData() on mount)
```

### Archivos Sin Cambios

```
src/lib/components/
├── Modal.svelte          (usa dashboard.addTransaction — sin cambios)
├── Header.svelte         (sin cambios)
├── pages/Dashboard.svelte
├── pages/TransactionList.svelte
├── pages/Coach.svelte
├── pages/Settings.svelte
```

### Dependencias a Agregar

```json
{
  "dependencies": {
    "dexie": "^4.0.7"
  }
}
```

---

## 3. MODELO DE DATOS

### Schema IndexedDB (Dexie)

#### 1. Tabla: `transactions`
```typescript
interface DBTransaction {
  id: number;                          // Primary key (auto-increment)
  name: string;
  cat: string | null;                  // Foreign key → categories.id
  amount: number;
  date: string;                        // ISO 8601 "2026-09-22"
  type: 'income' | 'expense';
  createdAt: number;                   // timestamp (sync-ready)
  updatedAt: number;                   // timestamp (soft-delete support)
  deleted: boolean;                    // soft-delete flag (future: cloud sync)
}

// Índices
db.transactions
  .primary('id')
  .index('date')                       // range queries: "Sept 2026"
  .index('cat')                        // filter by category
  .index('type')                       // filter by income/expense
  .index('createdAt')                  // time-based queries
  .index('deleted')                    // exclude deleted in queries
```

#### 2. Tabla: `preferences`
```typescript
interface DBPreferences {
  key: string;                         // Primary key ("user_settings")
  mode: 'dark' | 'light';
  accent: 'green' | 'blue' | 'purple' | 'orange';
  toggles: {
    alerts: boolean;
    roundup: boolean;
    weekly: boolean;
    sync: boolean;
  };
  budgets: Record<string, number>;     // { "fixed": 3200, ... }
  updatedAt: number;
}
```

#### 3. Tabla: `metadata`
```typescript
interface DBMetadata {
  key: string;                         // Primary key ("app_meta")
  version: number;                     // Schema version for migrations
  lastSyncAt: number;                  // Future: cloud sync timestamp
  nextId: number;                      // Auto-increment seed (instead of store)
}
```

#### 4. Tabla: `categories` (immutable reference data)
```typescript
interface DBCategory {
  id: string;                          // Primary key ("fixed", "debt", etc.)
  name: string;
  sub: string;
  icon: string;                        // SVG path
  hue: string;                         // Color hex
}
```

### Relaciones & Constraints

- **Foreign Key:** `transactions.cat` → `categories.id` (enforced in app layer)
- **Unique:** `preferences.key` = "user_settings" (singleton pattern)
- **Unique:** `metadata.key` = "app_meta" (singleton pattern)
- **Cascade:** No delete-cascade (soft-delete used instead)

### Migración de Datos

```
Version 1 (initial):
  ✅ transactions
  ✅ preferences
  ✅ metadata
  ✅ categories (seed)

Future versions (e.g., v2):
  - Add fields to schema
  - Transform existing data
  - Update indexes
  - Handle old data format
```

---

## 4. STORE — Cambios de API

### Estado Actual (store.ts)

```typescript
function createDashboardStore() {
  const initial = { txs: SEED, ... };
  const { subscribe, update } = writable(initial);
  
  return {
    addTransaction,    // ❌ No persiste
    // ❌ No updateTransaction
    // ❌ No deleteTransaction
  };
}
```

### Estado Futuro (enhanced store.ts)

```typescript
function createDashboardStore() {
  const { subscribe, set, update } = writable(initial);
  let db: Database;  // Dexie instance
  
  return {
    // ===== New: Initialization & Loading =====
    
    async initialize() {
      // 1. Open DB connection
      // 2. Run migrations if needed
      // 3. Load data from DB into store
      // 4. Handle errors gracefully
      db = new Database();
      await db.open();
      await loadData();
    },
    
    async loadData() {
      // Load transactions, preferences, metadata from DB
      // Update store with loaded data
      // Handle empty DB (new user)
    },
    
    // ===== Transaction Management =====
    
    async addTransaction(tx: Omit<Transaction, 'id'>) {
      // 1. Generate ID from metadata.nextId
      // 2. Validate data
      // 3. Insert into DB
      // 4. Update store
      // 5. Return created tx with ID
      // 6. Show toast on success
      // 7. Handle DB errors
      const id = await db.getNextId();
      const dbTx: DBTransaction = {
        ...tx,
        id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deleted: false
      };
      await db.transactions.add(dbTx);
      update((s) => ({
        ...s,
        txs: [txToUI(dbTx), ...s.txs],
        nextId: s.nextId + 1
      }));
    },
    
    async updateTransaction(id: number, changes: Partial<Transaction>) {
      // 1. Validate ID exists
      // 2. Merge with existing data
      // 3. Update DB
      // 4. Update store
      // 5. Handle errors
      await db.transactions.update(id, {
        ...changes,
        updatedAt: Date.now()
      });
      update((s) => ({
        ...s,
        txs: s.txs.map((t) => t.id === id ? { ...t, ...changes } : t)
      }));
    },
    
    async deleteTransaction(id: number) {
      // Soft-delete: set deleted=true, updatedAt=now
      // (hard-delete available later if needed)
      await db.transactions.update(id, {
        deleted: true,
        updatedAt: Date.now()
      });
      update((s) => ({
        ...s,
        txs: s.txs.filter((t) => t.id !== id)
      }));
    },
    
    // ===== Preferences =====
    
    async updatePreferences(prefs: Partial<DBPreferences>) {
      // Update mode, accent, budgets, toggles
      // Persist to DB
      await db.preferences.put({
        key: 'user_settings',
        ...prefs,
        updatedAt: Date.now()
      });
      update((s) => ({
        ...s,
        mode: prefs.mode ?? s.mode,
        accent: prefs.accent ?? s.accent,
        budgets: prefs.budgets ?? s.budgets,
        toggles: prefs.toggles ?? s.toggles
      }));
    },
    
    // ===== Existing Methods (unchanged) =====
    
    setView, setRange, setMode, setAccent,
    setKind, setAmount, setName, setFormCat,
    setQuery, setError, showToast,
    openModal, closeModal,
    toggleCategory, toggleSetting,
    
    // ===== Error Handling =====
    
    onError: (handler: (error: DBError) => void) => {
      // Callback for DB errors
      // Modal: "No se pudo guardar. Reintenta."
    }
  };
}
```

### Cambios Mínimos en Componentes

**Modal.svelte:**
```typescript
const handleSubmit = async () => {
  // Sin cambios en la UI
  // dashboard.addTransaction() ahora es async pero se llama igual
  await dashboard.addTransaction(tx);  // ← await nuevo
  dashboard.showToast('Registrado');
};
```

**+layout.svelte (onMount):**
```typescript
import { onMount } from 'svelte';

onMount(async () => {
  await dashboard.initialize();  // Cargar datos de DB
});
```

---

## 5. MIGRACIÓN: SEED → IndexedDB

### Estrategia (Sin Pérdida de Datos)

#### Paso 1: Detección de Estado
```typescript
async function initialize() {
  const meta = await db.metadata.get('app_meta');
  
  if (meta?.version === 1) {
    // DB ya existe, cargar datos
    return loadData();
  } else {
    // Primera ejecución
    return seedDatabase();
  }
}
```

#### Paso 2: Seed (Primera Ejecución)
```typescript
async function seedDatabase() {
  // 1. Insert categories (reference data)
  await db.categories.bulkAdd(CATEGORIES);
  
  // 2. Insert SEED transactions
  const seedTxs = SEED.map((tx) => ({
    ...tx,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    deleted: false
  }));
  await db.transactions.bulkAdd(seedTxs);
  
  // 3. Insert preferences (defaults)
  await db.preferences.put({
    key: 'user_settings',
    mode: 'dark',
    accent: 'green',
    toggles: { alerts: true, roundup: true, weekly: false, sync: true },
    budgets: { fixed: 3200, debt: 1450, life: 1100, exit: 900 },
    updatedAt: Date.now()
  });
  
  // 4. Insert metadata
  await db.metadata.put({
    key: 'app_meta',
    version: 1,
    lastSyncAt: 0,
    nextId: 100  // = SEED.length + 1
  });
  
  // 5. Load data into store
  return loadData();
}
```

#### Paso 3: Cargar en Store
```typescript
async function loadData() {
  const [txs, prefs, meta] = await Promise.all([
    db.transactions.where('deleted').equals(false).toArray(),
    db.preferences.get('user_settings'),
    db.metadata.get('app_meta')
  ]);
  
  dashboard.set({
    txs: txs.map(txToUI),
    mode: prefs?.mode || 'dark',
    accent: prefs?.accent || 'green',
    budgets: prefs?.budgets || DEFAULT_BUDGETS,
    toggles: prefs?.toggles || DEFAULT_TOGGLES,
    nextId: meta?.nextId || 100,
    // ... resto de state
  });
}
```

#### Paso 4: Detección de Cambios Externos
```
┌─────────────────────────────────────┐
│ App Restart                         │
│ 1. Check metadata.version           │
│ 2. If != currentVersion → migrate() │
│ 3. Load data                        │
└─────────────────────────────────────┘
```

### Garantías de No Pérdida

✅ SEED se importa solo en primera ejecución  
✅ Meta-tabla trackea versión para migraciones futuras  
✅ Transacciones user-creadas se guardan inmediatamente  
✅ No hay borrado de datos entre versiones  

---

## 6. COMPATIBILIDAD FUTURA: Flutter + SQLite/Drift

### Arquitectura Compartida (Domain-Driven)

```
lempir_app/
├── shared/
│   ├── lib/models/
│   │   ├── transaction.dart      (Dart: equatable + codegen)
│   │   ├── category.dart
│   │   └── preferences.dart
│   └── lib/repository.dart       (Abstract interface)
│
├── finance-dashboard/            (Web, Svelte)
│   └── src/lib/db/
│       ├── types.ts              (TypeScript: same shape)
│       └── web-repository.ts     (IndexedDB implementation)
│
└── lib/ (Flutter)
    └── data/
        ├── datasources/
        │   └── local_datasource.dart  (SQLite via Drift)
        └── repository_impl.dart       (Repository implementation)
```

### Pattern: Repository

**Interfaz (Compartida en Concepto)**
```typescript
interface IRepository {
  // Transacciones
  getTransactions(): Promise<Transaction[]>;
  addTransaction(tx: Transaction): Promise<void>;
  updateTransaction(id: number, changes: Partial<Transaction>): Promise<void>;
  deleteTransaction(id: number): Promise<void>;
  
  // Preferences
  getPreferences(): Promise<Preferences>;
  updatePreferences(prefs: Partial<Preferences>): Promise<void>;
}
```

**Web Implementation (IndexedDB)**
```typescript
class WebRepository implements IRepository {
  constructor(private db: Database) {}
  
  async getTransactions() {
    return db.transactions.where('deleted').equals(false).toArray();
  }
  
  async addTransaction(tx) {
    await db.transactions.add(tx);
  }
}
```

**Mobile Implementation (SQLite/Drift)**
```dart
class MobileRepository implements IRepository {
  final AppDatabase database;
  
  Future<List<Transaction>> getTransactions() {
    return (database.select(database.transactions)
        ..where((t) => t.deleted.equals(false)))
      .get();
  }
  
  Future<void> addTransaction(Transaction tx) async {
    await database.into(database.transactions).insert(tx);
  }
}
```

### Sincronización Futura (Phase 5)

```
Web (IndexedDB)              Mobile (SQLite)
    ↓                            ↓
    └────→ Cloud Sync Service ←──┘
               (JSON)
               
- Export: DB → JSON
- Import: JSON → DB
- Merge strategy: last-write-wins (timestamps)
- Soft-delete enables proper sync (no data loss)
```

---

## 7. RIESGOS IDENTIFICADOS

### 🔴 Crítico (Implementación Obligatoria)

**1. Pérdida de datos durante migración SEED → DB**
- **Escenario:** Usuario recarga app, SEED se reinicializa, sobrescribe datos
- **Causa:** Sin logic para detectar "ya existe DB"
- **Mitigación:** 
  - Usar metadata.version para detectar estado
  - Seed solo en primera ejecución
  - Test exhaustivo antes de push

**2. Inconsistencia Store ↔ DB**
- **Escenario:** addTransaction() falla en DB, pero store se actualiza (optimistic update)
- **Causa:** Sin rollback logic
- **Mitigación:**
  - Await DB operation primero
  - Update store después
  - Mostrar error → revertir store

**3. IndexedDB no soportado (navegadores antiguos)**
- **Escenario:** Safari 10, IE 11 sin IndexedDB
- **Causa:** Proyecto no especifica browser support
- **Mitigación:**
  - Detectar soporte en initialize()
  - Fallback a localStorage (degraded mode)
  - Warning en console

---

### 🟡 Alto (Considerar en V1)

**4. Quota de almacenamiento agotada**
- **Escenario:** User con 50,000 transacciones → quota exceeded
- **Mitigación:**
  - Usar Dexie.js (mejor compresión que raw IDB)
  - Opcional: archiving old transactions
  - Warning: "Almacenamiento casi lleno"

**5. Rendimiento en queries grandes**
- **Escenario:** Dashboard con 10,000 txs → lento al calcular
- **Mitigación:**
  - Index bien diseñados (date, cat, type)
  - Paginación en TransactionList (no cargar todo)
  - $derived de Svelte 5 optimiza re-renders

**6. Errores de IndexedDB no manejados**
- **Escenario:** DB transaction falla, usuario no sabe qué pasó
- **Mitigación:**
  - Try-catch en cada operation
  - Error modal: "No se pudo guardar. Reintenta."
  - Log to console para debugging

---

### 🟢 Medio (Post-V1)

**7. Sincronización manual JSON es engorrosa**
- **Escenario:** User quiere backup/restore
- **Causa:** Sin UI para export/import
- **Mitigación:** Phase 3 feature

**8. No hay historial de cambios (audit log)**
- **Escenario:** "Quién borró esta transacción?" → imposible saber
- **Causa:** Sin change log table
- **Mitigación:** Phase 4 feature (soft-delete + timestamps suficiente por ahora)

---

## 8. PLAN DE IMPLEMENTACIÓN (Pasos Pequeños)

### Sprint 1: Setup + Schema (1 día)

**1.1 Instalación (30 min)**
```bash
npm install dexie
npm install --save-dev @types/dexie
```

**1.2 Crear `src/lib/db/index.ts` (1 hora)**
- Definir Database class
- Setup schema (transactions, preferences, metadata, categories)
- Versioning system
- Export db instance

**1.3 Crear `src/lib/db/types.ts` (30 min)**
- Export DBTransaction, DBPreferences, DBMetadata
- Asegurar tipos match store.ts

**1.4 Test básico (30 min)**
- npm run dev
- Verificar DB se abre sin errores en console

---

### Sprint 2: Migraciones + Load (1 día)

**2.1 Crear `src/lib/db/migrations.ts` (1 hora)**
- Seed function
- Load function
- Versioning logic

**2.2 Actualizar `src/lib/store.ts` (1.5 horas)**
- Agregar initialize() async
- Agregar loadData() async
- Mantener API existente sin cambios
- Add error handler

**2.3 Actualizar `src/routes/+layout.svelte` (30 min)**
- Import dashboard
- onMount: await dashboard.initialize()
- Handle loading state

**2.4 Test (30 min)**
- Reload app → data persiste
- Seed ONLY en primera ejecución
- Verify metadata.version in DevTools

---

### Sprint 3: CRUD Operations (1.5 días)

**3.1 Implement addTransaction (async) (1 hora)**
- Get nextId from metadata
- Insert into DB
- Update store
- Toast on success
- Error modal on failure

**3.2 Implement updateTransaction (1 hora)**
- Find in DB
- Update with timestamp
- Update store
- Revert on error

**3.3 Implement deleteTransaction (soft-delete) (1 hora)**
- Set deleted=true, updatedAt=now
- Update store
- Toast: "Eliminado (deshacer?)"

**3.4 Test Modal workflow (30 min)**
- Reload → new tx persists
- Edit tx → updates in real-time
- Delete tx → soft-deleted, not queried

---

### Sprint 4: Preferences + Cleanup (0.5 días)

**4.1 Implement updatePreferences (30 min)**
- mode, accent, budgets, toggles
- Persist to DB
- Update store

**4.2 Remove SEED from store.ts (20 min)**
- Keep CATEGORIES static (reference data)
- Move SEED logic to migrations.seedDatabase()

**4.3 Verify all tests pass (10 min)**
- npm run check
- No type errors

---

### Sprint 5: Documentation + Edge Cases (0.5 días)

**5.1 README updates (15 min)**
- How to test persistence
- How to clear DB (DevTools)

**5.2 Error handling robustness (15 min)**
- IndexedDB not supported → graceful fallback
- Quota exceeded → warning
- DB locked → retry logic

**5.3 Final integration test (20 min)**
- Full workflow: seed → add → edit → delete → reload
- No data loss
- All UI updates correctly

---

### Total Effort

- Setup: 1 day
- Load/Init: 1 day
- CRUD: 1.5 days
- Preferences: 0.5 days
- **Total: ~4 days (1 developer, 1 sprint)**

---

## Checklist de Implementación

- [ ] Dexie installed
- [ ] `src/lib/db/index.ts` created (Database class, schema)
- [ ] `src/lib/db/migrations.ts` created (seed, load, version logic)
- [ ] `src/lib/store.ts` updated (initialize, loadData, async methods)
- [ ] `src/routes/+layout.svelte` updated (onMount: initialize)
- [ ] Modal workflow tested (add → persists → reload)
- [ ] Preferences tested (mode, accent, toggles persist)
- [ ] Delete tested (soft-delete, not queried after)
- [ ] Error handling tested (offline, quota, locked)
- [ ] SEED removed from default store initialization
- [ ] All tests pass (`npm run check`)
- [ ] Browser DevTools: verify IndexedDB tables populated
- [ ] Documentation updated (SPEC_KIT, README)

---

## Conclusión

**Arquitectura propuesta:**
- ✅ Local-first: IndexedDB en web, SQLite en mobile
- ✅ Offline-first: App funciona sin internet
- ✅ Sync-ready: Soft-delete + timestamps = future cloud sync
- ✅ Minimal UI changes: Store pattern persiste, componentes sin cambios
- ✅ Type-safe: TypeScript interfaces compartidas
- ✅ Escalable: Pattern repository = fácil agregar backends

**Siguientes pasos:**
1. Ejecutar Phase 2 (persistencia) — 4 días
2. Phase 3: Export/Import JSON, Archiving
3. Phase 4: UI para editar transacciones, soft-delete recovery
4. Phase 5: Cloud sync, Auth, Multi-user

