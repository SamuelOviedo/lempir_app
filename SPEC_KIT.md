# Spec Kit — lempir_app

**Version:** 2.1 — Local Persistence (Web) Implemented  
**Date:** 2026-09-24 (v2.0: 2026-09-09)  
**Status:** Active Development (Phase 1: Local Persistence — Web ✅ / Mobile ⏳)

> **Nota de nomenclatura de fases:** `PHASE2_PERSISTENCE_DESIGN.md` usa "Fase 1 = prototipo con mock data" y "Fase 2 = persistencia local". En este Spec Kit el roadmap (§7) empieza después del prototipo, así que **"Fase 2" del documento de diseño = "Phase 1: Local Persistence" de este spec**. El prototipo mock es la **Phase 0**. Ver §8.

---

## 1. Project Overview

**lempir_app** es una aplicación de **finanzas personales multi-plataforma** (Web + Mobile). Enfoque: gestión de presupuesto, categorización de gastos, IA coaching, y ahorro orientado a metas.

**Nombre de la marca:** Ledgerly (visible en logo/header web)

**Alcance actual (v1.0):**

- ✅ Web dashboard: Visualización de transacciones, presupuestos, insights
- ✅ Persistencia local (web): Implementada con IndexedDB (Dexie.js) — transacciones, categorías, preferencias y metadata sobreviven a recargas
- ✅ CRUD offline (web): alta, edición y borrado lógico (soft-delete) de transacciones
- ❌ Backend: No existe (local-only; cloud sync en Phase 5)
- ❌ Mobile: Boilerplate Flutter sin desarrollo (sin Drift/Riverpod aún)
- ❌ Auth: No implementada (single-user local)

**Target audience:** Usuarios hispanos (esp. ES/latam) con interés en finanzas personales, control de deuda, y ahorro disciplinado.

---

## 2. Architecture Overview

### 2.1 Stack Actual

```
lempir_app/
├── finance-dashboard/          # Web (Svelte/SvelteKit)
│   ├── src/
│   │   ├── lib/                # Components + Logic
│   │   │   ├── store.ts        # State management (Svelte store, API `dashboard.*`)
│   │   │   ├── services/       # Casos de uso (store → services → repository)
│   │   │   ├── db/             # Dexie schema, migrations, repository contracts + impl
│   │   │   ├── test/           # Vitest + fake-indexeddb (db, repository, store)
│   │   │   ├── components/
│   │   │   │   ├── Header.svelte
│   │   │   │   ├── Modal.svelte
│   │   │   │   ├── DeleteConfirmationModal.svelte
│   │   │   │   └── pages/      # 4 views (Dashboard, Transactions, Coach, Settings)
│   │   └── routes/             # SvelteKit routing
│   ├── package.json            # Dependencies
│   ├── vitest.config.ts        # Test runner config
│   └── tailwind.config.ts       # Styling
├── lib/main.dart              # Flutter (Mobile) — boilerplate
├── android/                    # Android native
├── ios/                        # iOS native
└── test/                       # Flutter tests (boilerplate widget test)
```

### 2.2 Technology Decisions

| Layer             | Tech                                                               | Why                                                                                                     |
| ----------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| **Web UI**        | Svelte 5 + SvelteKit 2.63                                          | Reactivity, minimal boilerplate, good DX                                                                |
| **Styling**       | Tailwind CSS 4.3                                                   | Rapid prototyping, consistency                                                                          |
| **Type Safety**   | TypeScript 6                                                       | Catch errors early, better IDE support                                                                  |
| **Build**         | Vite 8                                                             | Fast builds, HMR                                                                                        |
| **Mobile**        | Flutter + Dart 3.11                                                | Cross-platform iOS/Android from single codebase                                                         |
| **Web Data**      | IndexedDB (Dexie.js)                                               | Transacciones, presupuestos, historial estructurado; indexable, queryable, offline-first                |
| **Web Prefs**     | IndexedDB (Dexie.js), tabla `preferences` (`key: 'user_settings'`) | Tema, acento, toggles y presupuestos en el mismo store transaccional que los datos (ver §8, 2026-09-24) |
| **Mobile Data**   | SQLite + Drift                                                     | Type-safe, reactive, ORM integrado, migrations automáticas                                              |
| **Mobile State**  | Riverpod + Drift streams                                           | Reactivity, caching, sync con DB local                                                                  |
| **State (Web)**   | Svelte stores + persistence layer                                  | Mantener patrón actual, agregar persistencia debajo                                                     |
| **Export/Import** | JSON (web + mobile)                                                | Backup local, cross-platform restore                                                                    |
| **Backend**       | TBD Phase 5 (Cloud Sync)                                           | Currently local-only; cloud optional future                                                             |
| **Auth**          | TBD Phase 5                                                        | Currently none (single-user local)                                                                      |

