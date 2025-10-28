import fnbr from 'fnbr';
import fs from 'fs/promises';
import SpotifyWebApi from 'spotify-web-api-node';

// Constants
const JAM_TRACKS_FILE = 'data/jam_tracks.json';
const API_URL = 'https://fortnitecontent-website-prod07.ol.epicgames.com/content/api/pages/fortnite-game/spark-tracks';

// Spotify setup
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});
let spotifyAuthenticated = false;

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
      .map(event => event.eventType.split('.')[1])
      .filter(eventType => {
        const event = states.find(s =>
          s.activeEvents?.some(e =>
            e.eventType === `PilgrimSong.${eventType}`
          )
        );
        if (!event) return false;
        const activeEvent = event.activeEvents.find(e =>
          e.eventType === `PilgrimSong.${eventType}`
        );
        return new Date(activeEvent.activeSince) <= currentDate &&
               new Date(activeEvent.activeUntil) > currentDate;
      });

    return { dailyTracks, seasonEnd };
  } catch (error) {
    console.error('Error fetching daily jam tracks:', error);
    return { dailyTracks: [], seasonEnd: null };
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

    // Fetch all preview URLs in parallel
    if (previewUrlPromises.length > 0) {
      console.log(`Fetching ${previewUrlPromises.length} preview URLs...`);
      await Promise.all(previewUrlPromises);
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
    if (!spotifyAuthenticated) {
      const data = await spotifyApi.clientCredentialsGrant();
      spotifyApi.setAccessToken(data.body['access_token']);
      spotifyAuthenticated = true;
    }

    const searchResult = await spotifyApi.searchTracks(
      `${track.an.trim()} - ${track.tt.trim()}`,
      { limit: 1 }
    );

    const trackId = searchResult.body.tracks.items[0]?.id;
    if (!trackId) return null;

    const trackDetails = await spotifyApi.getTrack(trackId);
    let previewUrl = trackDetails.body.preview_url;

    if (!previewUrl) {
      const embedUrl = `https://open.spotify.com/embed/track/${trackId}`;
      const embedPage = await fetch(embedUrl);
      const embedHtml = await embedPage.text();
      const match = embedHtml.match(/"audioPreview":{"url":"([^"]+)"/);
      if (match) previewUrl = match[1];
    }

    return previewUrl;
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
