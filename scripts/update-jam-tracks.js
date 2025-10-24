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

  // Fetch daily tracks and update data
  const dailyTracks = await fetchDailyJamTracks(client);
  await updateJamTracks(availableTracksData, dailyTracks);
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

    return states
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
        return new Date(activeEvent.activeSince) < currentDate &&
               new Date(activeEvent.activeUntil) > currentDate;
      });
  } catch (error) {
    console.error('Error fetching daily jam tracks:', error);
    return [];
  }
}

async function updateJamTracks(availableTracksData, dailyTracks) {
  try {
    // Read existing data
    let existingData = {};
    try {
      existingData = JSON.parse(await fs.readFile(JAM_TRACKS_FILE, 'utf-8'));
    } catch (error) {
      console.log('No existing jam tracks file, starting fresh');
    }

    // Process tracks
    const jamTracks = {};
    for (const [trackId, trackData] of Object.entries(availableTracksData)) {
      if (!trackData.track) continue;

      const existingTrack = existingData[trackData.track.sn];
      const previewUrl = trackData.track.an.trim() !== 'Epic Games' ?
        (existingTrack?.previewUrl || await fetchPreviewUrl(trackData.track)) : null;

      jamTracks[trackData.track.sn] = {
        id: trackData.track.sn,
        title: trackData.track.tt.trim(),
        artist: trackData.track.an.trim(),
        releaseYear: trackData.track.ry,
        cover: trackData.track.au,
        bpm: trackData.track.mt,
        duration: formatDuration(trackData.track.dn),
        difficulties: {
          vocals: trackData.track.in.vl,
          guitar: trackData.track.in.gr,
          bass: trackData.track.in.ba,
          drums: trackData.track.in.ds,
          'plastic-bass': trackData.track.in.pb,
          'plastic-drums': trackData.track.in.pd,
          'plastic-guitar': trackData.track.in.pg
        },
        createdAt: existingTrack?.createdAt || new Date().toISOString(),
        lastFeatured: dailyTracks.includes(trackId) ?
          new Date().toISOString() : existingTrack?.lastFeatured || null,
        featured: dailyTracks.includes(trackId),
        previewUrl
      };
    }

    // Save updated data
    await fs.writeFile(JAM_TRACKS_FILE, JSON.stringify(jamTracks, null, 2));
    console.log('Jam tracks updated successfully.');
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