### 2.3 Data Model (UI / Store)

> Modelo expuesto por el store. El modelo persistido (`DBTransaction`, `DBCategory`, `DBPreferences`, `DBMetadata`) vive en `src/lib/db/types.ts` y añade `createdAt`, `updatedAt`, `deleted` (soft-delete). La conversión DB → UI se hace con `dbTransactionToUI`.

```typescript
// Transaction
{
  id: number
  name: string              // "Alquiler del apartamento"
  cat: string | null        // "fixed", "debt", "life", "exit" | null (income)
  amount: number            // 1850
  date: string              // "1 sep"
  type: 'income' | 'expense'
}

// Category (Budget)
{
  id: string                // "fixed", "debt", "life", "exit"
  name: string              // "Compromisos Fijos"
  sub: string               // "Alquiler, servicios, seguros"
  budget: number            // 3200 (monthly allocation)
  icon: string              // SVG path data
  hue: string               // "#7db9ff" (color)
}

// Dashboard State
{
  view: 'dashboard' | 'transactions' | 'coach' | 'settings'
  range: 'Este mes' | 'Trimestre' | 'Año'     // Time filter
  txs: Transaction[]
  modal: boolean                                // Add transaction modal open
  kind: 'Gasto' | 'Ingreso'                    // Modal: transaction type
  amount: string                                // Modal: input value
  name: string                                  // Modal: description
  formCat: string                               // Modal: selected category
  mode: 'dark' | 'light'                        // Theme
  accent: 'green' | 'blue' | 'purple' | 'orange' // Accent color
  budgets: Record<string, number>               // Cat ID → allocation
  toggles: { alerts, roundup, weekly, sync }   // Settings switches
  ...
}
```

### 2.4 Local-First / Offline-First Architecture

**Filosofía:** App funciona 100% sin internet. Datos persistidos localmente. Cloud sync opcional futura.

**Pattern:**

- **Domain layer:** Shared models (Transaction, Category, Budget, UserPreferences, AppMetadata)
- **Repository pattern:** Abstract interfaces → platform-specific implementations
- **Web:** Dexie.js (IndexedDB wrapper) + Svelte stores. Capas: `store.ts` → `services/finance-service.ts` → `db/repository.ts` (contratos) → `db/web-repository.ts` (Dexie)
- **Mobile:** SQLite (Drift ORM) + Riverpod providers
- **Export/Import:** JSON para backup y cross-platform transfer

**Data Persistence:**

- Transacciones, presupuestos, historial → IndexedDB (web) / SQLite (mobile)
- Preferencias (tema, acento, toggles, presupuestos) → IndexedDB `preferences` (web) / SQLite o SharedPreferences (mobile, por decidir en Phase 1 mobile)
- Migraciones automáticas con versionado
- Soft-delete support para future sync

**Capabilities:**

- ✅ Offline CRUD (add/edit/delete transactions)
- ✅ Data persist across app restarts
- ✅ Soft-delete + future sync support
- ✅ Export to JSON/CSV
- ✅ Import from backup
- ✅ Optional encryption (future)

**NOT included (Phase 5+):**

- ❌ Cloud sync / Remote backend
- ❌ Multi-user collaboration
- ❌ Authentication
- ❌ Real-time collaboration

---

## 3. Modules & Features

### 3.1 Finance Dashboard (Web) — ✅ IMPLEMENTED

#### 3.1.1 Dashboard View (Home)

**Purpose:** At-a-glance financial status.

**Components:**

