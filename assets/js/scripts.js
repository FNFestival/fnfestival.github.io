document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('trackModal');
    const searchInput = document.getElementById('searchInput');
    const trackCount = document.getElementById('trackCount');
    const contentElement = document.querySelector('.content');
    const logo = document.getElementById('logo');
    const muteButton = document.getElementById('muteButton');

    let tracksData = [];
    let loadedTracks = 0;
    const tracksPerPage = 10;
    const initialLoad = 50;
    const audio = new Audio();
    audio.volume = 0.5;
    let isMuted = localStorage.getItem('isMuted') === 'true';
    let currentPreviewUrl = '';

    audio.muted = isMuted;
    updateMuteIcon();

    function updateMuteIcon() {
        const muteIcon = muteButton.querySelector('.mute-icon');
        const unmuteIcon = muteButton.querySelector('.unmute-icon');
        if (isMuted) {
            muteIcon.style.display = 'block';
            unmuteIcon.style.display = 'none';
        } else {
            muteIcon.style.display = 'none';
            unmuteIcon.style.display = 'block';
        }
    }

    function toggleMute() {
        isMuted = !isMuted;
        audio.muted = isMuted;
        localStorage.setItem('isMuted', isMuted);
        updateMuteIcon();
        if (!isMuted && currentPreviewUrl) {
            audio.play();
        }
    }

    function playPreview(previewUrl) {
        if (audio.src !== previewUrl) {
            audio.src = previewUrl;
            currentPreviewUrl = previewUrl;
        }
        if (!isMuted) {
            audio.play();
        }
    }

    function openModal(track) {
        const { title, artist, releaseYear, cover, bpm, duration, difficulties, createdAt, lastFeatured, previewUrl } = track;

        modal.querySelector('#modalCover').src = cover;
        modal.querySelector('#modalTitle').textContent = title;
        modal.querySelector('#modalArtist').textContent = artist;
        modal.querySelector('#modalDetails').innerHTML = `
            <p>Release Year: ${releaseYear}</p>
            <p>BPM: ${bpm}</p>
            <p>Duration: ${duration}</p>
            <p>Created At: ${new Date(createdAt).toLocaleString()}</p>
            <p>Last Featured: ${lastFeatured ? new Date(lastFeatured).toLocaleString() : 'N/A'}</p>
        `;
        generateDifficultyBars(difficulties, modal.querySelector('#modalDifficulties'));

        modal.style.display = 'block';
        document.body.classList.add('modal-open');

        if (previewUrl) {
            playPreview(previewUrl);
        }
    }

    function closeModal() {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        if (!audio.paused) {
            audio.pause();
        }
        audio.src = '';
        currentPreviewUrl = '';
    }

    function renderTracks(tracks, clearExisting = true) {
        if (clearExisting) contentElement.innerHTML = '';

        tracks.forEach(track => {
            const trackElement = document.createElement('div');
            trackElement.classList.add('jam-track');

            trackElement.innerHTML = `
                <img src="${track.cover}" alt="${track.title} Cover">
                <div>
                    <h2>${track.title}</h2>
                    <p>${track.artist}</p>
                </div>
            `;

            const labels = generateLabels(track);
            trackElement.appendChild(labels);

            trackElement.addEventListener('click', () => openModal(track));
            contentElement.appendChild(trackElement);
        });
    }

    function filterTracks() {
        const query = searchInput.value.toLowerCase();
        const filteredTracks = tracksData.filter(track =>
            track.title.toLowerCase().includes(query) ||
            track.artist.toLowerCase().includes(query)
        );

        trackCount.textContent = query ? `Found: ${filteredTracks.length}` : `Total: ${tracksData.length}`;
        renderTracks(filteredTracks);

        // Update URL with search query parameter
        const url = new URL(window.location);
        if (query) {
            url.searchParams.set('q', query);
        } else {
            url.searchParams.delete('q');
        }
        window.history.pushState({}, '', url);
    }

    function loadMoreTracks(entries, observer) {
        if (entries[0].isIntersecting) {
            observer.unobserve(entries[0].target);
            renderTracks(tracksData.slice(loadedTracks, loadedTracks + tracksPerPage), false);
            loadedTracks += tracksPerPage;

            const newSentinel = document.createElement('div');
            newSentinel.style.height = '1px';
            contentElement.appendChild(newSentinel);
            observer.observe(newSentinel);
        }
    }

    function generateDifficultyBars(difficulties, container) {
        container.innerHTML = '';
        const maxBars = 7;
        Object.entries(difficulties).forEach(([instrument, level]) => {
            const difficultyElement = document.createElement('div');
            difficultyElement.classList.add('difficulty');

            let barsHTML = '';
            for (let i = 1; i <= maxBars; i++) {
                barsHTML += `<div class="difficulty-bar"><span class="${i <= (level + 1) ? 'active' : ''}"></span></div>`;
            }

            difficultyElement.innerHTML = `
                <div class="instrument-icon ${instrument}"></div>
                <div class="difficulty-bars">${barsHTML}</div>
            `;

            container.appendChild(difficultyElement);
        });
    }

    function generateLabels(track) {
        const labelContainer = document.createElement('div');
        labelContainer.classList.add('label-container');

        const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - new Date(track.lastModified) < sevenDaysInMillis) {
            const newLabel = document.createElement('span');
            newLabel.classList.add('new-label');
            newLabel.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.56.56 0 0 0-.163-.505L1.71 6.745l4.052-.576a.53.53 0 0 0 .393-.288L8 2.223l1.847 3.658a.53.53 0 0 0 .393.288l4.052.575-2.906 2.77a.56.56 0 0 0-.163.506l.694 3.957-3.686-1.894a.5.5 0 0 0-.461 0z"/>
                </svg>
            `;
            labelContainer.appendChild(newLabel);
        }

        if (track.featured) {
            const featuredLabel = document.createElement('span');
            featuredLabel.classList.add('featured-label');
            featuredLabel.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
                </svg>
            `;
            labelContainer.appendChild(featuredLabel);
        }

        return labelContainer;
    }

    function loadTracks() {
        fetch(`data/jam_tracks.json?_=${Date.now()}`)
            .then(response => response.json())
            .then(data => {
                tracksData = Object.values(data);
                tracksData.sort((a, b) => {
                    if (a.featured && !b.featured) return -1;
                    if (!a.featured && b.featured) return 1;
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });

                // Check for search query parameter in URL
                const urlParams = new URLSearchParams(window.location.search);
                const searchQuery = urlParams.get('q');
                if (searchQuery) {
                    searchInput.value = searchQuery;
                    filterTracks();
                } else {
                    renderTracks(tracksData.slice(0, initialLoad));
                    loadedTracks = initialLoad;

                    const sentinel = document.createElement('div');
                    sentinel.style.height = '1px';
                    contentElement.appendChild(sentinel);

                    const observer = new IntersectionObserver(loadMoreTracks);
                    observer.observe(sentinel);
                }

                trackCount.textContent = searchQuery ? `Found: ${tracksData.filter(track =>
                    track.title.toLowerCase().includes(searchQuery) ||
                    track.artist.toLowerCase().includes(searchQuery)
                ).length}` : `Total: ${tracksData.length}`;
            });
    }

    function updateCountdown() {
        const now = new Date();
        const nextUpdate = new Date();
        nextUpdate.setUTCHours(0, 0, 0, 0);
        if (now >= nextUpdate) {
            nextUpdate.setUTCDate(nextUpdate.getUTCDate() + 1);
        }
        const diff = nextUpdate - now;
        const threshold = 2 * 60 * 1000;
        const displayDiff = diff > threshold ? diff : threshold;
        const hours = Math.floor(displayDiff / (1000 * 60 * 60));
        const minutes = Math.floor((displayDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((displayDiff % (1000 * 60)) / 1000);
        document.getElementById('countdown').textContent = `Next update in: ${hours}h ${minutes}m ${seconds}s`;
    }

    setInterval(updateCountdown, 1000);
    updateCountdown();

    // Event listeners
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    document.querySelector('.modal-close').addEventListener('click', closeModal);
    logo.addEventListener('click', () => {
        window.location.href = '/';
    });
    searchInput.addEventListener('input', filterTracks);
    muteButton.addEventListener('click', toggleMute);
    loadTracks();
});
