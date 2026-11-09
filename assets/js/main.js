import { elements, state, CONFIG } from './state.js';
import { audio, updateMuteIcons, toggleMute, setupAudioLoop } from './audio.js';
import { stopMarquee, checkAndStartMarquee } from './marquee.js';
import { initModal, openModal, closeModal, navigateModal, toggleFavorite } from './modal.js';
import { updateFilterCache, applyFilter, sortTracks } from './filter.js';
import { initRender, generateDifficultyBars, generateLabels } from './render.js';
import { initUI, renderHomepage, updateTrackDisplay, updateURL } from './ui.js';
import { updateDropdown } from './dropdown.js';
import { renderTrackSkeleton } from './skeleton.js';
import { loadTracks, initializeFromURL, loadFestivalBackdrop } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
  if (state.isMuted) {
    audio.volume = 0;
  }

  let lastSearchInput = null;
  const reloadTracks = () => {
    renderTrackSkeleton(elements);
    loadTracks(elements, () => filterTracks(false));
  };

  function filterTracks(updateHistory = true, isSearchInput = false) {
    const rawQuery = elements.searchInput.value;
    const query = rawQuery.trim();
    const normalizedQuery = query.toLowerCase();
    const filterValue = elements.filterSelect.value;
    updateDropdown(elements.filterSelect);

    updateFilterCache();

    state.currentFilteredTracks = sortTracks(
      state.tracksData.filter(track => {
        const matchesSearch =
          track.title.toLowerCase().includes(normalizedQuery) ||
          track.artist.toLowerCase().includes(normalizedQuery);
        return matchesSearch && applyFilter(track, filterValue);
      }),
      filterValue
    );

    if (updateHistory) {
      const now = Date.now();
      const replace = isSearchInput && lastSearchInput !== null && now - lastSearchInput < 500;
      const changedURL = updateURL(query, filterValue, replace);
      if (!isSearchInput) lastSearchInput = null;
      else if (changedURL || replace) lastSearchInput = now;
    }

    if (state.isLoadingTracks) {
      renderTrackSkeleton(elements);
    } else {
      updateTrackDisplay(query, filterValue, elements);
    }
  }

  initModal({ generateDifficultyBars, generateLabels, filterTracks, renderHomepage: () => renderHomepage(elements) });
  initRender({ openModal: (track) => openModal(track, elements), filterTracks });
  initUI({ filterTracks, loadTracks: reloadTracks });
  initializeFromURL(elements);
  updateDropdown(elements.filterSelect);
  reloadTracks();
  loadFestivalBackdrop(document.querySelector('.festival-backdrop'));
  initializeEventListeners();
  updateMuteIcons();

  window.addEventListener('popstate', () => {
    document.querySelector('.season-dialog[open]')?.close();
    lastSearchInput = null;
    document.getElementById('coverLightbox').classList.remove('open');
    if (elements.modal.classList.contains('modal-open')) {
      closeModal(elements);
    }
    initializeFromURL(elements);
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

    for (const dialog of document.querySelectorAll('.season-dialog')) {
      dialog.addEventListener('click', event => {
        if (event.target === dialog) dialog.close();
      });
    }

    elements.modal.addEventListener('click', (e) => {
      if (e.target === elements.modal) closeModal(elements);
    });

    elements.modal.addEventListener('cancel', event => {
      event.preventDefault();
      closeModal(elements);
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

    elements.searchInput.addEventListener('input', () => filterTracks(true, true));
    elements.filterSelect.addEventListener('change', () => {
      state.inFilteredView = true;
      filterTracks();
    });
    for (const button of document.querySelectorAll('[data-mute-button]')) {
      button.addEventListener('click', event => {
        toggleMute();
        if (event.detail > 0) button.blur();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (!elements.modal.open && document.querySelector('.season-dialog[open]')) return;

      const lightbox = document.getElementById('coverLightbox');
      if (lightbox.classList.contains('open')) {
        if (e.key === 'Escape') {
          e.preventDefault();
          lightbox.classList.remove('open');
        }
        return;
      }

      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (elements.modal.style.display === 'flex') {
        switch (e.key) {
          case 'ArrowLeft':  e.preventDefault(); navigateModal(-1, elements); break;
          case 'ArrowRight': e.preventDefault(); navigateModal(1, elements);  break;
          case 'Escape':     e.preventDefault(); closeModal(elements);          break;
          case 'f': case 'F': e.preventDefault(); toggleFavorite(elements);   break;
          case 'm': case 'M': e.preventDefault(); toggleMute(); break;
        }
      } else {
        if (e.key === 'm' || e.key === 'M') {
          e.preventDefault();
          toggleMute();
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
