import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  base: './', // chemins relatifs : fonctionne sur GitHub Pages quel que soit le nom du dépôt
});