- **Hero Cards (3):**
  - Ingresos Totales: Sum of income transactions + trend delta + count sources
  - Gastos Totales: Sum of expenses + trend delta + % of income spent
  - Efectivo Libre: Income - Expenses + trend delta + interpretation
  - Each card: progress bar (% of income or budget)

- **Budget Categories Grid:**
  - 4 category cards (Fixed, Debt, Lifestyle, Savings)
  - Per card: icon, name, subtitle, spent/budget, progress bar
  - Status badge: "En control" / "Ajustado" (85%+) / "Excedido"
  - Color-coded by category hue
  - Hover effect (slight lift)

- **Trend Chart (6 months):**
  - Bar chart: Efectivo libre over time (Apr—Sep)
  - Current month highlighted with gradient + glow
  - Shows % change vs. April

**Data source:** Svelte store (`dashboard.subscribe()`)  
**Interactions:** Range selector (This month / Quarterly / Yearly), "Add quick" button opens Modal

---

#### 3.1.2 Transactions View

**Purpose:** Detailed ledger of all money movements.

**Components:**

- **Search header:**
  - Real-time filter by name, merchant, category
  - Shows "X of Y" count
  - Placeholder: "Buscar transacciones, comercios, categorías…"

- **Transaction List:**
  - Per row: avatar (initials in category color), name, date + category, amount (±), type color
  - Hover highlight
  - Click → (future: detail modal)
  - Empty state: "No transactions found"

**Data source:** Computed from store (filter + map)  
**Interactions:** Search input changes, triggers reactivity

---

#### 3.1.3 Coach View (AI Insights)

**Purpose:** Financial guidance & goal tracking.

**Components:**

- **Main Insight Card:**
  - Emoji icon, title, description, CTA button
  - 4 insights in rotation (hardcoded for now, IA-ready)
  - Examples:
    - "Oportunidad de ahorro: Reduciendo restaurantes, podrías ahorrar $450/mes"
    - "Patrón de gasto: Transporte ↑32% este mes"
    - "Progreso: 78% hacia deuda cero"
    - "Alerta: Lifestyle en 92% presupuesto"

- **Other Insights Grid (2 cols):**
  - 3 remaining insights as tiles
  - Smaller cards, click-through

- **Timeline Section:**
  - "Hacia Deuda Cero"
  - Milestones: Oct 2026 ($2800), Jan 2027 ($1400), May 2027 (🎉)
  - Visual: dots + lines

**Data source:** Hardcoded (future: IA-generated)  
**Interactions:** Card rotation, click → detail

---

#### 3.1.4 Settings View

**Purpose:** User preferences & appearance.

**Components:**

- **Toggles Section:**
  - 4 switches: Alerts, Roundup, Weekly summary, Excel sync
  - Each: title, description, toggle button
  - Controlled by store (`dashboard.toggleSetting()`)

- **Appearance Section:**
  - **Theme Mode:** Dark / Light radio buttons
  - **Accent Color:** 4 color swatches (Green, Blue, Purple, Orange)
  - Current selection indicator
  - Visual feedback on hover

**Data source:** Store (`mode`, `accent`, `toggles`)  
**Interactions:** Click toggle/button → update store → UI re-render

---

#### 3.1.5 Header Component

**Purpose:** Navigation header, context display, quick actions.

**Layout:**

- Left: View title (e.g., "SEPTIEMBRE 2026 · ESTE MES") + subtitle (e.g., "Buenos días, Maya")
- Right:
  - Range selector (if on Dashboard) — Este mes / Trimestre / Año
  - "Añadir rápido" CTA button (green)

**Interactions:** Range selector → `dashboard.setRange()` → re-calc  
Button → opens Modal

---

#### 3.1.6 Modal Component

**Purpose:** Quick transaction entry.

**Layout:**

- Title: "Registrar movimiento"
- Close button (X)
- Kind tabs: Gasto / Ingreso (toggle, active state)
- Form:
  - **Monto:** Currency input ($), large font, centered
  - **Descripción:** Text input, placeholder varies by kind
  - **Categoría:** (Expense only) 4-button grid
  - **Error:** Red text below (if `state.error`)
  - **Submit:** Large button "Registrar [gasto/ingreso]"

