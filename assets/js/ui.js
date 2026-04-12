import { state, CONFIG, MS_PER_WEEK } from './state.js';
import { marqueeObserver } from './marquee.js';
import { isFeaturedToday, applyDifficultyFiltersAndSort, sortTracksByColumn, normalizeInstrumentKey } from './filter.js';
import { createTrackElement, createTableRow, buildTableHTML, applyTableColumnVisibility } from './render.js';

// Callbacks injected at init to avoid circular imports
let _filterTracks;
let _loadTracks;

export function initUI({ filterTracks, loadTracks }) {
  _filterTracks = filterTracks;
  _loadTracks = loadTracks;
}

export function renderHomepage(elements) {
  const now = Date.now();
  const sevenDaysAgo = now - MS_PER_WEEK;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayStart = today.getTime();
  const favoritesSet = new Set(state.favorites);

  const categories = { new: [], featured: [], rotated: [], favorites: [], other: [] };

  // Categorize all tracks in a single pass
  state.tracksData.forEach(track => {
    const createdTime = new Date(track.createdAt).getTime();
    const isFeatured = isFeaturedToday(track, todayStart);
    const isRotated = track.lastFeatured && !isFeatured && new Date(track.lastFeatured).getTime() >= sevenDaysAgo;
    const isNew = createdTime > sevenDaysAgo;
    const isFavorite = favoritesSet.has(track.id);

    if (isNew) categories.new.push(track);
    if (isFeatured) categories.featured.push(track);
    if (isRotated) categories.rotated.push(track);
    if (isFavorite) categories.favorites.push(track);
    if (!isNew && !isFeatured && !isRotated && !isFavorite) categories.other.push(track);
  });

  const newTracks = categories.new.sort((a, b) => {
    const dateComp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return dateComp !== 0 ? dateComp : a.title.localeCompare(b.title);
  });

  const dailyRotation = categories.featured.sort((a, b) => {
    const dateA = a.lastFeatured ? new Date(a.lastFeatured).getTime() : 0;
    const dateB = b.lastFeatured ? new Date(b.lastFeatured).getTime() : 0;
    return dateB !== dateA ? dateB - dateA : a.title.localeCompare(b.title);
  });

  const rotatedOut = categories.rotated.sort((a, b) => {
    const dateA = new Date(a.lastFeatured).getTime();
    const dateB = new Date(b.lastFeatured).getTime();
    return dateB !== dateA ? dateB - dateA : a.title.localeCompare(b.title);
  });

  const favoriteTracks = categories.favorites.sort((a, b) =>
    state.favorites.indexOf(b.id) - state.favorites.indexOf(a.id)
  );

  const otherTracks = categories.other.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const nextUpdate = new Date();
  nextUpdate.setUTCDate(nextUpdate.getUTCDate() + 1);
  nextUpdate.setUTCHours(0, 0, 0, 0);

  const updateStart = new Date();
  updateStart.setUTCHours(0, 0, 0, 0);
  const updateEnd = new Date(updateStart);
  updateEnd.setUTCMinutes(2);

  let countdownText = '';
  if (now >= updateStart && now <= updateEnd) {
    countdownText = 'Updating...';
  } else {
    const timeUntilUpdate = nextUpdate - now;
    const hoursLeft = Math.floor(timeUntilUpdate / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeUntilUpdate % (1000 * 60 * 60)) / (1000 * 60));
    const secondsLeft = Math.floor((timeUntilUpdate % (1000 * 60)) / 1000);
    countdownText = (minutesLeft === 0 && hoursLeft === 0) ? `${secondsLeft}s` : `${hoursLeft}h ${minutesLeft}m`;
  }

  // Season countdown
  let seasonCountdownText = 'Unknown';
  if (state.seasonEnd) {
    const timeUntilSeasonEnd = new Date(state.seasonEnd) - now;
    const daysUntilSeasonEnd = Math.floor(timeUntilSeasonEnd / (1000 * 60 * 60 * 24));
    const hoursUntilSeasonEnd = Math.floor((timeUntilSeasonEnd % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    seasonCountdownText = `${daysUntilSeasonEnd}d ${hoursUntilSeasonEnd}h`;
  }

  elements.content.innerHTML = `
    <div class="info-section">
      <div class="track-stats">
        <div class="stat stat-clickable" id="totalTracksStat" tabindex="0" role="button">
          <span class="stat-value">${state.tracksData.length}</span>
          <span class="stat-label">Total Tracks</span>
        </div>
        <div class="stat">
          <span class="stat-value" id="seasonCountdown" translate="no">${seasonCountdownText}</span>
          <span class="stat-label">Until Season End</span>
        </div>
        <div class="stat">
          <span class="stat-value" id="updateCountdown" translate="no">${countdownText}</span>
          <span class="stat-label">Until Daily Update</span>
        </div>
      </div>
    </div>

    ${newTracks.length > 0 ? `
      <div class="track-section">
        <div class="section-header" tabindex="0" role="button" data-filter="new">
          <h2>New Tracks</h2>
          <span class="section-count">${newTracks.length}</span>
        </div>
        <div class="tracks-grid" data-section="new"></div>
      </div>
    ` : ''}

    ${dailyRotation.length > 0 ? `
      <div class="track-section">
        <div class="section-header" tabindex="0" role="button" data-filter="featured">
          <h2>Featured</h2>
          <span class="section-count">${dailyRotation.length}</span>
        </div>
        <div class="tracks-grid" data-section="daily"></div>
        ${dailyRotation.length > 6 ? '<button class="show-all-btn" data-filter="featured">Show All Featured</button>' : ''}
      </div>
    ` : ''}

    ${rotatedOut.length > 0 ? `
      <div class="track-section">
        <div class="section-header" tabindex="0" role="button" data-filter="rotated">
          <h2>Recently Rotated</h2>
          <span class="section-count">${rotatedOut.length}</span>
        </div>
        <div class="tracks-grid" data-section="rotated"></div>
        ${rotatedOut.length > 6 ? '<button class="show-all-btn" data-filter="rotated">Show All Recently Rotated</button>' : ''}
      </div>
    ` : ''}

    ${favoriteTracks.length > 0 ? `
      <div class="track-section">
        <div class="section-header" tabindex="0" role="button" data-filter="favorites">
          <h2>Your Favorites</h2>
          <span class="section-count">${favoriteTracks.length}</span>
        </div>
        <div class="tracks-grid" data-section="favorites"></div>
        ${favoriteTracks.length > 6 ? '<button class="show-all-btn" data-filter="favorites">Show All Favorites</button>' : ''}
      </div>
    ` : ''}

    <div class="track-section">
      <div class="section-header" tabindex="0" role="button" data-filter="all">
        <h2>Other Tracks</h2>
        <span class="section-count">${otherTracks.length}</span>
      </div>
      <div class="tracks-grid" data-section="other"></div>
      <button class="show-all-btn" data-filter="all">Show All Tracks</button>
    </div>
  `;

  // Populate sections using document fragments to batch DOM updates
  const populateSection = (selector, tracks, limit = 6) => {
    const grid = elements.content.querySelector(selector);
    if (!grid) return;
    const fragment = document.createDocumentFragment();
    tracks.slice(0, limit).forEach(track => fragment.appendChild(createTrackElement(track, 'compact')));
    grid.appendChild(fragment);
  };

  if (newTracks.length > 0) populateSection('[data-section="new"]', newTracks);
  if (dailyRotation.length > 0) populateSection('[data-section="daily"]', dailyRotation);
  if (rotatedOut.length > 0) populateSection('[data-section="rotated"]', rotatedOut);
  if (favoriteTracks.length > 0) populateSection('[data-section="favorites"]', favoriteTracks);
  populateSection('[data-section="other"]', otherTracks);

  // Store the displayed tracks in the order they appear on homepage for modal navigation
  state.currentDisplayedTracks = [
    ...newTracks.slice(0, 6),
    ...dailyRotation.slice(0, 6),
    ...rotatedOut.slice(0, 6),
    ...favoriteTracks.slice(0, 6),
    ...otherTracks.slice(0, 6)
  ];

  // Section header click handlers
  elements.content.querySelectorAll('.section-header').forEach(header => {
    const filterValue = header.dataset.filter;
    if (!filterValue) return;

    const navigateToFilter = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      elements.filterSelect.value = filterValue;
      elements.searchInput.value = '';
      state.inFilteredView = true;
      _filterTracks();
    };

    header.addEventListener('click', navigateToFilter);
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigateToFilter();
      }
    });
  });

  // Show All button handlers
  elements.content.querySelectorAll('.show-all-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      elements.filterSelect.value = btn.dataset.filter;
      elements.searchInput.value = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      state.inFilteredView = true;
      _filterTracks();
    });
  });

  // Total tracks stat click handler
  const totalTracksStat = elements.content.querySelector('#totalTracksStat');
  if (totalTracksStat) {
    const handleClick = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      elements.filterSelect.value = 'all';
      elements.searchInput.value = '';
      state.inFilteredView = true;
      _filterTracks();
    };

    totalTracksStat.addEventListener('click', handleClick);
    totalTracksStat.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    });
  }

  startHomepageCountdown();

  requestAnimationFrame(() => {
    elements.content.querySelectorAll('.jam-track').forEach(el => marqueeObserver.observe(el));
  });
}

