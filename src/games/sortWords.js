// Game 2: sort words into their correct order (chronological, numeric, or
// alphabetical, depending on the `order` field of the chosen list). Words
// appear as draggable tiles the child arranges into a row of slots.

import { speakEnglish, ttsAvailable } from '../tts.js';
import { makeSortable } from '../dragdrop.js';
import { sortedWords } from '../wordbank.js';
import { saveScore } from '../storage.js';
import { showToast } from '../toast.js';
import { playCorrect, playIncorrect } from '../sound.js';
import { t, randomPraise } from '../i18n/pl.js';

const SPEAKER_SVG =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" ' +
  'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M4 9v6h4l5 5V4L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg>';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function renderSortWords(container, list, onFinish) {
  const ordered = sortedWords(list, 'order');
  // Cap at 12 rather than the list's full length: this keeps a very long
  // custom list from producing an unmanageable row of tiles, while still
  // covering both shipped lists that need their *entire* order practiced
  // (7 days, 12 months) — a lower cap was silently truncating those.
  const roundWords = ordered.slice(0, Math.min(12, ordered.length));
  const shuffled = shuffle(roundWords);

  container.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'game-screen';

  const instructions = document.createElement('p');
  instructions.className = 'instructions';
  instructions.textContent = t('sortInstructions');
  wrap.appendChild(instructions);

  const slotsRow = document.createElement('div');
  slotsRow.className = 'sort-slots';
  const slots = roundWords.map(() => {
    const slot = document.createElement('div');
    slot.className = 'slot sort-slot';
    slotsRow.appendChild(slot);
    return slot;
  });
  wrap.appendChild(slotsRow);

  const tray = document.createElement('div');
  tray.className = 'tile-tray sort-tray';
  const tiles = shuffled.map((word) => {
    const tile = document.createElement('div');
    tile.className = 'tile tile-word';
    tile.dataset.en = word.en;

    const label = document.createElement('span');
    label.textContent = word.en;
    tile.appendChild(label);

    if (ttsAvailable()) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'speaker-btn speaker-btn-small';
      btn.setAttribute('aria-label', t('speak'));
      btn.innerHTML = SPEAKER_SVG;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        speakEnglish(word.en);
      });
      tile.appendChild(btn);
    }
    tray.appendChild(tile);
    return tile;
  });
  wrap.appendChild(tray);

  const feedback = document.createElement('div');
  feedback.className = 'feedback';
  wrap.appendChild(feedback);

  const controls = document.createElement('div');
  controls.className = 'controls-area';
  const checkBtn = document.createElement('button');
  checkBtn.type = 'button';
  checkBtn.className = 'btn btn-primary';
  checkBtn.textContent = t('check');
  checkBtn.addEventListener('click', check);
  controls.appendChild(checkBtn);
  wrap.appendChild(controls);

  container.appendChild(wrap);

  makeSortable({ tiles, slots, onChange: () => {} });

  function check() {
    const allFilled = slots.every((s) => s.firstElementChild);
    if (!allFilled) {
      feedback.textContent = t('fillAllSlots');
      feedback.className = 'feedback feedback-incorrect';
      return;
    }

    let correct = 0;
    slots.forEach((slot, i) => {
      const tile = slot.firstElementChild;
      const isRight = tile.dataset.en === roundWords[i].en;
      slot.classList.toggle('slot-correct', isRight);
      slot.classList.toggle('slot-wrong', !isRight);
      if (isRight) correct++;
    });

    if (correct === slots.length) {
      feedback.textContent = t('correct');
      feedback.className = 'feedback feedback-correct';
      showToast(randomPraise(), { variant: 'success' });
      playCorrect();
      const score = { correct, total: slots.length };
      saveScore(`${list.id}:sort`, score);
      controls.innerHTML = '';
      const doneBtn = document.createElement('button');
      doneBtn.type = 'button';
      doneBtn.className = 'btn btn-primary';
      doneBtn.textContent = t('finish');
      doneBtn.addEventListener('click', () => onFinish(score));
      controls.appendChild(doneBtn);
    } else {
      feedback.textContent = t('someWrongTryAgain');
      feedback.className = 'feedback feedback-incorrect';
      playIncorrect();
    }
  }
}
