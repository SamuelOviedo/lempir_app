<script lang="ts">
  const allInsights = [
    {
      icon: '💰',
      title: 'Oportunidad de ahorro',
      desc: 'Reduciendo gastos en restaurantes, podrías ahorrar $450/mes.',
      action: 'Ver detalles'
    },
    {
      icon: '📊',
      title: 'Patrón de gasto detectado',
      desc: 'Tus gastos de transporte aumentaron 32% este mes.',
      action: 'Analizar'
    },
    {
      icon: '🎯',
      title: 'Progreso en meta',
      desc: 'Vas 78% del camino hacia tu meta de deuda cero.',
      action: 'Ver timeline'
    },
    {
      icon: '⚠️',
      title: 'Alerta de categoría',
      desc: 'Gastos de Lifestyle están en 92% del presupuesto.',
      action: 'Ajustar presupuesto'
    }
  ];

  let currentInsight = $state(allInsights[0]);
</script>

<div class="px-8 py-6">
  <div class="flex flex-col gap-6 max-w-2xl">
    <!-- Welcome Section -->
    <div class="flex flex-col gap-2">
      <h2 class="text-2xl font-600">Tu Plan de Salida en 90 Días</h2>
      <p class="text-sm" style="color: rgba(230,237,243,0.60)">Basado en tu flujo de efectivo, deberías estar en cero deuda en Mayo 2027.</p>
    </div>

    <!-- Main Insight Card -->
    <div class="px-6 py-6 rounded-5.5 border border-[#5affa0]/22 bg-gradient-to-b from-[#5affa0]/12 to-transparent">
      <div class="flex items-start gap-4">
        <div class="text-4xl flex-none">{currentInsight.icon}</div>
        <div class="flex-1 flex flex-col gap-3">
          <div>
            <h3 class="font-600 text-base">{currentInsight.title}</h3>
            <p class="text-sm mt-1.5" style="color: rgba(230,237,243,0.60)">{currentInsight.desc}</p>
          </div>
          <button
            class="px-3 py-2 rounded-2.75 bg-[#5affa0]/12 border border-[#5affa0]/30 text-[#5affa0] text-xs font-600 cursor-pointer hover:bg-[#5affa0]/22 transition-all text-left"
          >
            {currentInsight.action} →
          </button>
        </div>
      </div>
    </div>

    <!-- Insights Grid -->
    <div class="flex flex-col gap-2.5">
      <div class="text-xs tracking-widest font-700" style="color: rgba(230,237,243,0.42)">OTROS INSIGHTS</div>
      <div class="grid grid-cols-2 gap-3">
        {#each allInsights.slice(1) as insight}
          <div class="px-4 py-4 rounded-3.5 border transition-all cursor-pointer" style="border-color: rgba(255,255,255,0.07); background-color: rgba(255,255,255,0.05)" onmouseover="this.style.backgroundColor = 'rgba(255,255,255,0.06)'" onmouseout="this.style.backgroundColor = 'rgba(255,255,255,0.05)'">
            <div class="text-2xl mb-2">{insight.icon}</div>
            <div class="text-xs font-600 mb-1.25">{insight.title}</div>
            <div class="text-xs leading-tight" style="color: rgba(230,237,243,0.42)">{insight.desc}</div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Timeline Section -->
    <div class="mt-4 pt-6 border-t" style="border-color: rgba(255,255,255,0.07)">
      <div class="text-xs tracking-widest font-700 mb-4" style="color: rgba(230,237,243,0.42)">TIMELINE HACIA DEUDA CERO</div>
      <div class="space-y-2.5">
        {#each [
          { month: 'Octubre 2026', status: 'Deuda: $2,800' },
          { month: 'Enero 2027', status: 'Deuda: $1,400' },
          { month: 'Mayo 2027', status: '🎉 Meta alcanzada' }
        ] as item}
          <div class="flex items-center gap-3">
            <div class="w-3 h-3 flex-none rounded-full" style={item.status.includes('🎉') ? 'background-color: #5affa0' : 'background-color: rgba(255,255,255,0.30)'} />
            <div class="flex-1">
              <div class="text-xs font-500">{item.month}</div>
              <div class="text-xs" style="color: rgba(230,237,243,0.42)">{item.status}</div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  :global {
    /* Coach page specific styles */
  }
</style>
