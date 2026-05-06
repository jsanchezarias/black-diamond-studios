# Bundle & Provider Optimization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate ~10 unnecessary Supabase queries that fire on every page load (including the public landing page), remove dead imports across the codebase, and restructure data fetching so providers are passive state managers and dashboards own their initialization.

**Architecture:** Split `AllProvidersWrapper` into two rings — a lightweight public ring (6 providers, no Supabase fetches) and a full auth ring (all 19 providers). Remove the auto-fetch `useEffect` from 7 heavy providers; each top-level dashboard triggers its own `cargar*()` on mount instead.

**Tech Stack:** React 18, TypeScript, Supabase (JS client), Vite, Sonner (toasts)

---

## Audit Results (pre-work)

### Providers that fetch unconditionally on mount (problem)
| Provider | Tables fetched | Who actually needs it |
|---|---|---|
| `AgendamientosContext` | `agendamientos` | Programador, Owner, Admin, Modelo dashboards |
| `ClientesContext` | `clientes` | Programador, Admin dashboards |
| `ServiciosContext` | `agendamientos` (re-aggregated) | Owner, Admin, Modelo dashboards |
| `GastosContext` | `gastos_operativos` + `servicios_publicos` | Owner, Admin dashboards |
| `InventoryContext` | `inventario` | Owner, Admin, Modelo dashboards |
| `AnalyticsContext` | `ventas_boutique` (last 365 days, limit 500) | AnalyticsPanel only |
| `BalanceFinancieroContext` | `balance_financiero` + realtime | BalanceDashboard only |
| `CarritoContext` | opens realtime sub on mount | ModeloDashboard only |
| `ModelosContext` | `usuarios` (role=modelo) | Landing page + dashboards |
| `VideosContext` | `videos` | Landing page |

### Providers safe for public path (no Supabase fetch on mount)
`LanguageContext`, `PublicUsersContext`*, `TestimoniosContext`, `TurnosContext`, `AsistenciaContext`, `ErrorMonitorContext`, `MultasContext`, `PagosContext`

*`PublicUsersContext` fetches session + chat messages, but this is intentional for the public chat widget on the landing page.

### Confirmed unused imports (via `tsc --noUnusedLocals`)
- `App.tsx` → `ClienteNavbar` (line 26), `GlobalLoader` const (line 447)
- `AdminDashboard.tsx` → `toast`, `HistorialClientesPanel`, `FinanzasPanel`
- `BalanceDashboard.tsx` → `React`, `TrendingUp`, `TrendingDown`
- `AnalyticsContext.tsx` → `React`
- `BalanceFinancieroContext.tsx` → `React`
- `CarritoContext.tsx` → `loading`, `setLoading`, `itemsError`
- `AnalyticsPanel.tsx` → 5 export-helper functions, `FileText`, `Printer`, `Legend`

---

## Task 1 — Remove dead code from App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Remove unused `ClienteNavbar` import (line 26)**

Delete the entire line:
```diff
- import { ClienteNavbar } from './app/components/ClienteNavbar';
```

- [ ] **Step 2: Remove unused `GlobalLoader` constant (lines 447–463)**

The app already uses `<GlobalLoadingScreen />` everywhere. `GlobalLoader` is a JSX element stored in a const that is never referenced. Delete lines 447–463:
```diff
-  // ✅ Fallback premium para Suspense
-  const GlobalLoader = (
-    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f1014] gap-6">
-      <div className="relative">
-        <div className="w-16 h-16 border-2 border-primary/20 rounded-full"></div>
-        <div className="w-16 h-16 border-t-2 border-primary rounded-full animate-spin absolute top-0 left-0"></div>
-        <div className="absolute inset-0 flex items-center justify-center">
-          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
-        </div>
-      </div>
-      <div className="flex flex-col items-center gap-2">
-        <h2 className="text-primary font-bold tracking-[0.2em] text-xs uppercase animate-pulse">
-          Black Diamond
-        </h2>
-        <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
-      </div>
-    </div>
-  );
```

