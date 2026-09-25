<script lang="ts">
	import { dashboard, ACCENTS, type DashboardState } from '$lib/store';

	const accents = ACCENTS;

	const themeModes: Array<{ id: DashboardState['mode']; label: string; icon: string }> = [
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

	let currentAccent = $derived(accents.find((a) => a.id === $dashboard.accent) ?? accents[0]);
</script>

<div class="px-4 py-6 md:px-8">
	<div class="flex max-w-xl flex-col gap-3.5">
		<!-- Toggles -->
		{#each settingsItems as item (item.key)}
			{@const on = !!$dashboard.toggles[item.key]}
			<div
				class="rounded-4 flex items-center gap-4 border px-4 py-4"
				style="border-color: var(--line); background: linear-gradient(to bottom, var(--c1), var(--c2))"
			>
				<div class="min-w-0 flex-1">
					<div class="font-600 text-sm">{item.title}</div>
					<div class="mt-1.25 text-xs leading-snug" style="color: var(--ink2)">
						{item.body}
					</div>
				</div>
				<button
					type="button"
					role="switch"
					aria-checked={on}
					onclick={() => dashboard.toggleSetting(item.key)}
					title={item.title}
					aria-label={item.title}
					class="toggle-track flex h-6.5 w-11 flex-none cursor-pointer items-center justify-start rounded-full border p-0.75 transition-all"
					class:on
				>
					<span
						class="toggle-knob h-4.5 w-4.5 rounded-full transition-all"
						style={on ? 'transform: translateX(calc(100% + 2px))' : 'transform: translateX(0)'}
					></span>
				</button>
			</div>
		{/each}

		<!-- Theme Appearance Section -->
		<div class="mt-6 border-t pt-6" style="border-color: var(--line)">
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
					style="color: var(--ink2)"
				>
					<path d="M12 3a9 9 0 100 18 4.5 4.5 0 000-9 4.5 4.5 0 010-9z" />
				</svg>
				<div class="font-600 text-xs tracking-tight">Configuración de Apariencia</div>
			</div>

			<!-- Theme Mode -->
			<div>
				<div class="font-700 mb-2.25 text-xs tracking-widest" style="color: var(--ink3)">
					MODO DE TEMA
				</div>
				<div class="flex gap-2.25">
					{#each themeModes as mode (mode.id)}
						{@const selected = $dashboard.mode === mode.id}
						<button
							type="button"
							onclick={() => dashboard.setMode(mode.id)}
							aria-pressed={selected}
							class="theme-btn rounded-3.25 font-600 flex flex-1 cursor-pointer items-center gap-2 border px-3 py-2.75 text-xs transition-all"
							class:selected
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
							{#if selected}
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
				<div class="font-700 mb-2.5 text-xs tracking-widest" style="color: var(--ink3)">
					COLOR DE ACENTO
				</div>
				<div class="flex gap-2.5">
					{#each accents as accent (accent.id)}
						{@const selected = $dashboard.accent === accent.id}
						<button
							type="button"
							onclick={() => dashboard.setAccent(accent.id)}
							title={accent.label}
							aria-label="Color de acento: {accent.label}"
							aria-pressed={selected}
							class="rounded-3 flex h-9.5 w-9.5 flex-none cursor-pointer items-center justify-center border-[1.5px] p-0 transition-all"
							style={selected
								? `background: var(--fill); border-color: ${accent.acc}; box-shadow: 0 0 16px ${accent.acc}40`
								: 'background: var(--fill); border-color: var(--line)'}
						>
							<span
								class="h-5 w-5 rounded-full"
								style={`background: linear-gradient(150deg, ${accent.acc}, ${accent.accd})`}
							></span>
						</button>
					{/each}
				</div>
				<div class="mt-2.75 text-xs" style="color: var(--ink3)">
					Acento actual: <span class="font-600" style="color: var(--acct)">
						{currentAccent.label}
					</span>
				</div>
			</div>

			{#if $dashboard.dbError}
				<div
					class="rounded-2 mt-4 border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-400"
					role="alert"
				>
					No se pudo guardar la preferencia. Reintenta.
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.toggle-track {
		background-color: var(--fill);
		border-color: var(--line);
	}

	.toggle-track.on {
		background-color: var(--acc22);
		border-color: var(--acc30);
		box-shadow: 0 0 16px var(--acc12);
	}

	.toggle-knob {
		background-color: var(--ink3);
	}

	.toggle-track.on .toggle-knob {
		background-color: var(--acc);
	}

	.theme-btn {
		background-color: var(--fill);
		color: var(--ink2);
		border-color: var(--line);
	}

	.theme-btn.selected {
		background-color: var(--acc12);
		color: var(--ink);
		border-color: var(--acc30);
		box-shadow: 0 0 18px var(--acc12);
	}
</style>
