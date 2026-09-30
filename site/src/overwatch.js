import { ref, computed } from 'vue';

export const API = 'https://overfast-api.tekrop.fr';

export const GAMEMODES = [
  { key: 'competitive', label: 'Compétitif' },
  { key: 'quickplay', label: 'Partie rapide' },
];

export const ROLES = [
  { key: 'tank', label: 'Tank' },
  { key: 'damage', label: 'Dégâts' },
  { key: 'support', label: 'Soutien' },
];

// 'Slifos#2280' <-> 'Slifos-2280' (format des URL et de l'API)
export const tagToUrl = (battletag) => battletag.replace('#', '-');
export const urlToTag = (tag) => {
  const i = tag.lastIndexOf('-');
  return `${tag.slice(0, i)}#${tag.slice(i + 1)}`;
};
export const BATTLETAG_RE = /^[^#\s]{2,32}#[0-9]{3,8}$/;

// Score d'un rang pour le tri : bronze 5 = 1, …, champion 1 = 40.
const DIVISIONS = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'grandmaster', 'champion'];
export const rankScore = (r) => (r ? DIVISIONS.indexOf(r.division) * 5 + (6 - r.tier) : 0);
export const bestRankScore = (ranks) => Math.max(0, ...ROLES.map((role) => rankScore(ranks?.[role.key])));

export const hours = (s) => `${(s / 3600).toFixed(1)} h`;
export const number = (n) => Math.round(n).toLocaleString('fr-FR');
export const formatDate = (iso) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

// Noms et portraits des héros, chargés une seule fois.
// Si l'API ne répond pas, on garde juste l'identifiant du héros.
export const heroInfo = ref({});
fetch(`${API}/heroes`)
  .then((res) => res.json())
  .then((list) => { heroInfo.value = Object.fromEntries(list.map((h) => [h.key, h])); })
  .catch(() => {});

// Tri d'une liste selon des colonnes { key, value: (item) => valeur, asc?: true }.
// Au premier clic, une colonne est triée en décroissant, sauf si elle a asc: true (noms).
export function useSort(items, columns, defaultKey) {
  const sortKey = ref(defaultKey);
  const sortDesc = ref(true);

  const sorted = computed(() => {
    const value = columns.find((c) => c.key === sortKey.value).value;
    return [...items.value].sort((a, b) => {
      const cmp = value(a) < value(b) ? -1 : value(a) > value(b) ? 1 : 0;
      return sortDesc.value ? -cmp : cmp;
    });
  });

  function sortBy(key) {
    if (sortKey.value === key) sortDesc.value = !sortDesc.value;
    else { sortKey.value = key; sortDesc.value = !columns.find((c) => c.key === key).asc; }
  }

  const arrow = (key) => (sortKey.value === key ? (sortDesc.value ? ' ▾' : ' ▴') : '');

  return { sortKey, sorted, sortBy, arrow };
}
