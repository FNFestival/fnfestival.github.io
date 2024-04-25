export async function fetchDailyJamTracks(client) {
    let jamTracks = { dailyTracks: [], upcomingTracks: [] };

    try {
        await client.login();

        const eventFlags = await client.getBREventFlags();
        const channel = eventFlags?.channels['client-events'];
        const states = channel?.states || [];

        const currentDate = new Date();

        states
            .flatMap(state => state.activeEvents || [])
            .filter(activeEvent => activeEvent.eventType.startsWith('PilgrimSong.'))
            .forEach(activeEvent => {
                const eventType = activeEvent.eventType.split('.')[1];
                const activeSince = new Date(activeEvent.activeSince);
                const isDaily = activeSince < currentDate;

                if (!jamTracks.dailyTracks.includes(eventType)) {
                    jamTracks[isDaily ? 'dailyTracks' : 'upcomingTracks'].push(eventType);
                }
            });
    } catch (error) {
        console.error('Error fetching daily jam tracks:', error);
    }

    return jamTracks;
}