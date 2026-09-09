<script lang="ts">
  import { dashboard, CATEGORIES } from '$lib/store';

  let state: any;
  dashboard.subscribe(s => {
    state = s;
  });

  $: income = state.txs
    .filter((t: any) => t.type === 'income')
    .reduce((a: number, t: any) => a + t.amount, 0);

  $: expense = state.txs
    .filter((t: any) => t.type === 'expense')
    .reduce((a: number, t: any) => a + t.amount, 0);

  $: leftover = income - expense;

  $: totalBudget = Object.values(state.budgets).reduce((a: number, b: number) => a + b, 0);

  const money = (n: number, cents = false) =>
    '$' + n.toLocaleString('es-ES', {
      minimumFractionDigits: cents ? 2 : 0,
      maximumFractionDigits: cents ? 2 : 0
    });

  $: hero = [
    {
      label: 'INGRESOS TOTALES',
      value: money(income),
      delta: '+8,2%',
      note: '2 fuentes · nómina + anticipo',
      pct: 100
    },
    {
      label: 'GASTOS TOTALES',
      value: money(expense),
      delta: '-3,1%',
      note: `${Math.round((expense / income) * 100)}% de los ingresos gastados`,
      pct: Math.min(100, (expense / income) * 100)
    },
    {
      label: 'EFECTIVO LIBRE',
      value: money(leftover),
      delta: leftover > 0 ? `+${Math.round((leftover / income) * 100)}%` : '0%',
      note: leftover >= 0
        ? 'Dinero libre tras todos los compromisos'
        : 'Estás gastando por encima de tus ingresos',
      pct: Math.max(4, Math.min(100, (leftover / income) * 100))
    }
  ];

  $: categories = CATEGORIES.map(c => {
    const items = state.txs.filter((t: any) => t.cat === c.id);
    const spent = items.reduce((a: number, t: any) => a + t.amount, 0);
    const budget = state.budgets[c.id];
    const pct = Math.min(100, (spent / budget) * 100);
    const over = spent > budget;
    const near = !over && pct > 85;
    const remain = budget - spent;

    return {
      ...c,
      items,
      spent,
      budget,
      pct,
      over,
      near,
      remain,
      status: over ? 'Excedido' : near ? 'Ajustado' : 'En control'
    };
  });

  $: trend = [
    { month: 'ABR', v: 640 },
    { month: 'MAY', v: 812 },
    { month: 'JUN', v: 905 },
    { month: 'JUL', v: 1080 },
    { month: 'AGO', v: 1224 },
    { month: 'SEP', v: Math.max(0, leftover) }
  ];

  $: maxT = Math.max(...trend.map(t => t.v), 1);
</script>

