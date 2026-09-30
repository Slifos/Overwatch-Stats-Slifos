<script setup>
import { ref, computed } from 'vue';
import { heroInfo, hours, number, useSort } from '../overwatch.js';

const props = defineProps({ heroes: { type: Object, required: true } });

const showAll = ref(false);
const heroName = (key) => heroInfo.value[key]?.name ?? key;

const columns = [
  { key: 'hero', label: 'Héros', value: (h) => heroName(h.key), asc: true },
  { key: 'time', label: 'Temps', value: (h) => h.time_played },
  { key: 'games', label: 'Parties', value: (h) => h.games_played },
  { key: 'winrate', label: 'Victoires', value: (h) => h.winrate },
  { key: 'kda', label: 'KDA', value: (h) => h.kda },
  { key: 'elims', label: 'Élim./p', value: (h) => h.average.eliminations },
  { key: 'damage', label: 'Dégâts/p', value: (h) => h.average.damage },
  { key: 'healing', label: 'Soins/p', value: (h) => h.average.healing },
];

// Beaucoup de héros n'ont que quelques secondes de jeu : on les cache par défaut.
const rows = computed(() =>
  Object.entries(props.heroes)
    .map(([key, h]) => ({ key, ...h }))
    .filter((h) => showAll.value || h.games_played > 0),
);
const { sortKey, sorted, sortBy, arrow } = useSort(rows, columns, 'time');
</script>

<template>
  <div class="head">
    <h2>Héros</h2>
    <label><input v-model="showAll" type="checkbox"> Afficher les héros sans partie</label>
  </div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key" :class="{ active: sortKey === col.key }" @click="sortBy(col.key)">
            {{ col.label }}{{ arrow(col.key) }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="h in sorted" :key="h.key">
          <td>
            <div class="avatar">
              <img v-if="heroInfo[h.key]" :src="heroInfo[h.key].portrait" alt="">
              {{ heroName(h.key) }}
            </div>
          </td>
          <td>{{ hours(h.time_played) }}</td>
          <td>{{ h.games_played }}</td>
          <td>{{ h.winrate }} %<span class="bar"><i :style="{ width: h.winrate + '%' }" /></span></td>
          <td>{{ h.kda }}</td>
          <td>{{ h.average.eliminations }}</td>
          <td>{{ number(h.average.damage) }}</td>
          <td>{{ number(h.average.healing) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.head label { font-size: 13px; color: var(--muted); cursor: pointer; }
.head input { padding: 0; }
</style>
