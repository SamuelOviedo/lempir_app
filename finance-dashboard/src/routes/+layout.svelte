<script lang="ts">
  import { dashboard } from '$lib/store';
  import Header from '$lib/components/Header.svelte';
  import Dashboard from '$lib/components/pages/Dashboard.svelte';
  import TransactionList from '$lib/components/pages/TransactionList.svelte';
  import Coach from '$lib/components/pages/Coach.svelte';
  import Settings from '$lib/components/pages/Settings.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import '../app.css';

  let state = $state({
    view: 'dashboard',
    mode: 'dark',
    modal: false,
    toast: ''
  });

  dashboard.subscribe(s => {
    state.view = s.view;
    state.mode = s.mode;
    state.modal = s.modal;
    state.toast = s.toast;
  });
</script>

<div class="min-h-screen flex bg-gradient-radial text-white" class:light={state.mode === 'light'}>
  <!-- Sidebar -->
  <aside class="w-60 px-4 py-6 border-r sticky top-0 h-screen flex flex-col" style="border-color: rgba(255,255,255,0.07); background: linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.014))">
    <!-- Logo -->
    <div class="flex items-center gap-3 px-2 mb-8">
      <div class="w-8 h-8 flex-none rounded-2.5 bg-gradient-to-r from-[#5affa0] to-[#22a865] flex items-center justify-center text-xs font-700" style="color: rgba(8,11,15,0.9)">$</div>
      <div class="text-sm font-600">Ledgerly</div>
    </div>

    <!-- Nav Menu -->
    <nav class="flex-1 space-y-1">
      <button
        onclick={() => dashboard.setView('dashboard')}
        class="w-full text-left px-4 py-2.5 rounded-3 text-sm font-500 transition-all"
        class:active={state.view === 'dashboard'}
        style={state.view === 'dashboard' ? 'background-color: rgba(90,255,160,0.12); color: white; border: 1px solid rgba(90,255,160,0.22)' : 'color: rgba(230,237,243,0.60); border: 1px solid transparent; background: transparent'}
      >
        Tablero
      </button>
      <button
        onclick={() => dashboard.setView('transactions')}
        class="w-full text-left px-4 py-2.5 rounded-3 text-sm font-500 transition-all"
        class:active={state.view === 'transactions'}
        style={state.view === 'transactions' ? 'background-color: rgba(90,255,160,0.12); color: white; border: 1px solid rgba(90,255,160,0.22)' : 'color: rgba(230,237,243,0.60); border: 1px solid transparent; background: transparent'}
      >
        Transacciones
      </button>
      <button
        onclick={() => dashboard.setView('coach')}
        class="w-full text-left px-4 py-2.5 rounded-3 text-sm font-500 transition-all"
        class:active={state.view === 'coach'}
        style={state.view === 'coach' ? 'background-color: rgba(90,255,160,0.12); color: white; border: 1px solid rgba(90,255,160,0.22)' : 'color: rgba(230,237,243,0.60); border: 1px solid transparent; background: transparent'}
      >
        Entrenador
      </button>
      <button
        onclick={() => dashboard.setView('settings')}
        class="w-full text-left px-4 py-2.5 rounded-3 text-sm font-500 transition-all"
        class:active={state.view === 'settings'}
        style={state.view === 'settings' ? 'background-color: rgba(90,255,160,0.12); color: white; border: 1px solid rgba(90,255,160,0.22)' : 'color: rgba(230,237,243,0.60); border: 1px solid transparent; background: transparent'}
      >
        Configuración
      </button>
    </nav>

    <!-- Footer -->
    <div class="flex items-center gap-2.5 px-4 py-3 rounded-3 border" style="border-color: rgba(255,255,255,0.07); background: rgba(255,255,255,0.05)">
      <div class="w-7 h-7 flex-none rounded-full bg-gradient-to-r from-[#5affa0] to-[#22a865] flex items-center justify-center text-xs font-700" style="color: rgba(8,11,15,0.9)">M</div>
      <div class="flex-1 min-w-0">
        <div class="text-xs font-600 truncate">Maya García</div>
        <div class="text-xs" style="color: rgba(230,237,243,0.42); margin-top: 2px">Cuenta activa</div>
      </div>
    </div>
  </aside>

  <main class="flex-1 flex flex-col">
    <Header />

    <div class="flex-1 overflow-auto">
      {#if state.view === 'dashboard'}
        <Dashboard />
      {:else if state.view === 'transactions'}
        <TransactionList />
      {:else if state.view === 'coach'}
        <Coach />
      {:else if state.view === 'settings'}
        <Settings />
      {/if}
    </div>
  </main>

  {#if state.modal}
    <Modal />
  {/if}

  {#if state.toast}
    <div
      class="fixed left-1/2 bottom-24 transform -translate-x-1/2 max-w-sm px-4 py-3 rounded-3 border border-[#5affa0]/30 bg-[#0c1410]/96 text-[#5affa0] text-xs font-500 shadow-lg"
    >
      {state.toast}
    </div>
  {/if}
</div>

<style global>
  :root {
    --acc: #5affa0;
    --acc-dark: #22a865;
    --bg: #080b0f;
    --ink: #e6edf3;
  }

  html, body {
    margin: 0;
    padding: 0;
    background: var(--bg);
    color: var(--ink);
    font-family: 'Inter', system-ui, sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  a {
    color: var(--acc);
    text-decoration: none;
  }

  a:hover {
    color: #8effc0;
  }

  .bg-gradient-radial {
    background: radial-gradient(
        1200px 600px at 78% -10%,
        rgba(90, 255, 160, 0.12),
        transparent 60%
      ),
      radial-gradient(900px 500px at 8% 110%, rgba(80, 120, 255, 0.06), transparent 60%),
      var(--bg);
  }
</style>
