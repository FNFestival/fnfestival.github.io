import { state, MS_PER_DAY, MS_PER_WEEK } from './state.js';

export const filterCache = {
  now: 0,
  today: 0,
  oneDayAgo: 0,
  sevenDaysAgo: 0,
  favoritesSet: new Set()
};

export function updateFilterCache() {
  const now = Date.now();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  filterCache.now = now;
  filterCache.today = today.getTime();
  filterCache.oneDayAgo = now - MS_PER_DAY;
  filterCache.sevenDaysAgo = now - MS_PER_WEEK;
  filterCache.favoritesSet = new Set(state.favorites);
}

export function isFeaturedToday(track, todayTimestamp = null) {
  if (!track.lastFeatured) return false;
  const featuredDate = new Date(track.lastFeatured);
  featuredDate.setUTCHours(0, 0, 0, 0);
  const today = todayTimestamp || filterCache.today;
  return featuredDate.getTime() === today;
}

export function applyFilter(track, filterValue) {
  switch (filterValue) {
    case 'featured':
      return isFeaturedToday(track);
    case 'rotated':
      // lastFeatured between 1-7 days ago
      if (!track.lastFeatured) return false;
      return new Date(track.lastFeatured).getTime() < filterCache.today &&
             new Date(track.lastFeatured).getTime() >= filterCache.sevenDaysAgo;
    case 'new':
      return new Date(track.createdAt).getTime() > filterCache.sevenDaysAgo;
    case 'favorites':
      return filterCache.favoritesSet.has(track.id);
    default:
      return true;
  }
}

export function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML.trim();
}

export function sortTracks(tracks, filterValue) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayStart = today.getTime();

  return tracks.sort((a, b) => {
    if (filterValue === 'rotated' || filterValue === 'featured') {
      const dateA = a.lastFeatured ? new Date(a.lastFeatured).getTime() : 0;
      const dateB = b.lastFeatured ? new Date(b.lastFeatured).getTime() : 0;
      if (dateB !== dateA) return dateB - dateA;
      return a.title.localeCompare(b.title);
    } else if (filterValue === 'new') {
      const dateComp = new Date(b.createdAt) - new Date(a.createdAt);
      if (dateComp !== 0) return dateComp;
      return a.title.localeCompare(b.title);
    } else if (filterValue === 'favorites') {
      // Sort by favorites array order (most recently added first)
      return state.favorites.indexOf(b.id) - state.favorites.indexOf(a.id);
    } else {
      // For 'all' filter, prioritize currently featured tracks
      const aIsFeatured = isFeaturedToday(a, todayStart);
      const bIsFeatured = isFeaturedToday(b, todayStart);
      if (aIsFeatured && !bIsFeatured) return -1;
      if (!aIsFeatured && bIsFeatured) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });
}

export function normalizeInstrumentKey(key) {
  // Convert kebab-case to camelCase (e.g., 'plastic-guitar' -> 'plasticGuitar')
  if (key.includes('-')) {
    return key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }
  return key;
}

export function applyDifficultyFiltersAndSort(tracks) {
  let filtered = tracks;

  // In table view, instrument filter controls column visibility, not row filtering
  if (state.difficultyFilterInstrument !== 'all' && state.viewMode !== 'table') {
    const normalizedInstrument = normalizeInstrumentKey(state.difficultyFilterInstrument);
    filtered = tracks.filter(track =>
      track.difficulties?.[normalizedInstrument] !== undefined
    );
  }

  // Table view uses column-header sort instead
  if (state.difficultySortOrder !== 'none' && state.difficultyFilterInstrument !== 'all' && state.viewMode !== 'table') {
    const normalizedInstrument = normalizeInstrumentKey(state.difficultyFilterInstrument);
    filtered.sort((a, b) => {
      const diffA = a.difficulties?.[normalizedInstrument] ?? -1;
      const diffB = b.difficulties?.[normalizedInstrument] ?? -1;
      return state.difficultySortOrder === 'asc' ? diffA - diffB : diffB - diffA;
    });
  }

  return filtered;
}

export function sortTracksByColumn(tracks, col, dir) {
  const parseDuration = s => {
    if (typeof s !== 'string') return 0;
    const m = s.match(/(?:(\d+)m\s*)?(?:(\d+)s)?/);
    if (m && (m[1] || m[2])) return (parseInt(m[1] || 0) * 60) + parseInt(m[2] || 0);
    // fallback: "m:ss" format
    const parts = s.split(':').map(Number);
    return parts.length === 2 ? parts[0] * 60 + (parts[1] || 0) : parts[0] || 0;
  };

  return [...tracks].sort((a, b) => {
    let vA, vB;
    if (col === 'title') {
      vA = (a.title || '').toLowerCase();
      vB = (b.title || '').toLowerCase();
    } else if (col === 'bpm') {
      vA = a.bpm || 0;
      vB = b.bpm || 0;
    } else if (col === 'duration') {
      vA = parseDuration(a.duration);
      vB = parseDuration(b.duration);
    } else {
      vA = a.difficulties?.[col] ?? -1;
      vB = b.difficulties?.[col] ?? -1;
    }
    if (vA < vB) return dir === 'asc' ? -1 : 1;
    if (vA > vB) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}
