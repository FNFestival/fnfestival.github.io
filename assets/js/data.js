import { state } from './state.js';

// Callbacks injected at init to avoid circular imports
let _initializeFromURL;
let _filterTracks;
let _renderHomepage;

export function initData({ initializeFromURL, filterTracks, renderHomepage }) {
  _initializeFromURL = initializeFromURL;
  _filterTracks = filterTracks;
  _renderHomepage = renderHomepage;
}

export function loadTracks(elements) {
  elements.content.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading jam tracks...</p>
    </div>
  `;

  // Calculate cache-friendly timestamp (last update at 00:02 UTC)
  const now = new Date();
  const lastUpdate = new Date();
  lastUpdate.setUTCHours(0, 2, 0, 0);

  // If current time is before 00:02 UTC today, use yesterday's update
  if (now.getUTCHours() === 0 && now.getUTCMinutes() < 2) {
    lastUpdate.setUTCDate(lastUpdate.getUTCDate() - 1);
  }

  const cacheTimestamp = lastUpdate.getTime();

  fetch(`data/tracks.json?v=${cacheTimestamp}`)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      if (data._metadata) {
        state.seasonEnd = data._metadata.seasonEnd;
        delete data._metadata;
      }

      state.tracksData = Object.entries(data).map(([id, track]) => ({ ...track, id }));
      _initializeFromURL(elements);
      _filterTracks();
    })
    .catch(error => {
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
  const searchQuery = urlParams.get('q');
  const filterValue = urlParams.get('filter');

  if (searchQuery) elements.searchInput.value = searchQuery;
  if (filterValue) elements.filterSelect.value = filterValue;
}
