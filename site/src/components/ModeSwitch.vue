<script setup>
import { GAMEMODES } from '../overwatch.js';

const mode = defineModel({ type: String, required: true });
</script>

<template>
  <div class="switch">
    <button v-for="m in GAMEMODES" :key="m.key" :class="{ on: mode === m.key }" @click="mode = m.key">
      {{ m.label }}
    </button>
  </div>
</template>

<style scoped>
.switch { display: inline-flex; background: var(--panel); border-radius: 8px; padding: 3px; }
.switch button { border: none; background: none; color: var(--muted); border-radius: 6px; }
.switch button.on { background: var(--panel-2); color: var(--text); }
</style>
