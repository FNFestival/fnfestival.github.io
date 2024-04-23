const API_URL = 'https://fortnitecontent-website-prod07.ol.epicgames.com/content/api/pages/fortnite-game/spark-tracks';

export async function fetchAvailableJamTracks() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        // Filter objects that have the "track" property
        const availableTracks = Object.fromEntries(
            Object.entries(data).filter(([_, trackData]) => trackData?.track)
        );

        return availableTracks;
    } catch (error) {
        console.error('Error fetching available jam tracks:', error);
        return null;
    }
}
