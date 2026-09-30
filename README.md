# Overwatch Stats

Suit les stats Overwatch (compétitif et partie rapide) d'une liste de joueurs.

- `sauvegarde.js` : toutes les 6 h (GitHub Actions), récupère les stats de chaque joueur actif sur
  [OverFast API](https://overfast-api.tekrop.fr) et les enregistre dans Supabase.
- `site/` : site Vue (classement + fiche joueur) déployé sur GitHub Pages. On peut y ajouter un joueur.
- `supabase/schema.sql` : tables, vue et droits de la base.

## Installation

1. **Supabase** : crée un projet sur [supabase.com](https://supabase.com), puis colle
   `supabase/schema.sql` dans le SQL Editor et lance-le.
2. **Secrets GitHub** (Settings → Secrets and variables → Actions → *Secrets*) :
   - `SUPABASE_URL` : l'URL du projet (Project Settings → API)
   - `SUPABASE_SERVICE_KEY` : la clé `service_role` (à ne jamais mettre dans le site)
3. **Variables GitHub** (même page, onglet *Variables*), pour le site :
   - `SUPABASE_URL` : la même URL
   - `SUPABASE_ANON_KEY` : la clé `anon` (publique)
4. **GitHub Pages** : Settings → Pages → Source : *GitHub Actions*.
5. **Edge Function** (sauvegarde immédiate quand on ajoute ou actualise un joueur depuis le site) :
   Supabase → Edge Functions → *Deploy a new function* → *Via Editor*, nomme-la `ajoute-joueur`,
   colle `supabase/functions/ajoute-joueur/index.ts` → *Deploy*. Puis, dans ses réglages,
   désactive *Verify JWT* (le site utilise une clé publishable, qui n'est pas un JWT).
6. Lance les workflows *Sauvegarde des stats Overwatch* et *Déploiement du site* depuis l'onglet Actions.

## Ajouter un joueur

Depuis le site (champ « Ajouter un joueur ») : ses stats sont récupérées tout de suite. Le bouton
« Actualiser » de la fiche joueur fait de même pour un joueur déjà suivi.

Ou dans Supabase : Table Editor → `players` → Insert, en remplissant seulement `battletag`
(ex. `Slifos#2280`). Les stats apparaissent à la sauvegarde suivante, ou dès qu'on clique « Actualiser ».

Un joueur introuvable est désactivé automatiquement (`active = false`). Pour arrêter de suivre
un joueur, passe `active` à `false` ou supprime sa ligne (ses sauvegardes sont supprimées avec).

## En local

```sh
# Site
cd site
cp .env.example .env   # puis remplis-le
npm install
npm run dev

# Sauvegarde (depuis la racine)
SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node sauvegarde.js

# Import des anciennes sauvegardes saisons/*.json (une seule fois)
SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node importe-saisons.js
```