**Interactions:**

- Close → `dashboard.closeModal()`
- Submit → validate amount > 0 → `dashboard.addTransaction()` → toast
- Show toast 3.4s then hide

**Validation:**

- Amount must be > 0 (parsed: remove dots, commas, currency)
- Name optional (defaults to "Gasto sin título" / "Ingreso sin título")
- Category required for expenses

---

#### 3.1.7 Sidebar Navigation

**Purpose:** Main navigation.

**Layout:**

- Logo: "Ledgerly" ($ icon + text)
- Nav menu: 4 buttons (Tablero, Transacciones, Entrenador, Configuración)
- Footer: User card (initials "M", "Maya García", "Cuenta activa")

**Active state:** Green highlight, light green background  
**Interactions:** Click → `dashboard.setView()`

---

### 3.2 Data & Calculations

#### Current (Persisted, IndexedDB)

- **10 seed transactions** (Sep 2026) in `db/migrations.ts` — inserted **only on first run** (detected via `metadata.version`); after that IndexedDB is the source of truth
- IDs for new transactions come from `metadata.nextId` (starts at 100)
- **4 budget categories** with fixed allocations:
  - Fixed: $3,200
  - Debt: $1,450
  - Lifestyle: $1,100
  - Savings: $900
- **Calculations** (reactive, Svelte `$:`):
  - Income sum, Expense sum, Leftover
  - Per-category: spent, budget, %, over/near/ok status
  - Trend: 6-month free cash chart data

#### Future (Phase 2+)

- Fetch from API
- Real-time sync across devices
- IA-generated insights (Coach page)
- Budget adjustments UI
- Recurring transactions
- Bill reminders

---

## 4. Features Matrix

| Feature                       | Status         | Notes                                                                 |
| ----------------------------- | -------------- | --------------------------------------------------------------------- |
| **View Transactions**         | ✅ Implemented | Dashboard + list + search                                             |
| **Add Transaction**           | ✅ Implemented | Modal with validation, persisted                                      |
| **Edit Transaction**          | ✅ Implemented | Modal in `edit` mode (`startEditTransaction`)                         |
| **Delete Transaction**        | ✅ Implemented | `DeleteConfirmationModal` + soft-delete                               |
| **Budget Tracking**           | ✅ Implemented | Per-category, visual progress                                         |
| **Spending Insights**         | ✅ Partially   | Coach page exists, hardcoded                                          |
| **Multi-theme**               | ✅ Implemented | Dark/Light + 4 accents, persisted in IndexedDB                        |
| **Data Persistence (Web)**    | ✅ Implemented | IndexedDB via Dexie (transactions, categories, preferences, metadata) |
| **Data Persistence (Mobile)** | ❌ Missing     | Drift + Riverpod pending                                              |
| **Automated Tests (Web)**     | ✅ Implemented | Vitest + fake-indexeddb (`src/lib/test/`)                             |
| **Backend API**               | ❌ Missing     | No server endpoints                                                   |
| **Authentication**            | ❌ Missing     | No user accounts                                                      |
| **Mobile UI**                 | ❌ Missing     | Flutter boilerplate only                                              |
| **Recurring Transactions**    | ❌ Backlog     | Future v2                                                             |
| **Budget Goals**              | ❌ Backlog     | Future v2                                                             |
| **Export (CSV/PDF)**          | ❌ Backlog     | Future v2                                                             |
| **Bank Integration**          | ❌ Backlog     | Future v2                                                             |
| **IA Personalized Coach**     | ❌ Backlog     | Coach page shell only                                                 |

---

## 5. Design System

### 5.1 Color Palette

**Primary Brand:**

- **Accent (Green):** `#5affa0` (primary), `#22a865` (dark variant)

**Semantic:**

- **Income:** `#5affa0` (green)
- **Expense (general):** `#ff8a8a` (red)
- **Debt:** `#ff8a8a` (red)
- **Savings/Exit:** `#8effc0` (light green)
- **Lifestyle:** `#ffc46b` (orange)
- **Fixed costs:** `#7db9ff` (blue)

**Backgrounds:**

