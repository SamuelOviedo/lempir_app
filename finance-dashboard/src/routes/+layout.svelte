<script lang="ts">
	import { dashboard } from '$lib/store';
	import Header from '$lib/components/Header.svelte';
	import DashboardPage from '$lib/components/pages/Dashboard.svelte';
	import TransactionList from '$lib/components/pages/TransactionList.svelte';
	import Coach from '$lib/components/pages/Coach.svelte';
	import Settings from '$lib/components/pages/Settings.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { fly, fade } from 'svelte/transition';
	import '../app.css';

	let state = $state({
		view: 'dashboard',
		mode: 'dark',
		modal: false,
		toast: ''
	});

	dashboard.subscribe((s) => {
		state.view = s.view;
		state.mode = s.mode;
		state.modal = s.modal;
		state.toast = s.toast;
	});
</script>

<div class="bg-gradient-radial flex min-h-screen text-white" class:light={state.mode === 'light'}>
	<!-- Sidebar -->
	<aside
		class="sticky top-0 flex h-screen flex-col border-r"
		style="flex: 0 0 244px; padding: 26px 18px; gap: 28px; border-color: rgba(255,255,255,0.07); background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.014))"
	>
		<!-- Logo -->
		<div class="flex items-center gap-2.75 px-2">
			<div
				class="rounded-2.5 font-700 flex h-8 w-8 flex-none items-center justify-center bg-gradient-to-r from-[#5affa0] to-[#22a865] text-xs"
				style="color: rgba(8,11,15,0.9)"
			>
				$
			</div>
			<div>
				<div class="font-600 text-sm">Ledgerly</div>
				<div class="text-xs font-600 tracking-wider" style="color: rgba(230,237,243,0.42)">ADIÓS A LAS HOJAS DE CÁLCULO</div>
			</div>
		</div>

		<!-- Nav Menu -->
		<nav class="flex-1 space-y-1">
			<button
				onclick={() => dashboard.setView('dashboard')}
				class="rounded-3 font-500 w-full px-4 py-2.5 text-left text-sm transition-all"
				class:active={state.view === 'dashboard'}
				style={state.view === 'dashboard'
					? 'background-color: rgba(90,255,160,0.12); color: white; border: 1px solid rgba(90,255,160,0.22)'
					: 'color: rgba(230,237,243,0.60); border: 1px solid transparent; background: transparent'}
			>
				Tablero
			</button>
			<button
				onclick={() => dashboard.setView('transactions')}
				class="rounded-3 font-500 w-full px-4 py-2.5 text-left text-sm transition-all"
				class:active={state.view === 'transactions'}
				style={state.view === 'transactions'
					? 'background-color: rgba(90,255,160,0.12); color: white; border: 1px solid rgba(90,255,160,0.22)'
					: 'color: rgba(230,237,243,0.60); border: 1px solid transparent; background: transparent'}
			>
				Transacciones
			</button>
			<button
				onclick={() => dashboard.setView('coach')}
				class="rounded-3 font-500 w-full px-4 py-2.5 text-left text-sm transition-all"
				class:active={state.view === 'coach'}
				style={state.view === 'coach'
					? 'background-color: rgba(90,255,160,0.12); color: white; border: 1px solid rgba(90,255,160,0.22)'
					: 'color: rgba(230,237,243,0.60); border: 1px solid transparent; background: transparent'}
			>
				Entrenador
			</button>
			<button
				onclick={() => dashboard.setView('settings')}
				class="rounded-3 font-500 w-full px-4 py-2.5 text-left text-sm transition-all"
				class:active={state.view === 'settings'}
				style={state.view === 'settings'
					? 'background-color: rgba(90,255,160,0.12); color: white; border: 1px solid rgba(90,255,160,0.22)'
					: 'color: rgba(230,237,243,0.60); border: 1px solid transparent; background: transparent'}
			>
				Configuración
			</button>
		</nav>

		<!-- Footer -->
		<div
			class="rounded-3 flex items-center gap-2.5 border px-4 py-3"
			style="border-color: rgba(255,255,255,0.07); background: rgba(255,255,255,0.05)"
		>
			<div
				class="font-700 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gradient-to-r from-[#5affa0] to-[#22a865] text-xs"
				style="color: rgba(8,11,15,0.9)"
			>
				M
			</div>
			<div class="min-w-0 flex-1">
				<div class="font-600 truncate text-xs">Maya García</div>
				<div class="text-xs" style="color: rgba(230,237,243,0.42); margin-top: 2px">
					Cuenta activa
				</div>
			</div>
		</div>
	</aside>

	<main class="flex flex-1 flex-col">
		<Header />

		<div class="flex flex-1 overflow-hidden gap-8">
			<!-- Central Content -->
			<div class="flex-1 overflow-auto">
				{#if state.view === 'dashboard'}
					<DashboardPage />
				{:else if state.view === 'transactions'}
					<TransactionList />
				{:else if state.view === 'coach'}
					<Coach />
				{:else if state.view === 'settings'}
					<Settings />
				{/if}
			</div>

			<!-- Right Sidebar (visible only on dashboard view) -->
			{#if state.view === 'dashboard'}
				<aside
					class="flex-col overflow-auto border-l"
					style="flex: 1 1 320px; padding: 24px 0 40px; border-color: rgba(255,255,255,0.07); background: linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.014))"
				>
					<div class="space-y-3.5 px-4.5">
						<!-- AI Insights Section -->
						<div
							class="rounded-5 border p-5 relative overflow-hidden"
							style="border-color: rgba(90,255,160,0.3); background: linear-gradient(165deg, rgba(90,255,160,0.12), rgba(255,255,255,0.014)); box-shadow: 0 0 44px rgba(90,255,160,0.12)"
						>
							<div class="absolute w-52 h-52 rounded-full" style="background: radial-gradient(circle, rgba(90,255,160,0.22), transparent 70%); left: -17px; top: -20px; animation: aiPulse 6s ease-in-out infinite"></div>
							<div class="relative">
								<div class="flex items-center gap-2.5 mb-4">
									<div class="flex h-7 w-7 flex-none items-center justify-center rounded-2.5" style="background: rgba(90,255,160,0.22); border: 1px solid rgba(90,255,160,0.3); box-shadow: 0 0 16px rgba(90,255,160,0.3)">
										<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5affa0" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
											<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"></path>
										</svg>
									</div>
									<div>
										<div class="text-xs font-600">Ideas de IA</div>
										<div class="text-xs font-500" style="color: #5affa0">Datos actuales</div>
									</div>
								</div>
								<div class="text-sm font-500 leading-6" style="letter-spacing: -0.02em">Oportunidad detectada</div>
								<div class="text-xs mt-2.75 leading-1.6" style="color: rgba(230,237,243,0.6)">Reduciendo gastos en restaurantes podrías ahorrar $450/mes.</div>
								<div class="flex gap-2 mt-3.75">
									<button class="flex-1 rounded-2.75 px-3 py-2.5 text-xs font-600 text-white border-none" style="background: linear-gradient(160deg, #5affa0, #22a865); box-shadow: 0 0 20px rgba(90,255,160,0.3)">
										Aplicar sugerencia
									</button>
									<button class="flex-none rounded-2.75 px-3 py-2.5 text-xs font-500 border" style="border-color: rgba(255,255,255,0.07); background: rgba(8,11,15,0.5); color: rgba(230,237,243,0.6)">
										Omitir
									</button>
								</div>
							</div>
						</div>

						<!-- Appearance Settings -->
						<div
							class="rounded-4 border p-4.5"
							style="border-color: rgba(255,255,255,0.07); background: linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.014))"
						>
							<div class="mb-4 flex items-center gap-2.25">
								<svg
									width="15"
									height="15"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									style="color: rgba(230,237,243,0.60)"
								>
									<path d="M12 3a9 9 0 100 18 4.5 4.5 0 000-9 4.5 4.5 0 010-9z" />
								</svg>
								<div class="font-600 text-xs">Configuración de Apariencia</div>
							</div>

							<div class="font-700 mb-2.25 text-xs tracking-widest" style="color: rgba(230,237,243,0.42)">MODO DE TEMA</div>
							<div class="flex gap-2 mb-4">
								<button class="rounded-2.5 flex-1 border px-2.5 py-1.5 text-xs font-500" style="border-color: rgba(90,255,160,0.3); background-color: rgba(90,255,160,0.12); color: #5affa0">
									☀️ Claro
								</button>
								<button class="rounded-2.5 flex-1 border px-2.5 py-1.5 text-xs font-500" style="border-color: rgba(255,255,255,0.07); background-color: rgba(255,255,255,0.06); color: rgba(230,237,243,0.6)">
									🌙 Oscuro
								</button>
							</div>

							<div class="font-700 mb-2.5 text-xs tracking-widest" style="color: rgba(230,237,243,0.42)">COLOR DE ACENTO</div>
							<div class="flex gap-2">
								<button title="Verde" style="background: linear-gradient(150deg, #5affa0, #22a865); border: 1px solid #5affa0; box-shadow: 0 0 12px rgba(90,255,160,0.3)" class="rounded-2 h-6 w-6 flex-none cursor-pointer"></button>
								<button title="Azul" style="background: linear-gradient(150deg, #6aa8ff, #2563eb); border: 1px solid rgba(255,255,255,0.07)" class="rounded-2 h-6 w-6 flex-none cursor-pointer"></button>
								<button title="Púrpura" style="background: linear-gradient(150deg, #b48cff, #7c3aed); border: 1px solid rgba(255,255,255,0.07)" class="rounded-2 h-6 w-6 flex-none cursor-pointer"></button>
								<button title="Naranja" style="background: linear-gradient(150deg, #ffab5e, #e07a17); border: 1px solid rgba(255,255,255,0.07)" class="rounded-2 h-6 w-6 flex-none cursor-pointer"></button>
							</div>
						</div>

						<!-- Where Did The Money Go -->
						<div
							class="rounded-4 border p-4.5"
							style="border-color: rgba(255,255,255,0.07); background: linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.014))"
						>
							<div class="font-600 text-xs mb-3.5">¿A dónde fue el dinero?</div>
							<div class="flex h-2 rounded-full overflow-hidden gap-0.5">
								<div style="width: 32%; background: #ff8a8a"></div>
								<div style="width: 28%; background: #5affa0"></div>
								<div style="width: 24%; background: #b48cff"></div>
								<div style="width: 16%; background: #ffab5e"></div>
							</div>
							<div class="mt-3.5 flex flex-col gap-2">
								<div class="flex items-center gap-2.25 text-xs">
									<span class="w-1.75 h-1.75 rounded-full" style="background: #ff8a8a"></span>
									<span style="color: rgba(230,237,243,0.6)">Alimentos</span>
									<span class="ml-auto font-mono text-xs" style="color: rgba(230,237,243,0.42)">32%</span>
								</div>
								<div class="flex items-center gap-2.25 text-xs">
									<span class="w-1.75 h-1.75 rounded-full" style="background: #5affa0"></span>
									<span style="color: rgba(230,237,243,0.6)">Transporte</span>
									<span class="ml-auto font-mono text-xs" style="color: rgba(230,237,243,0.42)">28%</span>
								</div>
								<div class="flex items-center gap-2.25 text-xs">
									<span class="w-1.75 h-1.75 rounded-full" style="background: #b48cff"></span>
									<span style="color: rgba(230,237,243,0.6)">Ocio</span>
									<span class="ml-auto font-mono text-xs" style="color: rgba(230,237,243,0.42)">24%</span>
								</div>
								<div class="flex items-center gap-2.25 text-xs">
									<span class="w-1.75 h-1.75 rounded-full" style="background: #ffab5e"></span>
									<span style="color: rgba(230,237,243,0.6)">Otros</span>
									<span class="ml-auto font-mono text-xs" style="color: rgba(230,237,243,0.42)">16%</span>
								</div>
							</div>
						</div>

						<!-- Upcoming Payments -->
						<div
							class="rounded-4 border p-4.5"
							style="border-color: rgba(255,255,255,0.07); background: linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.014))"
						>
							<div class="flex items-baseline justify-between gap-2.5 mb-3">
								<div class="font-600 text-xs">Próximos pagos</div>
								<div class="text-xs" style="color: rgba(230,237,243,0.42)">en 14 días</div>
							</div>
							<div class="flex flex-col gap-2.75">
								<div class="flex items-center gap-2.75">
									<div class="flex-none text-center" style="width: 34px; padding: 5px 0; border-radius: 9px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.07)">
										<div class="font-600 text-xs">15</div>
										<div class="text-xs mt-0.5 tracking-wider" style="color: rgba(230,237,243,0.42); letter-spacing: 0.06em">SEP</div>
									</div>
									<div class="flex-1 min-w-0">
										<div class="font-500 text-xs">Servicios</div>
										<div class="text-xs mt-0.5" style="color: rgba(230,237,243,0.42)">Utilities</div>
									</div>
									<div class="flex-none font-500 font-mono text-xs" style="color: #e8636e">−$89</div>
								</div>
								<div class="flex items-center gap-2.75">
									<div class="flex-none text-center" style="width: 34px; padding: 5px 0; border-radius: 9px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.07)">
										<div class="font-600 text-xs">20</div>
										<div class="text-xs mt-0.5 tracking-wider" style="color: rgba(230,237,243,0.42); letter-spacing: 0.06em">SEP</div>
									</div>
									<div class="flex-1 min-w-0">
										<div class="font-500 text-xs">Suscripciones</div>
										<div class="text-xs mt-0.5" style="color: rgba(230,237,243,0.42)">Streaming</div>
									</div>
									<div class="flex-none font-500 font-mono text-xs" style="color: #e8636e">−$34</div>
								</div>
								<div class="flex items-center gap-2.75">
									<div class="flex-none text-center" style="width: 34px; padding: 5px 0; border-radius: 9px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.07)">
										<div class="font-600 text-xs">1</div>
										<div class="text-xs mt-0.5 tracking-wider" style="color: rgba(230,237,243,0.42); letter-spacing: 0.06em">OCT</div>
									</div>
									<div class="flex-1 min-w-0">
										<div class="font-500 text-xs">Alquiler</div>
										<div class="text-xs mt-0.5" style="color: rgba(230,237,243,0.42)">Rent</div>
									</div>
									<div class="flex-none font-500 font-mono text-xs" style="color: #e8636e">−$900</div>
								</div>
							</div>
						</div>
					</div>
				</aside>
			{/if}
		</div>
	</main>

	{#if state.modal}
		<Modal />
	{/if}

	{#if state.toast}
		<div
			class="rounded-3 font-500 fixed bottom-24 left-1/2 max-w-sm -translate-x-1/2 transform border border-[#5affa0]/30 bg-[#0c1410]/96 px-4 py-3 text-xs text-[#5affa0] shadow-lg"
			transition:fly={{ y: 10, duration: 200 }}
		>
			{state.toast}
		</div>
	{/if}
</div>

<style global>
	:root {
		/* Accent (green by default) */
		--acc: #5affa0;
		--accd: #22a865;
		--accink: #04140b;
		--accfg: #0f6e44;
		--acc12: rgba(90, 255, 160, 0.12);
		--acc22: rgba(90, 255, 160, 0.22);
		--acc30: rgba(90, 255, 160, 0.32);

		/* Dark theme (default) */
		--bg: #080b0f;
		--ink: #e6edf3;
		--ink2: rgba(230, 237, 243, 0.62);
		--ink3: rgba(230, 237, 243, 0.44);
		--line: rgba(255, 255, 255, 0.07);
		--c1: rgba(255, 255, 255, 0.05);
		--c2: rgba(255, 255, 255, 0.014);
		--fill: rgba(255, 255, 255, 0.06);
		--panel: rgba(8, 11, 15, 0.5);
		--sheet: linear-gradient(165deg, rgba(24, 31, 39, 0.97), rgba(12, 16, 21, 0.98));
		--toast: rgba(12, 20, 16, 0.96);
	}

	/* Light theme */
	@media (prefers-color-scheme: light) {
		:root {
			--bg: #eef1f5;
			--ink: #0d1418;
			--ink2: rgba(13, 20, 24, 0.64);
			--ink3: rgba(13, 20, 24, 0.48);
			--line: rgba(13, 20, 24, 0.12);
			--c1: rgba(255, 255, 255, 0.92);
			--c2: rgba(255, 255, 255, 0.62);
			--fill: rgba(13, 20, 24, 0.055);
			--panel: rgba(255, 255, 255, 0.8);
			--sheet: #ffffff;
			--toast: #ffffff;
		}
	}

	@keyframes aiPulse {
		0%, 100% {
			opacity: 0.35;
			transform: scale(1);
		}
		50% {
			opacity: 0.75;
			transform: scale(1.06);
		}
	}

	@keyframes riseIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes sheetIn {
		from {
			opacity: 0;
			transform: translateY(18px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes scShine {
		0% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}

	:global(html, body) {
		margin: 0;
		padding: 0;
		background: var(--bg);
		color: var(--ink);
		font-family: 'Inter', system-ui, sans-serif;
	}

	:global(*) {
		box-sizing: border-box;
	}

	:global(a) {
		color: var(--acc);
		text-decoration: none;
	}

	:global(a:hover) {
		color: #8effc0;
	}

	.bg-gradient-radial {
		background:
			radial-gradient(1200px 600px at 78% -10%, rgba(90, 255, 160, 0.12), transparent 60%),
			radial-gradient(900px 500px at 8% 110%, rgba(80, 120, 255, 0.06), transparent 60%), var(--bg);
	}
</style>
