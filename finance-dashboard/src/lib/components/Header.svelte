<script lang="ts">
  import { dashboard } from '$lib/store';

  let currentView = $state('dashboard');
  let currentRange = $state('Este mes');
  dashboard.subscribe(s => {
    currentView = s.view;
    currentRange = s.range || 'Este mes';
  });

  const titles: Record<string, [string, string]> = {
    dashboard: ['SEPTIEMBRE 2026 · ESTE MES', 'Buenos días, Maya'],
    transactions: ['LIBRO MAYOR', 'Cada movimiento, registrado'],
    coach: ['ENTRENADOR FINANCIERO DE IA', 'Tu plan de salida en 90 días'],
    settings: ['PREFERENCIAS', 'Configuración']
  };

  const ranges = ['Este mes', 'Trimestre', 'Año'];
</script>

<header class="flex items-end gap-5 flex-wrap px-8 py-5 border-b" style="border-color: rgba(255,255,255,0.07)">
  <div class="flex-1 flex flex-col">
    <div class="text-xs tracking-widest font-600" style="color: rgba(230,237,243,0.42)">{titles[currentView]?.[0] || ''}</div>
    <h1 class="mt-1.75 font-600 text-2xl tracking-tight">{titles[currentView]?.[1] || ''}</h1>
  </div>

  <div class="flex items-center gap-2.5 flex-wrap">
    {#if currentView === 'dashboard'}
      <div class="flex gap-0.5 px-0.75 py-0.75 rounded-2.75 border" style="border-color: rgba(255,255,255,0.07); background-color: rgba(255,255,255,0.06)">
        {#each ranges as range}
          <button
            onclick={() => dashboard.setRange(range)}
            class="px-3 py-1.75 rounded-2.25 border-none cursor-pointer text-xs font-600 transition-all"
            class:active={currentRange === range}
          >
            {range}
          </button>
        {/each}
      </div>
    {/if}

    <button
      onclick={() => dashboard.openModal()}
      class="flex items-center gap-1.75 px-3.5 py-2.25 rounded-2.75 border border-[#5affa0]/30 bg-[#5affa0]/12 text-[#5affa0] text-xs font-600 cursor-pointer hover:bg-[#5affa0]/22 transition-all"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
      Añadir rápido
    </button>
  </div>
</header>

<style>
  .active {
    background-color: rgba(90, 255, 160, 0.12);
    color: white;
    border-color: rgba(90, 255, 160, 0.22);
  }

  button:not(.active) {
    background-color: transparent;
    color: rgba(230,237,243,0.42);
  }
</style>
