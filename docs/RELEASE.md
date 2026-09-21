# Release procedure (internal)

This project has no build step and no backend, so "releasing" is
deliberately simple: **merging to `main` is the release.** This doc exists
so that stays true on purpose, rather than by accident — read it before
changing how deployment works.

## How GitHub Pages is configured

- Repo Settings → Pages → **Source: Deploy from a branch**
- Branch: **`main`**, folder: **`/ (root)`**
- No GitHub Actions workflow is used for deployment. Do not add one for a
  plain rebuild-and-push unless the project actually gains a build step
  (e.g. a bundler) — it would just add a point of failure for no benefit.
- A push to `main` triggers Pages' own build automatically. Check
  progress under repo → **Actions** tab (Pages creates its own workflow
  run even without a custom one) or Settings → Pages, which shows the
  last deployment time and a link to the live URL.

## Versioning & cache-busting

GitHub Pages' CDN and browsers both cache aggressively. `index.html`
references `assets/style.css` and `src/app.js` with a `?v=X.Y.Z` query
string:

```html
<link rel="stylesheet" href="assets/style.css?v=0.1.0" />
<script type="module" src="src/app.js?v=0.1.0"></script>
```

**Bump both `?v=` values on every release that changes CSS or JS**, or
returning visitors (this is a tablet the same kid uses daily — it *will*
have a warm cache) may keep running the old code. There's no build step to
automate this yet, so it's a manual step — see the checklist below.

Keep a single source of truth for the version: add it as a comment at the
top of `src/app.js` (`// v0.1.0`) and match it in `index.html`.

## Pre-merge checklist

1. Bump the `?v=` query strings in `index.html` if CSS/JS changed.
2. Run through [`CONTRIBUTING.md`](../CONTRIBUTING.md)'s testing checklist
   — tablet, phone, desktop, drag-and-drop, speaker button.
3. Serve locally over HTTP (not `file://`) and confirm all four predefined
   lists load (`days`, `months`, `colors`, `numbers`) — a silent `fetch()`
   failure is the most common local-only bug (see README "Running
   locally").
4. Merge to `main`.
5. Wait ~1 minute, then open the live Pages URL in a **private/incognito
   window** (bypasses your own browser cache) and spot-check the change.

## Rollback

If a merge to `main` breaks the live site:

```bash
git revert <bad-commit-sha>
git push
```

Pages redeploys automatically from the new `main` HEAD, same as any other
push — there's no separate "previous version" to restore from, since the
deployed site always mirrors `main`.

## Things that would change this procedure

Flag these explicitly in a PR description if you're introducing them,
since they change the release model described above:

- **Adding a bundler/build step** → deployment would need to move to a
  dedicated `gh-pages` branch built by a GitHub Action, since Pages can't
  run a build itself when serving from `main`.
- **Adding a backend or API key** → no secrets exist in this repo today;
  introducing one means adding it to repo Settings → Secrets, never
  committing it, and documenting rotation here.
