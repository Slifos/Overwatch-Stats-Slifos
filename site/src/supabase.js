import { createClient } from '@supabase/supabase-js';

// Tolère les erreurs de copier-coller : espaces, guillemets, https:// oublié, / ou /rest/v1 en trop,
// et l'adresse du tableau de bord (supabase.com/dashboard/project/<id>) au lieu de celle de l'API.
const clean = (value) => value?.trim().replace(/^["']|["']$/g, '').trim();
const key = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);
const url = clean(import.meta.env.VITE_SUPABASE_URL)
  ?.replace(/^(?:https?:\/\/)?(?:app\.)?supabase\.com\/dashboard\/project\/([a-z0-9]+).*$/i, 'https://$1.supabase.co')
  .replace(/^(?!https?:\/\/)/, 'https://')
  .replace(/(\/rest\/v1)?\/*$/, '');

export const configured = Boolean(url && key);
export const supabase = configured ? createClient(url, key) : null;

// Ajoute le joueur s'il n'est pas suivi et sauvegarde ses stats tout de suite
// (Edge Function supabase/functions/ajoute-joueur). Renvoie { battletag, saved, warning? }.
export async function savePlayerNow(battletag) {
  const { data, error } = await supabase.functions.invoke('ajoute-joueur', { body: { battletag } });
  if (error) {
    const body = await error.context?.json?.().catch(() => null);
    throw new Error(body?.error ?? error.message);
  }
  return data;
}

// Renvoie les données d'une requête Supabase ou lève son erreur.
export async function query(request) {
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return data;
}
