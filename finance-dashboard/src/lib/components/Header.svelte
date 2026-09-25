<script lang="ts">
	import { dashboard } from '$lib/store';

	let currentView = $state('dashboard');
	let currentRange = $state('Este mes');
	dashboard.subscribe((s) => {
		currentView = s.view;
		currentRange = s.range || 'Este mes';
	});

	const titles: Record<string, [string, string]> = {
		dashboard: ['SEPTIEMBRE 2026 · ESTE MES', 'Buenos días, Maya'],
		transactions: ['LIBRO MAYOR', 'Cada movimiento, registrado'],
		coach: ['ENTRENADOR FINANCIERO DE IA', 'Tu plan de salida en 90 días'],
		settings: ['PREFERENCIAS', 'Configuración']
	};

	const ranges: Array<'Este mes' | 'Trimestre' | 'Año'> = ['Este mes', 'Trimestre', 'Año'];
</script>

<header
	class="flex flex-wrap items-end gap-3 border-b px-4 py-5 md:gap-5 md:px-8"
	style="border-color: var(--line)"
>
	<div class="flex flex-1 flex-col">
		<div class="font-600 text-xs tracking-widest" style="color: var(--ink3)">
			{titles[currentView]?.[0] || ''}
		</div>
		<h1 class="font-600 mt-1.75 text-2xl tracking-tight">{titles[currentView]?.[1] || ''}</h1>
	</div>

	<div class="flex flex-wrap items-center gap-2.5">
		{#if currentView === 'dashboard'}
			<div
				class="rounded-2.75 flex gap-0.5 border px-0.75 py-0.75"
				style="border-color: var(--line); background-color: var(--fill)"
			>
				{#each ranges as range}
					<button
						onclick={() => dashboard.setRange(range as 'Este mes' | 'Trimestre' | 'Año')}
						class="rounded-2.25 font-600 cursor-pointer border-none px-3 py-1.75 text-xs transition-all"
						class:active={currentRange === range}
					>
						{range}
					</button>
				{/each}
			</div>
		{/if}

		<button
			onclick={() => dashboard.openModal()}
			class="rounded-2.75 font-600 flex cursor-pointer items-center gap-1.75 border border-(--acc)/30 bg-(--acc)/12 px-3.5 py-2.25 text-xs text-(--acct) transition-all hover:bg-(--acc)/22"
		>
			<svg
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.4"
				stroke-linecap="round"
			>
				<path d="M12 5v14M5 12h14" />
			</svg>
			Añadir rápido
		</button>
	</div>
</header>

<style>
	.active {
		background-color: var(--acc12);
		color: var(--ink);
		border-color: var(--acc22);
	}

	button:not(.active) {
		background-color: transparent;
		color: var(--ink3);
	}

	button:not(.active):hover {
		background-color: var(--fill);
		color: var(--ink2);
	}
</style>
