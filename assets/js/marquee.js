import { CONFIG } from './state.js';

export const marqueeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Delay check slightly to ensure proper layout calculation
      setTimeout(() => {
        entry.target.querySelectorAll('.marquee-text').forEach(checkAndStartMarquee);
      }, CONFIG.marqueeCheckDelay);
    } else {
      entry.target.querySelectorAll('.marquee-text').forEach(stopMarquee);
    }
  });
}, { rootMargin: CONFIG.marqueeObserverMargin });

export function stopMarquee(textElement) {
  if (!textElement) return;
  textElement.classList.remove('scrolling');
  textElement.style.setProperty('--scroll-distance', '0px');
  textElement.style.setProperty('--marquee-duration', '10s');
}

export function checkAndStartMarquee(textElement) {
  if (!textElement?.parentElement) return;

  const container = textElement.parentElement;

  stopMarquee(textElement);

  requestAnimationFrame(() => {
    const containerWidth = container.clientWidth;
    const textWidth = textElement.scrollWidth;

    // Add small buffer to prevent unnecessary scrolling
    if (textWidth > containerWidth + 5) {
      const scrollDistance = textWidth - containerWidth;

      // Scale duration based on text length (35px per second)
      const baseDuration = Math.max(5, Math.min(18, scrollDistance / 35));

      const randomDelay = Math.random() * 2;

      textElement.style.cssText += `
        --scroll-distance: -${scrollDistance}px;
        --marquee-delay: ${randomDelay}s;
        --marquee-duration: ${baseDuration}s;
      `;

      // Force reflow to restart animation
      void textElement.offsetWidth;
      textElement.classList.add('scrolling');
    }
  });
}
