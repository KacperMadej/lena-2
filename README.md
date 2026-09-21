# Angielskie Słówka ✏️

A tablet-friendly web app that helps a Polish-speaking child (~8 years old)
learn to **write** English words — not just recognize them. Built as a
static site with no backend and no build step, hosted on GitHub Pages.

## What's inside (v1)

- **Word lists** — predefined (days of the week, months, basic colors,
  numbers 1–20) or your own custom list, pasted or uploaded as CSV.
- **Uzupełnij luki (fill the gaps)** — three difficulty levels:
  1. Drag letter tiles into the missing gaps.
  2. Type the missing letters on an in-app English keyboard.
  3. Type the whole word from scratch.
  Every level shows the Polish word plus a 🔊 button that speaks the
  English word aloud, so hearing + reading Polish is how the child knows
  what to write.
- **Ułóż po kolei (sort into order)** — drag shuffled words back into their
  correct order (e.g. Monday → Sunday, one → twenty).

Works on tablet (primary target), phone, and desktop browsers — drag and
drop is built on Pointer Events so touch, mouse, and pen all work the
same way.

## Tech stack

Plain HTML/CSS/JS (ES modules). No framework, no bundler, no npm
dependencies. This keeps GitHub Pages deploys as simple as "push to
`main`" — see [`docs/RELEASE.md`](docs/RELEASE.md) for the release
procedure.

- Text-to-speech: the browser's built-in Web Speech API (no external
  service, works offline on-device).
- Drag and drop: hand-rolled with Pointer Events (`src/dragdrop.js`).
- Progress/custom lists: stored in the browser's `localStorage`, per
  device — there's no account system or server.

## Running locally

Because the app loads the predefined word lists with `fetch()`, opening
`index.html` directly (`file://...`) will fail silently in most browsers.
Serve the folder over HTTP instead, for example:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open the printed `http://localhost:...` address. Test on an actual
tablet/phone too if you can — open the same address from another device
on your network (most local servers print a LAN address for this).

## Adding your own word list from the UI

Use **"+ Dodaj własną listę"** on the home screen. Paste or upload a CSV
with this format:

```csv
english,polish,order
apple,jabłko,1
banana,banan,2
```

`order` is optional — it controls both practice order and the correct
order for the sorting game (leave it out and rows keep the order you
typed them in).

## Project structure

```
index.html          entry point
assets/style.css    all styling
src/                app logic (see docs/ARCHITECTURE.md)
data/*.csv          predefined word lists
docs/                internal/maintainer documentation (not part of the app)
```

## Deployment

Hosted via GitHub Pages, deploying straight from the `main` branch root —
no GitHub Actions workflow needed for this static, no-build project. See
[`docs/RELEASE.md`](docs/RELEASE.md) for the exact steps and a
pre-release checklist.

## License

MIT — see [LICENSE](LICENSE).
