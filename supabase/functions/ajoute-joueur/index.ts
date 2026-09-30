// Edge Function Supabase : ajoute un joueur (s'il n'est pas déjà suivi) et sauvegarde
// ses stats tout de suite, sans attendre le passage de sauvegarde.js.
// Appelée par le site avec { battletag: 'Pseudo#1234' }.
// Même logique de sauvegarde que sauvegarde.js : garder les deux en phase.
import { createClient } from 'npm:@supabase/supabase-js@2';

const API = 'https://overfast-api.tekrop.fr';
const GAMEMODES = ['competitive', 'quickplay'];
const BATTLETAG_RE = /^[^#\s]{2,32}#[0-9]{3,8}$/;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

async function overfast(path: string) {
  const res = await fetch(`${API}${path}`);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const { battletag } = await req.json().catch(() => ({}));
  if (typeof battletag !== 'string' || !BATTLETAG_RE.test(battletag.trim())) {
    return reply({ error: 'Format attendu : Pseudo#1234' }, 400);
  }
  const tag = battletag.trim();
  const urlTag = encodeURIComponent(tag.replace('#', '-'));

  const summary = await overfast(`/players/${urlTag}/summary`);
  if (summary.status === 404) return reply({ error: `${tag} est introuvable (attention aux majuscules).` }, 404);
  if (!summary.ok) return reply({ error: `API Overwatch : ${summary.data.error ?? summary.status}` }, 502);

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: player, error } = await db
    .from('players')
    .upsert(
      {
        battletag: tag,
        username: summary.data.username,
        avatar: summary.data.avatar,
        active: true,
        last_error: null,
        last_checked_at: new Date().toISOString(),
      },
      { onConflict: 'battletag' },
    )
    .select('id')
    .single();
  if (error) return reply({ error: error.message }, 500);

  const ranks = summary.data.competitive?.pc ?? summary.data.competitive?.console ?? null;
  const saved: string[] = [];

  for (const gamemode of GAMEMODES) {
    const stats = await overfast(`/players/${urlTag}/stats/summary?gamemode=${gamemode}`);
    if (!stats.ok || !stats.data.general) continue; // profil privé ou aucune partie dans ce mode

    const { data: last } = await db
      .from('snapshots')
      .select('games_played')
      .eq('player_id', player.id)
      .eq('gamemode', gamemode)
      .order('saved_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (last?.games_played === stats.data.general.games_played) continue; // rien de nouveau

    const { error: insertError } = await db.from('snapshots').insert({
      player_id: player.id,
      gamemode,
      season: ranks?.season ?? null,
      games_played: stats.data.general.games_played,
      ranks: gamemode === 'competitive' ? ranks : null,
      general: stats.data.general,
      heroes: stats.data.heroes,
    });
    if (insertError) return reply({ error: insertError.message }, 500);
    saved.push(gamemode);
  }

  const { count } = await db.from('snapshots').select('id', { count: 'exact', head: true }).eq('player_id', player.id);
  if (!count) {
    await db.from('players').update({ last_error: 'Profil privé ou aucune partie' }).eq('id', player.id);
    return reply({ battletag: tag, saved, warning: 'Profil privé ou aucune partie : aucune stat à afficher.' });
  }
  return reply({ battletag: tag, saved });
});
