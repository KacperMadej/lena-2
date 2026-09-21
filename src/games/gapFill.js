// Game 1: fill the gaps in a word.
//   Level 1 — some letters are missing; drag matching letter tiles into the gaps.
//   Level 2 — same gaps, but type each missing letter on the on-screen keyboard.
//   Level 3 — no letters shown at all; type the whole word.
// In every level the child sees the Polish word and can tap a speaker button
// to hear the English word — that's the only way they know what to write.

import { speakEnglish, ttsAvailable } from '../tts.js';
import { renderKeyboard } from '../keyboard.js';
import { makeSortable } from '../dragdrop.js';
import { sortedWords } from '../wordbank.js';
import { saveScore } from '../storage.js';
import { t } from '../i18n/pl.js';

const SPEAKER_SVG =
  '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M4 9v6h4l5 5V4L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/>' +
  '<path d="M19.2 6a9 9 0 0 1 0 12"/></svg>';

function pickGapIndices(word) {
  const len = word.length;
  const count = Math.min(3, Math.max(1, len - 1));
  const idxs = new Set();
  while (idxs.size < count) idxs.add(Math.floor(Math.random() * len));
  return [...idxs].sort((a, b) => a - b);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function renderGapFill(container, list, level, onFinish) {
  const words = sortedWords(list, 'order');
  let index = 0;
  let correctCount = 0;

  function next() {
    if (index >= words.length) {
      const score = { correct: correctCount, total: words.length };
      saveScore(`${list.id}:gapfill:${level}`, score);
      onFinish(score);
      return;
    }
    renderWord(words[index]);
  }

  function renderWord(word) {
    const en = word.en.toUpperCase();
    const gapIdx = pickGapIndices(en);

    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'game-screen';

    // --- Polish prompt + speaker ---
    const prompt = document.createElement('div');
    prompt.className = 'prompt-card';
    const plWord = document.createElement('div');
    plWord.className = 'prompt-word';
    plWord.textContent = word.pl;
    prompt.appendChild(plWord);

    if (ttsAvailable()) {
      const speakBtn = document.createElement('button');
      speakBtn.type = 'button';
      speakBtn.className = 'speaker-btn';
      speakBtn.setAttribute('aria-label', t('speak'));
      speakBtn.innerHTML = SPEAKER_SVG;
      speakBtn.addEventListener('click', () => speakEnglish(word.en));
      prompt.appendChild(speakBtn);
      setTimeout(() => speakEnglish(word.en), 300);
    }
    wrap.appendChild(prompt);

    // --- Word boxes ---
    const wordRow = document.createElement('div');
    wordRow.className = 'word-row';
    const boxes = [];
    en.split('').forEach((ch, i) => {
      const box = document.createElement('div');
      if (gapIdx.includes(i)) {
        box.className = 'letter-box slot';
      } else {
        box.className = 'letter-box filled';
        box.textContent = ch;
      }
      wordRow.appendChild(box);
      boxes.push(box);
    });
    wrap.appendChild(wordRow);

    const feedback = document.createElement('div');
    feedback.className = 'feedback';

    const controlsArea = document.createElement('div');
    controlsArea.className = 'controls-area';

    function finish(isCorrect) {
      if (isCorrect) {
        correctCount++;
        feedback.textContent = t('correct');
        feedback.className = 'feedback feedback-correct';
        boxes.forEach((b) => b.classList.add('box-correct'));
      } else {
        feedback.textContent = t('incorrectTryAgain');
        feedback.className = 'feedback feedback-incorrect';
        gapIdx.forEach((i) => boxes[i].classList.add('box-wrong'));
      }
      controlsArea.innerHTML = '';
      if (!isCorrect) {
        const retryBtn = document.createElement('button');
        retryBtn.type = 'button';
        retryBtn.className = 'btn btn-secondary';
        retryBtn.textContent = t('tryAgain');
        retryBtn.addEventListener('click', () => renderWord(word));
        controlsArea.appendChild(retryBtn);
      }
      const nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'btn btn-primary';
      nextBtn.textContent = index === words.length - 1 ? t('finish') : t('next');
      nextBtn.addEventListener('click', () => {
        index++;
        next();
      });
      controlsArea.appendChild(nextBtn);
    }

    if (level === 1) {
      // --- Drag letter tiles into the gap slots ---
      const tray = document.createElement('div');
      tray.className = 'tile-tray';
      const missingLetters = shuffle(gapIdx.map((i) => en[i]));
      const tiles = missingLetters.map((letter) => {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.textContent = letter;
        tray.appendChild(tile);
        return tile;
      });
      wrap.appendChild(tray);
      wrap.appendChild(feedback);
      wrap.appendChild(controlsArea);
      container.appendChild(wrap);

      const slotEls = gapIdx.map((i) => boxes[i]);
      makeSortable({
        tiles,
        slots: slotEls,
        onChange: () => {
          const filled = slotEls.every((slot) => slot.firstElementChild);
          if (!filled) return;
          const guess = slotEls.map((slot) => slot.firstElementChild.textContent).join('');
          const answer = gapIdx.map((i) => en[i]).join('');
          finish(guess === answer);
        },
      });
    } else if (level === 2) {
      // --- Type each missing letter, one gap at a time ---
      wrap.appendChild(feedback);
      const kbHolder = document.createElement('div');
      wrap.appendChild(kbHolder);
      wrap.appendChild(controlsArea);
      container.appendChild(wrap);

      let activeGap = 0;
      const typedLetters = [];
      function highlightActive() {
        gapIdx.forEach((i, k) => boxes[i].classList.toggle('slot-active', k === activeGap));
      }
      highlightActive();

      renderKeyboard(kbHolder, {
        onLetter: (ch) => {
          if (activeGap >= gapIdx.length) return;
          const i = gapIdx[activeGap];
          boxes[i].textContent = ch;
          typedLetters[activeGap] = ch;
          activeGap++;
          if (activeGap >= gapIdx.length) {
            const guess = typedLetters.join('');
            const answer = gapIdx.map((idx) => en[idx]).join('');
            finish(guess === answer);
          } else {
            highlightActive();
          }
        },
        onBackspace: () => {
          if (activeGap > 0) {
            activeGap--;
            boxes[gapIdx[activeGap]].textContent = '';
            typedLetters[activeGap] = undefined;
            highlightActive();
          }
        },
      });
    } else {
      // --- Level 3: type the whole word, no letters shown ---
      boxes.forEach((b) => {
        b.textContent = '';
        b.className = 'letter-box slot';
      });
      wrap.appendChild(feedback);
      const kbHolder = document.createElement('div');
      wrap.appendChild(kbHolder);
      wrap.appendChild(controlsArea);
      container.appendChild(wrap);

      const typed = [];
      boxes[0] && boxes[0].classList.add('slot-active');
      renderKeyboard(kbHolder, {
        onLetter: (ch) => {
          if (typed.length >= en.length) return;
          boxes[typed.length].classList.remove('slot-active');
          boxes[typed.length].textContent = ch;
          typed.push(ch);
          if (typed.length < en.length) boxes[typed.length].classList.add('slot-active');
          if (typed.length === en.length) finish(typed.join('') === en);
        },
        onBackspace: () => {
          if (typed.length > 0) {
            boxes[typed.length - 1].classList.remove('box-correct', 'box-wrong');
            boxes[typed.length - 1].textContent = '';
            typed.pop();
            boxes[typed.length].classList.add('slot-active');
          }
        },
      });
    }
  }

  next();
}
