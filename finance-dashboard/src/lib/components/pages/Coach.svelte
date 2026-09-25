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

<div class="px-4 py-6 md:px-8">
	<div class="flex max-w-2xl flex-col gap-6">
		<!-- Welcome Section -->
		<div class="flex flex-col gap-2">
			<h2 class="font-600 text-2xl">Tu Plan de Salida en 90 Días</h2>
			<p class="text-sm" style="color: var(--ink2)">
				Basado en tu flujo de efectivo, deberías estar en cero deuda en Mayo 2027.
			</p>
		</div>

		<!-- Main Insight Card -->
		<div
			class="rounded-5.5 border border-(--acc)/22 bg-gradient-to-b from-(--acc)/12 to-transparent px-6 py-6"
		>
			<div class="flex items-start gap-4">
				<div class="flex-none text-4xl">{currentInsight.icon}</div>
				<div class="flex flex-1 flex-col gap-3">
					<div>
						<h3 class="font-600 text-base">{currentInsight.title}</h3>
						<p class="mt-1.5 text-sm" style="color: var(--ink2)">
							{currentInsight.desc}
						</p>
					</div>
					<button
						class="rounded-2.75 font-600 cursor-pointer border border-(--acc)/30 bg-(--acc)/12 px-3 py-2 text-left text-xs text-(--acct) transition-all hover:bg-(--acc)/22"
					>
						{currentInsight.action} →
					</button>
				</div>
			</div>
		</div>

		<!-- Insights Grid -->
		<div class="flex flex-col gap-2.5">
			<div class="font-700 text-xs tracking-widest" style="color: var(--ink3)">
				OTROS INSIGHTS
			</div>
			<div class="grid grid-cols-2 gap-3">
				{#each allInsights.slice(1) as insight}
					<div
						class="insight-card rounded-3.5 cursor-pointer border px-4 py-4 transition-all"
						style="border-color: var(--line); background-color: var(--c1)"
					>
						<div class="mb-2 text-2xl">{insight.icon}</div>
						<div class="font-600 mb-1.25 text-xs">{insight.title}</div>
						<div class="text-xs leading-tight" style="color: var(--ink3)">
							{insight.desc}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Timeline Section -->
		<div class="mt-4 border-t pt-6" style="border-color: var(--line)">
			<div class="font-700 mb-4 text-xs tracking-widest" style="color: var(--ink3)">
				TIMELINE HACIA DEUDA CERO
			</div>
			<div class="space-y-2.5">
				{#each [{ month: 'Octubre 2026', status: 'Deuda: $2,800' }, { month: 'Enero 2027', status: 'Deuda: $1,400' }, { month: 'Mayo 2027', status: '🎉 Meta alcanzada' }] as item}
					<div class="flex items-center gap-3">
						<div
							class="h-3 w-3 flex-none rounded-full"
							style={item.status.includes('🎉')
								? 'background-color: var(--acc)'
								: 'background-color: var(--ink3)'}
						></div>
						<div class="flex-1">
							<div class="font-500 text-xs">{item.month}</div>
							<div class="text-xs" style="color: var(--ink3)">{item.status}</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.insight-card:hover {
		background-color: var(--fill);
		transform: translateY(-2px);
	}
</style>
