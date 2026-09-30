<script setup>
import { ROLES, rankLabel } from '../overwatch.js';

defineProps({ ranks: { type: Object, default: null } });
</script>

<template>
  <div class="grid ranks">
    <div v-for="role in ROLES" :key="role.key" class="card rank">
      <img v-if="ranks?.[role.key]" :src="ranks[role.key].rank_icon" alt="">
      <div>
        <div class="role">{{ role.label }}</div>
        <div class="name" :class="{ muted: !ranks?.[role.key] }">{{ rankLabel(ranks?.[role.key]) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ranks { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
.rank { display: flex; align-items: center; gap: 12px; }
.rank img { width: 56px; height: 56px; }
.role { font-size: 13px; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
.name { font-size: 18px; font-weight: 600; }
</style>
