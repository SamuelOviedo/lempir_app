<script lang="ts">
	import { dashboard, CATEGORIES } from '$lib/store';
	import { fade, scale } from 'svelte/transition';

	let state = $state({
		kind: 'Gasto',
		amount: '',
		name: '',
		formCat: '',
		error: '',
		modalMode: 'create' as 'create' | 'edit',
		editingId: null as number | null
	});

	dashboard.subscribe((s) => {
		state.kind = s.kind;
		state.amount = s.amount;
		state.name = s.name;
		state.formCat = s.formCat;
		state.error = s.error;
		state.modalMode = s.modalMode;
		state.editingId = s.editingId;
	});

	const handleSubmit = async () => {
		const amt = parseFloat(
			String(state.amount)
				.replace(/\./g, '')
				.replace(',', '.')
				.replace(/[^0-9.]/g, '')
		);

		if (!amt || amt <= 0) {
			dashboard.setError('Introduce un monto mayor que cero.');
			return;
		}

		const isInc = state.kind === 'Ingreso';
		const tx = {
			amount: amt,
			type: isInc ? ('income' as const) : ('expense' as const),
			cat: isInc ? null : state.formCat,
			date: '8 sep',
			name: state.name.trim() || (isInc ? 'Ingreso sin título' : 'Gasto sin título')
		};

		try {
			// Create or edit based on modalMode
			if (state.modalMode === 'edit' && state.editingId !== null) {
				await dashboard.updateTransaction(state.editingId, tx);
				dashboard.showToast(
					(isInc ? 'Ingreso' : 'Gasto') +
						' actualizado · $' +
						amt.toLocaleString('es-ES', { minimumFractionDigits: 2 })
				);
				dashboard.clearEditingTransaction();
			} else {
				await dashboard.addTransaction(tx);
				dashboard.showToast(
					(isInc ? 'Ingreso' : 'Gasto') +
						' registrado · $' +
						amt.toLocaleString('es-ES', { minimumFractionDigits: 2 })
				);
			}
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Error desconocido';
			dashboard.setError(
				`No se pudo ${state.modalMode === 'edit' ? 'actualizar' : 'registrar'}: ${msg}`
			);
		}
	};

	const handleAmountChange = (e: Event) => {
		const input = e.currentTarget as HTMLInputElement;
		dashboard.setAmount(input.value);
	};

	const handleNameChange = (e: Event) => {
		const input = e.currentTarget as HTMLInputElement;
		dashboard.setName(input.value);
	};
</script>

