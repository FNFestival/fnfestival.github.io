import fs from 'fs/promises';
import { fetchPreviewUrl } from './fetchPreviewUrl.js';
import { generateTrackObject } from './generateTrackObject.js';

const JAM_TRACKS_FILE = 'data/jam_tracks.json';

export async function updateJamTracks(availableTracksData, dailyTracks) {
    try {
        // Read existing jam tracks data from file
        let jamTracksData = {};
        try {
            jamTracksData = JSON.parse(await fs.readFile(JAM_TRACKS_FILE, 'utf-8'));
        } catch (error) {
            // If the file doesn't exist or has issues, start with an empty object
            jamTracksData = {};
        }

        // Process available tracks and generate the track object
        const jamTracks = {};
        for (const trackId in availableTracksData) {
            const trackData = availableTracksData[trackId];
            if (!trackData.track) continue;

            // Check if track already has a preview URL in the existing data
            const existingTrack = jamTracksData[trackData.track.sn];
            const createdAt = existingTrack?.createdAt;

            let previewUrl = null;
            if (trackData.track.an.trim() !== 'Epic Games') {
                previewUrl = existingTrack?.previewUrl || await fetchPreviewUrl(trackData.track);
            }

            // Generate jam track object
            const trackObject = generateTrackObject(trackData, previewUrl, createdAt);

            // Mark as featured if it's in dailyTracks
            if (dailyTracks.includes(trackId)) {
                trackObject.featured = true;
            }

            jamTracks[trackData.track.sn] = trackObject;
        }

        // Write updated jam tracks data to file
        await fs.writeFile(JAM_TRACKS_FILE, JSON.stringify(jamTracks, null, 2));

        console.log('Jam tracks updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating jam tracks:', error);
        process.exit(1);
    }
}
