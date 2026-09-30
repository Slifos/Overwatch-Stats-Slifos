// Sauvegarde les stats compétitives de la saison en cours dans saisons/saison-N.json.
// À lancer régulièrement : le fichier de la saison est écrasé à chaque fois,
// donc la dernière sauvegarde avant le changement de saison garde les stats finales.
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = 'https://overfast-api.tekrop.fr';
const battletag = 'Slifos#2280'.replace('#', '-');

async function get(path) {
  const res = await fetch(`${BASE}/players/${battletag}${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(`${path} : ${JSON.stringify(data.error)}`);
  return data;
}

const summary = await get('/summary');
const stats = await get('/stats/summary?gamemode=competitive');

const season = summary.competitive?.pc?.season ?? summary.competitive?.console?.season;
if (!season) {
  console.log('Aucun rang compétitif trouvé pour cette saison, rien à sauvegarder.');
  process.exit(0);
}

const snapshot = {
  season,
  savedAt: new Date().toISOString(),
  ranks: summary.competitive,
  general: stats.general,
  heroes: stats.heroes,
};

await mkdir('saisons', { recursive: true });
const file = `saisons/saison-${season}.json`;
await writeFile(file, JSON.stringify(snapshot, null, 2));

console.log(`Saison ${season} sauvegardée dans ${file} (${stats.general.games_played} parties, ${stats.general.winrate} % de victoires)`);
