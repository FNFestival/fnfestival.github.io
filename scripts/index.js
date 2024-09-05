import fnbr from 'fnbr';
import { fetchAvailableJamTracks } from './fetchAvailableJamTracks.js';
import { fetchDailyJamTracks } from './fetchDailyJamTracks.js';
import { updateJamTracks } from './updateJamTracks.js';

// fnbr is a CommonJS module and we have to use it that way
const { Client } = fnbr;

async function main() {
    // Fetch available tracks data
    const availableTracksData = await fetchAvailableJamTracks();
    if (!availableTracksData) return;

    // Initialize the Fortnite client with device authentication
    const auth = {
        deviceAuth: {
            accountId: process.env.FNBR_ACCOUNT_ID,
            deviceId: process.env.FNBR_DEVICE_ID,
            secret: process.env.FNBR_SECRET
        }
    };
    const client = new Client({ auth });

    // Fetch daily and upcoming jam tracks
    const dailyTracks = await fetchDailyJamTracks(client);

    // Update jam tracks data
    await updateJamTracks(availableTracksData, dailyTracks);
}

main();
