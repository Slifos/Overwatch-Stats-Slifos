<script setup>
import { ref, computed } from 'vue';
import { supabase, query } from '../supabase.js';
import { ROLES, bestRankScore, hours, rankLabel, tagToUrl, useSort } from '../overwatch.js';
import AddPlayer from '../components/AddPlayer.vue';
import ModeSwitch from '../components/ModeSwitch.vue';

const mode = ref('competitive');
const players = ref([]);
const latest = ref([]);
const loading = ref(true);
const error = ref('');

async function load() {
  try {
    [players.value, latest.value] = await Promise.all([
      query(supabase.from('players').select('id, battletag, username, avatar, active, last_error')),
      query(supabase.from('latest_snapshots').select('player_id, gamemode, games_played, ranks, general')),
    ]);
  } catch (e) {
    error.value = `Impossible de charger les joueurs (${e.message}).`;
  } finally {
    loading.value = false;
  }
}
load();

// Joueurs avec des stats dans le mode choisi, et joueurs encore sans stats à part.
const rows = computed(() =>
  players.value
    .map((p) => ({ ...p, snap: latest.value.find((s) => s.player_id === p.id && s.gamemode === mode.value) }))
    .filter((p) => p.snap),
);
const pending = computed(() =>
  players.value.filter((p) => !latest.value.some((s) => s.player_id === p.id && s.gamemode === mode.value)),
);

const allColumns = [
  { key: 'player', label: 'Joueur', value: (p) => p.battletag.toLowerCase(), asc: true },
  { key: 'rank', label: 'Rangs', value: (p) => bestRankScore(p.snap.ranks), competitive: true },
  { key: 'games', label: 'Parties', value: (p) => p.snap.general.games_played },
  { key: 'winrate', label: 'Victoires', value: (p) => p.snap.general.winrate },
  { key: 'kda', label: 'KDA', value: (p) => p.snap.general.kda },
  { key: 'time', label: 'Temps', value: (p) => p.snap.general.time_played },
];
const columns = computed(() => allColumns.filter((c) => !c.competitive || mode.value === 'competitive'));
const { sortKey, sorted, sortBy, arrow } = useSort(rows, allColumns, 'winrate');
</script>

<template>
  <header>
    <h1>Stats <span>Overwatch</span></h1>
    <ModeSwitch v-model="mode" />
  </header>

  <AddPlayer @added="load" />

  <p v-if="error" class="message">{{ error }}</p>
  <p v-else-if="loading" class="message">Chargement…</p>

  <template v-else>
    <h2>Classement</h2>
    <p v-if="!rows.length" class="message">Aucun joueur n'a encore de stats dans ce mode.</p>
    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key" :class="{ active: sortKey === col.key }" @click="sortBy(col.key)">
              {{ col.label }}{{ arrow(col.key) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in sorted" :key="p.id">
            <td>
              <RouterLink :to="`/joueur/${tagToUrl(p.battletag)}`" class="avatar">
                <img :src="p.avatar" alt="">
                {{ p.battletag }}
              </RouterLink>
            </td>
            <td v-if="mode === 'competitive'">
              <span class="ranks">
                <template v-for="role in ROLES" :key="role.key">
                  <img
                    v-if="p.snap.ranks?.[role.key]"
                    :src="p.snap.ranks[role.key].rank_icon"
                    :title="`${role.label} : ${rankLabel(p.snap.ranks[role.key])}`"
                    :alt="`${role.label} ${rankLabel(p.snap.ranks[role.key])}`"
                  >
                  <span v-else class="none" :title="`${role.label} : non classé`">–</span>
                </template>
              </span>
            </td>
            <td>{{ p.snap.general.games_played }}</td>
            <td>{{ p.snap.general.winrate }} %<span class="bar"><i :style="{ width: p.snap.general.winrate + '%' }" /></span></td>
            <td>{{ p.snap.general.kda }}</td>
            <td>{{ hours(p.snap.general.time_played) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <template v-if="pending.length">
      <h2>Sans stats dans ce mode</h2>
      <ul class="pending">
        <li v-for="p in pending" :key="p.id">
          {{ p.battletag }}
          <span class="muted">— {{ p.last_error ?? (p.active ? 'en attente de la prochaine sauvegarde' : 'désactivé') }}</span>
        </li>
      </ul>
    </template>
  </template>
</template>

<style scoped>
header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
.ranks { display: inline-flex; gap: 4px; align-items: center; }
.ranks img { width: 28px; height: 28px; }
.ranks .none { width: 28px; text-align: center; color: var(--muted); }
.pending { margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; }
</style>
