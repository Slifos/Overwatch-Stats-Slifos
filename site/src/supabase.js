import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const configured = Boolean(url && key);
export const supabase = configured ? createClient(url, key) : null;

// Renvoie les données d'une requête Supabase ou lève son erreur.
export async function query(request) {
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return data;
}
