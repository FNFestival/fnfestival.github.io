export async function fetchDailyJamTracks(client) {
    const dailyTracks = [];

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
                const activeUntil = new Date(activeEvent.activeUntil);
                const isDaily = activeSince < currentDate && activeUntil > currentDate;

                if (isDaily && !dailyTracks.includes(eventType)) {
                    dailyTracks.push(eventType);
                }
            });
    } catch (error) {
        console.error('Error fetching daily jam tracks:', error);
    }

    return dailyTracks;
}
