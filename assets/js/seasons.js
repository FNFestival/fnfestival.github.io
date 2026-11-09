import { elements, state, MS_PER_DAY } from './state.js';
import { openModal } from './modal.js';

// Calendar dates and first-release Jam Tracks for each season's headliner.
const seasons = [
  {
    number: 15,
    headliner: "Lil Tecca",
    start: '2026-07-30',
    end: '2026-11-12',
    tracks: ["Ransom", "Dark Thoughts", "Love Me", "500lbs"]
  },
  {
    number: 14,
    headliner: "Laufey",
    start: '2026-04-16',
    end: '2026-07-30',
    tracks: ["Madwoman", "From the Start", "Lover Girl", "Tough Luck"]
  },
  {
    number: 13,
    headliner: "Chappell Roan",
    start: '2026-02-05',
    end: '2026-04-16',
    tracks: ["Pink Pony Club"]
  },
  {
    number: 12,
    headliner: "LISA",
    start: '2025-11-29',
    end: '2026-02-05',
    tracks: ["FUTW (Vixi Solo Version)", "Rockstar", "New Woman"]
  },
  {
    number: 11,
    headliner: null,
    start: '2025-10-09',
    end: '2025-11-29',
    tracks: []
  },
  {
    number: 10,
    headliner: "Gorillaz",
    start: '2025-08-26',
    end: '2025-10-09',
    tracks: ["On Melancholy Hill", "DARE", "Clint Eastwood"]
  },
  {
    number: 9,
    headliner: "Bruno Mars",
    start: '2025-06-18',
    end: '2025-08-26',
    tracks: ["Bruno-San's Theme Song", "APT.", "Die With A Smile", "Bonde Do Brunão", "That's What I Like", "Locked Out Of Heaven"]
  },
  {
    number: 8,
    headliner: "Sabrina Carpenter",
    start: '2025-04-08',
    end: '2025-06-18',
    tracks: ["Nonsense", "Please Please Please", "Taste", "Juno", "Bed Chem"]
  },
  {
    number: 7,
    headliner: "Hatsune Miku",
    start: '2025-01-14',
    end: '2025-04-08',
    tracks: ["M@GICAL☆CURE! LOVE SHOT!", "Miku", "Daisy 2.0", "World Is Mine", "Melt", "Decade"]
  },
  {
    number: 6,
    headliner: "Snoop Dogg",
    start: '2024-11-02',
    end: '2025-01-14',
    tracks: ["Young, Wild & Free", "Drop It Like It's Hot", "Beautiful", "All I Do Is Win"]
  },
  {
    number: 5,
    headliner: "Karol G",
    start: '2024-08-16',
    end: '2024-11-02',
    tracks: ["QLONA", "CAIRO", "OKI DOKI", "PROVENZA (REMIX)", "Tusa"]
  },
  {
    number: 4,
    headliner: "Metallica",
    start: '2024-06-13',
    end: '2024-08-16',
    tracks: ["One", "Enter Sandman", "Ride the Lightning", "The Unforgiven", "Wherever I May Roam", "For Whom The Bell Tolls", "Lux Æterna", "Nothing Else Matters", "Seek & Destroy", "Battery", "Fade to Black", "Sad But True"]
  },
  {
    number: 3,
    headliner: "Billie Eilish",
    start: '2024-04-23',
    end: '2024-06-13',
    tracks: ["Oxytocin", "Therefore I Am", "Happier Than Ever - Edit", "all the good girls go to hell", "CHIHIRO", "LUNCH", "THE DINER"]
  },
  {
    number: 2,
    headliner: "Lady Gaga",
    start: '2024-02-22',
    end: '2024-04-22',
    tracks: ["Poker Face", "Applause", "Bloody Mary", "Born This Way", "Just Dance", "Rain On Me", "Stupid Love", "The Edge of Glory"]
  },
  {
    number: 1,
    headliner: "The Weeknd",
    start: '2023-12-09',
    end: '2024-02-22',
    tracks: ["Blinding Lights", "Save Your Tears", "The Hills", "Take My Breath", "Can't Feel My Face", "Popular"]
  }
];

const dateFormat = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' });

export async function openSeasonHistory() {
  const dialog = document.getElementById('seasonHistory');
  const list = document.getElementById('seasonHistoryList');
  renderSeasons(list, seasons);
  dialog.showModal();

  try {
    const response = await fetch('data/live-seasons.json');
    if (!response.ok) return;
    const liveSeasons = await response.json();
    const merged = new Map(seasons.map(season => [season.number, season]));

    for (const live of liveSeasons) {
      const historical = merged.get(live.number);
      merged.set(live.number, historical ? { ...historical, end: live.end } : live);
    }

    if (dialog.open && !elements.modal.open) renderSeasons(list, [...merged.values()].sort((a, b) => b.number - a.number));
  } catch {
    // The curated season archive remains available if the updated snapshot cannot load.
  }
}

function renderSeasons(list, seasonList) {
  const tracksByTitle = new Map();
  for (const track of state.tracksData) {
    const matches = tracksByTitle.get(track.title) || [];
    matches.push(track);
    tracksByTitle.set(track.title, matches);
  }

  list.replaceChildren(...seasonList.map(season => createSeasonItem(season, tracksByTitle)));
}

function createSeasonItem(season, tracksByTitle) {
  const start = new Date(season.start);
  const end = new Date(season.end);
  const days = (end - start) / MS_PER_DAY;
  const now = new Date();
  const isCurrent = start <= now && now < end;
  const item = document.createElement('li');
  item.className = 'season-history-item';
  item.innerHTML = `
    <div class="season-art" aria-hidden="true">${season.number}</div>
    <div class="season-info">
      <div class="season-meta">
        <span class="season-number">Season ${season.number}</span>
        ${isCurrent ? '<span class="season-current">Current</span>' : ''}
      </div>
      <h3></h3>
      <p class="season-dates">${dateFormat.formatRange(start, end)} (${days} days)</p>
    </div>
  `;
  const info = item.querySelector('.season-info');
  const art = item.querySelector('.season-art');
  info.querySelector('h3').textContent = season.headliner || season.passName || 'Mixtape';
  if (!season.headliner && season.passName) {
    const note = document.createElement('p');
    note.className = 'season-dates season-track-note';
    note.textContent = 'Music Pass tracks';
    item.appendChild(note);
  }

  if (season.tracks.length) {
    const tracks = document.createElement('ul');
    tracks.className = 'season-track-list';
    for (const title of season.tracks) {
      const row = document.createElement('li');
      const matches = tracksByTitle.get(title) || [];
      const track = season.headliner
        ? matches.find(match => match.artist.toLowerCase().includes(season.headliner.toLowerCase()))
        : matches.length === 1 ? matches[0] : null;
      if (track) {
        if (track.cover && !art.querySelector('img')) {
          const cover = document.createElement('img');
          cover.alt = '';
          cover.loading = 'lazy';
          cover.addEventListener('error', () => cover.remove(), { once: true });
          cover.src = track.cover;
          art.appendChild(cover);
        }

        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = title;
        button.addEventListener('click', () => openModal(track, elements));
        row.appendChild(button);
      } else {
        row.textContent = title;
      }
      tracks.appendChild(row);
    }
    item.appendChild(tracks);
  }

  return item;
}
