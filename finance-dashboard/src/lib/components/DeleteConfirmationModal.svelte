<script lang="ts">
	import { dashboard } from '$lib/store';
	import { fade, scale } from 'svelte/transition';

	let {
		transactionName = '',
		transactionId = null
	}: { transactionName?: string; transactionId?: number | null } = $props();

	let isDeleting = $state(false);
	let deleteError = $state('');

	const handleConfirmDelete = async () => {
		if (!transactionId) return;

		isDeleting = true;
		deleteError = '';

		try {
			await dashboard.deleteTransaction(transactionId);
			dashboard.showToast('Transacción eliminada');
			dashboard.closeDeleteConfirmation();
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Error desconocido';
			deleteError = `No se pudo eliminar: ${msg}`;
			isDeleting = false;
		}
	};

	const handleCancel = () => {
		dashboard.closeDeleteConfirmation();
	};
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-6">
	<!-- Overlay -->
	<div
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && handleCancel()}
		onclick={handleCancel}
		class="absolute inset-0 bg-black/60 backdrop-blur"
		transition:fade={{ duration: 240 }}
	></div>

	<!-- Modal -->
	<div
		class="rounded-4 backdrop-blur-4 relative mx-4 w-full max-w-sm border px-5 py-5 shadow-lg"
		style="border-color: var(--line); background: linear-gradient(to bottom, var(--c1), var(--c2))"
		transition:scale={{ duration: 240, start: 0.98 }}
	>
		<!-- Header -->
		<div class="mb-4">
			<div class="font-600 text-base tracking-tight">¿Eliminar transacción?</div>
		</div>

		<!-- Content -->
		<div class="mb-4">
			<p class="text-sm" style="color: var(--ink)">
				¿Estás seguro de que deseas eliminar <span class="font-semibold">"{transactionName}"</span>?
			</p>
			<p class="mt-2 text-xs" style="color: var(--ink3)">
				Esta acción no se puede deshacer.
			</p>
		</div>

		<!-- Error -->
		{#if deleteError}
			<div
				class="rounded-2 mb-4 border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-400"
			>
				{deleteError}
			</div>
		{/if}

		<!-- Actions -->
		<div class="flex gap-3">
			<button
				onclick={handleCancel}
				disabled={isDeleting}
				class="rounded-3 font-600 flex-1 border px-3 py-2.5 text-xs transition-all disabled:opacity-50"
				style="border-color: var(--line); color: var(--ink)"
			>
				Cancelar
			</button>
			<button
				onclick={handleConfirmDelete}
				disabled={isDeleting}
				class="rounded-3 font-600 flex-1 border-none px-3 py-2.5 text-xs text-(--ink) transition-all disabled:opacity-50"
				style="background: rgba(255,85,85,0.9)"
			>
				{isDeleting ? 'Eliminando...' : 'Eliminar'}
			</button>
		</div>
	</div>
</div>
