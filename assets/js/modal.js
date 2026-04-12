import { state, CONFIG } from './state.js';
import { audio, fadeIn, fadeOut, setupAudioLoop } from './audio.js';
import { checkAndStartMarquee } from './marquee.js';

// Callbacks injected at init to avoid circular imports
let _generateDifficultyBars;
let _generateLabels;
let _filterTracks;
let _renderHomepage;

export function initModal({ generateDifficultyBars, generateLabels, filterTracks, renderHomepage }) {
  _generateDifficultyBars = generateDifficultyBars;
  _generateLabels = generateLabels;
  _filterTracks = filterTracks;
  _renderHomepage = renderHomepage;
}

export function openModal(track, elements) {
  if (state.currentDisplayedTracks.length === 0) {
    state.currentDisplayedTracks = [track];
  }

  state.currentTrackIndex = state.currentDisplayedTracks.findIndex(t =>
    t.title === track.title && t.artist === track.artist
  );

  if (state.currentTrackIndex === -1) {
    state.currentDisplayedTracks = [track];
    state.currentTrackIndex = 0;
  }

  state.currentTrack = track;
  renderModal(track, elements);
}

export function renderModal(track, elements) {
  const { id, title, artist, cover, bpm, duration, difficulties, createdAt, lastFeatured, previewUrl, releaseYear } = track;

  elements.modal.querySelector('#modalCover').src = cover;
  elements.modal.querySelector('#modalTitle').textContent = title;
  elements.modal.querySelector('#modalArtist').textContent = artist;

  requestAnimationFrame(() => {
    checkAndStartMarquee(elements.modal.querySelector('#modalTitle'));
    checkAndStartMarquee(elements.modal.querySelector('#modalArtist'));
  });

  const labelsContainer = elements.modal.querySelector('#modalLabels');
  labelsContainer.innerHTML = '';
  labelsContainer.appendChild(_generateLabels(track, true));

  const isFavorited = state.favorites.includes(id);
  elements.favoriteButton.classList.toggle('favorited', isFavorited);

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

  _generateDifficultyBars(difficulties, elements.modal.querySelector('#modalDifficulties'));

  elements.modal.style.display = 'flex';
  elements.modal.classList.add('modal-open');
  document.body.classList.add('modal-open');

  if (previewUrl) {
    if (state.loopTimeout) {
      clearTimeout(state.loopTimeout);
      state.loopTimeout = null;
    }

    if (state.fadeInterval) {
      clearInterval(state.fadeInterval);
      state.fadeInterval = null;
    }

    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0;
    audio.src = previewUrl;
    state.currentPreviewUrl = previewUrl;
    audio.load();

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        fadeIn(CONFIG.fadeDuration);
        setupAudioLoop(elements.modal);
      }).catch(err => {
        // Ignore AbortError (happens when switching tracks quickly)
        if (err.name !== 'AbortError') {
          console.error('Failed to play audio:', err);
        }
      });
    }
  }

  updateModalNavigation(elements.modal);
}

export function toggleFavorite(elements) {
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

  if (elements.filterSelect.value === 'favorites') {
    _filterTracks();
  } else if (elements.filterSelect.value === 'all' && !elements.searchInput.value) {
    _renderHomepage();
  }
}

export function updateModalNavigation(modal) {
  const prevButton = modal.querySelector('.modal-prev');
  const nextButton = modal.querySelector('.modal-next');

  const hasTracks = state.currentDisplayedTracks?.length > 0;
  const validIndex = state.currentTrackIndex >= 0 && state.currentTrackIndex < state.currentDisplayedTracks.length;

  if (!hasTracks || !validIndex) {
    prevButton.style.display = 'none';
    nextButton.style.display = 'none';
    return;
  }

  prevButton.style.display = state.currentTrackIndex > 0 ? 'block' : 'none';
  nextButton.style.display = state.currentTrackIndex < state.currentDisplayedTracks.length - 1 ? 'block' : 'none';
}

export function closeModal(elements) {
  elements.modal.style.display = 'none';
  elements.modal.classList.remove('modal-open');
  document.body.classList.remove('modal-open');

  if (state.loopTimeout) {
    clearTimeout(state.loopTimeout);
    state.loopTimeout = null;
  }

  fadeOut(CONFIG.fadeDuration, () => {
    audio.pause();
    audio.currentTime = 0;
    audio.src = '';
    state.currentPreviewUrl = '';
  });
}

export function navigateModal(direction, elements) {
  if (!state.currentDisplayedTracks?.length) return;

  const newIndex = state.currentTrackIndex + direction;
  if (newIndex < 0 || newIndex >= state.currentDisplayedTracks.length) return;

  if (state.loopTimeout) {
    clearTimeout(state.loopTimeout);
    state.loopTimeout = null;
  }
  if (state.fadeInterval) {
    clearInterval(state.fadeInterval);
    state.fadeInterval = null;
  }

  audio.pause();
  audio.currentTime = 0;
  audio.volume = 0;

  state.currentTrackIndex = newIndex;
  state.currentTrack = state.currentDisplayedTracks[newIndex];
  renderModal(state.currentDisplayedTracks[newIndex], elements);
}
