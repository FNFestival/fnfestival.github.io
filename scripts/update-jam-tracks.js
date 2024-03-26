const fs = require('fs').promises;
const { Client } = require('fnbr');

const API_URL = 'https://fortnitecontent-website-prod07.ol.epicgames.com/content/api/pages/fortnite-game/spark-tracks';
const JAM_TRACKS_FILE = 'data/jam_tracks.json';

const auth = {
    deviceAuth: {
        accountId: process.env.FNBR_ACCOUNT_ID,
        deviceId: process.env.FNBR_DEVICE_ID,
        secret: process.env.FNBR_SECRET
    }
};

// Fetch data from the provided API URL
async function fetchAvailableTracks() {
    const response = await fetch(API_URL);
    return response.json();
}

// Fetch daily and upcoming jam tracks using the provided Fortnite client
async function fetchDailyJamTracks(client) {
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
    if (upcomingState && isCurrentDay(upcomingState.validFrom)) {
        [dailyTracks, upcomingTracks] = [upcomingTracks, []];
    }

    return { dailyTracks, upcomingTracks };
}

// Update jam tracks data
async function updateJamTracks() {
    const client = new Client({ auth });

    const availableTracksData = await fetchAvailableTracks();
    const { dailyTracks, upcomingTracks } = await fetchDailyJamTracks(client);

    // Generate jam tracks object and categorize them
    const jamTracks = Object.fromEntries(
        Object.entries(availableTracksData)
            .filter(([_, trackData]) => trackData.track && trackData.track.sn === _)
            .map(([_, trackData]) => [
                trackData.track.sn,
                generateTrackObject(trackData)
            ])
    );

    const jamTracksData = {
        "dailyTracks": dailyTracks,
        "upcomingTracks": upcomingTracks,
        "jamTracks": jamTracks
    };

    // Write jam tracks data to file
    await fs.writeFile(JAM_TRACKS_FILE, JSON.stringify(jamTracksData, null, 2));

    console.log('Jam tracks updated successfully.');
    process.exit(0);
}

// Generate track object from track data
function generateTrackObject(trackData) {
    const track = trackData.track;
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
        lastModified: trackData.lastModified
    };
}

// Format duration from seconds to minutes and seconds
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
}

// Check if the provided date string is the current day
function isCurrentDay(dateString) {
    const upcomingDate = new Date(dateString);
    const currentDate = new Date();
    return upcomingDate.getDate() === currentDate.getDate();
}

// Update jam tracks and handle errors
updateJamTracks().catch(error => {
    console.error('Error updating jam tracks:', error);
    process.exit(1);
});
