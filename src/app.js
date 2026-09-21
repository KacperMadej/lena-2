import { loadBuiltinLists, parseCSV, WordList } from './wordbank.js';
import { getCustomLists, saveCustomList, deleteCustomList, getScore } from './storage.js';
import { renderGapFill } from './games/gapFill.js';
import { renderSortWords } from './games/sortWords.js';
import { t } from './i18n/pl.js';

const app = document.getElementById('app');
let builtinLists = [];

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function allLists() {
  const custom = getCustomLists().map((l) => new WordList(l.id, l.namePl, l.words, true));
  return [...builtinLists, ...custom];
}

// ---------- Home: choose a list ----------
function showHome() {
  app.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'screen home-screen';

  const subtitle = document.createElement('p');
  subtitle.className = 'instructions';
  subtitle.textContent = t('chooseList');
  wrap.appendChild(subtitle);

  const grid = document.createElement('div');
  grid.className = 'list-grid';
  allLists().forEach((list) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'list-card' + (list.isCustom ? ' list-card-custom' : '');
    card.innerHTML =
      `<span class="list-card-name">${escapeHtml(list.namePl)}</span>` +
      `<span class="list-card-count">${list.words.length} ${t('wordsCount')}</span>`;
    card.addEventListener('click', () => showModeSelect(list));

    if (list.isCustom) {
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'list-delete-btn';
      del.setAttribute('aria-label', t('deleteList'));
      del.textContent = '✕';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteCustomList(list.id);
        showHome();
      });
      card.appendChild(del);
    }
    grid.appendChild(card);
  });
  wrap.appendChild(grid);

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'btn btn-secondary btn-add-list';
  addBtn.textContent = t('addOwnList');
  addBtn.addEventListener('click', showCsvImport);
  wrap.appendChild(addBtn);

  app.appendChild(wrap);
}

// ---------- CSV import screen ----------
function showCsvImport() {
  app.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'screen import-screen';
  wrap.innerHTML = `
    <h2>${t('addOwnList')}</h2>
    <p class="instructions">${t('csvHelp')}</p>
    <label class="field-label" for="listNameInput">${t('listName')}</label>
    <input type="text" id="listNameInput" class="text-input" placeholder="${t('listNamePlaceholder')}" />
    <label class="field-label" for="csvInput">${t('csvLabel')}</label>
    <textarea id="csvInput" class="text-area" rows="8" placeholder="apple,jabłko,1&#10;banana,banan,2"></textarea>
    <input type="file" id="csvFile" accept=".csv,text/csv" class="file-input" />
    <div class="feedback" id="importFeedback"></div>
    <div class="controls-area">
      <button type="button" class="btn btn-secondary" id="cancelImport">${t('cancel')}</button>
      <button type="button" class="btn btn-primary" id="saveImport">${t('save')}</button>
    </div>
  `;
  app.appendChild(wrap);

  const fileInput = wrap.querySelector('#csvFile');
  const csvInput = wrap.querySelector('#csvInput');
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    file.text().then((text) => {
      csvInput.value = text;
    });
  });

  wrap.querySelector('#cancelImport').addEventListener('click', showHome);
  wrap.querySelector('#saveImport').addEventListener('click', () => {
    const name = wrap.querySelector('#listNameInput').value.trim();
    const csvText = csvInput.value.trim();
    const feedback = wrap.querySelector('#importFeedback');

    if (!name) {
      feedback.textContent = t('needListName');
      feedback.className = 'feedback feedback-incorrect';
      return;
    }
    const words = parseCSV(csvText);
    if (words.length === 0) {
      feedback.textContent = t('needAtLeastOneWord');
      feedback.className = 'feedback feedback-incorrect';
      return;
    }
    const id = 'custom-' + Date.now();
    saveCustomList({ id, namePl: name, words });
    showHome();
  });
}

// ---------- Mode select (gap-fill vs sort) ----------
function showModeSelect(list) {
  app.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'screen mode-screen';
  wrap.innerHTML = `<h2>${escapeHtml(list.namePl)}</h2>`;

  const gapBtn = document.createElement('button');
  gapBtn.type = 'button';
  gapBtn.className = 'btn btn-primary btn-mode';
  gapBtn.textContent = t('modeGapFill');
  gapBtn.addEventListener('click', () => showLevelSelect(list));
  wrap.appendChild(gapBtn);

  const sortBtn = document.createElement('button');
  sortBtn.type = 'button';
  sortBtn.className = 'btn btn-primary btn-mode';
  sortBtn.textContent = t('modeSort');
  sortBtn.addEventListener('click', () => startGame(list, 'sort'));
  wrap.appendChild(sortBtn);

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'btn btn-secondary';
  backBtn.textContent = t('back');
  backBtn.addEventListener('click', showHome);
  wrap.appendChild(backBtn);

  app.appendChild(wrap);
}

// ---------- Level select (gap-fill only) ----------
function showLevelSelect(list) {
  app.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'screen level-screen';
  wrap.innerHTML = `<h2>${t('modeGapFill')}</h2><p class="instructions">${t('chooseLevel')}</p>`;

  [1, 2, 3].forEach((level) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-primary btn-mode';
    btn.textContent = t('level' + level);
    const score = getScore(`${list.id}:gapfill:${level}`);
    if (score) {
      const badge = document.createElement('span');
      badge.className = 'score-badge';
      badge.textContent = `${score.correct}/${score.total}`;
      btn.appendChild(badge);
    }
    btn.addEventListener('click', () => startGame(list, 'gapfill', level));
    wrap.appendChild(btn);
  });

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'btn btn-secondary';
  backBtn.textContent = t('back');
  backBtn.addEventListener('click', () => showModeSelect(list));
  wrap.appendChild(backBtn);

  app.appendChild(wrap);
}

// ---------- Game screen ----------
function startGame(list, mode, level) {
  app.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'screen game-screen-wrap';
  app.appendChild(container);

  const finish = (score) => showResults(list, mode, level, score);
  if (mode === 'gapfill') renderGapFill(container, list, level, finish);
  else renderSortWords(container, list, finish);
}

// ---------- Results ----------
function showResults(list, mode, level, score) {
  app.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'screen results-screen';
  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  wrap.innerHTML = `
    <h2>${t('resultsTitle')}</h2>
    <p class="results-score">${score.correct} / ${score.total} (${pct}%)</p>
  `;

  const againBtn = document.createElement('button');
  againBtn.type = 'button';
  againBtn.className = 'btn btn-primary';
  againBtn.textContent = t('playAgain');
  againBtn.addEventListener('click', () => startGame(list, mode, level));
  wrap.appendChild(againBtn);

  const homeBtn = document.createElement('button');
  homeBtn.type = 'button';
  homeBtn.className = 'btn btn-secondary';
  homeBtn.textContent = t('backToHome');
  homeBtn.addEventListener('click', showHome);
  wrap.appendChild(homeBtn);

  app.appendChild(wrap);
}

async function init() {
  builtinLists = await loadBuiltinLists();
  showHome();
}

init();
