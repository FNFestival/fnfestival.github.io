document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const elements = {
    modal: document.getElementById('trackModal'),
    searchInput: document.getElementById('searchInput'),
    content: document.querySelector('.content'),
    logo: document.getElementById('logo'),
    muteButton: document.getElementById('muteButton'),
    favoriteButton: document.getElementById('favoriteButton'),
    filterSelect: document.getElementById('filterSelect'),
    randomButton: document.getElementById('randomButton')
  };

  // State
  const state = {
    tracksData: [],
    loadedTracks: 0,
    currentTrackIndex: -1,
    currentFilteredTracks: [],
    isMuted: localStorage.getItem('isMuted') === 'true',
    sawUpdateMessage: false,
    currentPreviewUrl: '',
    currentTrack: null,
    favorites: JSON.parse(localStorage.getItem('favoriteTracks') || '[]'),
    loopTimeout: null,
    countdownInterval: null,
    fadeInterval: null,
    infiniteScrollHandler: null,
    forceFilteredView: false
  };

  // Constants
  const CONFIG = {
    tracksPerPage: 20,
    initialLoad: 40,
    audioVolume: 0.2,
    marqueeObserverMargin: '100px',
    resizeDebounceDelay: 250,
    marqueeCheckDelay: 150,
    loopDelay: 3000,
    fadeDuration: 500
  };

  // Audio setup
  const audio = new Audio();
  audio.volume = CONFIG.audioVolume;

  const marqueeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Delay check slightly to ensure proper layout calculation
        setTimeout(() => {
          const marqueeElements = entry.target.querySelectorAll('.marquee-text');
          marqueeElements.forEach(checkAndStartMarquee);
        }, CONFIG.marqueeCheckDelay);
      } else {
        const marqueeElements = entry.target.querySelectorAll('.marquee-text');
        marqueeElements.forEach(stopMarquee);
      }
    });
  }, { rootMargin: CONFIG.marqueeObserverMargin });

  // Initialize
  loadTracks();
  initializeEventListeners();

  // Initialize mute icon on page load
  updateMuteIcon();
  if (state.isMuted) {
    audio.volume = 0;
  }

  // Audio Functions
  function updateMuteIcon() {
    const volumeIcon = elements.muteButton.querySelector('.volume-icon');
    const mutedIcon = elements.muteButton.querySelector('.muted-icon');

    if (state.isMuted) {
      volumeIcon.style.display = 'none';
      mutedIcon.style.display = 'block';
    } else {
      volumeIcon.style.display = 'block';
      mutedIcon.style.display = 'none';
    }
  }

  function toggleMute() {
    state.isMuted = !state.isMuted;
    audio.volume = state.isMuted ? 0 : CONFIG.audioVolume;
    localStorage.setItem('isMuted', state.isMuted);
    updateMuteIcon();
  }

  function fadeIn(duration) {
    // Clear any existing fade interval
    if (state.fadeInterval) {
      clearInterval(state.fadeInterval);
      state.fadeInterval = null;
    }

    audio.volume = 0;
    const steps = 20;
    const stepTime = duration / steps;
    const volumeStep = CONFIG.audioVolume / steps;
    let currentStep = 0;

    state.fadeInterval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps || state.isMuted) {
        audio.volume = state.isMuted ? 0 : CONFIG.audioVolume;
        clearInterval(state.fadeInterval);
        state.fadeInterval = null;
      } else {
        audio.volume = volumeStep * currentStep;
      }
    }, stepTime);
  }

  function fadeOut(duration, callback) {
    // Clear any existing fade interval
    if (state.fadeInterval) {
      clearInterval(state.fadeInterval);
      state.fadeInterval = null;
    }

    const steps = 20;
    const stepTime = duration / steps;
    const startVolume = audio.volume;
    const volumeStep = startVolume / steps;
    let currentStep = 0;

    state.fadeInterval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        audio.volume = 0;
        clearInterval(state.fadeInterval);
        state.fadeInterval = null;
        if (callback) callback();
      } else {
        audio.volume = startVolume - (volumeStep * currentStep);
      }
    }, stepTime);
  }

  function setupAudioLoop() {
    if (state.loopTimeout) {
      clearTimeout(state.loopTimeout);
    }

    // Calculate when to start the fade out (before the track ends)
    const timeUntilLoop = (audio.duration - audio.currentTime) * 1000 - CONFIG.fadeDuration;

    if (timeUntilLoop > 0) {
      state.loopTimeout = setTimeout(() => {
        if (state.currentPreviewUrl && elements.modal.style.display === 'flex') {
          fadeOut(CONFIG.fadeDuration, () => {
            // Add delay before restarting
            setTimeout(() => {
              if (state.currentPreviewUrl && elements.modal.style.display === 'flex') {
                audio.currentTime = 0;
                audio.play().then(() => {
                  fadeIn(CONFIG.fadeDuration);
                  // Setup the next loop
                  setupAudioLoop();
                }).catch(err => {
                  console.error('Error playing audio:', err);
                });
              }
            }, CONFIG.loopDelay);
          });
        }
      }, timeUntilLoop);
    }
  }    // Modal Functions
  function openModal(track) {
    state.currentTrackIndex = state.currentFilteredTracks.findIndex(t =>
      t.title === track.title && t.artist === track.artist
    );
    state.currentTrack = track;

    renderModal(track);
  }

  function renderModal(track) {
    // Only destructure what we actually use
    const { id, title, artist, cover, bpm, duration, difficulties, createdAt, lastFeatured, previewUrl, releaseYear } = track;

    elements.modal.querySelector('#modalCover').src = cover;
    elements.modal.querySelector('#modalTitle').textContent = title;
    elements.modal.querySelector('#modalArtist').textContent = artist;

    // Setup marquee for modal title and artist (same as track cards)
    requestAnimationFrame(() => {
      const modalTitle = elements.modal.querySelector('#modalTitle');
      const modalArtist = elements.modal.querySelector('#modalArtist');
      checkAndStartMarquee(modalTitle);
      checkAndStartMarquee(modalArtist);
    });

    // Add labels to modal
    const labelsContainer = elements.modal.querySelector('#modalLabels');
    labelsContainer.innerHTML = '';
    const labels = generateLabels(track, true);
    labelsContainer.appendChild(labels);

    // Update favorite button state
    const isFavorited = state.favorites.includes(id);
    if (isFavorited) {
      elements.favoriteButton.classList.add('favorited');
    } else {
      elements.favoriteButton.classList.remove('favorited');
    }

    elements.modal.querySelector('#modalDetails').innerHTML = `
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Duration</span>
          <span class="detail-value">${duration}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">BPM/Tempo</span>
          <span class="detail-value">${bpm}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Release Year</span>
          <span class="detail-value">${releaseYear}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Created</span>
          <span class="detail-value">${new Date(createdAt).toLocaleDateString()}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Last Featured</span>
          <span class="detail-value">${lastFeatured ? new Date(lastFeatured).toLocaleDateString() : 'Never'}</span>
        </div>
      </div>
    `;
    generateDifficultyBars(difficulties, elements.modal.querySelector('#modalDifficulties'));

    elements.modal.style.display = 'flex';
    elements.modal.classList.add('modal-open');
    document.body.classList.add('modal-open');

    if (previewUrl) {
      // Clear any pending loop timeout
      if (state.loopTimeout) {
        clearTimeout(state.loopTimeout);
        state.loopTimeout = null;
      }

      // Stop any existing fade
      if (state.fadeInterval) {
        clearInterval(state.fadeInterval);
        state.fadeInterval = null;
      }

      // Stop current audio immediately
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0;

      // Set new source
      audio.src = previewUrl;
      state.currentPreviewUrl = previewUrl;

      // Wait for audio to be ready before playing
      audio.load();

      // Play with proper error handling
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('Audio playing successfully');
          fadeIn(CONFIG.fadeDuration);
          setupAudioLoop();
        }).catch(err => {
          // Ignore AbortError (happens when switching tracks quickly)
          if (err.name !== 'AbortError') {
            console.error('Failed to play audio:', err);
            console.log('Preview URL:', previewUrl);
          }
        });
      }
    } else {
      console.warn('No preview URL for track:', title);
    }

    updateModalNavigation();
  }

  function toggleFavorite() {
    if (!state.currentTrack) return;

    const trackId = state.currentTrack.id;
    const index = state.favorites.indexOf(trackId);

    if (index > -1) {
      state.favorites.splice(index, 1);
      elements.favoriteButton.classList.remove('favorited');
    } else {
      state.favorites.push(trackId);
      elements.favoriteButton.classList.add('favorited');
    }

    localStorage.setItem('favoriteTracks', JSON.stringify(state.favorites));

    // Refresh if we're viewing favorites or on homepage
    if (elements.filterSelect.value === 'favorites') {
      filterTracks();
    } else if (elements.filterSelect.value === 'all' && !elements.searchInput.value) {
      // Re-render homepage to update favorites section
      renderHomepage();
    }
  }

  function updateModalNavigation() {
    const prevButton = elements.modal.querySelector('.modal-prev');
    const nextButton = elements.modal.querySelector('.modal-next');
    prevButton.style.display = state.currentTrackIndex > 0 ? 'block' : 'none';
    nextButton.style.display = state.currentTrackIndex < state.currentFilteredTracks.length - 1 ? 'block' : 'none';
  }

  function closeModal() {
    elements.modal.style.display = 'none';
    elements.modal.classList.remove('modal-open');
    document.body.classList.remove('modal-open');

    if (state.loopTimeout) {
      clearTimeout(state.loopTimeout);
      state.loopTimeout = null;
    }

    // Fade out then stop audio
    fadeOut(CONFIG.fadeDuration, () => {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
      state.currentPreviewUrl = '';
    });
  }

  function navigateModal(direction) {
    const newIndex = state.currentTrackIndex + direction;
    if (newIndex >= 0 && newIndex < state.currentFilteredTracks.length) {
      // Clear loop timeout before navigating
      if (state.loopTimeout) {
        clearTimeout(state.loopTimeout);
        state.loopTimeout = null;
      }

      state.currentTrackIndex = newIndex;
      state.currentTrack = state.currentFilteredTracks[newIndex];

      renderModal(state.currentFilteredTracks[newIndex]);
    }
  }

  // Marquee Animation
  function stopMarquee(textElement) {
    if (!textElement) return;
    textElement.classList.remove('scrolling');
    textElement.style.setProperty('--scroll-distance', '0px');
    textElement.style.setProperty('--marquee-duration', '10s');
  }

  function checkAndStartMarquee(textElement) {
    if (!textElement?.parentElement) return;

    const container = textElement.parentElement;

    // Reset animation
    stopMarquee(textElement);

    requestAnimationFrame(() => {
      const containerWidth = container.clientWidth;
      const textWidth = textElement.scrollWidth;

      // Add small buffer to prevent unnecessary scrolling
      if (textWidth > containerWidth + 5) {
        // Calculate distance needed to scroll the overflow
        const scrollDistance = textWidth - containerWidth;

        // Scale duration based on text length (35px per second)
        const baseDuration = Math.max(5, Math.min(18, scrollDistance / 35));

        // Stagger animations with random delay
        const randomDelay = Math.random() * 2;

        // Apply all styles at once
        textElement.style.cssText += `
          --scroll-distance: -${scrollDistance}px;
          --marquee-delay: ${randomDelay}s;
          --marquee-duration: ${baseDuration}s;
        `;

        // Force reflow to restart animation
        void textElement.offsetWidth;
        textElement.classList.add('scrolling');
      }
    });
  }

  // Track Rendering
  function renderTracks(tracks, clearExisting = true) {
    if (clearExisting) elements.content.innerHTML = '';

    const fragment = document.createDocumentFragment();

    tracks.forEach(track => {
      const trackElement = createTrackElement(track);
      fragment.appendChild(trackElement);
    });

    elements.content.appendChild(fragment);

    // Observe and start marquee for all newly added tracks
    requestAnimationFrame(() => {
      tracks.forEach((track, index) => {
        const trackElement = elements.content.children[clearExisting ? index : elements.content.children.length - tracks.length + index];
        if (trackElement) {
          marqueeObserver.observe(trackElement);
        }
      });
    });
  }

  function createTrackElement(track) {
    const trackElement = document.createElement('div');
    trackElement.classList.add('jam-track');

    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner';

    const img = new Image();
    img.src = track.cover;
    img.alt = `${track.title} Cover`;
    img.style.display = 'none';

    img.onload = () => {
      loadingSpinner.remove();
      img.style.display = '';
      img.classList.add('loaded');
    };

    trackElement.innerHTML = `
      <div class="track-text-content">
        <div class="marquee-container">
          <h2 class="marquee-text" translate="no">${track.title}</h2>
        </div>
        <div class="marquee-container">
          <p class="marquee-text" translate="no">${track.artist}</p>
        </div>
      </div>
    `;

    trackElement.insertBefore(loadingSpinner, trackElement.firstChild);
    trackElement.insertBefore(img, trackElement.firstChild);
    trackElement.appendChild(generateLabels(track));
    trackElement.addEventListener('click', () => openModal(track));

    return trackElement;
  }

  // Filtering and Searching
  function sanitizeInput(input) {
    // Remove HTML tags and trim whitespace
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML.trim();
  }

  function filterTracks(updateHistory = true) {
    const rawQuery = elements.searchInput.value;
    const query = sanitizeInput(rawQuery).toLowerCase();
    const filterValue = elements.filterSelect.value;

    // Update filter cache before filtering
    updateFilterCache();

    const filteredTracks = state.tracksData.filter(track => {
      const matchesSearch = track.title.toLowerCase().includes(query) ||
                track.artist.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      return applyFilter(track, filterValue);
    });

    // Sort and store filtered tracks
    state.currentFilteredTracks = sortTracks(filteredTracks, filterValue);
    updateTrackDisplay(query, filterValue, updateHistory);
  }

  // Cache time values for filter performance
  const filterTimeCache = {
    now: 0,
    oneDayAgo: 0,
    sevenDaysAgo: 0,
    favoritesSet: new Set()
  };

  function updateFilterCache() {
    const now = Date.now();
    filterTimeCache.now = now;
    filterTimeCache.oneDayAgo = now - (24 * 60 * 60 * 1000);
    filterTimeCache.sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    filterTimeCache.favoritesSet = new Set(state.favorites);
  }

  function applyFilter(track, filterValue) {
    switch (filterValue) {
      case 'featured':
        // Featured: lastFeatured within last 24 hours
        if (!track.lastFeatured) return false;
        return new Date(track.lastFeatured).getTime() >= filterTimeCache.oneDayAgo;
      case 'rotated':
        // Recently rotated: lastFeatured between 1-7 days ago (NOT in last 24 hours)
        if (!track.lastFeatured) return false;
        const lastFeaturedTime = new Date(track.lastFeatured).getTime();
        return lastFeaturedTime < filterTimeCache.oneDayAgo && lastFeaturedTime >= filterTimeCache.sevenDaysAgo;
      case 'new':
        return new Date(track.createdAt).getTime() > filterTimeCache.sevenDaysAgo;
      case 'favorites':
        return filterTimeCache.favoritesSet.has(track.id);
      default:
        return true;
    }
  }

  // Homepage Rendering
  function renderHomepage() {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;
    const oneDayAgo = now - oneDayMs;
    const sevenDaysAgo = now - sevenDaysMs;

    // Create Set for O(1) favorite lookups
    const favoritesSet = new Set(state.favorites);

    // Initialize category buckets
    const categories = {
      new: [],
      featured: [],
      rotated: [],
      favorites: [],
      other: []
    };

    // Categorize all tracks in a single pass
    state.tracksData.forEach(track => {
      const createdTime = new Date(track.createdAt).getTime();
      const lastFeaturedTime = track.lastFeatured ? new Date(track.lastFeatured).getTime() : 0;

      const isNew = createdTime > sevenDaysAgo;
      const isFeatured = lastFeaturedTime >= oneDayAgo;
      const isRotated = lastFeaturedTime < oneDayAgo && lastFeaturedTime >= sevenDaysAgo;
      const isFavorite = favoritesSet.has(track.id);

      if (isNew) categories.new.push(track);
      if (isFeatured) categories.featured.push(track);
      if (isRotated) categories.rotated.push(track);
      if (isFavorite) categories.favorites.push(track);
      if (!isNew && !isFeatured && !isRotated && !isFavorite) {
        categories.other.push(track);
      }
    });

    // Sort each category
    const newTracks = categories.new;

    const dailyRotation = categories.featured.sort((a, b) => {
      const dateA = a.lastFeatured ? new Date(a.lastFeatured).getTime() : 0;
      const dateB = b.lastFeatured ? new Date(b.lastFeatured).getTime() : 0;
      return dateB - dateA;
    });

    const rotatedOut = categories.rotated.sort((a, b) => {
      const dateA = new Date(a.lastFeatured).getTime();
      const dateB = new Date(b.lastFeatured).getTime();
      return dateB - dateA;
    });

    const favoriteTracks = categories.favorites.sort((a, b) => {
      const indexA = state.favorites.indexOf(a.id);
      const indexB = state.favorites.indexOf(b.id);
      return indexB - indexA;
    });

    const otherTracks = categories.other.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Calculate countdown
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

      if (minutesLeft === 0 && hoursLeft === 0) {
        countdownText = `${secondsLeft}s`;
      } else {
        countdownText = `${hoursLeft}h ${minutesLeft}m`;
      }
    }

    // Season countdown
    const seasonEnd = new Date('2025-11-29T08:00:00Z');
    const timeUntilSeasonEnd = seasonEnd - now;
    const daysUntilSeasonEnd = Math.floor(timeUntilSeasonEnd / (1000 * 60 * 60 * 24));
    const hoursUntilSeasonEnd = Math.floor((timeUntilSeasonEnd % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const seasonCountdownText = `${daysUntilSeasonEnd}d ${hoursUntilSeasonEnd}h`;

    elements.content.innerHTML = `
      <div class="info-section">
        <div class="track-stats">
          <div class="stat">
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
          <p class="section-description">New tracks are usually announced on Tuesday and arrive with the Thursday shop reset.</p>
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
      const limitedTracks = tracks.slice(0, limit);
      limitedTracks.forEach(track => fragment.appendChild(createTrackElement(track)));
      grid.appendChild(fragment);
    };

    if (newTracks.length > 0) populateSection('[data-section="new"]', newTracks);
    if (dailyRotation.length > 0) populateSection('[data-section="daily"]', dailyRotation);
    if (rotatedOut.length > 0) populateSection('[data-section="rotated"]', rotatedOut);
    if (favoriteTracks.length > 0) populateSection('[data-section="favorites"]', favoriteTracks);
    populateSection('[data-section="other"]', otherTracks);

    // Section header click handlers
    elements.content.querySelectorAll('.section-header').forEach(header => {
      const filterValue = header.dataset.filter;
      if (!filterValue) return;

      header.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        elements.filterSelect.value = filterValue;
        elements.searchInput.value = '';

        // Set flag to force all tracks view if clicking "Other Tracks"
        state.forceFilteredView = (filterValue === 'all');
        filterTracks();
        state.forceFilteredView = false;
      });

      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          elements.filterSelect.value = filterValue;
          elements.searchInput.value = '';

          // Set flag to force all tracks view if clicking "Other Tracks"
          state.forceFilteredView = (filterValue === 'all');
          filterTracks();
          state.forceFilteredView = false;
        }
      });
    });

    // Show All button handlers
    elements.content.querySelectorAll('.show-all-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const filterValue = btn.dataset.filter;
        elements.filterSelect.value = filterValue;
        elements.searchInput.value = '';

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Set flag to force all tracks view
        state.forceFilteredView = (filterValue === 'all');
        filterTracks();
        state.forceFilteredView = false;
      });
    });

    // Start countdown timer
    startHomepageCountdown();

    // Start marquee for all visible tracks
    requestAnimationFrame(() => {
      elements.content.querySelectorAll('.jam-track').forEach(trackElement => {
        marqueeObserver.observe(trackElement);
      });
    });
  }

  // Homepage countdown timer
  function startHomepageCountdown() {
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

      // Daily update countdown
      const nextUpdate = new Date();
      nextUpdate.setUTCDate(nextUpdate.getUTCDate() + 1);
      nextUpdate.setUTCHours(0, 0, 0, 0);

      const updateStart = new Date();
      updateStart.setUTCHours(0, 0, 0, 0);
      const updateEnd = new Date(updateStart);
      updateEnd.setUTCMinutes(2);

      if (now >= updateStart && now <= updateEnd) {
        countdownEl.textContent = 'Updating...';
      } else {
        const timeUntilUpdate = nextUpdate - now;
        const hoursLeft = Math.floor(timeUntilUpdate / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeUntilUpdate % (1000 * 60 * 60)) / (1000 * 60));
        const secondsLeft = Math.floor((timeUntilUpdate % (1000 * 60)) / 1000);

        if (minutesLeft === 0 && hoursLeft === 0) {
          countdownEl.textContent = `${secondsLeft}s`;
        } else {
          countdownEl.textContent = `${hoursLeft}h ${minutesLeft}m`;
        }
      }

      // Season countdown
      if (seasonCountdownEl) {
        const seasonEnd = new Date('2025-11-29T08:00:00Z');
        const timeUntilSeasonEnd = seasonEnd - now;
        const daysUntilSeasonEnd = Math.floor(timeUntilSeasonEnd / (1000 * 60 * 60 * 24));
        const hoursUntilSeasonEnd = Math.floor((timeUntilSeasonEnd % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        seasonCountdownEl.textContent = `${daysUntilSeasonEnd}d ${hoursUntilSeasonEnd}h`;
      }
    }, 1000);
  }

  function sortTracks(tracks, filterValue) {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    return tracks.sort((a, b) => {
      if (filterValue === 'rotated' || filterValue === 'featured') {
        return new Date(b.lastFeatured) - new Date(a.lastFeatured);
      } else if (filterValue === 'new') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else {
        // For 'all' filter, prioritize currently featured tracks
        const aIsFeatured = a.lastFeatured && new Date(a.lastFeatured).getTime() >= oneDayAgo;
        const bIsFeatured = b.lastFeatured && new Date(b.lastFeatured).getTime() >= oneDayAgo;

        if (aIsFeatured && !bIsFeatured) return -1;
        if (!aIsFeatured && bIsFeatured) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  }

  function updateTrackDisplay(query, filterValue, updateHistory = true) {
    // Clear any existing scroll handler
    if (state.infiniteScrollHandler) {
      window.removeEventListener('scroll', state.infiniteScrollHandler);
      state.infiniteScrollHandler = null;
    }

    state.loadedTracks = 0;

    // Scroll to top when displaying new results
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Show homepage when no filter/search (unless forced to show filtered view)
    if (!query && filterValue === 'all' && !state.forceFilteredView) {
      renderHomepage();
    } else {
      // Show filtered results
      const resultText = query
        ? `Search results for "${query}"`
        : filterValue === 'featured' ? 'Featured Tracks'
        : filterValue === 'rotated' ? 'Recently Rotated'
        : filterValue === 'new' ? 'New Tracks'
        : filterValue === 'favorites' ? 'Your Favorites'
        : 'All Tracks';

      elements.content.innerHTML = `
        <div class="page-header">
          <h1>${resultText}</h1>
          <p class="track-count">${state.currentFilteredTracks.length} tracks</p>
        </div>
        <div class="tracks-grid"></div>
      `;

      const grid = elements.content.querySelector('.tracks-grid');
      const tracksToShow = state.currentFilteredTracks.slice(0, CONFIG.initialLoad);
      tracksToShow.forEach(track => {
        grid.appendChild(createTrackElement(track));
      });

      // Start marquee for loaded tracks
      requestAnimationFrame(() => {
        grid.querySelectorAll('.jam-track').forEach(trackElement => {
          marqueeObserver.observe(trackElement);
        });
      });

      // Set loaded tracks count
      state.loadedTracks = Math.min(CONFIG.initialLoad, state.currentFilteredTracks.length);

      if (state.currentFilteredTracks.length > CONFIG.initialLoad) {
        setupInfiniteScroll(state.currentFilteredTracks, grid);
      }
    }

    // Update URL with search and filter parameters
    if (updateHistory) {
      updateURL(query, filterValue);
    }
  }

  function updateURL(query, filterValue) {
    const url = new URL(window.location);

    if (query) url.searchParams.set('q', query);
    else url.searchParams.delete('q');

    if (filterValue && filterValue !== 'all') url.searchParams.set('filter', filterValue);
    else url.searchParams.delete('filter');

    window.history.replaceState({ query, filterValue }, '', url);
  }

  // Infinite Scroll
  function setupInfiniteScroll(tracks, container) {
    let isLoading = false;

    const loadMoreTracks = () => {
      if (isLoading || state.loadedTracks >= tracks.length) return;

      const scrollPosition = window.scrollY + window.innerHeight;
      const containerBottom = container.offsetTop + container.offsetHeight;
      const distanceFromBottom = containerBottom - scrollPosition;

      // Load more when within 800px of the bottom
      if (distanceFromBottom < 800) {
        isLoading = true;

        const nextBatch = tracks.slice(state.loadedTracks, state.loadedTracks + CONFIG.tracksPerPage);

        nextBatch.forEach(track => {
          container.appendChild(createTrackElement(track));
        });

        state.loadedTracks += CONFIG.tracksPerPage;

        // Start marquee for newly added tracks
        requestAnimationFrame(() => {
          const startIndex = container.children.length - nextBatch.length;
          for (let i = startIndex; i < container.children.length; i++) {
            const trackElement = container.children[i];
            if (trackElement.classList.contains('jam-track')) {
              marqueeObserver.observe(trackElement);
            }
          }
        });

        isLoading = false;

        // Check again in case we need to load more
        setTimeout(() => loadMoreTracks(), 100);
      }
    };

    // Store the scroll handler so we can remove it later
    state.infiniteScrollHandler = loadMoreTracks;
    window.addEventListener('scroll', loadMoreTracks, { passive: true });

    // Initial check in case content doesn't fill the screen
    setTimeout(() => loadMoreTracks(), 100);
  }

  // Helper Functions
  function generateDifficultyBars(difficulties, container) {
    container.innerHTML = '';
    const maxBars = 7;

    // Helper function to convert instrument key to display name
    function getInstrumentDisplayName(key) {
      // Handle plastic/pro instruments
      if (key.startsWith('plastic')) {
        const baseInstrument = key.replace(/^plastic-?/i, '');
        const capitalizedBase = baseInstrument.charAt(0).toUpperCase() + baseInstrument.slice(1);

        if (capitalizedBase === 'Guitar') {
          return 'Pro Lead';
        }

        return `Pro ${capitalizedBase}`;
      }

      if (key === 'guitar') {
        return 'Lead';
      }

      return key.charAt(0).toUpperCase() + key.slice(1);
    }

    // Separate regular and pro instruments, then interleave for 2-column layout
    const regular = [];
    const pro = [];

    Object.entries(difficulties).forEach(([key, level]) => {
      (key.startsWith('plastic') ? pro : regular).push([key, level]);
    });

    // Sort by instrument type: vocals, guitar, bass, drums
    const getInstrumentType = (key) => key.replace(/^plastic/, '').toLowerCase();
    const order = { vocals: 0, guitar: 1, bass: 2, drums: 3 };
    const sortByType = (a, b) => (order[getInstrumentType(a[0])] ?? 999) - (order[getInstrumentType(b[0])] ?? 999);

    regular.sort(sortByType);
    pro.sort(sortByType);

    // Interleave: regular[0], pro[0], regular[1], pro[1], ...
    const sortedEntries = [];
    for (let i = 0; i < Math.max(regular.length, pro.length); i++) {
      if (regular[i]) sortedEntries.push(regular[i]);
      if (pro[i]) sortedEntries.push(pro[i]);
    }

    sortedEntries.forEach(([instrument, level]) => {
      const difficultyElement = document.createElement('div');
      difficultyElement.classList.add('difficulty');

      const barsHTML = Array.from({ length: maxBars }, (_, i) =>
        `<div class="difficulty-bar"><span class="${i <= level ? 'active' : ''}"></span></div>`
      ).join('');

      const instrumentName = getInstrumentDisplayName(instrument);

      difficultyElement.innerHTML = `
        <div class="instrument-name">${instrumentName}</div>
        <div class="difficulty-bars">${barsHTML}</div>
      `;

      container.appendChild(difficultyElement);
    });
  }

  function generateLabels(track, isModal = false) {
    const labelContainer = document.createElement('div');
    labelContainer.classList.add('label-container');

    const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
    const isNew = Date.now() - new Date(track.createdAt) < sevenDaysInMillis;

    if (isNew) {
      const newLabel = document.createElement('span');
      newLabel.classList.add('new-label');
      if (isModal) {
        newLabel.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.56.56 0 0 0-.163-.505L1.71 6.745l4.052-.576a.53.53 0 0 0 .393-.288L8 2.223l1.847 3.658a.53.53 0 0 0 .393.288l4.052.575-2.906 2.77a.56.56 0 0 0-.163.506l.694 3.957-3.686-1.894a.5.5 0 0 0-.461 0z"/>
          </svg>
          <span class="label-text">New</span>
        `;
      } else {
        newLabel.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.56.56 0 0 0-.163-.505L1.71 6.745l4.052-.576a.53.53 0 0 0 .393-.288L8 2.223l1.847 3.658a.53.53 0 0 0 .393.288l4.052.575-2.906 2.77a.56.56 0 0 0-.163.506l.694 3.957-3.686-1.894a.5.5 0 0 0-.461 0z"/>
          </svg>
        `;
      }
      labelContainer.appendChild(newLabel);
    }

    // Check if track is currently featured (lastFeatured within last 24 hours)
    const isFeaturedNow = track.lastFeatured &&
      (Date.now() - new Date(track.lastFeatured).getTime()) < 24 * 60 * 60 * 1000;

    if (isFeaturedNow) {
      const featuredLabel = document.createElement('span');
      featuredLabel.classList.add('featured-label');
      if (isModal) {
        featuredLabel.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
          </svg>
          <span class="label-text">Featured</span>
        `;
      } else {
        featuredLabel.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
          </svg>
        `;
      }
      labelContainer.appendChild(featuredLabel);
    }

    if (state.favorites.includes(track.id)) {
      const favoriteLabel = document.createElement('span');
      favoriteLabel.classList.add('favorite-label');
      if (isModal) {
        favoriteLabel.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/>
          </svg>
          <span class="label-text">Favorite</span>
        `;
      } else {
        favoriteLabel.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/>
          </svg>
        `;
      }
      labelContainer.appendChild(favoriteLabel);
    }

    return labelContainer;
  }

  // Data Loading
  function loadTracks() {
    // Show loading spinner
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

    fetch(`data/jam_tracks.json?v=${cacheTimestamp}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Convert object to array and add ID to each track
        state.tracksData = Object.entries(data).map(([id, track]) => ({
          ...track,
          id
        }));
        initializeFromURL();
        filterTracks();
      })
      .catch(error => {
        console.error('Error loading tracks:', error);
        elements.content.innerHTML = `
          <div class="error-container">
            <h2>Failed to load tracks</h2>
            <p>${error.message}</p>
            <button onclick="location.reload()">Retry</button>
          </div>
        `;
      });
  }

  function initializeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    const filterValue = urlParams.get('filter');

    if (searchQuery) elements.searchInput.value = searchQuery;
    if (filterValue) elements.filterSelect.value = filterValue;
  }

  // Handle browser back/forward navigation
  window.addEventListener('popstate', (event) => {
    // If modal is open, close it and don't change the underlying page
    if (elements.modal.classList.contains('modal-open')) {
      closeModal();
      return;
    }

    // Otherwise, restore the search/filter state from URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q') || '';
    const filterValue = urlParams.get('filter') || 'all';

    // Update form inputs
    elements.searchInput.value = searchQuery;
    elements.filterSelect.value = filterValue;

    // Trigger filter without updating history (we're already handling popstate)
    filterTracks(false);
  });

  // Countdown Timer
  // Countdown is now integrated into homepage rendering
  // No standalone countdown function needed

  // Event Listeners
  function initializeEventListeners() {
    // Audio events
    audio.addEventListener('loadedmetadata', () => {
      if (elements.modal.style.display === 'flex' && state.currentPreviewUrl) {
        setupAudioLoop();
      }
    });

    audio.addEventListener('timeupdate', () => {
      // Re-setup loop if it's been cleared or if time changed significantly
      if (!state.loopTimeout && elements.modal.style.display === 'flex' && state.currentPreviewUrl) {
        setupAudioLoop();
      }
    });

    // Modal events
    elements.modal.addEventListener('click', (e) => {
      if (e.target === elements.modal) closeModal();
    });

    elements.modal.querySelector('.modal-close').addEventListener('click', closeModal);
    elements.modal.querySelector('.modal-prev').addEventListener('click', () => navigateModal(-1));
    elements.modal.querySelector('.modal-next').addEventListener('click', () => navigateModal(1));

    // Favorite button
    elements.favoriteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite();
    });

    // Header events
    elements.logo.addEventListener('click', () => {
      elements.searchInput.value = '';
      elements.filterSelect.value = 'all';
      filterTracks();
    });

    elements.randomButton.addEventListener('click', () => {
      if (state.tracksData.length > 0) {
        const randomIndex = Math.floor(Math.random() * state.tracksData.length);
        const randomTrack = state.tracksData[randomIndex];

        // Set current filtered tracks to all tracks for navigation to work
        if (state.currentFilteredTracks.length === 0) {
          state.currentFilteredTracks = [...state.tracksData];
        }

        openModal(randomTrack);
      }
    });

    elements.searchInput.addEventListener('input', filterTracks);
    elements.filterSelect.addEventListener('change', filterTracks);
    elements.muteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMute();
    });

    // Keyboard events
    document.addEventListener('keydown', (e) => {
      // Prevent hotkeys when typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (elements.modal.style.display === 'flex') {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            navigateModal(-1);
            break;
          case 'ArrowRight':
            e.preventDefault();
            navigateModal(1);
            break;
          case 'Escape':
            closeModal();
            break;
          case 'f':
          case 'F':
            e.preventDefault();
            toggleFavorite();
            break;
          case 'm':
          case 'M':
            e.preventDefault();
            toggleMute();
            break;
        }
      } else {
        // Global hotkeys (when modal is closed)
        switch (e.key) {
          case 'm':
          case 'M':
            e.preventDefault();
            toggleMute();
            break;
        }
      }
    });

    // Window resize with debouncing
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // Recalculate all visible marquees
        document.querySelectorAll('.jam-track').forEach(track => {
          track.querySelectorAll('.marquee-text').forEach(marquee => {
            stopMarquee(marquee);
            checkAndStartMarquee(marquee);
          });
        });
      }, CONFIG.resizeDebounceDelay);
    });
  }
});
