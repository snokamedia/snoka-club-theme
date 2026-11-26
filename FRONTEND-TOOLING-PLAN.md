# Frontend Tooling Plan — snoka-club

Status: LOCKED (2026-10-28, per owner). Block theme. React islands.
TypeScript. Vite. swup on all frontend pages. Plan complete — build in
progress (P1).

Locked decisions:
- Stay block theme (no classic rewrite).
- `src/islands.tsx`: ONE React entry (dialog + toast host share the runtime),
  deferred, mounts on `[data-island]` nodes. React 19 bundled in (never in
  editor/admin). `@tabler/icons-react` inside islands only.
- TypeScript strict (`tsc --noEmit` in the chain). JS+JSDoc rejected.
- swup on every frontend page with portal/admin/login/logout/customizer
  exclusions; disabled under `prefers-reduced-motion`.

## 0a. Plugin-absent stub policy (snoka-access missing from tree)

Theme builds and ships with zero plugin calls: no `function_exists` checks
needed because there are no calls at all — portal links are plain `/portal/`
URLs in markup, the dialog/toast islands are self-contained, and no template
invokes the `[snoka_access_portal]` shortcode. When the plugin returns, nothing
in the theme changes; `/portal/` links and deep links (`/portal/#/notices`,
`#/library`, `#/forms`, `#/ballots`) resolve again on their own. Sandbox smoke
test until then: front `/` must 200 with zero console errors; `/portal/`
(plain page with unresolved shortcode) must not white-screen the theme.

## 0. Corrections to the proposal (read first)

1. **`@easeui/toast` does not exist** (registry 404). Dropped. `@base-ui/react`
   (verified v1.9.0) ships its own `./toast` export — toasts are covered with
   zero extra dependencies.
2. **`@tabler/icons-react` is the wrong package for theme PHP.** It is React-only;
   it cannot render in server-side templates. Two-track approach:
   - PHP/block output: keep the existing vendored-sprite system (`assets/icons/`
     + `inc/icons.php`, 26 icons already vendored) and add a sync script that
     pulls from `@tabler/icons` (verified v3.50.0, vanilla SVGs, MIT).
   - React islands only: `@tabler/icons-react` (matches the snoka-access plugin
     spec, same icon names, same stroke style).
3. **The pasted classic-theme architecture doc does not apply to this theme.**
   This is a block theme (FSE): no `header.php`/`footer.php`, no
   `Walker_Nav_Menu` (the Navigation block owns menus), no `$content_width`,
   no `index.php` minimum. Converting to classic would be a full rewrite for
   no payoff and would fight the Site Editor. Recommendation: **stay block
   theme** and adopt only the portable parts of that doc: enqueue discipline,
   Vite manifest-driven loading, accessibility minimums, verification chain.
   The `functions.php`-as-loader pattern already exists here
   (`inc/block-support.php`, `inc/icons.php`, etc.); this plan deepens it.

## 1. Verified dependency set (all MIT, all exist today)

| Package | Verified version | Role |
|---|---|---|
| `swup` | 4.10.0 | page transitions |
| `@swup/a11y-plugin` | 5.2.1 | focus management + announcements on transition (WCAG 2.2 requirement, not optional) |
| `@swup/head-plugin` | 2.3.1 | keep `<head>` (title, meta, styles) in sync across transitions |
| `@swup/preload-plugin` | 3.2.12 | hover/viewport preloading (pairs with core speculation rules) |
| `@base-ui/react` | 1.9.0 | headless Dialog + Toast (+ Accordion/Popover if needed) for React islands |
| `@tabler/icons` | 3.50.0 | build-time SVG source for the PHP sprite (`devDependency`) |
| `@tabler/icons-react` | — | React islands only (same names as PHP side) |

## 2. Build system: Vite + manifest-driven PHP loader

- `pnpm` only (workspace rule). New files: `package.json`, `vite.config.mjs`
  (`base: /wp-content/themes/snoka-club/dist/`, `build.manifest: true`,
  entries below), `.eslintignore` for `dist/`.
