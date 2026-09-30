// Sauvegarde les stats (compétitif et partie rapide) de tous les joueurs actifs dans Supabase.
// Lancé toutes les 6 heures par .github/workflows/sauvegarde.yml.
// Variables d'environnement : SUPABASE_URL, SUPABASE_SERVICE_KEY (clé service_role).

const API = 'https://overfast-api.tekrop.fr';
const GAMEMODES = ['competitive', 'quickplay'];
const PAUSE_MS = 1000; // entre deux joueurs, pour ne pas surcharger l'API

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Il manque SUPABASE_URL ou SUPABASE_SERVICE_KEY.');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Appel à l'API Overwatch. En cas de limite de requêtes (429), attend puis réessaie une fois.
async function overfast(path, retry = true) {
  const res = await fetch(`${API}${path}`);
  const data = await res.json().catch(() => ({}));
  if (res.status === 429 && retry) {
    const wait = Number(res.headers.get('retry-after') ?? 10);
    console.log(`  Limite de l'API atteinte, pause de ${wait} s`);
    await sleep(wait * 1000);
    return overfast(path, false);
  }
  if (!res.ok) throw new ApiError(res.status, data.error ?? `erreur ${res.status}`);
  return data;
}

// Appel à l'API REST de Supabase.
async function db(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: body && JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase ${method} ${path} : ${res.status} ${await res.text()}`);
  return method === 'GET' ? res.json() : null;
}

const updatePlayer = (id, fields) =>
  db(`players?id=eq.${id}`, { method: 'PATCH', body: { ...fields, last_checked_at: new Date().toISOString() } });

async function savePlayer(player) {
  const tag = encodeURIComponent(player.battletag.replace('#', '-'));
  const summary = await overfast(`/players/${tag}/summary`);
  const ranks = summary.competitive?.pc ?? summary.competitive?.console ?? null;
  const saved = [];

  for (const gamemode of GAMEMODES) {
    const stats = await overfast(`/players/${tag}/stats/summary?gamemode=${gamemode}`);
    if (!stats.general) continue; // profil privé ou aucune partie dans ce mode

    const [last] = await db(
      `snapshots?player_id=eq.${player.id}&gamemode=eq.${gamemode}&select=games_played&order=saved_at.desc&limit=1`,
    );
    if (last?.games_played === stats.general.games_played) continue; // rien de nouveau

    await db('snapshots', {
      method: 'POST',
      body: {
        player_id: player.id,
        gamemode,
        season: ranks?.season ?? null,
        games_played: stats.general.games_played,
        ranks: gamemode === 'competitive' ? ranks : null,
        general: stats.general,
        heroes: stats.heroes,
      },
    });
    saved.push(`${gamemode} (${stats.general.games_played} parties)`);
  }

  const noStats = saved.length === 0 && !(await db(`snapshots?player_id=eq.${player.id}&select=id&limit=1`)).length;
  await updatePlayer(player.id, {
    username: summary.username,
    avatar: summary.avatar,
    last_error: noStats ? 'Profil privé ou aucune partie' : null,
  });
  return saved;
}

const players = await db('players?active=is.true&select=id,battletag&order=id');
console.log(`${players.length} joueur(s) à sauvegarder`);

let failures = 0;
for (const player of players) {
  try {
    const saved = await savePlayer(player);
    console.log(`${player.battletag} : ${saved.length ? saved.join(', ') : 'rien de nouveau'}`);
  } catch (e) {
    failures++;
    console.log(`${player.battletag} : ERREUR ${e.message}`);
    // Joueur introuvable : on arrête de le suivre. Les autres erreurs sont peut-être passagères.
    await updatePlayer(player.id, { last_error: e.message, ...(e.status === 404 && { active: false }) }).catch(() => {});
  }
  await sleep(PAUSE_MS);
}

console.log(`Terminé : ${players.length - failures} réussi(s), ${failures} en erreur`);
