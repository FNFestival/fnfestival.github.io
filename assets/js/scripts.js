document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('trackModal');
    const searchInput = document.getElementById('searchInput');
    const trackCount = document.getElementById('trackCount');
    const contentElement = document.querySelector('.content');
    const playButton = document.getElementById('playPreviewButton');
    const logo = document.getElementById('logo');
    
    let tracksData = [];
    let loadedTracks = 0;
    const tracksPerPage = 10;
    const initialLoad = 50;
    const audio = new Audio();
    audio.volume = 0.5;

    function playPreview(previewUrl) {
        const playIcon = playButton.querySelector('.play-icon');
        const pauseIcon = playButton.querySelector('.pause-icon');

        if (audio.src !== previewUrl) {
            audio.src = previewUrl;
        }
        if (audio.paused) {
            audio.play();
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        } else {
            audio.pause();
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    }

    function openModal(track) {
        const { title, artist, releaseYear, cover, bpm, duration, difficulties, lastModified, previewUrl } = track;

        modal.querySelector('#modalCover').src = cover;
        modal.querySelector('#modalTitle').textContent = title;
        modal.querySelector('#modalArtist').textContent = artist;
        modal.querySelector('#modalDetails').innerHTML = `
            <p>Release Year: ${releaseYear}</p>
            <p>BPM: ${bpm}</p>
            <p>Duration: ${duration}</p>
            <p>Last Modified: ${new Date(lastModified).toLocaleString()}</p>
        `;
        generateDifficultyBars(difficulties, modal.querySelector('#modalDifficulties'));

        playButton.style.display = previewUrl ? 'block' : 'none';
        playButton.onclick = () => playPreview(track.previewUrl);

        modal.style.display = 'block';
        document.body.classList.add('modal-open');
    }

    function closeModal() {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        if (!audio.paused) {
            audio.pause();
        }
        audio.src = '';

        // Reset icon visibility
        const playIcon = playButton.querySelector('.play-icon');
        const pauseIcon = playButton.querySelector('.pause-icon');
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    }

    function handleAudioEnd() {
        const playIcon = playButton.querySelector('.play-icon');
        const pauseIcon = playButton.querySelector('.pause-icon');
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
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
            newLabel.textContent = 'New';
            labelContainer.appendChild(newLabel);
        }

        if (track.featured) {
            const featuredLabel = document.createElement('span');
            featuredLabel.classList.add('featured-label');
            featuredLabel.textContent = 'Featured';
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
                    return new Date(b.lastModified) - new Date(a.lastModified);
                });

                renderTracks(tracksData.slice(0, initialLoad));
                loadedTracks = initialLoad;

                trackCount.textContent = `Total: ${tracksData.length}`;

                const sentinel = document.createElement('div');
                sentinel.style.height = '1px';
                contentElement.appendChild(sentinel);

                const observer = new IntersectionObserver(loadMoreTracks);
                observer.observe(sentinel);
            });
    }

    // Event listeners
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    document.querySelector('.modal-close').addEventListener('click', closeModal);
    logo.addEventListener('click', () => location.reload());
    searchInput.addEventListener('input', filterTracks);
    audio.addEventListener('ended', handleAudioEnd);
    loadTracks();
});
