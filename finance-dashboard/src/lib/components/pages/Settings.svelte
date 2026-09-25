<script lang="ts">
	import { dashboard } from '$lib/store';

	let state = $state({
		toggles: {} as Record<string, boolean>,
		mode: 'dark',
		accent: 'green'
	});
	dashboard.subscribe((s) => {
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
		{
			id: 'light',
			label: 'Modo Claro',
			icon: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6L4.2 4.2M19.8 19.8l-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4M12 17a5 5 0 100-10 5 5 0 000 10z'
		},
		{ id: 'dark', label: 'Modo Oscuro', icon: 'M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z' }
	];

	const settingsItems = [
		{
			key: 'alerts',
			title: 'Alertas de sobregasto',
			body: 'Avísame en el momento en que una categoría supere el 85% de su presupuesto.'
		},
		{
			key: 'roundup',
			title: 'Redondeo a Metas de Salida',
			body: 'Redondea cada gasto hacia arriba y envía la diferencia al ahorro.'
		},
		{
			key: 'weekly',
			title: 'Resumen semanal del entrenador',
			body: 'Un correo cada lunes con los tres movimientos de mayor impacto.'
		},
		{
			key: 'sync',
			title: 'Importar hoja de cálculo',
			body: 'Sigue sincronizando el archivo de Excel heredado hasta que decidas dejarlo atrás.'
		}
	];
</script>

<div class="px-4 py-6 md:px-8">
	<div class="flex max-w-xl flex-col gap-3.5">
		<!-- Toggles -->
		{#each settingsItems as item}
			<div
				class="rounded-4 flex items-center gap-4 border px-4 py-4"
				style="border-color: rgba(255,255,255,0.07); background: linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.014))"
			>
				<div class="min-w-0 flex-1">
					<div class="font-600 text-sm">{item.title}</div>
					<div class="mt-1.25 text-xs leading-snug" style="color: rgba(230,237,243,0.60)">
						{item.body}
					</div>
				</div>
				<button
					onclick={() => dashboard.toggleSetting(item.key)}
					title="Toggle {item.title}"
					aria-label="Toggle {item.title}"
					class="toggle-track flex h-6.5 w-11 flex-none cursor-pointer items-center justify-start rounded-full border-none p-0.75 transition-all"
					class:active={state.toggles[item.key]}
				>
					<span
						class="toggle-knob h-4.5 w-4.5 rounded-full transition-all"
						class:active-knob={state.toggles[item.key]}
						style={state.toggles[item.key]
							? 'transform: translateX(calc(100% + 2px))'
							: 'transform: translateX(0)'}
					></span>
				</button>
			</div>
		{/each}

		<!-- Theme Appearance Section -->
		<div class="mt-6 border-t pt-6" style="border-color: rgba(255,255,255,0.07)">
			<div class="mb-4 flex items-center gap-2.25">
				<svg
					width="15"
					height="15"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					class="flex-none"
					style="color: rgba(230,237,243,0.60)"
				>
					<path d="M12 3a9 9 0 100 18 4.5 4.5 0 000-9 4.5 4.5 0 010-9z" />
				</svg>
				<div class="font-600 text-xs tracking-tight">Configuración de Apariencia</div>
			</div>

			<!-- Theme Mode -->
			<div>
				<div class="font-700 mb-2.25 text-xs tracking-widest" style="color: rgba(230,237,243,0.42)">
					MODO DE TEMA
				</div>
				<div class="flex gap-2.25">
					{#each themeModes as mode}
						<button
							onclick={() => dashboard.setMode(mode.id as 'dark' | 'light')}
							class="rounded-3.25 font-600 flex flex-1 cursor-pointer items-center gap-2 border px-3 py-2.75 text-xs transition-all"
							class:active-theme={state.mode === mode.id}
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								stroke-linecap="round"
								class="flex-none"
							>
								<path d={mode.icon} />
							</svg>
							<span class="flex-1 text-left">{mode.label}</span>
							{#if state.mode === mode.id}
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.4"
									stroke-linecap="round"
									class="flex-none"
								>
									<path d="M4 12.5l5 5L20 6.5" />
								</svg>
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<!-- Accent Color -->
			<div class="mt-4.5">
				<div class="font-700 mb-2.5 text-xs tracking-widest" style="color: rgba(230,237,243,0.42)">
					COLOR DE ACENTO
				</div>
				<div class="flex gap-2.5">
					{#each accents as accent}
						<button
							onclick={() =>
								dashboard.setAccent(accent.id as 'green' | 'blue' | 'purple' | 'orange')}
							title={accent.label}
							aria-label="Accent color: {accent.label}"
							class="rounded-3 border-1.5 flex h-9.5 w-9.5 flex-none cursor-pointer items-center justify-center bg-white/6 p-0 transition-all"
							class:active-accent={state.accent === accent.id}
							style={state.accent === accent.id
								? `border-color: ${accent.acc}; box-shadow: 0 0 16px ${accent.acc}40`
								: `border-color: rgba(255,255,255,0.07)`}
						>
							<span
								class="h-5 w-5 rounded-full"
								style={`background: linear-gradient(150deg, ${accent.acc}, ${accent.accd})`}
							></span>
						</button>
					{/each}
				</div>
				<div class="mt-2.75 text-xs" style="color: rgba(230,237,243,0.42)">
					Acento actual: <span class="font-600 text-[#5affa0]">
						{accents.find((a) => a.id === state.accent)?.label || 'Verde'}
					</span>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.active {
		background-color: rgba(90, 255, 160, 0.22);
		border-color: rgba(90, 255, 160, 0.3);
		box-shadow: 0 0 16px rgba(90, 255, 160, 0.12);
	}

	.active-knob {
		background-color: #5affa0;
	}

	.active-theme {
		background-color: rgba(90, 255, 160, 0.12);
		color: white;
		border-color: rgba(90, 255, 160, 0.3);
		box-shadow: 0 0 18px rgba(90, 255, 160, 0.12);
	}

	button:not(.active-theme) {
		background-color: rgba(255, 255, 255, 0.06);
		color: rgba(230, 237, 243, 0.6);
		border-color: rgba(255, 255, 255, 0.07);
	}

	.active-accent {
		box-shadow: 0 0 16px rgba(90, 255, 160, 0.32);
	}
</style>
