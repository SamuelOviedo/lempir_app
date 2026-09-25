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

	let ui = $state<Partial<DashboardState>>({
		view: 'dashboard',
		mode: 'dark',
		accent: 'green',
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
		ui.view = s.view;
		ui.mode = s.mode;
		ui.accent = s.accent;
		ui.modal = s.modal;
		ui.deleteConfirmation = s.deleteConfirmation;
		ui.deleteConfirmationId = s.deleteConfirmationId;
		ui.deleteConfirmationName = s.deleteConfirmationName;
		ui.toast = s.toast;
		ui.initialized = s.initialized;
		ui.dbError = s.dbError;
	});

	// Apply persisted appearance (theme + accent) to <html>; CSS tokens live in app.css
	$effect(() => {
		const root = document.documentElement;
		root.dataset.theme = ui.mode ?? 'dark';
		root.dataset.accent = ui.accent ?? 'green';
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
	<div class="flex min-h-screen items-center justify-center bg-red-950/40 text-center text-(--ink)">
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
{:else if !ui.initialized}
	<div class="bg-gradient-radial flex min-h-screen items-center justify-center text-(--ink)">
		<div class="text-center">
			<div class="text-xl font-semibold">Cargando...</div>
		</div>
	</div>
{:else}
	<div class="bg-gradient-radial flex min-h-screen text-(--ink)">
		<!-- Sidebar -->
		<aside
			class="sticky top-0 hidden h-screen flex-col border-r md:flex"
			style="flex: 0 0 244px; padding: 26px 18px; gap: 28px; border-color: var(--line); background: linear-gradient(180deg, var(--c1), var(--c2))"
		>
			<!-- Logo -->
			<div class="flex items-center gap-2.75 px-2">
				<div
					class="rounded-2.5 font-700 flex h-8 w-8 flex-none items-center justify-center bg-gradient-to-r from-(--acc) to-(--accd) text-xs"
					style="color: var(--accink)"
				>
					$
				</div>
				<div>
					<div class="font-600 text-sm">Ledgerly</div>
					<div class="font-600 text-xs tracking-wider" style="color: var(--ink3)">
						ADIÓS A LAS HOJAS DE CÁLCULO
					</div>
				</div>
			</div>

			<!-- Nav Menu -->
			<nav class="flex-1 space-y-1">
				<button
					onclick={() => dashboard.setView('dashboard')}
					class="rounded-3 font-500 w-full px-4 py-2.5 text-left text-sm transition-all"
					class:active={ui.view === 'dashboard'}
					style={ui.view === 'dashboard'
						? 'background-color: var(--acc12); color: var(--ink); border: 1px solid var(--acc22)'
						: 'color: var(--ink2); border: 1px solid transparent; background: transparent'}
				>
					Tablero
				</button>
				<button
					onclick={() => dashboard.setView('transactions')}
					class="rounded-3 font-500 w-full px-4 py-2.5 text-left text-sm transition-all"
					class:active={ui.view === 'transactions'}
					style={ui.view === 'transactions'
						? 'background-color: var(--acc12); color: var(--ink); border: 1px solid var(--acc22)'
						: 'color: var(--ink2); border: 1px solid transparent; background: transparent'}
				>
					Transacciones
				</button>
				<button
					onclick={() => dashboard.setView('coach')}
					class="rounded-3 font-500 w-full px-4 py-2.5 text-left text-sm transition-all"
					class:active={ui.view === 'coach'}
					style={ui.view === 'coach'
						? 'background-color: var(--acc12); color: var(--ink); border: 1px solid var(--acc22)'
						: 'color: var(--ink2); border: 1px solid transparent; background: transparent'}
				>
					Entrenador
				</button>
				<button
					onclick={() => dashboard.setView('settings')}
					class="rounded-3 font-500 w-full px-4 py-2.5 text-left text-sm transition-all"
					class:active={ui.view === 'settings'}
					style={ui.view === 'settings'
						? 'background-color: var(--acc12); color: var(--ink); border: 1px solid var(--acc22)'
						: 'color: var(--ink2); border: 1px solid transparent; background: transparent'}
				>
					Configuración
				</button>
			</nav>

			<!-- Footer -->
			<div
				class="rounded-3 flex items-center gap-2.5 border px-4 py-3"
				style="border-color: var(--line); background: var(--c1)"
			>
				<div
					class="font-700 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gradient-to-r from-(--acc) to-(--accd) text-xs"
					style="color: var(--accink)"
				>
					M
				</div>
				<div class="min-w-0 flex-1">
					<div class="font-600 truncate text-xs">Maya García</div>
					<div class="text-xs" style="color: var(--ink3); margin-top: 2px">
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
					{#if ui.view === 'dashboard'}
						<DashboardPage />
					{:else if ui.view === 'transactions'}
						<TransactionList />
					{:else if ui.view === 'coach'}
						<Coach />
					{:else if ui.view === 'settings'}
						<Settings />
					{/if}
				</div>

				<!-- Right Sidebar (visible only on dashboard view) -->
				{#if ui.view === 'dashboard'}
					<aside
						class="hidden flex-col overflow-auto border-l lg:flex"
						style="flex: 1 1 320px; padding: 24px 0 40px; border-color: var(--line); background: linear-gradient(to bottom, var(--c1), var(--c2))"
					>
						<div class="space-y-3.5 px-4.5">
							<!-- AI Insights Section -->
							<div
								class="rounded-5 relative overflow-hidden border p-5"
								style="border-color: var(--acc30); background: linear-gradient(165deg, var(--acc12), var(--c2)); box-shadow: 0 0 44px var(--acc12)"
							>
								<div
									class="absolute h-52 w-52 rounded-full"
									style="background: radial-gradient(circle, var(--acc22), transparent 70%); left: -17px; top: -20px; animation: aiPulse 6s ease-in-out infinite"
								></div>
								<div class="relative">
									<div class="mb-4 flex items-center gap-2.5">
										<div
											class="rounded-2.5 flex h-7 w-7 flex-none items-center justify-center"
											style="background: var(--acc22); border: 1px solid var(--acc30); box-shadow: 0 0 16px var(--acc30)"
										>
											<svg
												width="15"
												height="15"
												viewBox="0 0 24 24"
												fill="none"
												stroke="var(--acc)"
												stroke-width="1.9"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"></path>
											</svg>
										</div>
										<div>
											<div class="font-600 text-xs">Ideas de IA</div>
											<div class="font-500 text-xs" style="color: var(--acc)">Datos actuales</div>
										</div>
									</div>
									<div class="font-500 text-sm leading-6" style="letter-spacing: -0.02em">
										Oportunidad detectada
									</div>
									<div class="leading-1.6 mt-2.75 text-xs" style="color: var(--ink2)">
										Reduciendo gastos en restaurantes podrías ahorrar $450/mes.
									</div>
									<div class="mt-3.75 flex gap-2">
										<button
											class="rounded-2.75 font-600 flex-1 border-none px-3 py-2.5 text-xs text-(--ink)"
											style="background: linear-gradient(160deg, var(--acc), var(--accd)); box-shadow: 0 0 20px var(--acc30)"
										>
											Aplicar sugerencia
										</button>
										<button
											class="rounded-2.75 font-500 flex-none border px-3 py-2.5 text-xs"
											style="border-color: var(--line); background: rgba(8,11,15,0.5); color: var(--ink2)"
										>
											Omitir
										</button>
									</div>
								</div>
							</div>

							<!-- Appearance Settings -->
							<div
								class="rounded-4 border p-4.5"
								style="border-color: var(--line); background: linear-gradient(to bottom, var(--c1), var(--c2))"
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
										style="color: var(--ink2)"
									>
										<path d="M12 3a9 9 0 100 18 4.5 4.5 0 000-9 4.5 4.5 0 010-9z" />
									</svg>
									<div class="font-600 text-xs">Configuración de Apariencia</div>
								</div>

								<div
									class="font-700 mb-2.25 text-xs tracking-widest"
									style="color: var(--ink3)"
								>
									MODO DE TEMA
								</div>
								<div class="mb-4 flex gap-2">
									<button
										class="rounded-2.5 font-500 flex-1 border px-2.5 py-1.5 text-xs"
										style="border-color: var(--acc30); background-color: var(--acc12); color: var(--acc)"
									>
										☀️ Claro
									</button>
									<button
										class="rounded-2.5 font-500 flex-1 border px-2.5 py-1.5 text-xs"
										style="border-color: var(--line); background-color: var(--fill); color: var(--ink2)"
									>
										🌙 Oscuro
									</button>
								</div>

								<div
									class="font-700 mb-2.5 text-xs tracking-widest"
									style="color: var(--ink3)"
								>
									COLOR DE ACENTO
								</div>
								<div class="flex gap-2">
									<button
										title="Verde"
										style="background: linear-gradient(150deg, var(--acc), var(--accd)); border: 1px solid var(--acc); box-shadow: 0 0 12px var(--acc30)"
										class="rounded-2 h-6 w-6 flex-none cursor-pointer"
									></button>
									<button
										title="Azul"
										style="background: linear-gradient(150deg, #6aa8ff, #2563eb); border: 1px solid var(--line)"
										class="rounded-2 h-6 w-6 flex-none cursor-pointer"
									></button>
									<button
										title="Púrpura"
										style="background: linear-gradient(150deg, #b48cff, #7c3aed); border: 1px solid var(--line)"
										class="rounded-2 h-6 w-6 flex-none cursor-pointer"
									></button>
									<button
										title="Naranja"
										style="background: linear-gradient(150deg, #ffab5e, #e07a17); border: 1px solid var(--line)"
										class="rounded-2 h-6 w-6 flex-none cursor-pointer"
									></button>
								</div>
							</div>

							<!-- Where Did The Money Go -->
							<div
								class="rounded-4 border p-4.5"
								style="border-color: var(--line); background: linear-gradient(to bottom, var(--c1), var(--c2))"
							>
								<div class="font-600 mb-3.5 text-xs">¿A dónde fue el dinero?</div>
								<div class="flex h-2 gap-0.5 overflow-hidden rounded-full">
									<div style="width: 32%; background: #ff8a8a"></div>
									<div style="width: 28%; background: var(--acc)"></div>
									<div style="width: 24%; background: #b48cff"></div>
									<div style="width: 16%; background: #ffab5e"></div>
								</div>
								<div class="mt-3.5 flex flex-col gap-2">
									<div class="flex items-center gap-2.25 text-xs">
										<span class="h-1.75 w-1.75 rounded-full" style="background: #ff8a8a"></span>
										<span style="color: var(--ink2)">Alimentos</span>
										<span class="ml-auto font-mono text-xs" style="color: var(--ink3)"
											>32%</span
										>
									</div>
									<div class="flex items-center gap-2.25 text-xs">
										<span class="h-1.75 w-1.75 rounded-full" style="background: var(--acc)"></span>
										<span style="color: var(--ink2)">Transporte</span>
										<span class="ml-auto font-mono text-xs" style="color: var(--ink3)"
											>28%</span
										>
									</div>
									<div class="flex items-center gap-2.25 text-xs">
										<span class="h-1.75 w-1.75 rounded-full" style="background: #b48cff"></span>
										<span style="color: var(--ink2)">Ocio</span>
										<span class="ml-auto font-mono text-xs" style="color: var(--ink3)"
											>24%</span
										>
									</div>
									<div class="flex items-center gap-2.25 text-xs">
										<span class="h-1.75 w-1.75 rounded-full" style="background: #ffab5e"></span>
										<span style="color: var(--ink2)">Otros</span>
										<span class="ml-auto font-mono text-xs" style="color: var(--ink3)"
											>16%</span
										>
									</div>
								</div>
							</div>

							<!-- Upcoming Payments -->
							<div
								class="rounded-4 border p-4.5"
								style="border-color: var(--line); background: linear-gradient(to bottom, var(--c1), var(--c2))"
							>
								<div class="mb-3 flex items-baseline justify-between gap-2.5">
									<div class="font-600 text-xs">Próximos pagos</div>
									<div class="text-xs" style="color: var(--ink3)">en 14 días</div>
								</div>
								<div class="flex flex-col gap-2.75">
									<div class="flex items-center gap-2.75">
										<div
											class="flex-none text-center"
											style="width: 34px; padding: 5px 0; border-radius: 9px; background: var(--fill); border: 1px solid var(--line)"
										>
											<div class="font-600 text-xs">15</div>
											<div
												class="mt-0.5 text-xs tracking-wider"
												style="color: var(--ink3); letter-spacing: 0.06em"
											>
												SEP
											</div>
										</div>
										<div class="min-w-0 flex-1">
											<div class="font-500 text-xs">Servicios</div>
											<div class="mt-0.5 text-xs" style="color: var(--ink3)">
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
											style="width: 34px; padding: 5px 0; border-radius: 9px; background: var(--fill); border: 1px solid var(--line)"
										>
											<div class="font-600 text-xs">20</div>
											<div
												class="mt-0.5 text-xs tracking-wider"
												style="color: var(--ink3); letter-spacing: 0.06em"
											>
												SEP
											</div>
										</div>
										<div class="min-w-0 flex-1">
											<div class="font-500 text-xs">Suscripciones</div>
											<div class="mt-0.5 text-xs" style="color: var(--ink3)">
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
											style="width: 34px; padding: 5px 0; border-radius: 9px; background: var(--fill); border: 1px solid var(--line)"
										>
											<div class="font-600 text-xs">1</div>
											<div
												class="mt-0.5 text-xs tracking-wider"
												style="color: var(--ink3); letter-spacing: 0.06em"
											>
												OCT
											</div>
										</div>
										<div class="min-w-0 flex-1">
											<div class="font-500 text-xs">Alquiler</div>
											<div class="mt-0.5 text-xs" style="color: var(--ink3)">Rent</div>
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

		{#if ui.modal}
			<Modal />
		{/if}

		{#if ui.deleteConfirmation && ui.deleteConfirmationId}
			<DeleteConfirmationModal
				transactionName={ui.deleteConfirmationName}
				transactionId={ui.deleteConfirmationId}
			/>
		{/if}

		{#if ui.dbError}
			<div
				role="alert"
				class="rounded-3 fixed top-4 left-1/2 z-60 flex max-w-md -translate-x-1/2 items-start gap-3 border border-red-500/50 bg-(--toast) px-4 py-3 text-xs text-red-400 shadow-lg"
				transition:fly={{ y: -10, duration: 200 }}
			>
				<span class="flex-1">{ui.dbError}</span>
				<button
					type="button"
					onclick={() => dashboard.clearDbError()}
					aria-label="Cerrar aviso de error"
					class="cursor-pointer border-none bg-transparent text-red-400 hover:text-red-300"
				>
					✕
				</button>
			</div>
		{/if}

		{#if ui.toast}
			<div
				class="rounded-3 font-500 fixed bottom-24 left-1/2 max-w-sm -translate-x-1/2 transform border border-(--acc)/30 bg-(--toast) px-4 py-3 text-xs text-(--acct) shadow-lg"
				transition:fly={{ y: 10, duration: 200 }}
			>
				{ui.toast}
			</div>
		{/if}
	</div>
{/if}

<style>
	.bg-gradient-radial {
		background:
			radial-gradient(1200px 600px at 78% -10%, var(--acc12), transparent 60%),
			radial-gradient(900px 500px at 8% 110%, rgba(80, 120, 255, 0.06), transparent 60%), var(--bg);
	}
</style>
