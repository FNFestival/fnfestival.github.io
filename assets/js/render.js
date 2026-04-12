import { state, CONFIG, MS_PER_WEEK } from './state.js';
import { marqueeObserver, checkAndStartMarquee } from './marquee.js';
import { isFeaturedToday, normalizeInstrumentKey } from './filter.js';

// Callbacks injected at init to avoid circular imports
let _openModal;
let _filterTracks;

export function initRender({ openModal, filterTracks }) {
  _openModal = openModal;
  _filterTracks = filterTracks;
}

export function generateLabels(track, isModal = false) {
  const labelContainer = document.createElement('div');
  labelContainer.classList.add('label-container');

  const isNew = Date.now() - new Date(track.createdAt) < MS_PER_WEEK;

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

  if (isFeaturedToday(track)) {
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

export function generateDifficultyBars(difficulties, container, filterInstrument = null) {
  container.innerHTML = '';
  const maxBars = 7;

  function getInstrumentDisplayName(key) {
    if (key === 'plasticVocals') return 'Pro Vocals';
    if (key.startsWith('plastic')) {
      const base = key.replace(/^plastic-?/i, '');
      const capitalized = base.charAt(0).toUpperCase() + base.slice(1);
      return capitalized === 'Guitar' ? 'Pro Lead' : `Pro ${capitalized}`;
    }
    return key === 'guitar' ? 'Lead' : key.charAt(0).toUpperCase() + key.slice(1);
  }

  // Separate regular and pro instruments, then interleave for 2-column layout
  const regular = [];
  const pro = [];
  Object.entries(difficulties).forEach(([key, level]) => {
    (key.startsWith('plastic') ? pro : regular).push([key, level]);
  });

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

    if (filterInstrument && filterInstrument !== 'all' && instrument === normalizeInstrumentKey(filterInstrument)) {
      difficultyElement.classList.add('difficulty-highlight');
    }

    const barsHTML = Array.from({ length: maxBars }, (_, i) =>
      `<div class="difficulty-bar"><span class="${i <= level ? 'active' : ''}"></span></div>`
    ).join('');

    difficultyElement.innerHTML = `
      <div class="instrument-name">${getInstrumentDisplayName(instrument)}</div>
      <div class="difficulty-bars">${barsHTML}</div>
    `;

    container.appendChild(difficultyElement);
  });
}

export function createTrackElement(track, viewMode = state.viewMode) {
  const trackElement = document.createElement('div');
  trackElement.classList.add('jam-track');
  if (viewMode === 'detailed') {
    trackElement.classList.add('jam-track-detailed');
  }

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

  let trackContentHTML = `
    <div class="track-text-content">
      <div class="marquee-container">
        <h2 class="marquee-text" translate="no">${track.title}</h2>
      </div>
      <div class="marquee-container">
        <p class="marquee-text" translate="no">${track.artist}</p>
      </div>
    </div>
  `;
  if (viewMode === 'detailed') {
    trackContentHTML += `<div class="track-difficulties"></div>`;
  }

  trackElement.innerHTML = trackContentHTML;
  trackElement.insertBefore(loadingSpinner, trackElement.firstChild);
  trackElement.insertBefore(img, trackElement.firstChild);

  const textContent = trackElement.querySelector('.track-text-content');
  if (textContent) {
    textContent.appendChild(generateLabels(track));
  }

  if (viewMode === 'detailed') {
    const difficultiesContainer = trackElement.querySelector('.track-difficulties');
    const instrumentFilter = state.difficultyFilterInstrument !== 'all' ? state.difficultyFilterInstrument : null;
    generateDifficultyBars(track.difficulties, difficultiesContainer, instrumentFilter);
  }

  trackElement.addEventListener('click', () => _openModal(track));
  return trackElement;
}

