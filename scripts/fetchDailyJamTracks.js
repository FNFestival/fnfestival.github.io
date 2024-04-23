export async function fetchDailyJamTracks(client) {
    let jamTracks = { dailyTracks: [], upcomingTracks: [] };

    try {
        await client.login();

        const eventFlags = await client.getBREventFlags();
        const channel = eventFlags?.channels['client-events'];
        const states = channel?.states || [];

        const getEventTypes = (events) => events
            .filter(activeEvent => activeEvent.eventType.startsWith('PilgrimSong.'))
            .map(activeEvent => activeEvent.eventType.split('.')[1]);

        if (states.length > 0) {
            const dailyEvents = states[0]?.activeEvents || [];
            jamTracks.dailyTracks = getEventTypes(dailyEvents);

            if (states.length > 1) {
                const upcomingEvents = states[1]?.activeEvents || [];
                const upcomingEventTypes = getEventTypes(upcomingEvents);
                jamTracks.upcomingTracks = upcomingEventTypes.filter(eventType =>
                    !jamTracks.dailyTracks.includes(eventType)
                );
            }
        }
    } catch (error) {
        console.error('Error fetching daily jam tracks:', error);
    }

    return jamTracks;
}
