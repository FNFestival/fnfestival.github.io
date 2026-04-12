export const elements = {
  modal: document.getElementById('trackModal'),
  searchInput: document.getElementById('searchInput'),
  content: document.querySelector('.content'),
  logo: document.getElementById('logo'),
  muteButton: document.getElementById('muteButton'),
  favoriteButton: document.getElementById('favoriteButton'),
  filterSelect: document.getElementById('filterSelect'),
  randomButton: document.getElementById('randomButton')
};

export const state = {
  tracksData: [],
  loadedTracks: 0,
  currentTrackIndex: -1,
  currentFilteredTracks: [],
  currentDisplayedTracks: [],
  isMuted: localStorage.getItem('isMuted') === 'true',
  sawUpdateMessage: false,
  currentPreviewUrl: '',
  currentTrack: null,
  favorites: JSON.parse(localStorage.getItem('favoriteTracks') || '[]'),
  loopTimeout: null,
  countdownInterval: null,
  fadeInterval: null,
  infiniteScrollHandler: null,
  infiniteScrollEl: null,
  inFilteredView: false,
  seasonEnd: null,
  historyTimeout: null,
  wasUpdating: false,
  viewMode: localStorage.getItem('viewMode') || 'compact',
  difficultySortOrder: localStorage.getItem('difficultySortOrder') || 'none',
  difficultyFilterInstrument: localStorage.getItem('difficultyFilterInstrument') || 'all',
  tableSortColumn: null,
  tableSortDir: 'asc'
};

export const CONFIG = {
  tracksPerPage: 20,
  initialLoad: 40,
  audioVolume: 0.2,
  marqueeObserverMargin: '100px',
  resizeDebounceDelay: 250,
  marqueeCheckDelay: 150,
  loopDelay: 3000,
  fadeDuration: 500
};

export const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const MS_PER_WEEK = 7 * MS_PER_DAY;