<div class="flex flex-col gap-6 px-8 py-6">
  <!-- Hero Cards -->
  <div class="flex flex-wrap gap-3.5">
    {#each hero as card, i}
      <div class="flex-1 flex-basis-52 min-w-0 px-4 py-4 rounded-4 border backdrop-blur-4 relative overflow-hidden" style="border-color: rgba(255,255,255,0.07); background: linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.014))">
        {#if i === 2}
          <div class="absolute w-44 h-44 rounded-full right-full top-1/2 -translate-y-1/2 bg-radial-gradient opacity-25" />
        {/if}

        <div class="relative flex items-center justify-between gap-2 mb-3">
          <div class="text-xs tracking-widest font-700" style="color: rgba(230,237,243,0.42)">{card.label}</div>
          <div class="text-xs font-600 px-1.75 py-1.25 rounded-1.75 {i === 2 ? 'bg-[#5affa0]/12 text-[#5affa0]' : 'bg-red-500/12 text-red-400'}">
            {card.delta}
          </div>
        </div>

        <div class="relative text-2xl font-600 tracking-tight {i === 2 ? 'text-[#5affa0]' : 'text-white'}">
          {card.value}
        </div>

        <div class="relative text-xs mt-2" style="color: rgba(230,237,243,0.42)">{card.note}</div>

        <div class="relative mt-3.5 h-1 rounded-1 overflow-hidden" style="background-color: rgba(255,255,255,0.06)">
          <div
            class="h-full rounded-1 {i === 0 ? 'bg-gradient-to-r from-[#5affa0] to-[#22a865]' : i === 1 ? 'bg-gradient-to-r from-[#ff8a8a] to-[#d64b4b]' : 'bg-gradient-to-r from-[#5affa0] to-[#22a865]'}"
            style="width: {card.pct}%"
          />
        </div>
      </div>
    {/each}
  </div>

  <!-- Budget Categories -->
  <div>
    <div class="flex items-baseline justify-between gap-3 mb-3.25">
      <h2 class="text-base font-600 tracking-tight">Presupuesto por categorías</h2>
      <div class="text-xs font-500 font-mono" style="color: rgba(230,237,243,0.42)">
        {money(totalBudget)} asignado / {money(income)} de ingresos
      </div>
    </div>

    <div class="grid grid-cols-auto-fit gap-3.5">
      {#each categories as cat}
        <div
          class="px-4 py-4 rounded-4 border backdrop-blur-4 cursor-pointer transition-transform hover:translate-y-minus-0.5"
          class:border-red-500/35={cat.over}
          class:border-yellow-500/30={cat.near && !cat.over}
          style={!cat.over && !cat.near ? 'border-color: rgba(255,255,255,0.07)' : ''}
        >
          <div class="flex items-start gap-3">
            <div
              class="w-8 h-8 flex-none rounded-2.5 flex items-center justify-center"
              style="background: {cat.hue}26; border: 1px solid {cat.hue}4d; color: {cat.hue}"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <path d={cat.icon} />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-600 tracking-tight">{cat.name}</div>
              <div class="text-xs mt-0.75" style="color: rgba(230,237,243,0.42)">{cat.sub}</div>
            </div>
            <div
              class="text-xs font-700 px-1.75 py-1.25 rounded-1.75 flex-none"
              class:bg-red-500/16={cat.over}
              class:text-red-400={cat.over}
              class:bg-yellow-500/18={cat.near && !cat.over}
              class:text-yellow-400={cat.near && !cat.over}
              style={!cat.over && !cat.near ? 'background-color: rgba(255,255,255,0.06); color: rgba(230,237,243,0.42)' : ''}
            >
              {cat.status}
            </div>
          </div>

          <div class="mt-4 flex items-baseline justify-between gap-2">
            <div class="text-2xl font-600 tracking-tight">{money(cat.spent)}</div>
            <div class="text-xs font-500 font-mono" style="color: rgba(230,237,243,0.42)">de {money(cat.budget)}</div>
          </div>

          <div class="mt-2.75 h-1.5 rounded-1.5 overflow-hidden" style="background-color: rgba(255,255,255,0.06)">
            <div
              class="h-full rounded-1.5 transition-all duration-500"
              style="width: {cat.pct}%; background: linear-gradient(90deg, {cat.hue}, {cat.hue}99);"
            />
          </div>

          <div class="mt-2.25 flex items-center justify-between gap-2 text-xs">
            <span style="color: rgba(230,237,243,0.42)">{Math.round((cat.spent / cat.budget) * 100)}% usado</span>
            <span style={cat.over ? 'color: #ff5555' : 'color: rgba(230,237,243,0.42)'}>
              {cat.over ? money(-cat.remain) + ' excedido' : money(cat.remain) + ' disponible'}
            </span>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Trend Chart -->
  <div class="px-4 py-4 rounded-4 border backdrop-blur-4" style="border-color: rgba(255,255,255,0.07); background: linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.014))">
    <div class="flex items-baseline justify-between gap-3 mb-3">
      <h2 class="text-base font-600">Efectivo libre, últimos 6 meses</h2>
      <div class="text-xs font-500 font-mono" style="color: #5affa0">
        +{Math.round(((Math.max(0, leftover) - 640) / 640) * 100)}% vs abril
      </div>
    </div>

    <div class="mt-5 flex items-end gap-2.5 h-32">
      {#each trend as m, i}
        <div class="flex-1 min-w-0 flex flex-col justify-end items-center gap-2 h-full">
          <div class="text-xs font-500 font-mono" style="color: rgba(230,237,243,0.42)">{money(m.v)}</div>
          <div
            class="w-full rounded-t-1.75 rounded-b-0.75"
            style="height: {Math.max(6, (m.v / maxT) * 100)}%; background: {i === trend.length - 1 ? `linear-gradient(180deg, #5affa0, rgba(94,255,160,.12)); box-shadow: 0 0 24px rgba(90,255,160,.12)` : 'rgba(255,255,255,.06)'};"
          />
          <div class="text-xs font-600 tracking-widest" style="color: rgba(230,237,243,0.42)">{m.month}</div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .grid-cols-auto-fit {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(248px, 1fr));
  }

  .flex-basis-52 {
    flex-basis: 210px;
  }
</style>
