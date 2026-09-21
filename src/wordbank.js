// Word list model + CSV parsing. The same parser is used for the shipped
// predefined lists (fetched from /data/*.csv) and for lists a parent/child
// pastes or uploads themselves, so there is exactly one CSV format to
// document: english,polish,order (order is optional).

export class WordList {
  constructor(id, namePl, words, isCustom = false) {
    this.id = id;
    this.namePl = namePl;
    this.words = words; // [{ en, pl, order }]
    this.isCustom = isCustom;
  }
}

function parseCSVLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

export function parseCSV(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  const rows = lines.map(parseCSVLine);
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const hasHeader = header.includes('english') || header.includes('polish');
  const start = hasHeader ? 1 : 0;

  const words = [];
  for (let i = start; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 2) continue;
    const en = row[0].trim();
    const pl = row[1].trim();
    if (!en || !pl) continue;
    const rawOrder = row[2] !== undefined ? row[2].trim() : '';
    const order = rawOrder !== '' && Number.isFinite(Number(rawOrder))
      ? Number(rawOrder)
      : words.length + 1;
    words.push({ en, pl, order });
  }
  return words;
}

const BUILTIN_FILES = [
  { id: 'days', file: 'data/days.csv', namePl: 'Dni tygodnia' },
  { id: 'months', file: 'data/months.csv', namePl: 'Miesiące' },
  { id: 'colors', file: 'data/colors.csv', namePl: 'Podstawowe kolory' },
  { id: 'numbers', file: 'data/numbers.csv', namePl: 'Liczby 1-20' },
];

export async function loadBuiltinLists() {
  const lists = [];
  for (const def of BUILTIN_FILES) {
    try {
      const res = await fetch(def.file);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      const words = parseCSV(text);
      if (words.length > 0) lists.push(new WordList(def.id, def.namePl, words, false));
    } catch (e) {
      // Most likely cause during local testing: the page was opened via
      // file:// instead of a local server, which blocks fetch(). See
      // README.md "Running locally".
      console.warn('Nie udało się wczytać listy "%s": %s', def.id, e.message);
    }
  }
  return lists;
}

export function sortedWords(list, mode = 'order') {
  const words = [...list.words];
  if (mode === 'order') {
    words.sort((a, b) => a.order - b.order);
  } else if (mode === 'alpha') {
    words.sort((a, b) => a.en.localeCompare(b.en));
  } else if (mode === 'random') {
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }
  }
  return words;
}
