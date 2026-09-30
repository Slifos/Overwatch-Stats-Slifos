<script setup>
import { hours, number } from '../overwatch.js';

defineProps({ general: { type: Object, required: true } });
</script>

<template>
  <div class="grid tiles">
    <div class="card">
      <div class="label">Parties</div>
      <div class="value">{{ general.games_played }}</div>
      <div class="sub"><span class="win">{{ general.games_won }} V</span> · <span class="loss">{{ general.games_lost }} D</span></div>
    </div>
    <div class="card">
      <div class="label">Victoires</div>
      <div class="value">{{ general.winrate }} %</div>
    </div>
    <div class="card">
      <div class="label">KDA</div>
      <div class="value">{{ general.kda }}</div>
    </div>
    <div class="card">
      <div class="label">Temps de jeu</div>
      <div class="value">{{ hours(general.time_played) }}</div>
    </div>
    <div class="card">
      <div class="label">Éliminations / partie</div>
      <div class="value">{{ general.average.eliminations }}</div>
      <div class="sub">{{ number(general.total.eliminations) }} au total</div>
    </div>
    <div class="card">
      <div class="label">Morts / partie</div>
      <div class="value">{{ general.average.deaths }}</div>
      <div class="sub">{{ number(general.total.deaths) }} au total</div>
    </div>
    <div class="card">
      <div class="label">Dégâts / partie</div>
      <div class="value">{{ number(general.average.damage) }}</div>
      <div class="sub">{{ number(general.total.damage) }} au total</div>
    </div>
    <div class="card">
      <div class="label">Soins / partie</div>
      <div class="value">{{ number(general.average.healing) }}</div>
      <div class="sub">{{ number(general.total.healing) }} au total</div>
    </div>
  </div>
</template>

<style scoped>
.tiles { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
.label { font-size: 13px; color: var(--muted); }
.value { font-size: 24px; font-weight: 700; margin-top: 4px; }
.sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
</style>
