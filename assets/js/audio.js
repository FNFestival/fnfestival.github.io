import { state, CONFIG } from './state.js';

export const audio = new Audio();
audio.volume = CONFIG.audioVolume;

export function updateMuteIcons() {
  for (const button of document.querySelectorAll('[data-mute-button]')) {
    button.setAttribute('aria-pressed', String(state.isMuted));
    const label = button.querySelector('span');
    if (label) label.textContent = state.isMuted ? 'Unmute' : 'Mute';
    button.querySelector('.volume-icon').style.display = state.isMuted ? 'none' : 'block';
    button.querySelector('.muted-icon').style.display = state.isMuted ? 'block' : 'none';
  }
}

export function toggleMute() {
  state.isMuted = !state.isMuted;
  audio.volume = state.isMuted ? 0 : CONFIG.audioVolume;
  localStorage.setItem('isMuted', state.isMuted);
  updateMuteIcons();
}

export function fadeIn(duration) {
  if (state.fadeInterval) {
    clearInterval(state.fadeInterval);
    state.fadeInterval = null;
  }

  audio.volume = 0;
  const steps = 20;
  const stepTime = duration / steps;
  const volumeStep = CONFIG.audioVolume / steps;
  let currentStep = 0;

  state.fadeInterval = setInterval(() => {
    currentStep++;
    if (currentStep >= steps || state.isMuted) {
      audio.volume = state.isMuted ? 0 : CONFIG.audioVolume;
      clearInterval(state.fadeInterval);
      state.fadeInterval = null;
    } else {
      audio.volume = volumeStep * currentStep;
    }
  }, stepTime);
}

export function fadeOut(duration, callback) {
  if (state.fadeInterval) {
    clearInterval(state.fadeInterval);
    state.fadeInterval = null;
  }

  const steps = 20;
  const stepTime = duration / steps;
  const startVolume = audio.volume;
  const volumeStep = startVolume / steps;
  let currentStep = 0;

  state.fadeInterval = setInterval(() => {
    currentStep++;
    if (currentStep >= steps) {
      audio.volume = 0;
      clearInterval(state.fadeInterval);
      state.fadeInterval = null;
      if (callback) callback();
    } else {
      audio.volume = startVolume - (volumeStep * currentStep);
    }
  }, stepTime);
}

export function setupAudioLoop(modal, currentPreviewUrlGetter) {
  if (state.loopTimeout) {
    clearTimeout(state.loopTimeout);
  }

  const timeUntilLoop = (audio.duration - audio.currentTime) * 1000 - CONFIG.fadeDuration;

  if (timeUntilLoop > 0) {
    state.loopTimeout = setTimeout(() => {
      if (state.currentPreviewUrl && modal.style.display === 'flex') {
        fadeOut(CONFIG.fadeDuration, () => {
          setTimeout(() => {
            if (state.currentPreviewUrl && modal.style.display === 'flex') {
              audio.currentTime = 0;
              audio.play().then(() => {
                fadeIn(CONFIG.fadeDuration);
                setupAudioLoop(modal, currentPreviewUrlGetter);
              }).catch(err => {
                console.error('Error playing audio:', err);
              });
            }
          }, CONFIG.loopDelay);
        });
      }
    }, timeUntilLoop);
  }
}
