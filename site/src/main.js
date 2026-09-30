import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue';
import Classement from './views/Classement.vue';
import Joueur from './views/Joueur.vue';
import './style.css';

// Historique en hash (#/joueur/...) : pas besoin de configurer le serveur sur GitHub Pages.
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: Classement },
    { path: '/joueur/:tag', component: Joueur, props: true },
  ],
});

createApp(App).use(router).mount('#app');