- New `inc/assets.php`: static-cached `.vite/manifest.json` reader, hashed entry
  enqueue with `type="module"` via `script_loader_tag`, `wp_set_script_translations`.
  Replaces the hardcoded `wp_enqueue_style` in `functions.php`.
- Entries (each independently enqueued, conditional loading per doc §"Enqueue discipline"):
  - `src/main.js` (vanilla, every page): mobile nav behavior, skip-link fixups,
    footer year, copy-phone/email buttons.
  - `src/transitions.js` (vanilla, frontend only — never editor, never login):
    swup + the three plugins. Gated on `prefers-reduced-motion: no-preference`
    (JS `matchMedia` check; no transition when reduced motion).
  - `src/islands/emergency-dialog.jsx` (React, deferred): Base UI Dialog with
    emergency contacts. Mounts on `[data-island="emergency-dialog"]`.
  - `src/islands/toasts.jsx` (React, deferred): Base UI Toast host for
    copy-to-clipboard confirmations and portal handoff notices.
- `dist/` committed (theme runs straight from git on the DDEV bind mount).
- Dev: `pnpm dev` (Vite) + browser reload; `src/` is the only linted JS scope.

## 3. swup integration rules (block theme + portal constraints)

- Container: pin to the `<main>` element core renders. Verify the actual selector
  in the sandbox (`curl` the front page, confirm `id="wp--skip-link--target"` or
  whatever core emits); set `containers: [verified]`. Header/footer persist across
  transitions by design. Fallback if core changes markup: a `render_block` filter
  adding the container id — decide at implementation, do not pre-build both.
- Exclusions (non-negotiable): `/portal/*` (React HashRouter SPA — swup hijacking
  it breaks login, voting, and file downloads), `/wp-admin/*`, `/wp-login.php`,
  hash-only links, file downloads. swup `linkSelector` + `ignoreVisit` accordingly.
- `inc/performance.php`: add `/portal/*` to speculation-rule excludes (same reason:
  no prerendering the portal app or its REST-backed views).
- No-JS: everything works without swup (`<noscript>`-clean by construction —
  swup only enhances; links are real links). Test with JS disabled, per the a11y doc.
- Site Editor: transition bundle never enqueues in `enqueue_block_editor_assets`
  or the iframe preview.

## 4. Icons: two tracks, one name set

- PHP side (existing, keep): allowlist in `inc/icons.php` + vendored SVGs. Add
  `pnpm icons:sync` — copies allowlisted names from
  `node_modules/@tabler/icons/icons/<name>.svg` into `assets/icons/`, normalizes
  to `fill="none" stroke="currentColor"` (satisfies the workspace SVG rule and
  matches Tabler outline style). Allowlist additions are a conscious diff.
- Condo gaps in the current 26-icon set: `bell` (notices), `files`/`folder`
  (library), `clipboard-list` (requests), `checkbox`/`vote` (ballots),
  `building-community`/`building` (corp), `alert-triangle` (emergency),
  `lifebuoy` (after-hours). Add at implementation.
- React islands: `@tabler/icons-react`, same names. Visual parity with the plugin
  for free.

## 5. Accessibility contract (WCAG 2.2 AA, from the pasted doc)

- Measured 2026-10-28 (computed, not guessed): primary `#1F4A5E`/white **9.55:1**
  (AAA), contrast bg **15.81:1**, **secondary `#A86B2C`/white 4.37:1** — passes
  large-text/UI (3:1) but **fails body text (4.5:1)**. Rule: secondary never body
  copy, never small links; if the real corp brand needs copper body text, darken
  to `#8A5A24`-ish and re-measure before shipping.
- swup transitions: `@swup/a11y-plugin` handles focus-to-main + live-region
  announcement; transitions fully disabled under `prefers-reduced-motion`.
- Checklist per template: skip link first in DOM, one `h1`, no skipped levels,
  icon-only buttons get `aria-label`, `aria-current="page"` on active nav item
  (Navigation block does this; verify after swup replaces `<main>` — nav persists,
  but active states need a `visit:end` refresh hook), every input labeled,
  44px targets, 200% zoom sanity.