export function createTableRow(track) {
  const tr = document.createElement('tr');
  tr.classList.add('jam-track-row');

  const tdCover = document.createElement('td');
  tdCover.className = 'td-cover';
  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  const img = new Image();
  img.src = track.cover;
  img.alt = '';
  img.style.display = 'none';
  img.onload = () => { spinner.remove(); img.style.display = ''; img.classList.add('loaded'); };
  tdCover.appendChild(spinner);
  tdCover.appendChild(img);
  tr.appendChild(tdCover);

  const tdTitle = document.createElement('td');
  tdTitle.className = 'td-title';
  tdTitle.innerHTML = `
    <div class="marquee-container"><span class="marquee-text" translate="no">${track.title}</span></div>
    <div class="marquee-container"><span class="marquee-text td-artist" translate="no">${track.artist}</span></div>
  `;
  tr.appendChild(tdTitle);

  const d = track.difficulties || {};
  const dv = (v) => v != null ? v : '–';
  [
    ['td-num', track.bpm, null],
    ['td-num', track.duration, null],
    ['td-diff', dv(d.vocals), 'vocals'],
    ['td-diff', dv(d.guitar), 'guitar'],
    ['td-diff', dv(d.bass), 'bass'],
    ['td-diff', dv(d.drums), 'drums'],
    ['td-diff', dv(d.plasticVocals), 'plasticVocals'],
    ['td-diff', dv(d.plasticGuitar), 'plasticGuitar'],
    ['td-diff', dv(d.plasticBass), 'plasticBass'],
    ['td-diff', dv(d.plasticDrums), 'plasticDrums']
  ].forEach(([cls, val, col]) => {
    const td = document.createElement('td');
    td.className = cls;
    if (col) td.dataset.col = col;
    td.textContent = val;
    tr.appendChild(td);
  });

  tr.addEventListener('click', () => _openModal(track));
  return tr;
}

export function buildTableHTML() {
  return `
    <div class="tracks-table-wrapper">
      <table class="tracks-table">
        <thead>
          <tr>
            <th class="th-cover"></th>
            <th class="th-title th-sortable" data-sort="title">Track <span class="sort-indicator"></span></th>
            <th class="th-num th-sortable" data-sort="bpm">BPM <span class="sort-indicator"></span></th>
            <th class="th-num th-sortable" data-sort="duration">Dur <span class="sort-indicator"></span></th>
            <th class="th-diff th-sortable" data-sort="vocals" data-col="vocals" title="Vocals">Vcl <span class="sort-indicator"></span></th>
            <th class="th-diff th-sortable" data-sort="guitar" data-col="guitar" title="Lead">Ld <span class="sort-indicator"></span></th>
            <th class="th-diff th-sortable" data-sort="bass" data-col="bass" title="Bass">Bs <span class="sort-indicator"></span></th>
            <th class="th-diff th-sortable" data-sort="drums" data-col="drums" title="Drums">Dr <span class="sort-indicator"></span></th>
            <th class="th-diff th-sortable" data-sort="plasticVocals" data-col="plasticVocals" title="Pro Vocals">P.Vc <span class="sort-indicator"></span></th>
            <th class="th-diff th-sortable" data-sort="plasticGuitar" data-col="plasticGuitar" title="Pro Lead">P.Ld <span class="sort-indicator"></span></th>
            <th class="th-diff th-sortable" data-sort="plasticBass" data-col="plasticBass" title="Pro Bass">P.Bs <span class="sort-indicator"></span></th>
            <th class="th-diff th-sortable" data-sort="plasticDrums" data-col="plasticDrums" title="Pro Drums">P.Dr <span class="sort-indicator"></span></th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `;
}

export function applyTableColumnVisibility(scope, instrument) {
  const diffCols = ['vocals', 'guitar', 'bass', 'drums', 'plasticVocals', 'plasticGuitar', 'plasticBass', 'plasticDrums'];
  const selected = instrument !== 'all' ? normalizeInstrumentKey(instrument) : null;
  diffCols.forEach(col => {
    const show = !selected || col === selected;
    scope.querySelectorAll(`[data-col="${col}"]`).forEach(el => {
      el.style.display = show ? '' : 'none';
    });
  });
}

export function renderTracks(tracks, content, clearExisting = true) {
  if (clearExisting) content.innerHTML = '';

  const fragment = document.createDocumentFragment();
  tracks.forEach(track => fragment.appendChild(createTrackElement(track)));
  content.appendChild(fragment);

  requestAnimationFrame(() => {
    tracks.forEach((track, index) => {
      const trackElement = content.children[clearExisting ? index : content.children.length - tracks.length + index];
      if (trackElement) marqueeObserver.observe(trackElement);
    });
  });
}
