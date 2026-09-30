<script setup>
import { ROLES, rankLabel, rankScore } from '../overwatch.js';

// seasons : dernière sauvegarde compétitive de chaque saison, de la plus récente à la plus ancienne,
// avec { id, season, games_played, winrate, ranks }.
const props = defineProps({
  seasons: { type: Array, required: true },
  selectedId: { type: Number, default: null },
});
const emit = defineEmits(['select']);

// Évolution d'un rôle par rapport à la saison précédente (la ligne suivante).
function trend(index, role) {
  const now = rankScore(props.seasons[index].ranks?.[role]);
  const before = rankScore(props.seasons[index + 1]?.ranks?.[role]);
  if (!now || !before || now === before) return null;
  return now > before ? 'up' : 'down';
}
</script>

<template>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Saison</th>
          <th v-for="role in ROLES" :key="role.key">{{ role.label }}</th>
          <th>Parties</th>
          <th>Victoires</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(s, i) in seasons"
          :key="s.id"
          :class="{ selected: s.id === selectedId }"
          title="Voir le détail de cette saison"
          @click="emit('select', s.id)"
        >
          <td>Saison {{ s.season }}</td>
          <td v-for="role in ROLES" :key="role.key">
            <span v-if="s.ranks?.[role.key]" class="rank">
              <span v-if="trend(i, role.key)" :class="trend(i, role.key) === 'up' ? 'win' : 'loss'">
                {{ trend(i, role.key) === 'up' ? '▲' : '▼' }}
              </span>
              {{ rankLabel(s.ranks[role.key]) }}
              <img :src="s.ranks[role.key].rank_icon" alt="">
            </span>
            <span v-else class="muted">–</span>
          </td>
          <td>{{ s.games_played }}</td>
          <td>{{ s.winrate }} %</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
th { cursor: default; }
tbody tr { cursor: pointer; }
tbody tr:hover td { background: var(--panel-2); }
tr.selected td:first-child { box-shadow: inset 3px 0 var(--accent); color: var(--accent); }
.rank { display: inline-flex; align-items: center; gap: 6px; }
.rank img { width: 24px; height: 24px; }
.win, .loss { font-size: 11px; }
</style>