<div class="fixed inset-0 z-50 flex items-end justify-center p-6">
	<!-- Overlay -->
	<div
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && dashboard.closeModal()}
		onclick={() => dashboard.closeModal()}
		class="absolute inset-0 bg-black/60 backdrop-blur"
		transition:fade={{ duration: 240 }}
	></div>

	<!-- Modal -->
	<div
		class="rounded-5.5 backdrop-blur-4 relative mx-4 w-full max-w-lg border px-5.5 py-5.5 shadow-lg"
		style="border-color: rgba(255,255,255,0.07); background: linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.014))"
		transition:scale={{ duration: 240, start: 0.98 }}
	>
		<!-- Header -->
		<div class="mb-4 flex items-center justify-between gap-3">
			<div class="font-600 text-base tracking-tight">
				{state.modalMode === 'edit' ? 'Editar movimiento' : 'Registrar movimiento'}
			</div>
			<button
				onclick={() => dashboard.closeModal()}
				class="close-btn rounded-2.25 h-7 w-7 flex-none cursor-pointer border bg-transparent transition-colors"
				style="border-color: rgba(255,255,255,0.07); color: rgba(230,237,243,0.60)"
			>
				✕
			</button>
		</div>

		<!-- Kind Tabs -->
		<div
			class="rounded-3 mb-4 flex gap-0.5 border p-0.75"
			style="background-color: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.07)"
		>
			{#each ['Gasto', 'Ingreso'] as kind}
				<button
					onclick={() => dashboard.setKind(kind as 'Gasto' | 'Ingreso')}
					class="rounded-2.5 font-600 flex-1 cursor-pointer border-none px-3 py-2.25 text-xs transition-all"
					class:active={state.kind === kind}
				>
					{kind}
				</button>
			{/each}
		</div>

		<!-- Form -->
		<div class="flex flex-col gap-3">
			<!-- Amount -->
			<div class="flex flex-col gap-1.75">
				<label
					for="amount-input"
					class="font-700 text-xs tracking-widest"
					style="color: rgba(230,237,243,0.42)">MONTO</label
				>
				<div
					class="rounded-3.25 flex items-center gap-2.25 border px-3.5 py-3"
					style="background-color: rgba(255,255,255,0.06); border-color: {state.error
						? 'rgba(255, 85, 85, 0.55)'
						: 'rgba(255,255,255,0.07)'}"
				>
					<span class="font-500 font-mono text-base" style="color: rgba(230,237,243,0.42)">$</span>
					<input
						id="amount-input"
						type="text"
						placeholder="0,00"
						inputmode="decimal"
						value={state.amount}
						oninput={handleAmountChange}
						class="font-600 min-w-0 flex-1 border-none bg-transparent font-mono text-2xl tracking-tight text-white"
					/>
				</div>
			</div>

			<!-- Name -->
			<div class="flex flex-col gap-1.75">
				<label
					for="name-input"
					class="font-700 text-xs tracking-widest"
					style="color: rgba(230,237,243,0.42)">DESCRIPCIÓN</label
				>
				<input
					id="name-input"
					type="text"
					placeholder={state.kind === 'Ingreso'
						? 'Anticipo, nómina, proyecto…'
						: 'Comercio o nombre del recibo'}
					value={state.name}
					oninput={handleNameChange}
					class="rounded-3.25 border px-3.5 py-3 text-xs text-white"
					style="background-color: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.07)"
				/>
			</div>

			<!-- Category (Expense only) -->
			{#if state.kind === 'Gasto'}
				<div class="flex flex-col gap-1.75">
					<div
						id="category-group"
						class="font-700 text-xs tracking-widest"
						style="color: rgba(230,237,243,0.42)"
					>
						CATEGORÍA
					</div>
					<div class="grid grid-cols-2 gap-2" role="group" aria-labelledby="category-group">
						{#each CATEGORIES as cat}
							<button
								onclick={() => dashboard.setFormCat(cat.id)}
								class="rounded-2.75 font-500 cursor-pointer border px-3 py-2.5 text-left text-xs transition-all"
								class:active={state.formCat === cat.id}
								style={state.formCat === cat.id ? '' : 'border-color: rgba(255,255,255,0.07)'}
								aria-pressed={state.formCat === cat.id}
							>
								{cat.name}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Error -->
			{#if state.error}
				<div class="text-xs text-red-400">{state.error}</div>
			{/if}

			<!-- Submit -->
			<button
				onclick={handleSubmit}
				class="rounded-3.25 font-600 mt-0.5 cursor-pointer border-none bg-gradient-to-r from-[#5affa0] to-[#22a865] px-3.25 py-3.25 text-xs text-[#04140b] shadow-lg shadow-[#5affa0]/30 transition-all hover:brightness-110"
			>
				{state.kind === 'Ingreso' ? 'Registrar ingreso' : 'Registrar gasto'}
			</button>
		</div>
	</div>
</div>

<style>
	.active {
		background-color: rgba(90, 255, 160, 0.12);
		color: white;
		border-color: rgba(90, 255, 160, 0.22);
	}

	.active.active {
		background: linear-gradient(160deg, rgba(90, 255, 160, 0.12), rgba(255, 255, 255, 0.014));
	}

	.close-btn:hover {
		color: rgba(230, 237, 243, 0.9);
	}

	:global(input):focus-visible {
		outline: 2px solid var(--acc, #5affa0);
		outline-offset: 2px;
	}
</style>
