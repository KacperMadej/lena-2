// Lightweight, dependency-free toast + celebration overlay. Both attach
// directly to <body> rather than the app's screen container, so they can
// float above whatever screen is currently showing and aren't wiped out
// by the next screen render.

let toastHost = null;

function getToastHost() {
  if (!toastHost) {
    toastHost = document.createElement('div');
    toastHost.className = 'toast-host';
    document.body.appendChild(toastHost);
  }
  return toastHost;
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * A small pill notification for one correct/incorrect answer.
 * variant: 'success' | 'error'
 */
export function showToast(message, { variant = 'success', duration = 1500 } = {}) {
  const host = getToastHost();
  const el = document.createElement('div');
  el.className = `toast toast-${variant}`;
  el.textContent = message;
  host.appendChild(el);

  requestAnimationFrame(() => el.classList.add('toast-in'));
  setTimeout(() => {
    el.classList.remove('toast-in');
    el.classList.add('toast-out');
    setTimeout(() => el.remove(), 300);
  }, duration);
}

/**
 * The bigger "you finished perfectly" celebration. `emojiRain`, when given
 * a non-empty array, adds a bonus of matching emoji gently falling around
 * the card — used as an easter egg for specific word lists (colors,
 * seasons) rather than shown on every perfect score.
 */
export function showCelebration(message, { emojiRain = [], duration = 2600 } = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'celebration-overlay';

  const card = document.createElement('div');
  card.className = 'celebration-card';
  card.textContent = message;
  overlay.appendChild(card);

  if (emojiRain.length > 0 && !prefersReducedMotion()) {
    const rain = document.createElement('div');
    rain.className = 'emoji-rain';
    const dropCount = 16;
    for (let i = 0; i < dropCount; i++) {
      const drop = document.createElement('span');
      drop.className = 'emoji-drop';
      drop.textContent = emojiRain[Math.floor(Math.random() * emojiRain.length)];
      drop.style.left = Math.random() * 100 + '%';
      drop.style.animationDelay = (Math.random() * 0.8).toFixed(2) + 's';
      drop.style.animationDuration = (2.2 + Math.random() * 1.4).toFixed(2) + 's';
      drop.style.fontSize = Math.round(20 + Math.random() * 16) + 'px';
      rain.appendChild(drop);
    }
    overlay.appendChild(rain);
  }

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('celebration-in'));
  setTimeout(() => {
    overlay.classList.remove('celebration-in');
    overlay.classList.add('celebration-out');
    setTimeout(() => overlay.remove(), 400);
  }, duration);
}
