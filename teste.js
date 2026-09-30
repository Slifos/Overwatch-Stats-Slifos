const battletag = 'Slifos-2280';
const BASE = 'https://overfast-api.tekrop.fr';

const res = await fetch(`${BASE}/players/${battletag}/summary`);
const data = await res.json();

if (!res.ok) {
  console.log('Erreur :', data.error);
} else {
  console.log('Joueur :', data.username);
  console.log('Rangs :', data.competitive?.pc);
  console.log('Niveau :', data.level);
  console.log('Perso préféré :', data.favorite?.pc);
}




// Perso préféré = le héros avec le plus de temps de jeu
for (const mode of ['quickplay', 'competitive']) {
  const statsRes = await fetch(`${BASE}/players/${battletag}/stats/summary?gamemode=${mode}`);
  const stats = await statsRes.json();

  const top3 = Object.entries(stats.heroes)
    .sort(([, a], [, b]) => b.time_played - a.time_played)
    .slice(0, 3);

  console.log(`\nHéros les plus joués (${mode}) :`);
  for (const [hero, s] of top3) {
    const heures = (s.time_played / 3600).toFixed(1);
    console.log(`  ${hero} : ${heures} h, ${s.games_played} parties, ${s.winrate} % de victoires`);
    
  }
}
