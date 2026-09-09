# Spec Kit — lempir_app

**Version:** 1.0 — State Base  
**Date:** 2026-09-09  
**Status:** Active Development (Phase 2: Backend & Persistence)  

---

## 1. Project Overview

**lempir_app** es una aplicación de **finanzas personales multi-plataforma** (Web + Mobile). Enfoque: gestión de presupuesto, categorización de gastos, IA coaching, y ahorro orientado a metas.

**Nombre de la marca:** Ledgerly (visible en logo/header web)

**Alcance actual (v1.0):**
- ✅ Web dashboard: Visualización de transacciones, presupuestos, insights
- ❌ Backend: No existe (mockdata via Svelte store)
- ❌ Mobile: Boilerplate Flutter sin desarrollo
- ❌ Persistencia: No hay BD
- ❌ Auth: No implementada

**Target audience:** Usuarios hispanos (esp. ES/latam) con interés en finanzas personales, control de deuda, y ahorro disciplinado.

---

## 2. Architecture Overview

### 2.1 Stack Actual

```
lempir_app/
├── finance-dashboard/          # Web (Svelte/SvelteKit)
│   ├── src/
│   │   ├── lib/                # Components + Logic
│   │   │   ├── store.ts        # State management (Svelte stores)
│   │   │   ├── components/
│   │   │   │   ├── Header.svelte
│   │   │   │   ├── Modal.svelte
│   │   │   │   └── pages/      # 4 views (Dashboard, Transactions, Coach, Settings)
│   │   └── routes/             # SvelteKit routing
│   ├── package.json            # Dependencies
│   └── tailwind.config.ts       # Styling
├── lib/main.dart              # Flutter (Mobile) — boilerplate
├── android/                    # Android native
├── ios/                        # iOS native
└── test/                       # Testing (empty)
```

### 2.2 Technology Decisions

| Layer | Tech | Why |
|-------|------|-----|
| **Web UI** | Svelte 5 + SvelteKit 2.63 | Reactivity, minimal boilerplate, good DX |
| **Styling** | Tailwind CSS 4.3 | Rapid prototyping, consistency |
| **Type Safety** | TypeScript 6 | Catch errors early, better IDE support |
| **Build** | Vite 8 | Fast builds, HMR |
| **Mobile** | Flutter + Dart 3.11 | Cross-platform iOS/Android from single codebase |
| **State** | Svelte stores (writable) | Simple, reactive, no boilerplate |
| **Backend** | TBD (Phase 2) | Currently mock, will be Node/Python/Firebase |
| **Database** | TBD (Phase 2) | Firestore, PostgreSQL, or MongoDB |
| **Auth** | TBD (Phase 2) | Firebase Auth, Auth0, or custom JWT |

### 2.3 Data Model (Current/Mock)

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

#### Current (Mock)
- **10 seed transactions** (Sep 2026) in `store.ts`
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

| Feature | Status | Notes |
|---------|--------|-------|
| **View Transactions** | ✅ Implemented | Dashboard + list + search |
| **Add Transaction** | ✅ Implemented | Modal with validation |
| **Budget Tracking** | ✅ Implemented | Per-category, visual progress |
| **Spending Insights** | ✅ Partially | Coach page exists, hardcoded |
| **Multi-theme** | ✅ Implemented | Dark/Light + 4 accents |
| **Data Persistence** | ❌ Missing | Mock only, no storage |
| **Backend API** | ❌ Missing | No server endpoints |
| **Authentication** | ❌ Missing | No user accounts |
| **Mobile UI** | ❌ Missing | Flutter boilerplate only |
| **Recurring Transactions** | ❌ Backlog | Future v2 |
| **Budget Goals** | ❌ Backlog | Future v2 |
| **Export (CSV/PDF)** | ❌ Backlog | Future v2 |
| **Bank Integration** | ❌ Backlog | Future v2 |
| **IA Personalized Coach** | ❌ Backlog | Coach page shell only |

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
dashboard.setView() / addTransaction() / etc.
    ↓
Svelte store updates
    ↓
Components subscribed to store re-render
    ↓
