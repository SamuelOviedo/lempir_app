<script lang="ts">
  import { dashboard, CATEGORIES } from '$lib/store';

  let state: any;
  let filteredTxs: any[] = [];

  dashboard.subscribe(s => {
    state = s;
    const q = s.query.trim().toLowerCase();
    const catName = (id: string) => CATEGORIES.find(c => c.id === id)?.name || 'Ingreso';

    filteredTxs = s.txs
      .filter((t: any) => !q || t.name.toLowerCase().includes(q) || catName(t.cat).toLowerCase().includes(q))
      .map((t: any) => {
        const c = CATEGORIES.find(x => x.id === t.cat);
        const hue = t.type === 'income' ? '#5affa0' : c?.hue || '#8b98a5';

        return {
          ...t,
          category: catName(t.cat),
          initials: t.name
            .split(' ')
            .filter((w: string) => /[a-záéíóúñ]/i.test(w[0] || ''))
            .slice(0, 2)
            .map((w: string) => w[0].toUpperCase())
            .join(''),
          avatar: `background: ${hue}26; border: 1px solid ${hue}4d; color: ${hue}`,
          amount: (t.type === 'income' ? '+' : '−') + '$' + t.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 }),
          amountColor: t.type === 'income' ? 'color: #5affa0' : 'color: var(--ink)'
        };
      });
  });

  const money = (n: number) => '$' + n.toLocaleString('es-ES');
</script>

<div class="px-8 py-6">
  <div class="rounded-4 border backdrop-blur-4 overflow-hidden" style="border-color: rgba(255,255,255,0.07); background: linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.014))">
    <!-- Search Header -->
    <div class="flex items-center gap-2.5 px-4 py-3.75 border-b" style="border-color: rgba(255,255,255,0.07)">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" class="flex-none" style="color: rgba(230,237,243,0.42)">
        <path d="M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4" />
      </svg>
      <input
        type="text"
        placeholder="Buscar transacciones, comercios, categorías…"
        value={state.query}
        on:input={e => dashboard.setQuery(e.currentTarget.value)}
        class="flex-1 min-w-0 bg-transparent border-none outline-none text-white text-xs"
      />
      <span class="text-xs font-500 font-mono flex-none" style="color: rgba(230,237,243,0.42)">
        {filteredTxs.length} de {state.txs.length}
      </span>
    </div>

    <!-- Transaction List -->
    {#each filteredTxs as tx}
      <div class="flex items-center gap-3.25 px-4 py-3.25 border-b transition-colors" style="border-color: rgba(255,255,255,0.07)" onmouseover="this.style.backgroundColor = 'rgba(255,255,255,0.06)'" onmouseout="this.style.backgroundColor = 'transparent'">
        <div
          class="w-7 h-7 flex-none rounded-2.5 flex items-center justify-center text-xs font-600"
          style={tx.avatar}
        >
          {tx.initials}
        </div>

        <div class="flex-1 flex-basis-37 min-w-0">
          <div class="text-sm font-500 overflow-hidden text-ellipsis whitespace-nowrap">{tx.name}</div>
          <div class="text-xs mt-0.5" style="color: rgba(230,237,243,0.42)">{tx.date} · {tx.category}</div>
        </div>

        <div class="text-sm font-600 font-mono tracking-tighter min-w-23 text-right" style={tx.amountColor}>
          {tx.amount}
        </div>
      </div>
    {/each}

    {#if filteredTxs.length === 0}
      <div class="py-8 text-center text-sm" style="color: rgba(230,237,243,0.42)">No transactions found</div>
    {/if}
  </div>
</div>

<style>
  .flex-basis-37 {
    flex-basis: 150px;
  }

  .min-w-23 {
    min-width: 92px;
  }
</style>