- **Dark mode:** `--bg: #080b0f` (very dark blue-black)
- **Overlay:** `rgba(255,255,255,0.05)` to `0.14` (glassmorphism)
- **Text:** `--ink: #e6edf3` (light gray-white)
- **Muted:** `rgba(230,237,243,0.42)` (secondary text)

### 5.2 Typography

- **Font family:** 'Inter', system-ui, sans-serif
- **Weights:** 500, 600, 700
- **Sizes:**
  - Hero text: 2xl, 3xl
  - Body: xs, sm, base
  - Monospace (amounts): `font-mono`
- **Tracking:** `tracking-widest` for labels, `tracking-tight` for amounts

### 5.3 Components

- **Cards:** `rounded-4` (1rem), `border`, `backdrop-blur-4`, gradient background
- **Buttons:** `rounded-2.75` to `3.25`, hover effects, active states
- **Inputs:** `rounded-3.25`, light background, outline-none
- **Progress bars:** `rounded-1` to `1.5`, height `h-1` to `h-1.5`
- **Spacing:** Tailwind scale (px-4, py-4, gap-3, etc.)

### 5.4 Interactions

- **Hover:** Slight `translate-y` lift, brightness increase on buttons
- **Active:** Green highlight `rgba(90, 255, 160, 0.12)` + border
- **Focus:** Outline-none (relies on visual feedback)
- **Transitions:** `transition-all`, `duration-500` for smooth changes

---

## 6. Technical Specifications

### 6.1 Svelte/SvelteKit Setup

**Config:**

- `svelte.config.js`: Adapter auto, SvelteKit config
- `vite.config.ts`: Svelte plugin, Tailwind Vite plugin
- `tsconfig.json`: Strict mode, moduleResolution bundler
- `tailwind.config.ts`: Extend spacing (custom px values)

**Key patterns:**

- **Stores:** `writable()` for reactive state, custom methods (setView, addTransaction, etc.)
- **Reactivity:** `$:` labels for computed values, `$state()` rune for local state (Svelte 5)
- **Subscriptions:** `store.subscribe(s => ...)` to sync component state
- **Styling:** Global CSS in `+layout.svelte`, component scoped `<style>`

### 6.2 Data Flow

```
User Action (click, input)
    ↓
Component event handler
    ↓
dashboard.setView() / addTransaction() / setMode() / etc.
    ↓
store.ts  ── UI-only state (view, modal, query…) → update in memory
    ↓        persisted state (txs, preferences)
services/finance-service.ts   (use-cases)
    ↓
db/repository.ts              (contracts: TransactionRepository, PreferencesRepository…)
    ↓
db/web-repository.ts          (Dexie / IndexedDB implementation)
    ↓
Svelte store updates → subscribed components re-render
```

- **Transactions:** DB-first (await DB write, then update store; error → `dbError`, store unchanged).
- **Preferences (`setMode`, `setAccent`, `toggleSetting`):** optimistic (store updates instantly, then persist; on failure the touched fields roll back and `dbError` is set).
- Components never import `db/*` directly; only `$lib/store`.

### 6.3 Build & Deployment (Future)

**Web:**

- `npm run build` → Static site (SvelteKit adapter auto)
- Deploy to Vercel (recommended), Netlify, or custom server

**Mobile (Flutter):**

- `flutter build apk` → Android
- `flutter build ipa` → iOS
- Deploy to Google Play, App Store

---

## 7. Future Roadmap

### Phase 1: Local Persistence (Web + Mobile) (Weeks 1-2)

**Objective:** Implement offline-first data storage for both web and mobile.

> Diseño detallado: `PHASE2_PERSISTENCE_DESIGN.md` (su "Fase 2" = esta Phase 1).

**Web (IndexedDB + Dexie):**

