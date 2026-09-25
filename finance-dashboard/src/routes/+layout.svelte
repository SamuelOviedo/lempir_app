<script lang="ts">
	import { onMount } from 'svelte';
	import { dashboard, type DashboardState } from '$lib/store';
	import Header from '$lib/components/Header.svelte';
	import DashboardPage from '$lib/components/pages/Dashboard.svelte';
	import TransactionList from '$lib/components/pages/TransactionList.svelte';
	import Coach from '$lib/components/pages/Coach.svelte';
	import Settings from '$lib/components/pages/Settings.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import DeleteConfirmationModal from '$lib/components/DeleteConfirmationModal.svelte';
	import { fly, fade } from 'svelte/transition';
	import '../app.css';

	let state = $state<Partial<DashboardState>>({
		view: 'dashboard',
		mode: 'dark',
		modal: false,
		deleteConfirmation: false,
		deleteConfirmationId: null,
		deleteConfirmationName: '',
		toast: '',
		initialized: false,
		dbError: ''
	});

	let initError = $state('');

	dashboard.subscribe((s) => {
		state.view = s.view;
		state.mode = s.mode;
		state.modal = s.modal;
		state.deleteConfirmation = s.deleteConfirmation;
		state.deleteConfirmationId = s.deleteConfirmationId;
		state.deleteConfirmationName = s.deleteConfirmationName;
		state.toast = s.toast;
		state.initialized = s.initialized;
		state.dbError = s.dbError;
	});

	// Initialize store once on mount
	onMount(async () => {
		try {
			await dashboard.initialize();
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Unknown error';
			initError = `Failed to load data: ${msg}`;
			console.error('[App] Initialization error:', msg);
		}
	});
</script>

