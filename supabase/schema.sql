-- Schéma de la base Supabase. À coller une fois dans le SQL Editor du projet.

-- Joueurs suivis. N'importe qui peut en ajouter depuis le site (seulement le battletag),
-- le reste est rempli par sauvegarde.js.
create table players (
  id bigint generated always as identity primary key,
  battletag text not null unique check (battletag ~ '^[^#\s]{2,32}#[0-9]{3,8}$'), -- 'Slifos#2280'
  username text,
  avatar text,
  active boolean not null default true,  -- false : ignoré par la sauvegarde (joueur introuvable…)
  last_error text,                       -- dernière erreur rencontrée (profil privé…)
  last_checked_at timestamptz,
  added_at timestamptz not null default now()
);

-- Une ligne par joueur, mode de jeu et sauvegarde. sauvegarde.js n'en ajoute une que si
-- le nombre de parties a changé depuis la précédente, pour ne pas remplir la base pour rien.
create table snapshots (
  id bigint generated always as identity primary key,
  player_id bigint not null references players (id) on delete cascade,
  gamemode text not null check (gamemode in ('competitive', 'quickplay')),
  season int,                            -- saison compétitive en cours au moment de la sauvegarde
  saved_at timestamptz not null default now(),
  games_played int not null,
  ranks jsonb,                           -- seulement en compétitif
  general jsonb not null,
  heroes jsonb not null
);
create index on snapshots (player_id, gamemode, saved_at desc);

-- Dernière sauvegarde de chaque joueur pour chaque mode (utilisée par le classement).
create view latest_snapshots with (security_invoker = true) as
select distinct on (player_id, gamemode) *
from snapshots
order by player_id, gamemode, saved_at desc;

-- Droits : tout le monde peut lire, les visiteurs peuvent seulement ajouter un battletag.
-- sauvegarde.js utilise la clé service_role, qui ignore ces règles.
alter table players enable row level security;
alter table snapshots enable row level security;

create policy "lecture publique" on players for select using (true);
create policy "ajout public" on players for insert to anon, authenticated with check (true);
create policy "lecture publique" on snapshots for select using (true);

revoke insert, update, delete on players from anon, authenticated;
grant insert (battletag) on players to anon, authenticated;
revoke insert, update, delete on snapshots from anon, authenticated;
