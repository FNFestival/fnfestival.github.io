import { readFile, writeFile } from 'node:fs/promises';

const endpoint = 'https://fnapi.osirion.gg/v1/season-passes/festival-pass';
const output = new URL('../data/live-seasons.json', import.meta.url);
const knownHeadliners = new Map([[16, 'Kasane Teto']]);

const response = await fetch(endpoint, { signal: AbortSignal.timeout(15000) });
if (!response.ok) throw new Error(`Festival pass returned HTTP ${response.status}`);

const { seasonPass } = await response.json();
const { seasonNumber: number, seasonName: passName, seasonStart, seasonEnd, categories } = seasonPass;
if (!Number.isInteger(number) || !(Date.parse(seasonStart) < Date.parse(seasonEnd)) || !Array.isArray(categories)) {
  throw new Error('Festival pass response is missing season dates or rewards');
}

const start = new Date(seasonStart).toISOString().slice(0, 10);
const end = new Date(seasonEnd).toISOString().slice(0, 10);
const headliner = knownHeadliners.get(number) ?? null;
const passTracks = categories.flatMap(category => category.pages)
  .flatMap(page => page.entries)
  .flatMap(entry => entry.rewards ?? [])
  .filter(reward => reward.item?.type?.id === 'sparkssong' && reward.item.name)
  .map(reward => reward.item.name);
let tracks = [...new Set(passTracks)];

if (headliner) {
  const catalog = await fetch('https://fortnite-api.com/v2/cosmetics/tracks', { signal: AbortSignal.timeout(15000) });
  if (!catalog.ok) throw new Error(`Jam Track catalog returned HTTP ${catalog.status}`);
  const { data } = await catalog.json();
  tracks = [...new Set(data.filter(track =>
    track.artist?.toLowerCase().includes(headliner.toLowerCase()) &&
    Date.parse(track.added) >= Date.parse(start) && Date.parse(track.added) < Date.parse(end)
  ).map(track => track.title))];
}

const archive = JSON.parse(await readFile(output, 'utf8'));
const existing = archive.find(season => season.number === number);
const updated = archive.filter(season => season.number !== number);
updated.push({
  number,
  passName,
  headliner,
  start,
  end,
  tracks: [...new Set([...(existing?.tracks ?? []), ...tracks])]
});
updated.sort((a, b) => b.number - a.number);
await writeFile(output, JSON.stringify(updated, null, 2) + '\n');