UI updates
```

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

### Phase 2: Backend & Persistence (Weeks 2-3)
- [ ] Choose backend framework (Node/Express, Python/FastAPI, Vercel Functions, etc.)
- [ ] Design API schema:
  - `POST /api/transactions` — add
  - `GET /api/transactions` — list (with filters)
  - `DELETE /api/transactions/:id` — remove
  - `PATCH /api/transactions/:id` — update
  - `GET /api/dashboard` — summary (income, expenses, by category)
  - `POST /api/budgets` — set category allocation
  - `GET /api/budgets` — retrieve
- [ ] Implement database (Firestore / PostgreSQL / MongoDB)
- [ ] Connect Web frontend to API
- [ ] Remove mock data, enable live updates

### Phase 3: Authentication (Week 4)
- [ ] Choose auth provider (Firebase, Auth0, custom JWT)
- [ ] Implement sign-up, login, logout
- [ ] Per-user data isolation
- [ ] Session management

### Phase 4: Mobile (Flutter) (Weeks 5-6)
- [ ] Replace Counter template with real app structure
- [ ] Implement same 4 views (Dashboard, Transactions, Coach, Settings)
- [ ] Share state with Web (Redux, Riverpod, or HTTP API sync)
- [ ] Push to test devices

### Phase 5: Polish & Launch (Week 7+)
- [ ] IA Coach: real insights (NLP, ML model for spending patterns)
- [ ] Export (CSV, PDF)
- [ ] Notifications (budget alerts, etc.)
- [ ] Dark mode sync across platforms
- [ ] Performance optimization
- [ ] Launch: App Store, Play Store, Web domain

---

## 8. Decision Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2026-09-09 | Svelte 5 + SvelteKit for Web | Minimal boilerplate, excellent reactivity, good for prototypes | Faster iteration, developer happiness |
| 2026-09-09 | Tailwind for styling | Rapid UI build, consistency, widely supported | Reduced CSS writing, fewer custom styles |
| 2026-09-09 | Svelte stores for state | Simple, no Redux complexity at this scale | Easier debugging, minimal overhead |
| 2026-09-09 | Mock data in Phase 1 | Focus on UX, defer backend complexity | Faster demo & validation, clear separation |
| 2026-09-09 | Flutter for mobile | One codebase iOS + Android | Cost savings, faster launch, unified logic |
| 2026-09-09 | TypeScript throughout | Type safety, better tooling, fewer bugs | Confidence in refactors, better IDE support |

---

## 9. Testing Strategy

### Unit Tests
- Store methods (setView, addTransaction, validation)
- Calculations (income, expense sums, budget %)
- Date parsing, currency formatting

### Component Tests
- Modal: open/close, validation, submit
- Header: range selector interaction
- Cards: rendering, conditional styles

### E2E Tests (Future)
- Full flow: Login → Add transaction → View dashboard → Change settings → Logout
- Search → Filter results
- Modal validation edge cases

### Validation (Current Phase)
- ✅ `svelte-check` — TypeScript + Svelte correctness
- ✅ `prettier` — Code formatting
- ✅ Manual testing in browser

---

## 10. Known Constraints & Assumptions

- **Users:** Primarily Spanish-speaking, financial awareness level medium–high
- **Data:** Seed transactions are Sep 2026 (arbitrary current date)
- **Budget:** 4 fixed categories only (future: custom categories)
- **Locale:** es-ES formatting (currency, dates)
- **Theme:** Default dark mode, but Light available
- **Session:** No persistence → page reload = state reset (until Phase 2)

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
│   │   │   ├── Modal.svelte         # Transaction input modal
│   │   │   └── pages/
│   │   │       ├── Dashboard.svelte # Home view (hero + budget + trend)
│   │   │       ├── TransactionList.svelte # Ledger view
│   │   │       ├── Coach.svelte     # Insights + timeline
│   │   │       └── Settings.svelte  # Preferences
│   │   ├── index.ts                 # (empty, future exports)
│   │   └── store.ts                 # Svelte store + types + seed data
│   ├── routes/
│   │   ├── +layout.svelte           # Root layout (sidebar + main)
│   │   └── +page.svelte             # Index page (empty, layout handles all)
│   └── styles/
│       └── layout.css               # Layout-specific styles
├── static/
│   └── robots.txt
├── package.json
├── svelte.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── prettier.config.js
└── README.md
```

### B. Key npm Scripts

```json
{
  "dev": "vite dev",              // Local dev server + HMR
  "build": "vite build",          // Production build
  "preview": "vite preview",      // Preview prod build locally
  "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
  "check:watch": "...",           // Watch mode for check
  "lint": "prettier --check .",   // Check formatting
  "format": "prettier --write ."  // Auto-format
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