- [x] Install Dexie.js, setup TypeScript types (`db/types.ts`)
- [x] Create IndexedDB schema (`db/schema.ts`: transactions, categories, preferences, metadata; `DB_VERSION = 1`)
- [x] Add migrations script (v1 schema, seed only on first run — `db/migrations.ts`)
- [x] CRUD persisted: add / edit / soft-delete transactions
- [x] Preferences persisted in IndexedDB (`setMode`, `setAccent`, `toggleSetting`, `updatePreferences`)
- [x] Implement repositories (`db/repository.ts` contracts + `db/web-repository.ts` Dexie impl: transactions, preferences, metadata)
- [x] Implement services (`services/finance-service.ts`) and refactor store.ts to use them (API `dashboard.*` unchanged)
- [x] Automated tests (Vitest + fake-indexeddb): db, repository, store, reload simulation
- [ ] Category repository (categories are static reference data today; needed when custom categories/`updateBudget` land)
- [ ] Services for budget update, export, import (export/import → Phase 4)
- [ ] Manual offline test in browser: add tx → close app → reload → verify persist
- [ ] Error handling edge cases: IndexedDB unsupported, quota exceeded, DB blocked

**Mobile (SQLite + Drift):**

- [ ] Add Riverpod, Drift, json_serializable to pubspec.yaml
- [ ] Define entities (Transaction, Category, Budget, Preferences)
- [ ] Generate Drift database schema
- [ ] Create repositories + datasources
- [ ] Create Riverpod providers (transaction, preferences)
- [ ] Scaffold main.dart with routing structure

**Est. effort:** 20-22 hours

### Phase 2: Cloud Sync Architecture (Week 3)

**Objective:** Design cloud sync protocol without implementing backend.

- [ ] Define sync strategy (conflict resolution, eventual consistency)
- [ ] Sketch API endpoints (no implementation yet)
- [ ] Add `syncedAt`, `deleted` fields to models
- [ ] Prepare sync layer skeleton (web & mobile)
- [ ] Document sync protocol

**Est. effort:** 8-10 hours

### Phase 3: Mobile UI + Binding (Weeks 4-5)

**Objective:** Port web UI to Flutter, connect to Riverpod providers.

- [ ] Adapt Dashboard, Transactions, Coach, Settings to Flutter
- [ ] Connect widgets to Riverpod providers
- [ ] Implement CRUD operations (add, edit, delete transactions)
- [ ] Add theme/accent switching
- [ ] Test on iOS + Android devices

**Est. effort:** 12-14 hours

### Phase 4: Export/Import + Backup (Week 6)

**Objective:** Enable data backup and cross-platform restore.

- [ ] Implement JSON export (web + mobile)
- [ ] Implement JSON import (merge/overwrite logic)
- [ ] Add file picker for import
- [ ] Test roundtrip: export web → import mobile → verify match

**Est. effort:** 4-6 hours

### Phase 5: Cloud Backend + Auth (Future)

**Objective:** Add optional cloud sync and authentication.

- [ ] Choose backend framework (Node/Express, Vercel Functions, etc.)
- [ ] Implement auth (Firebase, Auth0, or custom JWT)
- [ ] Design + implement API endpoints (list, add, update, delete transactions)
- [ ] Implement sync engine (bidirectional, conflict resolution)
- [ ] Connect web + mobile to API
- [ ] Multi-user support, per-user data isolation

---

## 8. Decision Log

