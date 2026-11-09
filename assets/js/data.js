import { loadShop } from './shop.js';
import { state } from './state.js';

export function loadTracks(elements, onLoaded) {
  state.isLoadingTracks = true;

  // Calculate cache-friendly timestamp (last update at 00:02 UTC)
  const now = new Date();
  const lastUpdate = new Date();
  lastUpdate.setUTCHours(0, 2, 0, 0);

  // If current time is before 00:02 UTC today, use yesterday's update
  if (now.getUTCHours() === 0 && now.getUTCMinutes() < 2) {
    lastUpdate.setUTCDate(lastUpdate.getUTCDate() - 1);
  }

  const cacheTimestamp = lastUpdate.getTime();

  const tracks = fetch(`data/tracks.json?v=${cacheTimestamp}`)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    });

  Promise.all([tracks, loadShop()])
    .then(([data]) => {
      if (data._metadata) {
        state.seasonEnd = data._metadata.seasonEnd;
        delete data._metadata;
      }

      state.tracksData = Object.entries(data).map(([id, track]) => ({ ...track, id }));
      state.isLoadingTracks = false;
      onLoaded();
    })
    .catch(error => {
      state.isLoadingTracks = false;
      console.error('Error loading tracks:', error);
      elements.content.innerHTML = `
        <div class="error-container">
          <h2>Failed to load tracks</h2>
          <p>${error.message}</p>
          <button class="show-all-btn" onclick="location.reload()">Retry</button>
        </div>
      `;
    });
}

export function initializeFromURL(elements) {
  const urlParams = new URLSearchParams(window.location.search);
  elements.searchInput.value = urlParams.get('q') || '';
  const filterValue = urlParams.get('filter');
  const hasValidFilter = Array.from(elements.filterSelect.options).some(option => option.value === filterValue);
  elements.filterSelect.value = hasValidFilter ? filterValue : 'all';
  state.inFilteredView = hasValidFilter;
}

export async function loadFestivalBackdrop(backdrop) {
  try {
    const response = await fetch('https://prod.fn-api.cc/v1/mnemonic/playlist_pilgrimquickplay?related=false', {
      signal: AbortSignal.timeout(3000)
    });
    if (!response.ok) return;

    const { data } = await response.json();
    const image = new URL(data?.metadata?.lobby_background_image_urls?.url);
    if (image.origin !== 'https://cdn2.unrealengine.com' || image.username || image.password) return;

    backdrop.style.backgroundImage = `url(${JSON.stringify(image.href)})`;
  } catch {
    // The background is decorative; keep the dark page background if it cannot load.
  }
}
