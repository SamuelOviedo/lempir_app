<script lang="ts">
  import { dashboard, CATEGORIES } from '$lib/store';

  let state = $state({
    kind: 'Gasto',
    amount: '',
    name: '',
    formCat: '',
    error: ''
  });

  dashboard.subscribe(s => {
    state.kind = s.kind;
    state.amount = s.amount;
    state.name = s.name;
    state.formCat = s.formCat;
    state.error = s.error;
  });

  const handleSubmit = () => {
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
      type: isInc ? 'income' : 'expense',
      cat: isInc ? null : state.formCat,
      date: '8 sep',
      name: state.name.trim() || (isInc ? 'Ingreso sin título' : 'Gasto sin título')
    };

    dashboard.addTransaction(tx);
    dashboard.showToast((isInc ? 'Ingreso' : 'Gasto') + ' registrado · $' + amt.toLocaleString('es-ES', { minimumFractionDigits: 2 }));
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
    onclick={() => dashboard.closeModal()}
    class="absolute inset-0 bg-black/60 backdrop-blur"
  />

  <!-- Modal -->
  <div class="relative w-full max-w-lg px-5.5 py-5.5 rounded-5.5 border backdrop-blur-4 shadow-lg" style="border-color: rgba(255,255,255,0.07); background: linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.014))">
    <!-- Header -->
    <div class="flex items-center justify-between gap-3 mb-4">
      <div class="text-base font-600 tracking-tight">Registrar movimiento</div>
      <button
        onclick={() => dashboard.closeModal()}
        class="w-7 h-7 flex-none rounded-2.25 border bg-transparent cursor-pointer transition-colors"
        style="border-color: rgba(255,255,255,0.07); color: rgba(230,237,243,0.60)"
        onmouseover="this.style.color = 'rgba(230,237,243,0.90)'"
        onmouseout="this.style.color = 'rgba(230,237,243,0.60)'"
      >
        ✕
      </button>
    </div>

    <!-- Kind Tabs -->
    <div class="mb-4 flex gap-0.5 p-0.75 rounded-3 border" style="background-color: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.07)">
      {#each ['Gasto', 'Ingreso'] as kind}
        <button
          onclick={() => dashboard.setKind(kind)}
          class="flex-1 px-3 py-2.25 rounded-2.5 border-none cursor-pointer text-xs font-600 transition-all"
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
        <label class="text-xs tracking-widest font-700" style="color: rgba(230,237,243,0.42)">MONTO</label>
        <div
          class="flex items-center gap-2.25 px-3.5 py-3 rounded-3.25 border"
          style="background-color: rgba(255,255,255,0.06); border-color: {state.error ? 'rgba(255, 85, 85, 0.55)' : 'rgba(255,255,255,0.07)'}"
        >
          <span class="text-base font-500 font-mono" style="color: rgba(230,237,243,0.42)">$</span>
          <input
            type="text"
            placeholder="0,00"
            inputmode="decimal"
            value={state.amount}
            on:input={handleAmountChange}
            class="flex-1 min-w-0 bg-transparent border-none outline-none text-white text-2xl font-600 font-mono tracking-tight"
          />
        </div>
      </div>

      <!-- Name -->
      <div class="flex flex-col gap-1.75">
        <label class="text-xs tracking-widest font-700" style="color: rgba(230,237,243,0.42)">DESCRIPCIÓN</label>
        <input
          type="text"
          placeholder={state.kind === 'Ingreso' ? 'Anticipo, nómina, proyecto…' : 'Comercio o nombre del recibo'}
          value={state.name}
          on:input={handleNameChange}
          class="px-3.5 py-3 rounded-3.25 border text-white text-xs outline-none"
          style="background-color: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.07)"
        />
      </div>

      <!-- Category (Expense only) -->
      {#if state.kind === 'Gasto'}
        <div class="flex flex-col gap-1.75">
          <label class="text-xs tracking-widest font-700" style="color: rgba(230,237,243,0.42)">CATEGORÍA</label>
          <div class="grid grid-cols-2 gap-2">
            {#each CATEGORIES as cat}
              <button
                onclick={() => dashboard.setFormCat(cat.id)}
                class="px-3 py-2.5 rounded-2.75 cursor-pointer text-xs font-500 text-left border transition-all"
                class:active={state.formCat === cat.id}
                style={state.formCat === cat.id ? '' : 'border-color: rgba(255,255,255,0.07)'}
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
        class="mt-0.5 px-3.25 py-3.25 rounded-3.25 border-none bg-gradient-to-r from-[#5affa0] to-[#22a865] text-[#04140b] text-xs font-600 cursor-pointer shadow-lg shadow-[#5affa0]/30 hover:brightness-110 transition-all"
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
</style>
