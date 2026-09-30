<script setup>
import { ref, computed, watch } from 'vue';
import { supabase, query, savePlayerNow } from '../supabase.js';
import { formatDate, urlToTag } from '../overwatch.js';
import ModeSwitch from '../components/ModeSwitch.vue';
import RankCards from '../components/RankCards.vue';
import StatTiles from '../components/StatTiles.vue';
import HeroTable from '../components/HeroTable.vue';
import SeasonHistory from '../components/SeasonHistory.vue';

const props = defineProps({ tag: { type: String, required: true } });

const mode = ref('competitive');
const player = ref(null);
const snapshots = ref([]); // liste légère (sans le détail des héros) de toutes les sauvegardes du joueur
const selectedId = ref(null);
const snapshot = ref(null);
const error = ref('');
const refreshing = ref(false);
const refreshMessage = ref('');

async function load() {
  const battletag = urlToTag(props.tag);
  const [found] = await query(supabase.from('players').select('*').eq('battletag', battletag));
  if (!found) throw new Error(`${battletag} n'est pas suivi`);
  snapshots.value = await query(
    supabase.from('snapshots').select('id, gamemode, season, saved_at, games_played, ranks, winrate:general->winrate')
      .eq('player_id', found.id).order('saved_at', { ascending: false }),
  );
  player.value = found;
}

watch(() => props.tag, async () => {
  error.value = '';
  player.value = null;
  await load().catch((e) => { error.value = e.message; });
}, { immediate: true });

// Récupère les stats du joueur tout de suite, sans attendre la sauvegarde automatique.
async function refresh() {
  refreshing.value = true;
  refreshMessage.value = '';
  try {
    const result = await savePlayerNow(player.value.battletag);
    refreshMessage.value = result.warning ?? (result.saved.length ? '' : 'Rien de nouveau depuis la dernière sauvegarde.');
    await load();
  } catch (e) {
    refreshMessage.value = e.message;
  } finally {
    refreshing.value = false;
  }
}

// En compétitif, on propose la dernière sauvegarde de chaque saison. En partie rapide, les stats
// sont cumulées depuis toujours, donc seule la dernière sauvegarde compte.
const choices = computed(() => {
  const list = snapshots.value.filter((s) => s.gamemode === mode.value);
  if (mode.value === 'quickplay') return list.slice(0, 1);
  const seen = new Set();
  return list.filter((s) => !seen.has(s.season) && seen.add(s.season));
});
watch(choices, (list) => { selectedId.value = list[0]?.id ?? null; });

watch(selectedId, async (id) => {
  snapshot.value = null;
  if (!id) return;
  try {
    [snapshot.value] = await query(supabase.from('snapshots').select('*').eq('id', id));
  } catch (e) {
    error.value = e.message;
  }
});
</script>

<template>
  <RouterLink to="/" class="back">← Classement</RouterLink>

  <p v-if="error" class="message">{{ error }}</p>
  <p v-else-if="!player" class="message">Chargement…</p>

  <template v-else>
    <header>
      <div class="avatar big">
        <img v-if="player.avatar" :src="player.avatar" alt="">
        <h1>{{ player.battletag.split('#')[0] }} <span>#{{ player.battletag.split('#')[1] }}</span></h1>
      </div>
      <ModeSwitch v-model="mode" />
    </header>

    <div class="info">
      <select v-if="mode === 'competitive' && choices.length > 1" v-model="selectedId">
        <option v-for="c in choices" :key="c.id" :value="c.id">Saison {{ c.season }}</option>
      </select>
      <span v-if="snapshot" class="muted">Sauvegardé le {{ formatDate(snapshot.saved_at) }}</span>
      <span v-if="player.last_error" class="loss">{{ player.last_error }}</span>
      <button :disabled="refreshing" @click="refresh">{{ refreshing ? 'Actualisation…' : 'Actualiser' }}</button>
      <span v-if="refreshMessage" class="muted">{{ refreshMessage }}</span>
    </div>

    <p v-if="!choices.length" class="message">
      Pas encore de stats dans ce mode. Clique sur « Actualiser » pour les récupérer.
    </p>
    <p v-else-if="!snapshot" class="message">Chargement…</p>

    <template v-else>
      <template v-if="mode === 'competitive'">
        <h2>Rangs compétitifs · Saison {{ snapshot.season }}</h2>
        <RankCards :ranks="snapshot.ranks" />

        <h2>Historique des saisons</h2>
        <SeasonHistory :seasons="choices" :selected-id="selectedId" @select="selectedId = $event" />
      </template>

      <h2>Général</h2>
      <StatTiles :general="snapshot.general" />

      <HeroTable :heroes="snapshot.heroes" />
    </template>
  </template>
</template>

<style scoped>
.back { display: inline-block; color: var(--muted); font-size: 14px; margin-bottom: 16px; }
.back:hover { color: var(--text); }
header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
.avatar.big img { width: 56px; height: 56px; border-radius: 10px; }
.info { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; margin-top: 12px; font-size: 14px; }
</style>
