import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

let spotifyAuthenticated = false;

async function authenticateSpotifyApi() {
    try {
        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body['access_token']);
        spotifyApi.setRefreshToken(data.body['refresh_token']);
        spotifyAuthenticated = true;
    } catch (error) {
        console.error('Error authenticating Spotify API:', error);
        spotifyAuthenticated = false;
    }
}

export async function fetchPreviewUrl(track) {
    try {
        // Authenticate Spotify API if not already authenticated
        if (!spotifyAuthenticated) {
            await authenticateSpotifyApi();
        }

        // Construct search query
        const query = `${track.an.trim()} - ${track.tt.trim()}`;

        // Search for track on Spotify
        const searchResult = await spotifyApi.searchTracks(query, { limit: 1 });
        const trackId = searchResult.body.tracks.items[0]?.id;

        if (trackId) {
            // Get track details
            const trackDetails = await spotifyApi.getTrack(trackId);
            let previewUrl = trackDetails.body.preview_url;

            // If preview URL not available, try to extract from embed page
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
