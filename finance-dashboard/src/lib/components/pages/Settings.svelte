<script lang="ts">
  import { dashboard } from '$lib/store';

  let state = $state({
    toggles: {},
    mode: 'dark',
    accent: 'green'
  });
  dashboard.subscribe(s => {
    state.toggles = s.toggles;
    state.mode = s.mode;
    state.accent = s.accent;
  });

  const accents = [
    { id: 'green', label: 'Verde', acc: '#5affa0', accd: '#22a865' },
    { id: 'blue', label: 'Azul', acc: '#6aa8ff', accd: '#2563eb' },
    { id: 'purple', label: 'Púrpura', acc: '#b48cff', accd: '#7c3aed' },
    { id: 'orange', label: 'Naranja', acc: '#ffab5e', accd: '#e07a17' }
  ];

  const themeModes = [
    { id: 'light', label: 'Modo Claro', icon: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6L4.2 4.2M19.8 19.8l-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4M12 17a5 5 0 100-10 5 5 0 000 10z' },
    { id: 'dark', label: 'Modo Oscuro', icon: 'M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z' }
  ];

  const settingsItems = [
    { key: 'alerts', title: 'Alertas de sobregasto', body: 'Avísame en el momento en que una categoría supere el 85% de su presupuesto.' },
    { key: 'roundup', title: 'Redondeo a Metas de Salida', body: 'Redondea cada gasto hacia arriba y envía la diferencia al ahorro.' },
    { key: 'weekly', title: 'Resumen semanal del entrenador', body: 'Un correo cada lunes con los tres movimientos de mayor impacto.' },
    { key: 'sync', title: 'Importar hoja de cálculo', body: 'Sigue sincronizando el archivo de Excel heredado hasta que decidas dejarlo atrás.' }
  ];
</script>

<div class="px-8 py-6">
  <div class="flex flex-col gap-3.5 max-w-xl">
    <!-- Toggles -->
    {#each settingsItems as item}
      <div class="flex items-center gap-4 px-4 py-4 rounded-4 border" style="border-color: rgba(255,255,255,0.07); background: linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.014))">
        <div class="flex-1 min-w-0">
          <div class="text-sm font-600">{item.title}</div>
          <div class="text-xs mt-1.25 leading-snug" style="color: rgba(230,237,243,0.60)">{item.body}</div>
        </div>
        <button
          onclick={() => dashboard.toggleSetting(item.key)}
          class="flex-none w-11 h-6.5 rounded-full cursor-pointer p-0.75 flex transition-all justify-end items-center border-none"
          class:active={state.toggles[item.key]}
        >
          <span
            class="w-4.5 h-4.5 rounded-full transition-all"
            class:active-knob={state.toggles[item.key]}
          />
        </button>
      </div>
    {/each}

    <!-- Theme Appearance Section -->
    <div class="mt-6 pt-6 border-t" style="border-color: rgba(255,255,255,0.07)">
      <div class="flex items-center gap-2.25 mb-4">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="flex-none" style="color: rgba(230,237,243,0.60)">
          <path d="M12 3a9 9 0 100 18 4.5 4.5 0 000-9 4.5 4.5 0 010-9z" />
        </svg>
        <div class="text-xs font-600 tracking-tight">Configuración de Apariencia</div>
      </div>

      <!-- Theme Mode -->
      <div>
        <div class="text-xs tracking-widest font-700 mb-2.25" style="color: rgba(230,237,243,0.42)">MODO DE TEMA</div>
        <div class="flex gap-2.25">
          {#each themeModes as mode}
            <button
              onclick={() => dashboard.setMode(mode.id)}
              class="flex-1 flex items-center gap-2 px-3 py-2.75 rounded-3.25 border cursor-pointer text-xs font-600 transition-all"
              class:active-theme={state.mode === mode.id}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="flex-none">
                <path d={mode.icon} />
              </svg>
              <span class="flex-1 text-left">{mode.label}</span>
              {#if state.mode === mode.id}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" class="flex-none">
                  <path d="M4 12.5l5 5L20 6.5" />
                </svg>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <!-- Accent Color -->
      <div class="mt-4.5">
        <div class="text-xs tracking-widest font-700 mb-2.5" style="color: rgba(230,237,243,0.42)">COLOR DE ACENTO</div>
        <div class="flex gap-2.5">
          {#each accents as accent}
            <button
              onclick={() => dashboard.setAccent(accent.id)}
              title={accent.label}
              class="w-9.5 h-9.5 flex-none rounded-3 cursor-pointer flex items-center justify-center p-0 border-1.5 transition-all bg-white/6"
              class:active-accent={state.accent === accent.id}
              style={state.accent === accent.id ? `border-color: ${accent.acc}; box-shadow: 0 0 16px ${accent.acc}40` : `border-color: rgba(255,255,255,0.07)`}
            >
              <span
                class="w-5 h-5 rounded-full"
                style={`background: linear-gradient(150deg, ${accent.acc}, ${accent.accd})`}
              />
            </button>
          {/each}
        </div>
        <div class="text-xs mt-2.75" style="color: rgba(230,237,243,0.42)">
          Acento actual: <span class="text-[#5affa0] font-600">
            {accents.find(a => a.id === state.accent)?.label || 'Verde'}
          </span>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .active {
    background-color: rgba(90, 255, 160, 0.22);
    border-color: rgba(90, 255, 160, 0.30);
    box-shadow: 0 0 16px rgba(90, 255, 160, 0.12);
  }

  .active-knob {
    background-color: #5affa0;
  }

  .active-theme {
    background-color: rgba(90, 255, 160, 0.12);
    color: white;
    border-color: rgba(90, 255, 160, 0.30);
    box-shadow: 0 0 18px rgba(90, 255, 160, 0.12);
  }

  button:not(.active-theme) {
    background-color: rgba(255, 255, 255, 0.06);
    color: rgba(230, 237, 243, 0.60);
    border-color: rgba(255, 255, 255, 0.07);
  }
</style>
