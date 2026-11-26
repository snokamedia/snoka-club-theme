# Design Methods & Standards — snoka-club

Date: 2026-10-28. Evidence-backed; every claim below was checked, not assumed.

## 1. WordPress version status

- Sandbox runs **7.1.4** (verified: `wp core version`). Current. No upgrade work.
- Theme header said `Tested up to: 6.8` — stale. Bumped to **7.1** this turn
  (`style.css`). `Requires at least: 6.6`, `Requires PHP: 8.1` unchanged.
- `theme.json` `$schema` tracks trunk; no 7.x-deprecated APIs in use
  (no `view-transitions` support flag — correctly omitted per prior runtime check).

## 2. Architecture decisions (what was built and why)

- **Block theme, not classic.** Full-site-editing, `theme.json` tokens, `.html`
  templates/parts, PHP patterns. The classic boot-chain/nav-walker model does
  not apply; adopting it would be a rewrite against the platform direction.
- **Tokens in `theme.json`, behavior in PHP.** Palette, type scale, spacing,
  radii, shadows, layout widths live in `theme.json`. `functions.php` is a
  loader for `inc/` modules only; no content model in the theme (portal data
  belongs to snoka-access).
- **Vite + TypeScript build, manifest-driven enqueue** (`inc/assets.php`).
  Three entries: `main` (vanilla globals), `transitions` (swup), `islands`
  (one React 19 entry: Base UI dialog + toast host). Deferred, never in
  editor/admin/customizer preview. `dist/` committed so the theme runs from git.
- **swup page transitions** with hard exclusions (`/portal/*` React SPA,
  wp-admin/login/logout, customizer), reduced-motion gate, overlay auto-close,
  nav `aria-current` refresh.
- **Quality chain per change**: build → `tsc --noEmit` → eslint (flat, WP
  preset) → PHPCBF (WordPress) → sandbox smoke (front 200, portal 200, assets
  200) → commit → workspace backup.

## 3. The block-recovery problem (Edit Site shows invalid blocks)

**Mechanism.** The editor re-validates saved markup against each block's save
function. Hand-written template/pattern HTML that differs by even one class
or attribute from core's expected output flags the block for recovery. This
is a build-method failure: I authored markup by hand instead of validating it.

**Checked and eliminated (evidence):**
- Editor-generated layout classes (`is-layout-*`, `wp-container-*`) in
  theme source: **none found** (grep over templates/parts/patterns).
- Image `scale` attribute: **valid** — exists in core's image `block.json`
  (verified in the sandbox's `wp-includes`).

**Prime suspects (unverified without the editor — stated as suspects, not facts):**
- Hand-written Cover save markup (`hero-club.php`): class list/order,
  `has-background-dim-60`, `data-object-fit`, inner-container structure,
  `url`-without-`id` + `alt` handling. Cover is the most validation-sensitive
  core block and the most likely offender.
- Group `anchor` + `tagName:main` rendering, outline button class string,
  image `sizeSlug` + explicit dimensions combination.

**Prescribed fix (needs owner go-ahead, then I build it):**
1. `pnpm validate-blocks`: node harness using `@wordpress/blocks` `parse()`
   (which sets `isValid` per block) over every template/part plus every
   pattern's rendered output. Registers core blocks from
   `@wordpress/block-library` in node.
2. Fix-until-clean: correct markup to core's save output, never the reverse.
3. Editor re-test protocol: open Edit Site, front-page template, and each
   pattern — zero recovery prompts — before the fix is declared done.
4. Standing rule added to the plan: no hand-written block markup merges
   without a clean harness run.

## 4. Icon method vs. core standards (corrected 2026-10-28)

**Correction to the 2026-10-27 version of this section:** the claim
"WordPress ships no theme icon API" is stale. 7.0 added the `core` icon
collection and the dynamic `core/icon` block; 7.1 made registration public
(`wp_register_icon_collection()`, `wp_register_icon()`, `wp_get_icon()`).
The hybrid proposal below (copying core SVGs into the theme) is **retracted**:
`core/search` is already registered — copying it would duplicate GPL assets
under a second name. This section replaces it.

**What I built.** `assets/icons/*.svg` (34 files) + allowlist in `inc/icons.php`
(`snoka_club_icon()` / `..._icon_url()`) + `pnpm icons:sync` pulling
from `@tabler/icons` (MIT). Rationale at the time: Tabler outline icons
satisfy the workspace SVG rule (`fill="none" stroke="currentColor"`, safe in
buttons), and the names match the snoka-access plugin's `@tabler/icons-react`
set for visual parity. That helper **bypasses the registry**, which is why
Tabler outlines still work there — and why registry rules must never touch it
(see guardrails below).

**Sandbox registry check (7.1.4, verified via `wp_get_icon()`, not docs):**

| Name | Renders? | Notes |
|---|---|---|
| bell, file, calendar, check, home, menu, search, quote, info, plus, arrow-right, arrow-left, chart-bar | ✅ (13 names) | byte lengths 190–567 recorded in session log |
| star, gift, close, edit, page, media, post, groups, yes, megaphone, pin | ❌ | exist in Gutenberg trunk `@wordpress/icons`, **absent** on 7.1.4 — trunk coverage ≠ registry coverage |
| lifebuoy, building, folder, clipboard, checkbox, phone | ❌ | absent on both |

Sampled `core/bell` output: single filled `path`, no `stroke`, no `fill` —
paints black outside `.wp-block-icon` (where core CSS sets `fill: currentColor`).
Raw Tabler files (`fill="none" stroke="currentColor"`, often with extra
elements) do not survive the 7.1.4 sanitizer (allowlist: `svg/path/polygon`
only); pointing `wp_register_icon()` at them renders wrong shapes.

**Decision (locked — corrected after owner feedback): Tabler, inline.**
The owner said Tabler, and the registry cannot carry strokes, so the portal
surface uses Tabler glyphs inlined via `wp:html` + the allowlisted helper
(`bell`, `files`, `clipboard-list`, `checkbox` at 48px, `stroke="currentColor"`,
decorative `aria-hidden`). This gives what `<img>` could not: color inheritance
(including dark surfaces) and zero extra requests — with no save-drift, as the
`wp:html` block stores raw markup and `validate:blocks` proves it clean.
- `Requires at least` stays 6.6: no registry API ships, no Icon blocks ship.
  The `snoka-club/*` collection is deferred until fill-safe gap icons
  exist; the two hand-drawn fills were removed rather than ship lookalikes.
- `pnpm validate:icons` still guards any future `wp:icon` name.

## 5. Decisions needed from the owner

1. Approve the block-validation harness + fix-until-clean pass (§3)?
2. Icon decision recorded above (§4) — standing unless challenged: helper for
   stroke/parity, registry only where a surface is fully covered, no empty
   collection, bump `Requires` with the first registry-using change.

## 6. Follow-up (2026-10-28): custom icon block + runtime gate

- `snoka-club/icon` dynamic block added (Tabler glyphs as real,
  editor-pickable blocks; server-rendered through the allowlisted helper;
  `save()` returns null so save-drift is impossible). Portal cards use it;
  the frontend `wp:html` workaround is gone. `validate:blocks` green.
- `pnpm smoke:runtime` added after a production-only crash (Base UI #73:
  `useToastManager()` called outside its provider — invisible to tsc, Vite,
  and ESLint, caught only by executing the bundle under jsdom). Fixed by
  moving the hook inside `<Toast.Provider>`; the gate fails on the old bundle
  and passes on the new one.
