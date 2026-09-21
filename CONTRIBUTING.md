# Contributing

Thanks for helping improve Angielskie Słówka! This is a small, dependency-free
static site — the goal is to keep it that way, so anyone can clone it and
start editing without an install step.

## Code style

- Plain ES modules, no bundler, no framework. If a change seems to need a
  build step, that's a sign to reconsider the approach first.
- 2-space indentation, semicolons, `const`/`let` (no `var`).
- All user-facing text goes through `src/i18n/pl.js` (the `t()` helper) —
  no hardcoded Polish strings in the game/app logic.
- Keep modules focused: one file per concern (see
  [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the current map).

## Adding a new predefined word list

1. Add a CSV file to `data/`, following the existing format:
   `english,polish,order`.
2. Register it in `BUILTIN_FILES` in `src/wordbank.js`.
3. Test it in both games — some words may need the gap-count logic in
   `gapFill.js` double-checked for very short words (2–3 letters).

## Adding a new game

- Put it in `src/games/`, exporting a `renderXxx(container, list, ...args, onFinish)`
  function, mirroring `gapFill.js` / `sortWords.js`.
- Call `onFinish(score)` with `{ correct, total }` when the round ends, so
  it plugs into the existing results screen and score storage in `app.js`.
- Reuse `src/dragdrop.js` for any drag interaction rather than writing a
  new drag implementation — it already handles touch/mouse/pen uniformly.

## Testing checklist before opening a PR

Since there's no automated test suite, please manually check:

- [ ] Tablet (the primary target) — Chrome/Android or Safari/iPadOS
- [ ] Phone — at least one of Chrome/Android or Safari/iOS
- [ ] Desktop browser (for quick iteration) — Chrome/Firefox/Edge
- [ ] Drag-and-drop works with touch **and** mouse
- [ ] The speaker button either plays audio or is hidden — never a dead
      button (test with system volume off, since some CI/emulators report
      no voices at all)
- [ ] New/changed strings are in `src/i18n/pl.js`, not inline

## Internal docs

- [`docs/RELEASE.md`](docs/RELEASE.md) — how releases/deploys actually work
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — module map and data flow
