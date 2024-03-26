const fs = require('fs').promises;
const { Client } = require('fnbr');
const SpotifyWebApi = require('spotify-web-api-node');

const API_URL = 'https://fortnitecontent-website-prod07.ol.epicgames.com/content/api/pages/fortnite-game/spark-tracks';
const JAM_TRACKS_FILE = 'data/jam_tracks.json';

const auth = {
    deviceAuth: {
        accountId: process.env.FNBR_ACCOUNT_ID,
        deviceId: process.env.FNBR_DEVICE_ID,
        secret: process.env.FNBR_SECRET
    }
};

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

// Fetches the preview URL of a track from Spotify
async function fetchPreviewUrl(track) {
    try {
        const query = `${track.an.trim()} - ${track.tt.trim()}`;
        const searchResult = await spotifyApi.searchTracks(query, { limit: 1 });
        const trackId = searchResult.body.tracks.items[0]?.id;

        if (trackId) {
            const trackDetails = await spotifyApi.getTrack(trackId);
            let previewUrl = trackDetails.body.preview_url;

            if (!previewUrl) {
                const embedUrl = `https://open.spotify.com/embed/track/${trackId}`;
                const embedPage = await fetch(embedUrl);
                const embedHtml = await embedPage.text();
                const match = embedHtml.match(/"audioPreview":{"url":"([^"]+)"/);
                if (match) {
                    previewUrl = match[1];
                }
            }
            return previewUrl;
        }
        return null;
    } catch (error) {
        console.error('Error fetching preview URL:', error);
        return null;
    }
}

// Fetches available tracks from the provided API URL
async function fetchAvailableTracks() {
    const response = await fetch(API_URL);
    return response.json();
}

// Fetches daily and upcoming jam tracks using the Fortnite client
async function fetchDailyJamTracks(client) {
    try {
        await client.login();

        const eventFlags = await client.getBREventFlags();
        const channel = eventFlags?.channels['client-events'];
        const [currentState, upcomingState] = channel?.states || [];

        // Filter active events to get only jam tracks
        const filterTracks = events => events
            .filter(activeEvent => activeEvent.eventType.startsWith('PilgrimSong.'))
            .map(activeEvent => activeEvent.eventType.split('.')[1]);

        let dailyTracks = currentState ? filterTracks(currentState.activeEvents) : [];
        let upcomingTracks = upcomingState ? filterTracks(upcomingState.activeEvents) : [];

        // Swap daily and upcoming tracks if upcoming tracks are for the current day
        console.log('Current state valid from:', currentState.validFrom);
        console.log('Upcoming state valid from:', upcomingState.validFrom);
        if (upcomingState && isCurrentDay(upcomingState.validFrom)) {
            [dailyTracks, upcomingTracks] = [upcomingTracks, []];
        }

        return { dailyTracks, upcomingTracks };
    } catch (error) {
        console.error('Error fetching daily jam tracks:', error);
        return { dailyTracks: [], upcomingTracks: [] };
    }
}

// Updates jam tracks data
async function updateJamTracks() {
    try {
        // Initialize the Fortnite client with authentication
        const client = new Client({ auth });

        // Fetch available tracks data
        const availableTracksData = await fetchAvailableTracks();
        if (!availableTracksData) return;

        // Fetch daily and upcoming jam tracks
        const { dailyTracks, upcomingTracks } = await fetchDailyJamTracks(client);

        // Read existing jam tracks data from file
        let jamTracksData = {};
        try {
            jamTracksData = JSON.parse(await fs.readFile(JAM_TRACKS_FILE, 'utf-8'));
        } catch (error) {
            console.error('Error reading jam tracks file:', error);
        }

        // Process available tracks and update jamTracksData
        const jamTracks = {};
        for (const trackId in availableTracksData) {
            const trackData = availableTracksData[trackId];
            if (!trackData.track) continue;

            // Check if track already has a preview URL in the existing data
            const existingTrack = jamTracksData.jamTracks[trackData.track.sn];
            const previewUrl = existingTrack?.previewUrl || await fetchPreviewUrl(trackData.track);

            // Generate jam track object
            jamTracks[trackData.track.sn] = generateTrackObject(trackData, previewUrl);
        }

        // Construct updated jam tracks data
        const updatedJamTracksData = {
            dailyTracks,
            upcomingTracks,
            jamTracks
        };

        // Write updated jam tracks data to file
        await fs.writeFile(JAM_TRACKS_FILE, JSON.stringify(updatedJamTracksData, null, 2));

        console.log('Jam tracks updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating jam tracks:', error);
        process.exit(1);
    }
}

// Generates a track object from track data
function generateTrackObject(trackData, previewUrl) {
    const { track } = trackData;
    return {
        title: track.tt.trim(),
        artist: track.an.trim(),
        releaseYear: track.ry,
        cover: track.au,
        bpm: track.mt,
        duration: formatDuration(track.dn),
        difficulties: {
            bass: track.in.ba,
            drums: track.in.ds,
            vocals: track.in.vl,
            guitar: track.in.gr
        },
        lastModified: trackData.lastModified,
        previewUrl
    };
}

// Formats duration from seconds to minutes and seconds
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
}

// Checks if the provided date string is the current day
function isCurrentDay(dateString) {
    const upcomingDate = new Date(dateString);
    const currentDate = new Date();
    console.log('Comparing', upcomingDate.getDate(), 'and', currentDate.getDate())
    return upcomingDate.getDate() === currentDate.getDate();
}

// Initializes Spotify API with client credentials grant
spotifyApi.clientCredentialsGrant()
    .then(data => {
        spotifyApi.setAccessToken(data.body['access_token']);
        spotifyApi.setRefreshToken(data.body['refresh_token']);
        updateJamTracks();
    })
    .catch(error => {
        console.error('Error retrieving access token:', error);
        process.exit(1);
    });
