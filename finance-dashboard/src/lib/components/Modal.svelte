<script lang="ts">
	import { dashboard, CATEGORIES, formatTxDate } from '$lib/store';
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
			// Keep the original date when editing; new movements are dated today
			date:
				state.modalMode === 'edit' && state.editingId !== null
					? ($dashboard.txs.find((t) => t.id === state.editingId)?.date ?? formatTxDate())
					: formatTxDate(),
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
		style="border-color: var(--line); background: var(--sheet); color: var(--ink)"
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
				style="border-color: var(--line); color: var(--ink2)"
			>
				✕
			</button>
		</div>

		<!-- Kind Tabs -->
		<div
			class="rounded-3 mb-4 flex gap-0.5 border p-0.75"
			style="background-color: var(--fill); border-color: var(--line)"
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
					style="color: var(--ink3)">MONTO</label
				>
				<div
					class="rounded-3.25 flex items-center gap-2.25 border px-3.5 py-3"
					style="background-color: var(--fill); border-color: {state.error
						? 'rgba(255, 85, 85, 0.55)'
						: 'var(--line)'}"
				>
					<span class="font-500 font-mono text-base" style="color: var(--ink3)">$</span>
					<input
						id="amount-input"
						type="text"
						placeholder="0,00"
						inputmode="decimal"
						value={state.amount}
						oninput={handleAmountChange}
						class="font-600 min-w-0 flex-1 border-none bg-transparent font-mono text-2xl tracking-tight text-(--ink)"
					/>
				</div>
			</div>

			<!-- Name -->
			<div class="flex flex-col gap-1.75">
				<label
					for="name-input"
					class="font-700 text-xs tracking-widest"
					style="color: var(--ink3)">DESCRIPCIÓN</label
				>
				<input
					id="name-input"
					type="text"
					placeholder={state.kind === 'Ingreso'
						? 'Anticipo, nómina, proyecto…'
						: 'Comercio o nombre del recibo'}
					value={state.name}
					oninput={handleNameChange}
					class="rounded-3.25 border px-3.5 py-3 text-xs text-(--ink)"
					style="background-color: var(--fill); border-color: var(--line)"
				/>
			</div>

			<!-- Category (Expense only) -->
			{#if state.kind === 'Gasto'}
				<div class="flex flex-col gap-1.75">
					<div
						id="category-group"
						class="font-700 text-xs tracking-widest"
						style="color: var(--ink3)"
					>
						CATEGORÍA
					</div>
					<div class="grid grid-cols-2 gap-2" role="group" aria-labelledby="category-group">
						{#each CATEGORIES as cat}
							<button
								onclick={() => dashboard.setFormCat(cat.id)}
								class="rounded-2.75 font-500 cursor-pointer border px-3 py-2.5 text-left text-xs transition-all"
								class:active={state.formCat === cat.id}
								style={state.formCat === cat.id ? '' : 'border-color: var(--line)'}
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
				class="rounded-3.25 font-600 mt-0.5 cursor-pointer border-none bg-gradient-to-r from-(--acc) to-(--accd) px-3.25 py-3.25 text-xs text-(--accink) shadow-lg shadow-(color:--acc)/30 transition-all hover:brightness-110"
			>
				{state.kind === 'Ingreso' ? 'Registrar ingreso' : 'Registrar gasto'}
			</button>
		</div>
	</div>
</div>

<style>
	.active {
		background-color: var(--acc12);
		color: var(--ink);
		border-color: var(--acc22);
	}

	.active.active {
		background: linear-gradient(160deg, var(--acc12), var(--c2));
	}

	.close-btn:hover {
		color: var(--ink);
	}

	:global(input):focus-visible {
		outline: 2px solid var(--acc);
		outline-offset: 2px;
	}
</style>
