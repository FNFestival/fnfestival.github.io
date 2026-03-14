import fnbr from 'fnbr';
import fs from 'fs/promises';

// Constants
const JAM_TRACKS_FILE = 'data/tracks.json';
const API_URL = 'https://fortnitecontent-website-prod07.ol.epicgames.com/content/api/pages/fortnite-game/spark-tracks';
const PREVIEW_BATCH_SIZE = 10;

async function main() {
  // Fetch available tracks
  const availableTracksData = await fetchAvailableJamTracks();
  if (!availableTracksData) return;

  // Initialize Fortnite client
  const client = new fnbr.Client({
    auth: {
      deviceAuth: {
        accountId: process.env.FNBR_ACCOUNT_ID,
        deviceId: process.env.FNBR_DEVICE_ID,
        secret: process.env.FNBR_SECRET
      }
    }
  });

  // Fetch daily tracks and season info, then update data
  const { dailyTracks, seasonEnd } = await fetchDailyJamTracks(client);
  await updateJamTracks(availableTracksData, dailyTracks, seasonEnd);
}

async function fetchAvailableJamTracks() {
  try {
    const response = await fetch(API_URL);
    return Object.fromEntries(
      Object.entries(await response.json())
        .filter(([_, trackData]) => trackData?.track)
    );
  } catch (error) {
    console.error('Error fetching available jam tracks:', error);
    return null;
  }
}

async function fetchDailyJamTracks(client) {
  try {
    await client.login();
    const eventFlags = await client.getBREventFlags();
    const states = eventFlags?.channels['client-events']?.states || [];
    const currentDate = new Date();

    // Find season end date
    let seasonEnd = null;
    const seasonEvent = states
      .flatMap(state => state.activeEvents || [])
      .find(event => event.eventType.startsWith('EventFlag.Event_SparksS'));

    if (seasonEvent) {
      seasonEnd = seasonEvent.activeUntil;
    }

    // Get daily tracks
    const dailyTracks = states
      .flatMap(state => state.activeEvents || [])
      .filter(event => event.eventType.startsWith('PilgrimSong.'))
      .map(event => ({
        id: event.eventType.split('.')[1],
        activeSince: event.activeSince,
        activeUntil: event.activeUntil
      }))
      .filter(event => {
        const activeSince = new Date(event.activeSince);
        const activeUntil = new Date(event.activeUntil);
        const isActive = activeSince <= currentDate && activeUntil > currentDate;
        return isActive;
      })
      .map(event => event.id);

    return { dailyTracks, seasonEnd };
  } catch (error) {
    console.error('Error fetching daily jam tracks:', error);
    return { dailyTracks: [], seasonEnd: null };
  } finally {
    await client.logout().catch(() => {});
  }
}

async function updateJamTracks(availableTracksData, dailyTracks, seasonEnd) {
  try {
    // Read existing data
    let existingData = {};
    try {
      const fileContent = await fs.readFile(JAM_TRACKS_FILE, 'utf-8');
      existingData = JSON.parse(fileContent);
      if (existingData._metadata) {
        delete existingData._metadata;
      }
    } catch (error) {
      console.log('No existing jam tracks file, starting fresh');
    }

    const now = new Date().toISOString();
    const dailyTracksSet = new Set(dailyTracks);

    // Process all tracks
    const jamTracks = {};
    const previewUrlPromises = [];

    for (const [trackId, trackData] of Object.entries(availableTracksData)) {
      if (!trackData.track) continue;

      const track = trackData.track;
      const trackSn = track.sn;
      const existingTrack = existingData[trackSn];

      // Cache trimmed strings
      const artistName = track.an.trim();
      const trackTitle = track.tt.trim();

      // Determine if we need to fetch preview URL
      const needsPreviewUrl = artistName !== 'Epic Games' && !existingTrack?.previewUrl;

      jamTracks[trackSn] = {
        id: trackSn,
        title: trackTitle,
        artist: artistName,
        releaseYear: track.ry,
        cover: track.au,
        bpm: track.mt,
        duration: formatDuration(track.dn),
        difficulties: {
          vocals: track.in.vl,
          bass: track.in.ba,
          guitar: track.in.gr,
          drums: track.in.ds,
          plasticVocals: track.in.bd,
          plasticBass: track.in.pb,
          plasticGuitar: track.in.pg,
          plasticDrums: track.in.pd
        },
        createdAt: existingTrack?.createdAt || now,
        lastFeatured: dailyTracksSet.has(trackId) ? now : existingTrack?.lastFeatured || null,
        previewUrl: existingTrack?.previewUrl || null
      };

      // Queue preview URL fetch for parallel execution
      if (needsPreviewUrl) {
        previewUrlPromises.push(
          fetchPreviewUrl(track).then(url => {
            if (url) {
              jamTracks[trackSn].previewUrl = url;
            }
          })
        );
      }
    }

    // Fetch preview URLs in batches to avoid hammering the API
    if (previewUrlPromises.length > 0) {
      console.log(`Fetching ${previewUrlPromises.length} preview URLs...`);
      for (let i = 0; i < previewUrlPromises.length; i += PREVIEW_BATCH_SIZE) {
        await Promise.all(previewUrlPromises.slice(i, i + PREVIEW_BATCH_SIZE));
      }
    }

    // Prepare final data with metadata
    const finalData = {
      _metadata: {
        seasonEnd: seasonEnd,
        lastUpdated: now
      },
      ...jamTracks
    };

    // Save updated data
    await fs.writeFile(JAM_TRACKS_FILE, JSON.stringify(finalData, null, 2));
    console.log('Jam tracks updated successfully.');
    console.log(`Season ends: ${seasonEnd || 'Unknown'}`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating jam tracks:', error);
    process.exit(1);
  }
}

async function fetchPreviewUrl(track) {
  try {
    const query = encodeURIComponent(`${track.an.trim()} ${track.tt.trim()}`);
    const response = await fetch(
      `https://itunes.apple.com/search?term=${query}&media=music&entity=song&limit=1`
    );
    const data = await response.json();
    return data.results?.[0]?.previewUrl ?? null;
  } catch (error) {
    console.error('Error fetching preview URL:', error);
    return null;
  }
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

main();
