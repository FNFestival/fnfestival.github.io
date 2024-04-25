export async function fetchDailyJamTracks(client) {
    let jamTracks = { dailyTracks: [], upcomingTracks: [] };

    try {
        await client.login();

        const eventFlags = await client.getBREventFlags();
        const channel = eventFlags?.channels['client-events'];
        const states = channel?.states || [];

        const currentDate = new Date();
        const tomorrow = new Date(currentDate);
        tomorrow.setDate(currentDate.getDate() + 1);

        states
            .flatMap(state => state.activeEvents || [])
            .filter(activeEvent => activeEvent.eventType.startsWith('PilgrimSong.'))
            .forEach(activeEvent => {
                const eventType = activeEvent.eventType.split('.')[1];
                const activeSince = new Date(activeEvent.activeSince);
                const activeUntil = new Date(activeEvent.activeUntil);

                const isDaily = activeUntil >= currentDate;
                const isUpcoming = activeSince > currentDate && activeSince < tomorrow;

                if (isDaily) {
                    jamTracks.dailyTracks.push(eventType);
                } else if (isUpcoming) {
                    jamTracks.upcomingTracks.push(eventType);
                }
            });
    } catch (error) {
        console.error('Error fetching daily jam tracks:', error);
    }

    return jamTracks;
}