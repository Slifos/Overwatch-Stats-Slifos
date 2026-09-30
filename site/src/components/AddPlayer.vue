<script setup>
import { ref } from 'vue';
import { supabase } from '../supabase.js';
import { API, BATTLETAG_RE, tagToUrl } from '../overwatch.js';

const emit = defineEmits(['added']);

const battletag = ref('');
const busy = ref(false);
const message = ref('');
const failed = ref(false);

async function add() {
  const tag = battletag.value.trim();
  message.value = '';
  failed.value = true;

  if (!BATTLETAG_RE.test(tag)) {
    message.value = 'Format attendu : Pseudo#1234';
    return;
  }

  busy.value = true;
  try {
    // Vérifie que le joueur existe avant de l'ajouter. Si l'API ne répond pas, on l'ajoute quand même :
    // la sauvegarde le désactivera s'il est introuvable.
    const res = await fetch(`${API}/players/${encodeURIComponent(tagToUrl(tag))}/summary`).catch(() => null);
    if (res?.status === 404) {
      message.value = `${tag} est introuvable (attention aux majuscules).`;
      return;
    }

    const { error } = await supabase.from('players').insert({ battletag: tag });
    if (error?.code === '23505') {
      message.value = `${tag} est déjà suivi.`;
      return;
    }
    if (error) throw new Error(error.message);

    failed.value = false;
    message.value = `${tag} ajouté ! Ses stats apparaîtront à la prochaine sauvegarde (toutes les 6 h).`;
    battletag.value = '';
    emit('added');
  } catch (e) {
    message.value = `Erreur : ${e.message}`;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <form class="add" @submit.prevent="add">
    <input v-model="battletag" placeholder="Pseudo#1234" aria-label="BattleTag du joueur à ajouter">
    <button class="primary" :disabled="busy">{{ busy ? 'Vérification…' : 'Ajouter un joueur' }}</button>
    <p v-if="message" :class="failed ? 'loss' : 'win'">{{ message }}</p>
  </form>
</template>

<style scoped>
.add { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.add input { flex: 1; min-width: 160px; max-width: 260px; }
.add p { flex-basis: 100%; margin: 0; font-size: 13px; }
</style>
