// Speaks English words aloud using the browser's built-in speech synthesis.
// No dependency, works offline on-device, and degrades gracefully: if the
// browser has no speechSynthesis or no English voice, callers should hide
// the speaker button instead of showing one that silently does nothing.

export function ttsAvailable() {
  return 'speechSynthesis' in window;
}

function pickEnglishVoice() {
  if (!ttsAvailable()) return null;
  const voices = speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;
  return (
    voices.find((v) => v.lang === 'en-US') ||
    voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en')) ||
    null
  );
}

export function speakEnglish(text) {
  if (!ttsAvailable()) return false;
  try {
    speechSynthesis.cancel(); // don't stack up overlapping utterances
    const utter = new SpeechSynthesisUtterance(text);
    const voice = pickEnglishVoice();
    if (voice) utter.voice = voice;
    utter.lang = voice ? voice.lang : 'en-US';
    utter.rate = 0.85; // a little slower — easier for a child to follow
    speechSynthesis.speak(utter);
    return true;
  } catch (e) {
    console.warn('Błąd syntezatora mowy', e);
    return false;
  }
}

// Chrome/Android load the voice list asynchronously after page load; this
// just warms the list up so the first speak() call already has options.
if (ttsAvailable()) {
  speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
}
