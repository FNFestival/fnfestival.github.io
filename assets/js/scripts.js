document.addEventListener("DOMContentLoaded", () => {
    // Get references to DOM elements
    const modal = document.getElementById("myModal");
    const modalClose = document.querySelector(".modal-close");

    // Add event listeners for closing the modal
    modalClose.addEventListener("click", closeModal);
    modal.addEventListener("click", closeModalIfClickedOutside);

    // Function to close the modal
    function closeModal() {
        modal.style.display = "none";
        document.body.classList.remove("modal-open");
        stopPreview();
    }

    // Function to close the modal if clicked outside
    function closeModalIfClickedOutside(event) {
        if (event.target === modal) {
            closeModal();
        }
    }

    // Function to open the modal with track details
    function openModal(track) {
        // Destructure track object for readability
        const { cover, title, artist, releaseYear, bpm, duration, difficulties, lastModified, previewUrl } = track;

        // Get references to modal elements
        const modalCover = document.getElementById("modalCover");
        const modalTitle = document.getElementById("modalTitle");
        const modalArtist = document.getElementById("modalArtist");
        const detailsElement = document.getElementById("modalDetails");
        const difficultiesElement = document.getElementById("modalDifficulties");

        // Set modal content
        modalCover.src = cover;
        modalTitle.textContent = title;
        modalArtist.textContent = artist;
        detailsElement.innerHTML = `
            <p>Release Year: ${releaseYear}</p>
            <p>BPM: ${bpm}</p>
            <p>Duration: ${duration}</p>
            <p>Last Modified: ${new Date(lastModified).toLocaleString()}</p>
        `;
        // Generate difficulty bars HTML and join them into a single string
        difficultiesElement.innerHTML = Object.entries(difficulties).map(([instrument, value]) => generateDifficultyBars(value, instrument)).join('');

        // Display modal and add class to body for styling
        modal.style.display = "block";
        document.body.classList.add("modal-open");

        // Play preview if available
        if (previewUrl) {
            playPreview(previewUrl);
        }
    }    

    // Function to play the track preview
    function playPreview(previewUrl) {
        trackPreview.src = previewUrl;
        trackPreview.volume = 0.02;
        trackPreview.play();
    }

    // Function to stop the track preview
    function stopPreview() {
        trackPreview.pause();
        trackPreview.currentTime = 0;
    }

    // Function to generate difficulty bars HTML
    function generateDifficultyBars(difficulty, instrument) {
        const filledBars = '<span class="active"></span>'.repeat(difficulty + 1);
        const emptyBars = '<span></span>'.repeat(6 - difficulty);
        return `
            <div class="difficulty">
                <span class="instrument-icon ${instrument}"></span>
                <div class="difficulty-bar">
                    ${filledBars}${emptyBars}
                </div>
            </div>
        `;
    }

    // Function to toggle visibility of section content
    function toggleSectionVisibility(sectionDiv, index) {
        const isHidden = sectionDiv.classList.toggle("hidden");
        localStorage.setItem(`section_${index}`, isHidden ? 'hidden' : 'visible');
    }

    // Function to load jam data asynchronously
    async function loadJamData() {
        try {
            // Fetch jam tracks JSON data with cache-busting query parameter
            const url = `data/jam_tracks.json?_=${Date.now()}`;
            const response = await fetch(url, { cache: "no-cache" });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const data = await response.json();
            const contentDiv = document.querySelector(".content");

            // Define sections with their corresponding tracks
            const sections = [
                { title: "Daily Jam Tracks", tracks: data.dailyTracks.map(trackId => data.jamTracks[trackId]) },
                { title: "Upcoming Jam Tracks", tracks: data.upcomingTracks.map(trackId => data.jamTracks[trackId]) },
                { title: "Available Jam Tracks", tracks: Object.values(data.jamTracks) }
            ];

            // Iterate over sections
            sections.forEach(({ title, tracks }, index) => {
                // Skip sections with no tracks
                if (!tracks || tracks.length === 0) {
                    return;
                }

                // Sort tracks by lastModified
                tracks.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

                // Create section div and title
                const sectionDiv = document.createElement("div");
                sectionDiv.classList.add("jam-section");
                const sectionTitle = document.createElement("h2");
                sectionTitle.textContent = title;
                const badge = document.createElement("span");
                badge.classList.add("badge");
                badge.textContent = tracks.length;
                sectionTitle.appendChild(badge);
                sectionDiv.appendChild(sectionTitle);

                // Retrieve section visibility state from localStorage
                const storedVisibility = localStorage.getItem(`section_${index}`);
                if (storedVisibility === 'hidden') {
                    sectionDiv.classList.add('hidden');
                }

                // Create div for jam tracks
                const jamTracksDiv = document.createElement("div");
                jamTracksDiv.classList.add("jam-tracks");

                // Map tracks for this section
                tracks.forEach(track => {
                    const trackDiv = document.createElement("div");
                    trackDiv.classList.add("jam-track");
                    const isNewTrack = isTrackNew(track.lastModified);
                    trackDiv.innerHTML = `
                        <img src="${track.cover}" alt="Jam Track Cover" draggable="false">
                        <div class="jam-track-info">
                            <h2 translate="no">${track.title}</h2>
                            <p translate="no">${track.artist}</p>
                            ${isNewTrack ? '<div class="optional-icon">New</div>' : ''}
                        </div>
                    `;
                    // Add click event listener to open modal with track details
                    trackDiv.addEventListener("click", () => openModal(track));
                    jamTracksDiv.appendChild(trackDiv);
                });

                // Append jamTracksDiv to sectionDiv and sectionDiv to contentDiv
                sectionDiv.appendChild(jamTracksDiv);
                contentDiv.appendChild(sectionDiv);

                // Add event listener to section title to toggle visibility
                sectionTitle.addEventListener("click", () => toggleSectionVisibility(sectionDiv, index));
            });

            // Add fade-in class for styling
            contentDiv.classList.add("fade-in");
        } catch (error) {
            console.error("Error fetching or parsing JSON:", error);
        }
    }

    // Function to check if a track is new (within the last week)
    function isTrackNew(lastModified) {
        const weekInMillis = 7 * 24 * 60 * 60 * 1000;
        const lastModifiedTime = new Date(lastModified).getTime();
        return (Date.now() - lastModifiedTime) <= weekInMillis;
    }

    // Load jam data when the page loads
    loadJamData();
});
