<script setup>
import { configured } from './supabase.js';
</script>

<template>
  <main>
    <p v-if="!configured" class="message">
      Supabase n'est pas configuré : copie <code>site/.env.example</code> en <code>site/.env</code> et remplis-le.
    </p>
    <RouterView v-else />
  </main>
</template>