| Date       | Decision                                                                                                               | Rationale                                                                                                                                                                            | Impact                                                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-09 | Svelte 5 + SvelteKit for Web                                                                                           | Minimal boilerplate, excellent reactivity, good for prototypes                                                                                                                       | Faster iteration, developer happiness                                                                                               |
| 2026-09-09 | Tailwind for styling                                                                                                   | Rapid UI build, consistency, widely supported                                                                                                                                        | Reduced CSS writing, fewer custom styles                                                                                            |
| 2026-09-09 | Svelte stores for state                                                                                                | Simple, no Redux complexity at this scale                                                                                                                                            | Easier debugging, minimal overhead                                                                                                  |
| 2026-09-09 | Mock data in prototype (Phase 0)                                                                                       | Focus on UX, defer backend complexity                                                                                                                                                | Faster demo & validation, clear separation. Superseded by IndexedDB persistence (Phase 1)                                           |
| 2026-09-09 | Flutter for mobile                                                                                                     | One codebase iOS + Android                                                                                                                                                           | Cost savings, faster launch, unified logic                                                                                          |
| 2026-09-09 | TypeScript throughout                                                                                                  | Type safety, better tooling, fewer bugs                                                                                                                                              | Confidence in refactors, better IDE support                                                                                         |
| 2026-09-09 | Local-first / Offline-first architecture                                                                               | App works 100% without internet; cloud sync optional future                                                                                                                          | Resilient, autonomous app; prep for sync later                                                                                      |
| 2026-09-09 | IndexedDB (Dexie.js) for web data                                                                                      | Structured data (txs, budgets) need indexing & querying                                                                                                                              | Better than localStorage for complex domain models                                                                                  |
| 2026-09-09 | ~~localStorage for web preferences~~ (superseded 2026-09-24)                                                           | Lightweight, perfect for theme/language/flags                                                                                                                                        | Simple key-value, no DB overhead                                                                                                    |
| 2026-09-09 | SQLite + Drift for mobile                                                                                              | Type-safe ORM, reactive streams, auto-migrations                                                                                                                                     | Matches domain model, better than Hive/Isar for financial data                                                                      |
| 2026-09-09 | Riverpod for mobile state                                                                                              | Reactive, composable, integrates with Drift streams                                                                                                                                  | Better than Provider for this scale, handles DB binding                                                                             |
| 2026-09-09 | Repository pattern (shared domain)                                                                                     | Abstract interfaces for web & mobile                                                                                                                                                 | Code reuse, platform agnostic logic, easier testing                                                                                 |
| 2026-09-09 | JSON for export/import                                                                                                 | Human-readable, portable, no proprietary formats                                                                                                                                     | Easy backup, cross-platform data transfer, future sync prep                                                                         |
| 2026-09-24 | Web preferences stored in **IndexedDB** (`preferences` table, singleton `user_settings`) instead of localStorage       | Already implemented that way; one storage engine, transactional writes, same soft-sync metadata (`updatedAt`) as the rest of the data; budgets live in prefs and are structured data | Replaces 2026-09-09 localStorage decision. Single export/import source. Async read at startup (handled by `dashboard.initialize()`) |
| 2026-09-24 | Phase naming aligned: prototype = Phase 0; `PHASE2_PERSISTENCE_DESIGN.md` "Fase 2" = spec "Phase 1: Local Persistence" | Both docs used different numbering                                                                                                                                                   | No renumbering of roadmap; cross-reference notes added                                                                              |
| 2026-09-24 | Web layering: `store.ts` → `services/` → `db/repository.ts` (interfaces) → `db/web-repository.ts` (Dexie)              | Decouple store from Dexie; same contracts will be mirrored by Drift on mobile                                                                                                        | Store is testable with a fake service (`createDashboardStore(service)`); components unchanged                                       |
| 2026-09-24 | Preference setters are optimistic with rollback; transaction CRUD stays DB-first                                       | Theme/toggle clicks must feel instant; financial data must never show unsaved state                                                                                                  | On persist failure: prefs revert + `dbError`; CRUD throws + `dbError`                                                               |

---

## 9. Testing Strategy

### Unit / Integration Tests (✅ Vitest + jsdom + fake-indexeddb)

Location: `finance-dashboard/src/lib/test/` · run: `npm run test:run`

- ✅ `db.test.ts` — seed on first run only, nextId, soft-delete, ID integrity
- ✅ `repository.test.ts` — Dexie repositories (id allocation, getActive, not-found errors, prefs merge) + preference persistence in store (setMode/setAccent/toggleSetting, rollback on failure)
- ✅ `store.test.ts` — initialize, CRUD, edit state, reload simulation
- ⏳ Calculations (income, expense sums, budget %)
- ⏳ Date parsing, currency formatting

### Component Tests

- Modal: open/close, validation, submit
- Header: range selector interaction
- Cards: rendering, conditional styles

### E2E Tests (Future)

- Full flow: Login → Add transaction → View dashboard → Change settings → Logout
- Search → Filter results
- Modal validation edge cases

### Validation (Current Phase)

- ✅ `npm run check` — `svelte-check` (TypeScript + Svelte correctness)
- ✅ `npm run lint` — `prettier --check .` (formatting)
- ✅ `npm run test:run` — Vitest suite
- ✅ Manual testing in browser (offline: add tx → reload → still present)