export function startHomepageCountdown() {
  if (state.countdownInterval) {
    clearInterval(state.countdownInterval);
  }

  state.countdownInterval = setInterval(() => {
    const countdownEl = document.getElementById('updateCountdown');
    const seasonCountdownEl = document.getElementById('seasonCountdown');

    if (!countdownEl) {
      clearInterval(state.countdownInterval);
      return;
    }

    const now = new Date();
    const nextUpdate = new Date();
    nextUpdate.setUTCDate(nextUpdate.getUTCDate() + 1);
    nextUpdate.setUTCHours(0, 0, 0, 0);

    const updateStart = new Date();
    updateStart.setUTCHours(0, 0, 0, 0);
    const updateEnd = new Date(updateStart);
    updateEnd.setUTCMinutes(2);

    if (now >= updateStart && now <= updateEnd) {
      countdownEl.textContent = 'Updating...';
      state.wasUpdating = true;
    } else {
      // If we were updating and now we're not, reload tracks
      if (state.wasUpdating) {
        state.wasUpdating = false;
        clearInterval(state.countdownInterval);
        _loadTracks();
        return;
      }

      const timeUntilUpdate = nextUpdate - now;
      const hoursLeft = Math.floor(timeUntilUpdate / (1000 * 60 * 60));
      const minutesLeft = Math.floor((timeUntilUpdate % (1000 * 60 * 60)) / (1000 * 60));
      countdownEl.textContent = `${hoursLeft}h ${minutesLeft}m`;
    }

    // Season countdown
    if (seasonCountdownEl && state.seasonEnd) {
      const timeUntilSeasonEnd = new Date(state.seasonEnd) - now;
      const daysUntilSeasonEnd = Math.floor(timeUntilSeasonEnd / (1000 * 60 * 60 * 24));
      const hoursUntilSeasonEnd = Math.floor((timeUntilSeasonEnd % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      seasonCountdownEl.textContent = `${daysUntilSeasonEnd}d ${hoursUntilSeasonEnd}h`;
    }
  }, 1000);
}

export function updateTrackDisplay(query, filterValue, elements, updateHistory = true) {
  if (state.infiniteScrollHandler) {
    const prevScrollEl = state.infiniteScrollEl || window;
    prevScrollEl.removeEventListener('scroll', state.infiniteScrollHandler);
    state.infiniteScrollHandler = null;
    state.infiniteScrollEl = null;
  }

  state.loadedTracks = 0;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const shouldShowHomepage = !query && filterValue === 'all' && !state.inFilteredView;

  if (shouldShowHomepage) {
    renderHomepage(elements);
  } else {
    const resultText = query
      ? `Search results for "${query}"`
      : filterValue === 'featured' ? 'Featured Tracks'
      : filterValue === 'rotated' ? 'Recently Rotated'
      : filterValue === 'new' ? 'New Tracks'
      : filterValue === 'favorites' ? 'Your Favorites'
      : 'All Tracks';

    let displayTracks = applyDifficultyFiltersAndSort([...state.currentFilteredTracks]);
    state.currentDisplayedTracks = displayTracks;

    elements.content.innerHTML = `
      <div class="page-header">
        <div class="page-header-content">
          <div>
            <h1>${resultText}</h1>
            <p class="track-count">${displayTracks.length} tracks</p>
          </div>
          <div class="view-controls">
            <div class="grid-view-controls" ${state.viewMode === 'table' ? 'style="display:none"' : ''}>
              <div class="control-group">
                <label for="instrumentFilter">Instrument:</label>
                <select id="instrumentFilter" class="custom-select compact">
                  <option value="all">All</option>
                  <option value="vocals">Vocals</option>
                  <option value="guitar">Lead</option>
                  <option value="bass">Bass</option>
                  <option value="drums">Drums</option>
                  <option value="plastic-vocals">Pro Vocals</option>
                  <option value="plastic-guitar">Pro Lead</option>
                  <option value="plastic-bass">Pro Bass</option>
                  <option value="plastic-drums">Pro Drums</option>
                </select>
              </div>
              <div class="control-group">
                <label for="difficultySort">Sort by Difficulty:</label>
                <select id="difficultySort" class="custom-select compact">
                  <option value="none">Default</option>
                  <option value="asc">Easiest First</option>
                  <option value="desc">Hardest First</option>
                </select>
              </div>
            </div>
            <div class="control-group">
              <label for="viewToggle">View:</label>
              <div class="view-toggle" id="viewToggle">
                <button id="compactViewBtn" class="view-toggle-btn ${state.viewMode === 'compact' ? 'active' : ''}" title="Compact View">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5z"/>
                  </svg>
                </button>
                <button id="detailedViewBtn" class="view-toggle-btn ${state.viewMode === 'detailed' ? 'active' : ''}" title="Detailed View">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/>
                  </svg>
                </button>
                <button id="tableViewBtn" class="view-toggle-btn ${state.viewMode === 'table' ? 'active' : ''}" title="Table View">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm15 2h-4v3h4zm0 4h-4v3h4zm0 4h-4v3h3a1 1 0 0 0 1-1zm-5 3v-3H6v3zm-4 0v-3H2v2a1 1 0 0 0 1 1zm-4-4h4V8H2zm0-4h4V4H2zm5-3v3h4V4zm4 4H7v3h4z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      ${state.viewMode === 'table' ? buildTableHTML() : `<div class="tracks-grid ${state.viewMode === 'detailed' ? 'detailed-view' : ''}"></div>`}
    `;

    if (state.viewMode === 'table') {
      const wrapper = elements.content.querySelector('.tracks-table-wrapper');
      const headerH = document.querySelector('.header').offsetHeight;
      wrapper.style.maxHeight = `calc(100dvh - ${headerH + 20}px)`;
      wrapper.querySelector('thead').addEventListener('click', (e) => {
        const th = e.target.closest('th[data-sort]');
        if (!th) return;
        const col = th.dataset.sort;
        if (state.tableSortColumn === col) {
          state.tableSortColumn = state.tableSortDir === 'desc' ? null : undefined;
          if (state.tableSortDir !== 'desc') state.tableSortDir = 'desc';
          else state.tableSortColumn = null;
        } else {
          state.tableSortColumn = col;
          state.tableSortDir = 'asc';
        }
        refreshCurrentView(elements);
      });
      const tbody = wrapper.querySelector('tbody');
      displayTracks.slice(0, CONFIG.initialLoad).forEach(track => tbody.appendChild(createTableRow(track)));
      state.loadedTracks = Math.min(CONFIG.initialLoad, displayTracks.length);
      if (displayTracks.length > CONFIG.initialLoad) {
        setupInfiniteScroll(displayTracks, tbody, createTableRow);
      }
      applyTableColumnVisibility(wrapper, state.difficultyFilterInstrument);
    } else {
      const grid = elements.content.querySelector('.tracks-grid');
      displayTracks.slice(0, CONFIG.initialLoad).forEach(track => {
        grid.appendChild(createTrackElement(track, state.viewMode));
      });
      requestAnimationFrame(() => {
        grid.querySelectorAll('.jam-track').forEach(el => marqueeObserver.observe(el));
      });
      state.loadedTracks = Math.min(CONFIG.initialLoad, displayTracks.length);
      if (displayTracks.length > CONFIG.initialLoad) {
        setupInfiniteScroll(displayTracks, grid);
      }
    }

    setupViewControls(elements);
  }

  if (updateHistory) {
    // Use immediate update for section navigation, debounced for search typing
    debouncedUpdateURL(query, filterValue, state.inFilteredView || filterValue !== 'all');
  }
}

export function refreshCurrentView(elements) {
  let displayTracks = applyDifficultyFiltersAndSort([...state.currentFilteredTracks]);

  const trackCount = elements.content.querySelector('.track-count');
  if (trackCount) trackCount.textContent = `${displayTracks.length} tracks`;

  const compactBtn = document.getElementById('compactViewBtn');
  const detailedBtn = document.getElementById('detailedViewBtn');
  const tableBtn = document.getElementById('tableViewBtn');
  if (compactBtn) compactBtn.classList.toggle('active', state.viewMode === 'compact');
  if (detailedBtn) detailedBtn.classList.toggle('active', state.viewMode === 'detailed');
  if (tableBtn) tableBtn.classList.toggle('active', state.viewMode === 'table');

  const gridViewControls = elements.content.querySelector('.grid-view-controls');
  if (gridViewControls) gridViewControls.style.display = state.viewMode === 'table' ? 'none' : '';

  if (state.infiniteScrollHandler) {
    const prevScrollEl = state.infiniteScrollEl || window;
    prevScrollEl.removeEventListener('scroll', state.infiniteScrollHandler);
    state.infiniteScrollHandler = null;
    state.infiniteScrollEl = null;
  }

  if (state.viewMode === 'table') {
    if (state.tableSortColumn) {
      displayTracks = sortTracksByColumn(displayTracks, state.tableSortColumn, state.tableSortDir);
    }

    const existingGrid = elements.content.querySelector('.tracks-grid');
    if (existingGrid) existingGrid.remove();
    let wrapper = elements.content.querySelector('.tracks-table-wrapper');
    if (!wrapper) {
      const temp = document.createElement('div');
      temp.innerHTML = buildTableHTML();
      elements.content.appendChild(temp.firstElementChild);
      wrapper = elements.content.querySelector('.tracks-table-wrapper');
      // Size wrapper to fill viewport below the fixed header
      const headerH = document.querySelector('.header').offsetHeight;
      wrapper.style.maxHeight = `calc(100dvh - ${headerH + 20}px)`;
      // Bind sort click handler once on this wrapper
      wrapper.querySelector('thead').addEventListener('click', (e) => {
        const th = e.target.closest('th[data-sort]');
        if (!th) return;
        const col = th.dataset.sort;
        if (state.tableSortColumn === col) {
          if (state.tableSortDir === 'desc') state.tableSortColumn = null;
          else state.tableSortDir = 'desc';
        } else {
          state.tableSortColumn = col;
          state.tableSortDir = 'asc';
        }
        refreshCurrentView(elements);
      });
    }

    const tbody = wrapper.querySelector('tbody');
    tbody.innerHTML = '';
    displayTracks.slice(0, CONFIG.initialLoad).forEach(track => tbody.appendChild(createTableRow(track)));
    state.loadedTracks = Math.min(CONFIG.initialLoad, displayTracks.length);
    if (displayTracks.length > CONFIG.initialLoad) {
      setupInfiniteScroll(displayTracks, tbody, createTableRow);
    }
    applyTableColumnVisibility(wrapper, state.difficultyFilterInstrument);
    wrapper.querySelectorAll('th[data-sort]').forEach(th => {
      const ind = th.querySelector('.sort-indicator');
      if (!ind) return;
      if (th.dataset.sort === state.tableSortColumn) {
        ind.textContent = state.tableSortDir === 'asc' ? ' ▲' : ' ▼';
        th.classList.add('sort-active');
      } else {
        ind.textContent = '';
        th.classList.remove('sort-active');
      }
    });
  } else {
    const existingTable = elements.content.querySelector('.tracks-table-wrapper');
    if (existingTable) existingTable.remove();
    let grid = elements.content.querySelector('.tracks-grid');
    if (!grid) {
      grid = document.createElement('div');
      elements.content.appendChild(grid);
    }
    grid.innerHTML = '';
    grid.className = `tracks-grid ${state.viewMode === 'detailed' ? 'detailed-view' : ''}`;
    displayTracks.slice(0, CONFIG.initialLoad).forEach(track => grid.appendChild(createTrackElement(track, state.viewMode)));
    requestAnimationFrame(() => {
      grid.querySelectorAll('.jam-track').forEach(el => marqueeObserver.observe(el));
    });
    state.loadedTracks = Math.min(CONFIG.initialLoad, displayTracks.length);
    if (displayTracks.length > CONFIG.initialLoad) {
      setupInfiniteScroll(displayTracks, grid);
    }
  }
}

export function setupViewControls(elements) {
  const compactBtn = document.getElementById('compactViewBtn');
  const detailedBtn = document.getElementById('detailedViewBtn');
  const tableBtn = document.getElementById('tableViewBtn');
  const instrumentFilter = document.getElementById('instrumentFilter');
  const difficultySort = document.getElementById('difficultySort');

  if (!compactBtn || !detailedBtn) return;

  if (instrumentFilter) instrumentFilter.value = state.difficultyFilterInstrument;
  if (difficultySort) difficultySort.value = state.difficultySortOrder;

  compactBtn.addEventListener('click', () => {
    if (state.viewMode !== 'compact') {
      state.viewMode = 'compact';
      localStorage.setItem('viewMode', 'compact');
      refreshCurrentView(elements);
    }
  });

  detailedBtn.addEventListener('click', () => {
    if (state.viewMode !== 'detailed') {
      state.viewMode = 'detailed';
      localStorage.setItem('viewMode', 'detailed');
      refreshCurrentView(elements);
    }
  });

  if (tableBtn) {
    tableBtn.addEventListener('click', () => {
      if (state.viewMode !== 'table') {
        state.viewMode = 'table';
        localStorage.setItem('viewMode', 'table');
        refreshCurrentView(elements);
      }
    });
  }

  if (instrumentFilter) {
    instrumentFilter.addEventListener('change', (e) => {
      state.difficultyFilterInstrument = e.target.value;
      localStorage.setItem('difficultyFilterInstrument', e.target.value);

      // Reset sort to none if switching to 'all'
      if (e.target.value === 'all' && state.difficultySortOrder !== 'none') {
        state.difficultySortOrder = 'none';
        localStorage.setItem('difficultySortOrder', 'none');
        if (difficultySort) difficultySort.value = 'none';
      }

      refreshCurrentView(elements);
    });
  }

  if (difficultySort) {
    difficultySort.addEventListener('change', (e) => {
      state.difficultySortOrder = e.target.value;
      localStorage.setItem('difficultySortOrder', e.target.value);

      // If sorting by difficulty but no instrument selected, default to guitar
      if (e.target.value !== 'none' && state.difficultyFilterInstrument === 'all') {
        state.difficultyFilterInstrument = 'guitar';
        localStorage.setItem('difficultyFilterInstrument', 'guitar');
        if (instrumentFilter) instrumentFilter.value = 'guitar';
      }

      refreshCurrentView(elements);
    });
  }
}

// Infinite Scroll
export function setupInfiniteScroll(tracks, container, creator = null) {
  const createItem = creator || ((track) => createTrackElement(track, state.viewMode));
  // For table tbody, scroll within the wrapper; otherwise scroll the window
  const scrollEl = container.tagName === 'TBODY'
    ? container.closest('.tracks-table-wrapper')
    : window;
  let isLoading = false;

  const loadMoreTracks = () => {
    if (isLoading || state.loadedTracks >= tracks.length) return;

    const scrollBottom = scrollEl === window
      ? window.scrollY + window.innerHeight
      : scrollEl.scrollTop + scrollEl.clientHeight;
    const contentHeight = scrollEl === window
      ? container.offsetTop + container.offsetHeight
      : container.offsetHeight;

    if (contentHeight - scrollBottom < 800) {
      isLoading = true;
      const nextBatch = tracks.slice(state.loadedTracks, state.loadedTracks + CONFIG.tracksPerPage);
      nextBatch.forEach(track => container.appendChild(createItem(track)));
      state.loadedTracks += CONFIG.tracksPerPage;

      requestAnimationFrame(() => {
        const startIndex = container.children.length - nextBatch.length;
        for (let i = startIndex; i < container.children.length; i++) {
          const el = container.children[i];
          if (el.classList.contains('jam-track') || el.classList.contains('jam-track-row')) {
            marqueeObserver.observe(el);
          }
        }
      });

      isLoading = false;
      setTimeout(() => loadMoreTracks(), 100);
    }
  };

  state.infiniteScrollHandler = loadMoreTracks;
  state.infiniteScrollEl = scrollEl;
  scrollEl.addEventListener('scroll', loadMoreTracks, { passive: true });
  setTimeout(() => loadMoreTracks(), 100);
}

// URL management
function updateURL(query, filterValue) {
  const url = new URL(window.location);
  if (query) url.searchParams.set('q', query);
  else url.searchParams.delete('q');
  if (filterValue && filterValue !== 'all') url.searchParams.set('filter', filterValue);
  else url.searchParams.delete('filter');
  window.history.pushState({ query, filterValue }, '', url);
}

export function debouncedUpdateURL(query, filterValue, immediate = false) {
  if (state.historyTimeout) {
    clearTimeout(state.historyTimeout);
    state.historyTimeout = null;
  }

  if (immediate || state.inFilteredView) {
    updateURL(query, filterValue);
  } else {
    // Debounce URL updates for search typing (500ms delay)
    state.historyTimeout = setTimeout(() => {
      updateURL(query, filterValue);
      state.historyTimeout = null;
    }, 500);
  }
}
