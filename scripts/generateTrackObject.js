// Function to format duration from seconds to minutes and seconds
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
}

export function generateTrackObject(trackData, previewUrl) {
    const { track } = trackData;
    const duration = formatDuration(track.dn);

    return {
        title: track.tt.trim(),
        artist: track.an.trim(),
        releaseYear: track.ry,
        cover: track.au,
        bpm: track.mt,
        duration,
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