- [ ] **Step 3: Verify the 6 lazy imports use the correct named export form**

All 6 use `.then(m => ({ default: m.X }))` — this is correct. No changes needed.

- [ ] **Step 4: Run tsc**
```bash
cd "Black damion/black-diamond-studios" && npx tsc --noEmit
```
Expected: same errors as before (pre-existing in AgendamientosPanel/ProgramadorDashboard/ProgramadorChatLanding). No new errors.

---

## Task 2 — Remove unused imports from initial-bundle files

Focus only on files that are **not lazy-loaded** (they're in the initial JS chunk). Lazy-loaded dashboards are deferred — their unused imports don't hurt initial load.

**Files:**
- Modify: `src/app/components/BalanceDashboard.tsx`
- Modify: `src/app/components/AnalyticsContext.tsx`
- Modify: `src/app/components/BalanceFinancieroContext.tsx`
- Modify: `src/app/components/CarritoContext.tsx`
- Modify: `src/app/components/AdminDashboard.tsx`

### BalanceDashboard.tsx
- [ ] **Step 1: Remove `React`, `TrendingUp`, `TrendingDown`**

```diff
- import React from 'react';
  import { useBalanceFinanciero } from './BalanceFinancieroContext';
- import { TrendingUp, TrendingDown, Wallet, Calendar, Clock, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
+ import { Wallet, Calendar, Clock, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
```

### AnalyticsContext.tsx
- [ ] **Step 2: Remove `React` default import**

```diff
- import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
+ import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
```

### BalanceFinancieroContext.tsx
- [ ] **Step 3: Remove `React` default import**

```diff
- import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
+ import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
```

### CarritoContext.tsx
- [ ] **Step 4: Remove unused `loading` / `setLoading` state and `itemsError`**

Line 48 — remove the state declaration:
```diff
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
- const [loading, setLoading] = useState(true);
```

Also in `cargarCompras` (around line 138), `itemsError` is destructured but never used:
```diff
- const { data: itemsData, error: itemsError } = await supabase
+ const { data: itemsData } = await supabase
```

### AdminDashboard.tsx
- [ ] **Step 5: Remove `toast`, `HistorialClientesPanel`, `FinanzasPanel`**

Find and delete these 3 import lines (lines 42, 47, 51):
```diff
- import { toast } from 'sonner';
```
```diff
- const HistorialClientesPanel = lazy(() => import('../../components/HistorialClientesPanel')...);
- const FinanzasPanel = lazy(() => import(...));
```
(Exact lines will differ slightly — use the line numbers from `tsc --noUnusedLocals` output)

- [ ] **Step 6: Run tsc**
```bash
npx tsc --noEmit
```
Expected: no new errors.

---

## Task 3 — Split AllProvidersWrapper: public vs auth rings

This is the highest-impact change. Currently both the public (landing/login) and authenticated routes wrap everything in `AllProvidersWrapper`, which mounts all 19 providers — including 7 that immediately fire Supabase queries.

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Create `PublicProvidersWrapper` inside App.tsx**

Add this component just after `AllProvidersWrapper` (around line 107):

```tsx
// Wrapper minimal para rutas públicas — solo providers sin fetch de datos internos
function PublicProvidersWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorMonitorProvider>
      <LanguageProvider>
        <PublicUsersProvider>
          <ModelosProvider>
            <TestimoniosProvider>
              <VideosProvider>
                {children}
              </VideosProvider>
            </TestimoniosProvider>
          </ModelosProvider>
        </PublicUsersProvider>
      </LanguageProvider>
    </ErrorMonitorProvider>
  );
}
```

Providers included (and why):
- `ErrorMonitorProvider` — always needed (error tracking)
- `LanguageProvider` — i18n on landing page (`useLanguage` in LandingPage)
- `PublicUsersProvider` — public chat widget + session (`usePublicUsers` in LandingPage)
- `ModelosProvider` — model gallery on landing page (`useModelos` in LandingPage)
- `TestimoniosProvider` — testimonials section on landing page
- `VideosProvider` — video showcase section on landing page

- [ ] **Step 2: Use `PublicProvidersWrapper` for the unauthenticated branch**

In the bottom return of `App()` (around line 576), replace `AllProvidersWrapper` with `PublicProvidersWrapper`:

```diff
  return (
    <ErrorBoundary>
-     <AllProvidersWrapper>
+     <PublicProvidersWrapper>
        <Toaster ... />
        <div ...>
          {showLogin ? <LoginForm ... /> : <Suspense><LandingPage ... /></Suspense>}
        </div>
-     </AllProvidersWrapper>
+     </PublicProvidersWrapper>
    </ErrorBoundary>
  );
```

The authenticated branch (`if (currentUser)`) keeps `AllProvidersWrapper` unchanged.

- [ ] **Step 3: Run tsc**
```bash
npx tsc --noEmit
```
Expected: no new errors.

- [ ] **Step 4: Smoke test — open the app without logging in**

Start dev server:
```bash
npm run dev
```

Open browser, open Network tab, visit landing page. Verify:
- ❌ NO requests to `agendamientos`, `clientes`, `servicios`, `gastos_operativos`, `inventario`, `ventas_boutique`, `balance_financiero`
- ✅ Requests to `usuarios` (ModelosProvider loads models for gallery), `testimonios`, `videos`
- ✅ Landing page renders correctly with gallery, testimonials, and video sections

---

## Task 4 — Remove auto-fetch from AgendamientosContext; add to dashboards

**Files:**
- Modify: `src/app/components/AgendamientosContext.tsx`
- Modify: `src/app/components/ProgramadorDashboard.tsx`
- Modify: `src/app/components/AdminDashboard.tsx`
- Modify: `src/app/components/ModeloDashboard.tsx`

**Note:** `recargarAgendamientos` is already exposed in the context value — no need to add it.

- [ ] **Step 1: In `AgendamientosContext.tsx`, remove the initial `cargarAgendamientos()` call from `useEffect`**

Current (around line 159):
```tsx
useEffect(() => {
  cargarAgendamientos();   // ← REMOVE THIS LINE

  const channel = supabase
    .channel('agendamientos-rt')
    ...
```

After:
```tsx
useEffect(() => {
  const channel = supabase
    .channel('agendamientos-rt')
    ...
```

Keep all realtime subscription code intact. Only remove the `cargarAgendamientos()` call at the top.

- [ ] **Step 2: In `ProgramadorDashboard.tsx`, trigger initial load on mount**

Find the existing session-verification `useEffect` (around line 51) and add the cargar call:

```tsx
const { recargarAgendamientos } = useAgendamientos();

useEffect(() => {
  recargarAgendamientos();
  // ...existing session check code
}, [userId, onLogout]);
```

Or add a separate `useEffect` right after it:
```tsx
useEffect(() => {
  recargarAgendamientos();
}, []); // only on mount
```

- [ ] **Step 3: In `AdminDashboard.tsx`, trigger initial load**

Find the first `useEffect` and add:
```tsx
const { recargarAgendamientos } = useAgendamientos();

useEffect(() => {
  recargarAgendamientos();
}, []);
```

- [ ] **Step 4: In `ModeloDashboard.tsx`, trigger initial load**

`ModeloDashboard` already calls `useAgendamientos()`. Add trigger:
```tsx
useEffect(() => {
  recargarAgendamientos();
}, []);
```

Note: `OwnerDashboard` doesn't directly use agendamientos, so no change there.

- [ ] **Step 5: Run tsc**
```bash
npx tsc --noEmit
```
Expected: no new errors.

---

## Task 5 — Remove auto-fetch from ClientesContext; expose and add to dashboards

**Files:**
- Modify: `src/app/components/ClientesContext.tsx`
- Modify: `src/app/components/ProgramadorDashboard.tsx`
- Modify: `src/app/components/AdminDashboard.tsx`

Currently `cargarClientes` is a private function inside the provider. It is NOT exposed in the context value. We need to expose it.

- [ ] **Step 1: Expose `cargarClientes` in `ClientesContext.tsx` value**

In the context type interface (around line 170), add:
```tsx
cargarClientes: () => Promise<void>;
```

In the context `value={{...}}` (around line 420), add:
```tsx
cargarClientes,
```

In the fallback return of `useClientes()` (around line 446), add:
```tsx
cargarClientes: async () => {},
```

- [ ] **Step 2: Remove the `cargarClientes()` call from `useEffect` in `ClientesContext.tsx`**

Current (around line 176):
```tsx
useEffect(() => {
  cargarClientes();   // ← REMOVE

  const channel = supabase
    .channel('clientes-rt')
    ...
```

After:
```tsx
useEffect(() => {
  const channel = supabase
    .channel('clientes-rt')
    ...
```

- [ ] **Step 3: In `ProgramadorDashboard.tsx`, trigger initial load**

```tsx
const { cargarClientes } = useClientes();

useEffect(() => {
  cargarClientes();
}, []);
```

- [ ] **Step 4: In `AdminDashboard.tsx`, trigger initial load**

```tsx
const { cargarClientes } = useClientes();

useEffect(() => {
  cargarClientes();
}, []);
```

Note: `GestionClientesAdmin` is lazy-loaded from AdminDashboard. By the time it renders, `cargarClientes()` will already have been called by AdminDashboard's `useEffect`.

- [ ] **Step 5: Run tsc**
```bash
npx tsc --noEmit
```
Expected: no new errors.

---

## Task 6 — Remove auto-fetch from ServiciosContext and GastosContext

**Files:**
- Modify: `src/app/components/ServiciosContext.tsx`
- Modify: `src/app/components/GastosContext.tsx`
- Modify: `src/app/components/OwnerDashboard.tsx`
- Modify: `src/app/components/AdminDashboard.tsx`
- Modify: `src/app/components/ModeloDashboard.tsx`

`ServiciosContext` exposes `recargarServicios`. `GastosContext` exposes `cargarGastos` and `cargarServicios` (servicios públicos).

### ServiciosContext

- [ ] **Step 1: Remove `cargarServicios()` from `ServiciosContext.tsx` useEffect**

Current (around line 230):
```tsx
useEffect(() => {
  cargarServicios();   // ← REMOVE

  const channel = supabase.channel('servicios-agendamientos-rt')
    ...
```

After:
```tsx
useEffect(() => {
  const channel = supabase.channel('servicios-agendamientos-rt')
    ...
```

### GastosContext

- [ ] **Step 2: Remove `cargarGastos()` and `cargarServicios()` from `GastosContext.tsx` useEffect**

Current (around line 72):
```tsx
useEffect(() => {
  cargarGastos();     // ← REMOVE
  cargarServicios();  // ← REMOVE

  const channel = supabase.channel('gastos-rt')
    ...
```

Also remove the `window.addEventListener('focus', ...)` — this causes a full re-fetch on every tab focus, which is excessive:
```diff
- const handleFocus = () => { cargarGastos(); cargarServicios(); };
- window.addEventListener('focus', handleFocus);
```
And remove from the cleanup:
```diff
- window.removeEventListener('focus', handleFocus);
```

### Dashboards

- [ ] **Step 3: In `OwnerDashboard.tsx`, trigger both initial loads**

```tsx
const { recargarServicios } = useServicios();
const { cargarGastos, cargarServicios: cargarServiciosPublicos } = useGastos();

useEffect(() => {
  recargarServicios();
  cargarGastos();
  cargarServiciosPublicos();
}, []);
```

- [ ] **Step 4: In `AdminDashboard.tsx`, trigger both initial loads**

Same pattern as OwnerDashboard above.

- [ ] **Step 5: In `ModeloDashboard.tsx`, trigger ServiciosContext load**

ModeloDashboard uses `useServicios()` for the boutique/service tab:
```tsx
const { recargarServicios } = useServicios();

useEffect(() => {
  recargarServicios();
}, []);
```

- [ ] **Step 6: Run tsc**
```bash
npx tsc --noEmit
```
Expected: no new errors.

---

## Task 7 — Remove auto-fetch from InventoryContext, AnalyticsContext, BalanceFinancieroContext

**Files:**
- Modify: `src/app/components/InventoryContext.tsx`
- Modify: `src/app/components/AnalyticsContext.tsx`
- Modify: `src/app/components/BalanceFinancieroContext.tsx`
- Modify: `src/app/components/OwnerDashboard.tsx`
- Modify: `src/app/components/AdminDashboard.tsx`
- Modify: `src/app/components/ModeloDashboard.tsx`
- Modify: `src/app/components/AnalyticsPanel.tsx`
- Modify: `src/app/components/BalanceDashboard.tsx`

### InventoryContext

`recargarProductos` is already exposed in the context value.

- [ ] **Step 1: Remove `cargarProductos()` from `InventoryContext.tsx` useEffect**

Current (around line 39):
```tsx
useEffect(() => {
  cargarProductos();   // ← REMOVE

  const channel = supabase.channel('productos-rt')
    ...
```

- [ ] **Step 2: In `OwnerDashboard.tsx`, add inventory trigger**

```tsx
const { recargarProductos } = useInventory();

// Add to the existing useEffect from Task 6, or create a new one:
useEffect(() => {
  recargarProductos();
}, []);
```

- [ ] **Step 3: In `AdminDashboard.tsx`, add inventory trigger**

Same as Step 2.

- [ ] **Step 4: In `ModeloDashboard.tsx`, add inventory trigger**

ModeloDashboard uses `useInventory()` for the boutique tab:
```tsx
const { recargarProductos } = useInventory();

useEffect(() => {
  recargarProductos();
}, []);
```

### AnalyticsContext

`cargarVentas` is currently a local function inside `useEffect`. It is NOT exposed. We need to hoist it and expose it.

- [ ] **Step 5: Expose `cargarVentas` in `AnalyticsContext.tsx`**

Move `cargarVentas` outside the `useEffect` (make it a standalone async function in the provider body):

```tsx
// BEFORE (inside useEffect):
useEffect(() => {
  const cargarVentas = async () => { ... };
  cargarVentas();
}, []);

// AFTER (hoisted, exposed):
const cargarVentas = async () => {
  try {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 365);
    const { data, error } = await supabase
      .from('ventas_boutique')
      .select('*')
      .gte('fecha', fechaLimite.toISOString().split('T')[0])
      .order('fecha', { ascending: false })
      .limit(500);

    if (!error && data) {
      setVentasBoutique(data);
    }
  } catch (err) {
    console.error('Error cargando ventas boutique:', err);
  } finally {
    setCargando(false);
  }
};

// Remove the useEffect entirely (no more auto-fetch):
// useEffect(() => { cargarVentas(); }, []);  ← DELETE
```

Add `cargarVentas` to the context type interface:
```tsx
cargarVentas: () => Promise<void>;
```

Add to the `AnalyticsContext.Provider value={{...}}`:
```tsx
cargarVentas,
```

- [ ] **Step 6: In `AnalyticsPanel.tsx`, trigger `cargarVentas` on mount**

```tsx
const { cargarVentas, /* other values */ } = useAnalytics();

useEffect(() => {
  cargarVentas();
}, []);
```

### BalanceFinancieroContext

`recargar` (= `cargarMovimientos`) is already exposed.

- [ ] **Step 7: Remove `cargarMovimientos()` from `BalanceFinancieroContext.tsx` useEffect**

Current (around line 59):
```tsx
useEffect(() => {
  cargarMovimientos();   // ← REMOVE

  const channel = supabase.channel('balance_changes')
    ...
```

- [ ] **Step 8: In `BalanceDashboard.tsx`, trigger initial load**

```tsx
const { recargar, /* other values */ } = useBalanceFinanciero();

useEffect(() => {
  recargar();
}, []);
```

- [ ] **Step 9: Run tsc**
```bash
npx tsc --noEmit
```
Expected: no new errors.

---

## Task 8 — Build verification and smoke tests

**Files:** none (verification only)

- [ ] **Step 1: Run full TypeScript check**
```bash
cd "Black damion/black-diamond-studios" && npx tsc --noEmit
```
Expected: only the 6 pre-existing errors in `AgendamientosPanel`, `AgendarCitaModal`, `ProgramadorChatLanding`, `ProgramadorDashboard` (these are pre-existing, not introduced by this plan).

- [ ] **Step 2: Run Vite build**
```bash
npm run build
```
Expected: build succeeds. Note the `dist/assets/*.js` chunk sizes reported by Vite.

- [ ] **Step 3: Smoke test — unauthenticated path**

```bash
npm run dev
```
Open browser DevTools → Network tab → filter by "Fetch/XHR". Navigate to `/`. Verify:
- ✅ Only these Supabase requests fire: `usuarios` (modelos gallery), `testimonios`, `videos`, `clientes` (PublicUsersContext session check)
- ❌ None of these fire: `agendamientos`, `gastos_operativos`, `servicios_publicos`, `inventario`, `ventas_boutique`, `balance_financiero`

- [ ] **Step 4: Smoke test — authenticated path (programador)**

Log in as programador. Verify:
- ✅ After login, all the previously-removed fetches now fire from within the dashboard
- ✅ Agendamientos panel shows data
- ✅ Error Board panel accessible and functional
- ✅ Analytics panel shows data (cargarVentas called)
- ✅ Finanzas/Balance panel shows data

- [ ] **Step 5: Smoke test — authenticated path (modelo)**

Log in as modelo. Verify:
- ✅ ModeloDashboard renders correctly
- ✅ Boutique tab shows inventory products
- ✅ Agendamientos panel shows model's schedule

---

## Summary of changes per file

| File | Change |
|---|---|
| `App.tsx` | Remove `ClienteNavbar` import + `GlobalLoader` const; add `PublicProvidersWrapper`; use it for unauthenticated route |
| `BalanceDashboard.tsx` | Remove `React`, `TrendingUp`, `TrendingDown`; add `recargar()` call on mount |
| `AnalyticsContext.tsx` | Remove `React`; hoist + expose `cargarVentas`; remove auto-fetch useEffect |
| `BalanceFinancieroContext.tsx` | Remove `React`; remove auto-fetch call from useEffect |
| `CarritoContext.tsx` | Remove unused `loading`/`setLoading` state + `itemsError` |
| `AdminDashboard.tsx` | Remove `toast`, `HistorialClientesPanel`, `FinanzasPanel`; add triggers for 5 contexts |
| `AgendamientosContext.tsx` | Remove auto-fetch call from useEffect |
| `ClientesContext.tsx` | Expose `cargarClientes`; remove auto-fetch |
| `ServiciosContext.tsx` | Remove auto-fetch call from useEffect |
| `GastosContext.tsx` | Remove auto-fetch calls + window focus listener from useEffect |
| `InventoryContext.tsx` | Remove auto-fetch call from useEffect |
| `ProgramadorDashboard.tsx` | Add triggers for `recargarAgendamientos`, `cargarClientes` |
| `OwnerDashboard.tsx` | Add triggers for `recargarServicios`, `cargarGastos`, `recargarProductos` |
| `ModeloDashboard.tsx` | Add triggers for `recargarAgendamientos`, `recargarServicios`, `recargarProductos` |
| `AnalyticsPanel.tsx` | Remove 9 unused imports; add `cargarVentas()` trigger on mount |
