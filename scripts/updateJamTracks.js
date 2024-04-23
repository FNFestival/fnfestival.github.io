import fs from 'fs/promises';
import { fetchPreviewUrl } from './fetchPreviewUrl.js';
import { generateTrackObject } from './generateTrackObject.js';

const JAM_TRACKS_FILE = 'data/jam_tracks.json';

export async function updateJamTracks(availableTracksData, dailyTracks, upcomingTracks) {
    try {
        // Read existing jam tracks data from file
        let jamTracksData = {};
        try {
            jamTracksData = JSON.parse(await fs.readFile(JAM_TRACKS_FILE, 'utf-8'));
        } catch (error) {
            throw new Error('Error reading jam tracks file:', error);
        }

        // Process available tracks and generate the track object
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