- Verification: static markup walk + keyboard walk (tab every page, operate every
  control) + Lighthouse a11y on front + `/portal/` link path. Report only numbers
  actually run.

## 6. Verification chain (adapted to themes)

Per template file / behavior change, stop at the first red:

1. `pnpm build` (Vite manifest regenerates; no stale hashes).
2. `pnpm typecheck` (`tsc --noEmit`) + `pnpm lint` (`eslint ./src/`).
3. `phpcbf --standard=WordPress` on touched PHP (WSL, explicit paths only).
4. `phpstan` — check `scripts/qa/run-phpstan.php` theme support first; else run
   phpstan directly with a theme-level config.
5. Theme Check plugin in `snoka-access-sandbox` (install + run, fix errors).
6. Sandbox smoke: front `/` 200, `/portal/` 200 + SPA root renders, swup on/off,
   JS-disabled pass, zero console 404/500.
7. Commit (project git identity) → `backup.sh --theme snoka-club`.

## 7. Phased implementation

- P1: scaffolding — DONE 2026-10-28: `package.json`, `vite.config.mjs`,
  `tsconfig.json`, `inc/assets.php`, `src/main.ts`, `src/transitions.ts`,
  manifest loader wired, swup exclusions. (Note: `/portal/*` speculation
  exclude deferred — `inc/performance.php` untouched until the plugin returns,
  to keep this phase diff reviewable; swup-side exclusions are live.)
- P2: islands — DONE 2026-10-28: emergency dialog + toast host (single
  `src/islands.tsx` entry) + mount points in front template/footer part.
- P3: icons — sync script, condo icon gaps, replace any emoji/placeholder glyphs.
- P4: a11y lockdown — contrast rule enforcement, focus/keyboard walks, Lighthouse,
  Theme Check clean.

## 8. Build log (P1+P2, 2026-10-28 — all verified, no guessing)

Resolved versions (`pnpm-lock.yaml` committed): `vite@8.3.5`,
`@vitejs/plugin-react@6.1.2`, `typescript@5.9.3` (deliberately not TS 7.x —
native port, ecosystem unproven), `eslint@10.13.0`,
`@wordpress/eslint-plugin@28.0.0`, `react@19.3.1` + `react-dom@^19`,
`@types/react(-dom)@19.3.0`. Peer warnings are transitive lint-plugin noise
(`eslint-plugin-import/jsx-a11y/react` cap at eslint 9, vitest plugin wants
TS≥6) — lint run itself is clean.

API corrections found by reading installed `.d.ts` (not docs):
- swup v4 `visit:end` payload is `undefined` — refresh nav from
  `window.location.href`, never from a visit object.
- Base UI v1 toast manager is `Toast.useToastManager()` on the namespace
  (not a subpath export); `Toast.Root` requires the `toast` object prop —
  declarative children-only usage does not exist.
- `@tabler/icons-react@3.50.0` has no `IconSiren` (no siren at all) —
  emergency trigger uses `IconAlarm`.
- React 19 types have no global `JSX` namespace — `import type { JSX }`.
- Core auto-adds `id="wp--skip-link--target"` to a `tagName:main` group, so
  future templates only need the tagName; the explicit anchor stays on the
  front page as documentation.
- `.eslintrc.js` removed: ESLint 10 cannot load it. Flat `eslint.config.mjs`
  with the same WP preset + the mandated `no-use-before-define` override
  (rule confirmed present in typescript-eslint v8).

Chain green: `pnpm build` (main 0.5kB, transitions 38kB, islands 300kB/95kB
gzip deferred) → `tsc --noEmit` → `eslint ./src/` → `phpcbf WordPress` on
touched PHP. Sandbox: front `/` 200 (main landmark, both island mounts, 3
module scripts + transition CSS all 200), `/portal/` 200 with theme chrome
intact despite the missing plugin.
- Two `h1`s on the front page (site title + hero) left as-is: core default
  behavior, revisit in P4 if Theme Check flags it.