---

## 10. Known Constraints & Assumptions

- **Users:** Primarily Spanish-speaking, financial awareness level medium–high
- **Data:** Seed transactions are Sep 2026 (arbitrary current date)
- **Budget:** 4 fixed categories only (future: custom categories)
- **Locale:** es-ES formatting (currency, dates)
- **Theme:** Default dark mode, but Light available
- **Storage:** All data stored locally (IndexedDB/SQLite); no cloud sync until Phase 5
- **Single-user:** No auth, no multi-user; cloud account optional future
- **Data Encryption:** Not implemented (device/app sandboxed); optional future
- **Connectivity:** App functions 100% offline; cloud features optional future
- **Sync:** Soft-delete + metadata fields prepared for future cloud sync

---

## 11. Appendix

### A. File Structure

```
finance-dashboard/
├── src/
│   ├── app.css                      # Global styles (dark mode, gradients)
│   ├── app.d.ts                     # Type declarations (app namespace)
│   ├── app.html                     # HTML shell
│   ├── lib/
│   │   ├── assets/
│   │   │   └── favicon.svg
│   │   ├── components/
│   │   │   ├── Header.svelte        # Header + range selector
│   │   │   ├── Modal.svelte         # Transaction input modal (create / edit)
│   │   │   ├── DeleteConfirmationModal.svelte # Confirm soft-delete
│   │   │   └── pages/
│   │   │       ├── Dashboard.svelte # Home view (hero + budget + trend)
│   │   │       ├── TransactionList.svelte # Ledger view (search, edit, delete)
│   │   │       ├── Coach.svelte     # Insights + timeline
│   │   │       └── Settings.svelte  # Preferences (persisted)
│   │   ├── db/
│   │   │   ├── index.ts             # Public exports of the persistence layer
│   │   │   ├── schema.ts            # Dexie `LempirDatabase`, `DB_VERSION`, tables
│   │   │   ├── types.ts             # DB types + converters (`dbTransactionToUI`, `txToDBTransaction`)
│   │   │   ├── migrations.ts        # `initializeDatabase`, seed, `DEFAULT_PREFERENCES`, nextId helpers
│   │   │   ├── repository.ts        # Platform-agnostic repository interfaces
│   │   │   └── web-repository.ts    # Dexie implementations (transactions, preferences, metadata)
│   │   ├── services/
│   │   │   ├── index.ts             # Public exports
│   │   │   └── finance-service.ts   # Use-cases consumed by the store (`financeService`)
│   │   ├── test/
│   │   │   ├── setup.ts             # fake-indexeddb + DB reset
│   │   │   ├── db.test.ts           # Migrations / DB layer
│   │   │   ├── repository.test.ts   # Repositories + preference persistence
│   │   │   └── store.test.ts        # Store API + reload simulation
│   │   ├── index.ts                 # (empty, future exports)
│   │   └── store.ts                 # Svelte store (`dashboard.*`), UI types, CATEGORIES
│   ├── routes/
│   │   ├── +layout.svelte           # Root layout (sidebar + main), calls `dashboard.initialize()`
│   │   ├── +page.svelte             # Index page (empty, layout handles all)
│   │   └── layout.css               # Layout-specific styles
├── static/
│   └── robots.txt
├── package.json
├── svelte.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts                 # Vitest (jsdom, setup file, src/**/*.test.ts)
├── prettier.config.js
└── README.md
```

### B. Key npm Scripts

```json
{
  "dev": "vite dev", // Local dev server + HMR
  "build": "vite build", // Production build
  "preview": "vite preview", // Preview prod build locally
  "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
  "check:watch": "...", // Watch mode for check
  "test": "vitest", // Tests in watch mode
  "test:run": "vitest run", // Tests single run (CI)
  "lint": "prettier --check .", // Check formatting
  "format": "prettier --write ." // Auto-format
}
```

### C. Environment Setup

- **Node:** v18+ (LTS)
- **npm:** v8+
- **TypeScript:** 6.0.3
- **Svelte:** 5.56.1
- **SvelteKit:** 2.63.0

---

**End of Spec Kit**
