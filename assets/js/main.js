import { elements, state, CONFIG } from './state.js';
import { audio, updateMuteIcon, toggleMute, setupAudioLoop } from './audio.js';
import { stopMarquee, checkAndStartMarquee } from './marquee.js';
import { initModal, openModal, closeModal, navigateModal, toggleFavorite } from './modal.js';
import { updateFilterCache, applyFilter, sanitizeInput, sortTracks } from './filter.js';
import { initRender, generateDifficultyBars, generateLabels } from './render.js';
import { initUI, renderHomepage, updateTrackDisplay } from './ui.js';
import { initData, loadTracks, initializeFromURL } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
  if (state.isMuted) {
    audio.volume = 0;
  }

  function filterTracks(updateHistory = true) {
    const rawQuery = elements.searchInput.value;
    const query = sanitizeInput(rawQuery).toLowerCase();
    const filterValue = elements.filterSelect.value;

    updateFilterCache();

    state.currentFilteredTracks = sortTracks(
      state.tracksData.filter(track => {
        const matchesSearch =
          track.title.toLowerCase().includes(query) ||
          track.artist.toLowerCase().includes(query);
        return matchesSearch && applyFilter(track, filterValue);
      }),
      filterValue
    );

    updateTrackDisplay(query, filterValue, elements, updateHistory);
  }

  initModal({ generateDifficultyBars, generateLabels, filterTracks, renderHomepage: () => renderHomepage(elements) });
  initRender({ openModal: (track) => openModal(track, elements), filterTracks });
  initUI({ filterTracks, loadTracks: () => loadTracks(elements) });
  initData({ initializeFromURL: () => initializeFromURL(elements), filterTracks, renderHomepage: () => renderHomepage(elements) });

  loadTracks(elements);
  initializeEventListeners();
  updateMuteIcon(elements.muteButton);

  window.addEventListener('popstate', () => {
    if (elements.modal.classList.contains('modal-open')) {
      closeModal(elements);
      return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    elements.searchInput.value = urlParams.get('q') || '';
    elements.filterSelect.value = urlParams.get('filter') || 'all';
    filterTracks(false);
  });

  function initializeEventListeners() {
    audio.addEventListener('loadedmetadata', () => {
      if (elements.modal.style.display === 'flex' && state.currentPreviewUrl) {
        setupAudioLoop(elements.modal);
      }
    });

    audio.addEventListener('timeupdate', () => {
      if (!state.loopTimeout && elements.modal.style.display === 'flex' && state.currentPreviewUrl) {
        setupAudioLoop(elements.modal);
      }
    });

    elements.modal.addEventListener('click', (e) => {
      if (e.target === elements.modal) closeModal(elements);
    });

    elements.modal.querySelector('.modal-close').addEventListener('click', () => closeModal(elements));
    elements.modal.querySelector('.modal-prev').addEventListener('click', () => navigateModal(-1, elements));
    elements.modal.querySelector('.modal-next').addEventListener('click', () => navigateModal(1, elements));

    document.getElementById('modalCover').addEventListener('click', (e) => {
      e.stopPropagation();
      if (!state.currentTrack) return;
      document.getElementById('lightboxImage').src = state.currentTrack.cover;
      document.getElementById('coverLightbox').classList.add('open');
    });

    document.getElementById('coverLightbox').addEventListener('click', () => {
      document.getElementById('coverLightbox').classList.remove('open');
    });

    elements.favoriteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(elements);
    });

    elements.logo.addEventListener('click', () => {
      elements.searchInput.value = '';
      elements.filterSelect.value = 'all';
      state.inFilteredView = false;
      filterTracks();
    });

    elements.randomButton.addEventListener('click', () => {
      if (state.tracksData.length > 0) {
        const randomTrack = state.tracksData[Math.floor(Math.random() * state.tracksData.length)];
        if (state.currentFilteredTracks.length === 0) {
          state.currentFilteredTracks = [...state.tracksData];
        }
        openModal(randomTrack, elements);
      }
    });

    elements.searchInput.addEventListener('input', filterTracks);
    elements.filterSelect.addEventListener('change', filterTracks);
    elements.muteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMute(elements.muteButton);
    });

    document.addEventListener('keydown', (e) => {
      const lightbox = document.getElementById('coverLightbox');
      if (lightbox.classList.contains('open')) {
        if (e.key === 'Escape') lightbox.classList.remove('open');
        return;
      }

      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (elements.modal.style.display === 'flex') {
        switch (e.key) {
          case 'ArrowLeft':  e.preventDefault(); navigateModal(-1, elements); break;
          case 'ArrowRight': e.preventDefault(); navigateModal(1, elements);  break;
          case 'Escape':     closeModal(elements);                             break;
          case 'f': case 'F': e.preventDefault(); toggleFavorite(elements);   break;
          case 'm': case 'M': e.preventDefault(); toggleMute(elements.muteButton); break;
        }
      } else {
        if (e.key === 'm' || e.key === 'M') {
          e.preventDefault();
          toggleMute(elements.muteButton);
        }
      }
    });

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
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