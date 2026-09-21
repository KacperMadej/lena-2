// Thin wrapper around localStorage. Everything the app persists (custom
// word lists the parent/child created, and best scores per list+mode+level)
// lives under one key, as one JSON blob, so it stays easy to inspect/export.

const KEY = 'ewk_state_v1'; // "English Words for Kids"

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { customLists: [], scores: {} };
  } catch (e) {
    // Private browsing / storage disabled / corrupted JSON: fail soft.
    return { customLists: [], scores: {} };
  }
}

function writeAll(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    // Storage full or blocked — the app keeps working, it just won't persist.
    console.warn('Nie udało się zapisać danych lokalnie.', e);
  }
}

export function getCustomLists() {
  return readAll().customLists || [];
}

export function saveCustomList(list) {
  const state = readAll();
  state.customLists = (state.customLists || []).filter((l) => l.id !== list.id);
  state.customLists.push(list);
  writeAll(state);
}

export function deleteCustomList(id) {
  const state = readAll();
  state.customLists = (state.customLists || []).filter((l) => l.id !== id);
  writeAll(state);
}

// key example: "days:gapfill:1" or "colors:sort"
export function saveScore(key, score) {
  const state = readAll();
  state.scores = state.scores || {};
  const prevBest = state.scores[key];
  const prevRatio = prevBest ? prevBest.correct / prevBest.total : -1;
  const newRatio = score.correct / score.total;
  if (newRatio >= prevRatio) {
    state.scores[key] = { ...score, date: new Date().toISOString() };
    writeAll(state);
  }
}

export function getScore(key) {
  return readAll().scores[key] || null;
}
