// Affiche un résumé de toutes les saisons sauvegardées par sauvegarde.js.
import { readdir, readFile } from 'node:fs/promises';

const files = (await readdir('saisons').catch(() => [])).filter((f) => f.endsWith('.json'));
if (files.length === 0) {
  console.log('Aucune saison sauvegardée. Lance d\'abord : node sauvegarde.js');
  process.exit(0);
}

const seasons = await Promise.all(files.map(async (f) => JSON.parse(await readFile(`saisons/${f}`, 'utf8'))));
seasons.sort((a, b) => a.season - b.season);

const rank = (r) => (r ? `${r.division} ${r.tier}` : '-');

for (const s of seasons) {
  const ranks = s.ranks.pc ?? s.ranks.console;
  const topHero = Object.entries(s.heroes).sort(([, a], [, b]) => b.time_played - a.time_played)[0];

  console.log(`\nSaison ${s.season} (sauvegardée le ${s.savedAt.slice(0, 10)})`);
  console.log(`  Rangs : tank ${rank(ranks.tank)}, dps ${rank(ranks.damage)}, support ${rank(ranks.support)}`);
  console.log(`  ${s.general.games_played} parties, ${s.general.winrate} % de victoires, KDA ${s.general.kda}`);
  if (topHero) console.log(`  Héros le plus joué : ${topHero[0]}`);
}
