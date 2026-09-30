<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { savePlayerNow } from '../supabase.js';
import { BATTLETAG_RE, tagToUrl } from '../overwatch.js';

const router = useRouter();

const battletag = ref('');
const busy = ref(false);
const message = ref('');

async function add() {
  const tag = battletag.value.trim();
  message.value = '';

  if (!BATTLETAG_RE.test(tag)) {
    message.value = 'Format attendu : Pseudo#1234';
    return;
  }

  busy.value = true;
  try {
    await savePlayerNow(tag);
    router.push(`/joueur/${tagToUrl(tag)}`);
  } catch (e) {
    message.value = e.message;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <form class="add" @submit.prevent="add">
    <input v-model="battletag" placeholder="Pseudo#1234" aria-label="BattleTag du joueur à ajouter">
    <button class="primary" :disabled="busy">{{ busy ? 'Récupération des stats…' : 'Ajouter un joueur' }}</button>
    <p v-if="message" class="loss">{{ message }}</p>
  </form>
</template>

<style scoped>
.add { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.add input { flex: 1; min-width: 160px; max-width: 260px; }
.add p { flex-basis: 100%; margin: 0; font-size: 13px; }
</style>
