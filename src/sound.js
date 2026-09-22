// Small synthesized sound effects using the Web Audio API. No audio files
// to fetch or host — stays consistent with the rest of the app (no
// external assets, works fully offline once loaded), and keeps the repo
// free of binary files that are annoying to diff/review.

let ctx = null;

function getContext() {
  if (!ctx) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return null;
    ctx = new AudioCtor();
  }
  // Browsers suspend new contexts until a user gesture resumes them; every
  // call site here is triggered from a tap/click, so this is safe to call
  // every time.
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(context, { freq, start, duration, type = 'sine', gain = 0.18 }) {
  const osc = context.createOscillator();
  const g = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, context.currentTime + start);
  g.gain.setValueAtTime(0, context.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, context.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, context.currentTime + start + duration);
  osc.connect(g);
  g.connect(context.destination);
  osc.start(context.currentTime + start);
  osc.stop(context.currentTime + start + duration + 0.05);
}

/** A short, cheerful two-note chime for a correct answer. */
export function playCorrect() {
  const c = getContext();
  if (!c) return;
  tone(c, { freq: 523.25, start: 0, duration: 0.14 }); // C5
  tone(c, { freq: 659.25, start: 0.1, duration: 0.18 }); // E5
}

/** A soft, non-alarming two-note dip for a wrong answer — never harsh. */
export function playIncorrect() {
  const c = getContext();
  if (!c) return;
  tone(c, { freq: 300, start: 0, duration: 0.16, gain: 0.12 });
  tone(c, { freq: 220, start: 0.11, duration: 0.2, gain: 0.12 });
}

/** A small fanfare for finishing a whole round/session with a perfect score. */
export function playCelebration() {
  const c = getContext();
  if (!c) return;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((freq, i) => tone(c, { freq, start: i * 0.13, duration: 0.24, gain: 0.16 }));
}