{#if initError}
	<div class="flex min-h-screen items-center justify-center bg-red-950/40 text-center text-white">
		<div>
			<div class="text-2xl font-bold">Error al cargar datos</div>
			<div class="mt-2 text-sm">{initError}</div>
			<button
				onclick={() => location.reload()}
				class="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700"
			>
				Reintentar
			</button>
		</div>
	</div>
{:else if !state.initialized}
	<div class="bg-gradient-radial flex min-h-screen items-center justify-center text-white">
		<div class="text-center">
			<div class="text-xl font-semibold">Cargando...</div>
		</div>
	</div>
{:else}
	<div class="bg-gradient-radial flex min-h-screen text-white" class:light={state.mode === 'light'}>
		<!-- Sidebar -->
		<aside
			class="sticky top-0 hidden h-screen flex-col border-r md:flex"
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
					<div class="font-600 text-xs tracking-wider" style="color: rgba(230,237,243,0.42)">
						ADIÓS A LAS HOJAS DE CÁLCULO
					</div>
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

			<div class="flex flex-1 gap-8 overflow-hidden">
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
						class="hidden flex-col overflow-auto border-l lg:flex"
						style="flex: 1 1 320px; padding: 24px 0 40px; border-color: rgba(255,255,255,0.07); background: linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.014))"
					>
						<div class="space-y-3.5 px-4.5">
							<!-- AI Insights Section -->
							<div
								class="rounded-5 relative overflow-hidden border p-5"
								style="border-color: rgba(90,255,160,0.3); background: linear-gradient(165deg, rgba(90,255,160,0.12), rgba(255,255,255,0.014)); box-shadow: 0 0 44px rgba(90,255,160,0.12)"
							>
								<div
									class="absolute h-52 w-52 rounded-full"
									style="background: radial-gradient(circle, rgba(90,255,160,0.22), transparent 70%); left: -17px; top: -20px; animation: aiPulse 6s ease-in-out infinite"
								></div>
								<div class="relative">
									<div class="mb-4 flex items-center gap-2.5">
										<div
											class="rounded-2.5 flex h-7 w-7 flex-none items-center justify-center"
											style="background: rgba(90,255,160,0.22); border: 1px solid rgba(90,255,160,0.3); box-shadow: 0 0 16px rgba(90,255,160,0.3)"
										>
											<svg
												width="15"
												height="15"
												viewBox="0 0 24 24"
												fill="none"
												stroke="#5affa0"
												stroke-width="1.9"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"></path>
											</svg>
										</div>
										<div>
											<div class="font-600 text-xs">Ideas de IA</div>
											<div class="font-500 text-xs" style="color: #5affa0">Datos actuales</div>
										</div>
									</div>
									<div class="font-500 text-sm leading-6" style="letter-spacing: -0.02em">
										Oportunidad detectada
									</div>
									<div class="leading-1.6 mt-2.75 text-xs" style="color: rgba(230,237,243,0.6)">
										Reduciendo gastos en restaurantes podrías ahorrar $450/mes.
									</div>
									<div class="mt-3.75 flex gap-2">
										<button
											class="rounded-2.75 font-600 flex-1 border-none px-3 py-2.5 text-xs text-white"
											style="background: linear-gradient(160deg, #5affa0, #22a865); box-shadow: 0 0 20px rgba(90,255,160,0.3)"
										>
											Aplicar sugerencia
										</button>
										<button
											class="rounded-2.75 font-500 flex-none border px-3 py-2.5 text-xs"
											style="border-color: rgba(255,255,255,0.07); background: rgba(8,11,15,0.5); color: rgba(230,237,243,0.6)"
										>
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

								<div
									class="font-700 mb-2.25 text-xs tracking-widest"
									style="color: rgba(230,237,243,0.42)"
								>
									MODO DE TEMA
								</div>
								<div class="mb-4 flex gap-2">
									<button
										class="rounded-2.5 font-500 flex-1 border px-2.5 py-1.5 text-xs"
										style="border-color: rgba(90,255,160,0.3); background-color: rgba(90,255,160,0.12); color: #5affa0"
									>
										☀️ Claro
									</button>
									<button
										class="rounded-2.5 font-500 flex-1 border px-2.5 py-1.5 text-xs"
										style="border-color: rgba(255,255,255,0.07); background-color: rgba(255,255,255,0.06); color: rgba(230,237,243,0.6)"
									>
										🌙 Oscuro
									</button>
								</div>

								<div
									class="font-700 mb-2.5 text-xs tracking-widest"
									style="color: rgba(230,237,243,0.42)"
								>
									COLOR DE ACENTO
								</div>
								<div class="flex gap-2">
									<button
										title="Verde"
										style="background: linear-gradient(150deg, #5affa0, #22a865); border: 1px solid #5affa0; box-shadow: 0 0 12px rgba(90,255,160,0.3)"
										class="rounded-2 h-6 w-6 flex-none cursor-pointer"
									></button>
									<button
										title="Azul"
										style="background: linear-gradient(150deg, #6aa8ff, #2563eb); border: 1px solid rgba(255,255,255,0.07)"
										class="rounded-2 h-6 w-6 flex-none cursor-pointer"
									></button>
									<button
										title="Púrpura"
										style="background: linear-gradient(150deg, #b48cff, #7c3aed); border: 1px solid rgba(255,255,255,0.07)"
										class="rounded-2 h-6 w-6 flex-none cursor-pointer"
									></button>
									<button
										title="Naranja"
										style="background: linear-gradient(150deg, #ffab5e, #e07a17); border: 1px solid rgba(255,255,255,0.07)"
										class="rounded-2 h-6 w-6 flex-none cursor-pointer"
									></button>
								</div>
							</div>

							<!-- Where Did The Money Go -->
							<div
								class="rounded-4 border p-4.5"
								style="border-color: rgba(255,255,255,0.07); background: linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.014))"
							>
								<div class="font-600 mb-3.5 text-xs">¿A dónde fue el dinero?</div>
								<div class="flex h-2 gap-0.5 overflow-hidden rounded-full">
									<div style="width: 32%; background: #ff8a8a"></div>
									<div style="width: 28%; background: #5affa0"></div>
									<div style="width: 24%; background: #b48cff"></div>
									<div style="width: 16%; background: #ffab5e"></div>
								</div>
								<div class="mt-3.5 flex flex-col gap-2">
									<div class="flex items-center gap-2.25 text-xs">
										<span class="h-1.75 w-1.75 rounded-full" style="background: #ff8a8a"></span>
										<span style="color: rgba(230,237,243,0.6)">Alimentos</span>
										<span class="ml-auto font-mono text-xs" style="color: rgba(230,237,243,0.42)"
											>32%</span
										>
									</div>
									<div class="flex items-center gap-2.25 text-xs">
										<span class="h-1.75 w-1.75 rounded-full" style="background: #5affa0"></span>
										<span style="color: rgba(230,237,243,0.6)">Transporte</span>
										<span class="ml-auto font-mono text-xs" style="color: rgba(230,237,243,0.42)"
											>28%</span
										>
									</div>
									<div class="flex items-center gap-2.25 text-xs">
										<span class="h-1.75 w-1.75 rounded-full" style="background: #b48cff"></span>
										<span style="color: rgba(230,237,243,0.6)">Ocio</span>
										<span class="ml-auto font-mono text-xs" style="color: rgba(230,237,243,0.42)"
											>24%</span
										>
									</div>
									<div class="flex items-center gap-2.25 text-xs">
										<span class="h-1.75 w-1.75 rounded-full" style="background: #ffab5e"></span>
										<span style="color: rgba(230,237,243,0.6)">Otros</span>
										<span class="ml-auto font-mono text-xs" style="color: rgba(230,237,243,0.42)"
											>16%</span
										>
									</div>
								</div>
							</div>

							<!-- Upcoming Payments -->
							<div
								class="rounded-4 border p-4.5"
								style="border-color: rgba(255,255,255,0.07); background: linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.014))"
							>
								<div class="mb-3 flex items-baseline justify-between gap-2.5">
									<div class="font-600 text-xs">Próximos pagos</div>
									<div class="text-xs" style="color: rgba(230,237,243,0.42)">en 14 días</div>
								</div>
								<div class="flex flex-col gap-2.75">
									<div class="flex items-center gap-2.75">
										<div
											class="flex-none text-center"
											style="width: 34px; padding: 5px 0; border-radius: 9px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.07)"
										>
											<div class="font-600 text-xs">15</div>
											<div
												class="mt-0.5 text-xs tracking-wider"
												style="color: rgba(230,237,243,0.42); letter-spacing: 0.06em"
											>
												SEP
											</div>
										</div>
										<div class="min-w-0 flex-1">
											<div class="font-500 text-xs">Servicios</div>
											<div class="mt-0.5 text-xs" style="color: rgba(230,237,243,0.42)">
												Utilities
											</div>
										</div>
										<div class="font-500 flex-none font-mono text-xs" style="color: #e8636e">
											−$89
										</div>
									</div>
									<div class="flex items-center gap-2.75">
										<div
											class="flex-none text-center"
											style="width: 34px; padding: 5px 0; border-radius: 9px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.07)"
										>
											<div class="font-600 text-xs">20</div>
											<div
												class="mt-0.5 text-xs tracking-wider"
												style="color: rgba(230,237,243,0.42); letter-spacing: 0.06em"
											>
												SEP
											</div>
										</div>
										<div class="min-w-0 flex-1">
											<div class="font-500 text-xs">Suscripciones</div>
											<div class="mt-0.5 text-xs" style="color: rgba(230,237,243,0.42)">
												Streaming
											</div>
										</div>
										<div class="font-500 flex-none font-mono text-xs" style="color: #e8636e">
											−$34
										</div>
									</div>
									<div class="flex items-center gap-2.75">
										<div
											class="flex-none text-center"
											style="width: 34px; padding: 5px 0; border-radius: 9px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.07)"
										>
											<div class="font-600 text-xs">1</div>
											<div
												class="mt-0.5 text-xs tracking-wider"
												style="color: rgba(230,237,243,0.42); letter-spacing: 0.06em"
											>
												OCT
											</div>
										</div>
										<div class="min-w-0 flex-1">
											<div class="font-500 text-xs">Alquiler</div>
											<div class="mt-0.5 text-xs" style="color: rgba(230,237,243,0.42)">Rent</div>
										</div>
										<div class="font-500 flex-none font-mono text-xs" style="color: #e8636e">
											−$900
										</div>
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

		{#if state.deleteConfirmation && state.deleteConfirmationId}
			<DeleteConfirmationModal
				transactionName={state.deleteConfirmationName}
				transactionId={state.deleteConfirmationId}
			/>
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
{/if}

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
		0%,
		100% {
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
