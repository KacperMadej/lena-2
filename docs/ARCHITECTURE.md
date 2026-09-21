# Architecture (internal)

## Overview

A single-page app, no framework, no build step. `src/app.js` is a small
hand-rolled router: it swaps the contents of `<main id="app">` between a
handful of "screens." Every module is a plain ES module imported with
native `<script type="module">` — no bundler resolves anything.

```
index.html
 └─ src/app.js  (screens: home → mode select → level select → game → results)
     ├─ src/wordbank.js   (WordList model, CSV parsing, built-in list loading)
     ├─ src/storage.js    (localStorage: custom lists + best scores)
     ├─ src/i18n/pl.js    (all UI strings)
     ├─ src/tts.js        (Web Speech API wrapper)
     ├─ src/dragdrop.js   (Pointer Events drag & drop, shared by both games)
     ├─ src/keyboard.js   (in-app English on-screen keyboard)
     └─ src/games/
         ├─ gapFill.js    (Game 1: fill the gaps, 3 levels)
         └─ sortWords.js  (Game 2: sort into order)
```

## Screen flow

```
Home (pick a list) ──► Mode select ──► Level select (gap-fill only) ──► Game ──► Results
      │                                                                            │
      └────────────────────────── "+ Dodaj własną listę" (CSV import) ◄───────────┘
                                                                     (back to Home)
```

Each `showXxx()` function in `app.js` fully replaces `app.innerHTML` and
wires up its own event listeners — there's no persistent DOM between
screens, which keeps state bugs from earlier screens leaking forward.

## Data model

A `WordList` (`src/wordbank.js`) is `{ id, namePl, words, isCustom }`
where `words` is `[{ en, pl, order }]`. `order` is the single field that
drives:

- practice sequencing in the gap-fill game (`sortedWords(list, 'order')`)
- the correct answer in the sorting game

Predefined lists live as CSV in `/data` and are fetched + parsed at
runtime (see README "Running locally" for why this needs an HTTP server,
not `file://`). Custom lists a user creates through the CSV-import screen
are parsed with the exact same `parseCSV()` function and persisted to
`localStorage` via `src/storage.js` — there is only one CSV format to
reason about anywhere in the codebase.

## Drag and drop

`src/dragdrop.js` exports one function, `makeSortable({ tiles, slots,
onChange })`, used by both games. It's built on **Pointer Events**
(not the HTML5 Drag and Drop API) specifically because native DnD does
not fire on touch devices — this app's primary target is a tablet, so
that was a hard requirement, not a preference.

Both games follow the same pattern: tiles start in a `.tile-tray`,
`.slot` elements are drop targets, and `onChange` is called after every
drop so the game can re-check whether the puzzle is complete. Dropping a
tile onto an occupied slot swaps the occupant back to where the dragged
tile came from, so reordering already-placed tiles "just works."

## Gap-fill level logic (`games/gapFill.js`)

- Gap count: `min(3, max(1, wordLength - 1))`, positions chosen randomly
  per word (recomputed each time a word is (re)rendered, so retries don't
  reuse the same gaps).
- Level 1 renders the missing letters as draggable tiles into `.slot`
  boxes (uses `dragdrop.js`).
- Level 2 renders the same gaps as empty boxes, advances one "active" gap
  at a time as the child taps letters on `keyboard.js`.
- Level 3 blanks out the whole word and reuses `keyboard.js` the same way,
  advancing through every letter instead of just the gaps.

All three levels funnel into one local `finish(isCorrect)` closure per
word so scoring/feedback/button rendering isn't duplicated three times.

## Why no framework

The app is small enough (2 games, list management, ~1000 lines of JS
total) that a framework would add a build step for little benefit, and a
build step is exactly what keeps GitHub Pages deploys simple (see
`RELEASE.md`). If the app grows substantially — more games, more complex
state — revisit this, but treat it as a deliberate tradeoff to re-examine,
not a default to abandon casually.

## Known v1 limitations / natural v2 extensions

- No adaptive difficulty — level is chosen manually, not based on mastery.
- No per-word mastery tracking, only a best score per list+mode(+level).
- No offline/PWA support (no service worker) — TTS works offline since
  it's on-device, but the page itself needs a network hit to load once.
- No i18n beyond Polish — `i18n/pl.js` is a flat dictionary rather than a
  locale-switching system, since a second language isn't in scope yet.
