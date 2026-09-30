// Importe une fois dans Supabase les anciennes sauvegardes saisons/saison-N.json de Slifos.
// Variables d'environnement : SUPABASE_URL, SUPABASE_SERVICE_KEY.
import { readdir, readFile } from 'node:fs/promises';

const BATTLETAG = 'Slifos#2280';
const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

async function db(path, { method = 'GET', body, prefer = 'return=representation' } = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: prefer,
    },
    body: body && JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase ${method} ${path} : ${res.status} ${await res.text()}`);
  return res.json();
}

await db('players?on_conflict=battletag', {
  method: 'POST',
  body: { battletag: BATTLETAG },
  prefer: 'resolution=ignore-duplicates,return=representation',
});
const [player] = await db(`players?battletag=eq.${encodeURIComponent(BATTLETAG)}&select=id`);

const files = (await readdir('saisons')).filter((f) => /^saison-\d+\.json$/.test(f));
for (const f of files) {
  const s = JSON.parse(await readFile(`saisons/${f}`, 'utf8'));
  await db('snapshots', {
    method: 'POST',
    body: {
      player_id: player.id,
      gamemode: 'competitive',
      season: s.season,
      saved_at: s.savedAt,
      games_played: s.general.games_played,
      ranks: s.ranks.pc ?? s.ranks.console,
      general: s.general,
      heroes: s.heroes,
    },
  });
  console.log(`${f} importé`);
}
