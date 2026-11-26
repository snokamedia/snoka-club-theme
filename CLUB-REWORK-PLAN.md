# Snoka Club — Theme Rework Plan

> Source theme: `snoka-club` (currently generic "Snoka Block Theme" v0.1.0, block-first, theme.json-driven).
> Goal: rework into a purpose-built condominium corporation website theme.
>
> ## 0. Locked scope (2026-10-28, per owner)
>
> - **Identity:** generic/placeholder condo corp (e.g. "Sandbox Condo"). No real corp name, no real branding yet. Theme must make rebranding trivial later (tokens + site title/logo, no hardcoded corp name in templates).
> - **Pages:** one page for now — the front page. It doubles as the snoka-access test surface (public condo info + portal entry).
> - **Sandbox:** `sites/snoka-access-sandbox` (`https://snoka-access-sandbox.ddev.site`). Plugins already active: `snoka-access` 1.0.0, `snoka-email-core`, `snoka-express-login`, `mailpoet`. Portal page `/portal/` exists. Active theme is still `twentytwentyfive` — mounting + activating this theme is part of the work.
> - **Plugin:** `snoka-access` owns membership/files/notices/requests/votes. Theme owns presentation only: header/footer, front-page pattern, portal-entry CTA, notice-bar slot. No CPTs in theme, no duplicate portal UI, Tabler icons stay in plugin (theme uses core blocks; stroke SVGs only if needed in buttons).
> - **Language:** English only. Translatable strings now, no translation workflow.
> - **Later (out of scope):** real corp identity, full IA (documents/board/fees/amenities pages), payments, booking, multilingual.

## 1. Current state (verified 2026-10-28)

- `style.css`: generic framework header — `Theme Name: Snoka Block Theme`, `Text Domain: snoka-block-theme`, GPL. Must be renamed/rebranded.
- `theme.json` v3: generic palette (Primary `#005177`, Secondary `#C2571B`, Base/Contrast/Tertiary), system serif/sans fonts, fluid type, 680px/1200px layout. No condo identity.
- `functions.php`: behavior-only, no CPTs (by design — plugins own content model). Constants `SNOKA_BLOCK_THEME_VERSION` / `SLUG` still generic.
- `templates/` (21): generic blog/commerce set — `front-page`, `home`, `single`, `archive`, `archive-product/tour/event/project`, `single-product`, `404`, `search`, etc. No condo templates (notices, documents, board, amenities, contact/emergency).
- `parts/` (10): 4 headers, 3 footers, pre-header bar, 2 sidebars. Pre-header bar is the right slot for emergency/notice bar but currently generic.
- `patterns/` (16): generic business/tourism — heroes, CTA variants, pricing-table, testimonials, team-grid, events-list, services-grid. `team-grid` and `events-list` are the closest reusable seeds for Board and Notices.
- `inc/`: `block-support.php`, `icons.php`, `rest-extras.php`, `template-tags.php`, `performance.php` — all generic.
- No condo-specific styles, no resident-portal hooks, no document-library UI, no maintenance-request flow.

## 2. Rework goals

1. Rebrand from generic framework to condo-corp identity (name, slug, text domain, tokens).
2. Serve two audiences: **public** (buyers/realtors/visitors) + **residents/owners** (notices, documents, contacts, rules).
3. Prioritize legibility, accessibility (older residents), and findability (board info, fees, bylaws, emergencies, contacts in ≤2 clicks).
4. Keep content model clean: theme owns presentation (templates/parts/patterns/styles); structured content (notices, documents, amenities) preferably in a companion plugin — decision needed.
5. Stay block-first, Site Editor native, no page-builder lock-in.

## 3. Proposed phases

### Phase 0 — Identity + decisions (blocks everything below)
- Rename theme: `snoka-club`, text domain, constants, headers.
- Lock condo palette/typography (trustworthy, high-contrast, accessible).
- Decide content ownership: theme-only vs. companion plugin (`snoka-condo`?) for Notice / Document / Amenity / Board Member CPTs.
- Decide resident area: public pages only vs. password-protected pages vs. membership plugin.

### Phase 1 — Design tokens (`theme.json`, `styles/`)
- New palette (e.g. deep navy/slate + warm accent), high-contrast link/focus states.
- Readable body type (system or Inter/Source Sans), larger base size option, generous line-height.
- New button, notice/alert, card, table (fee schedules), and document-row styles.
- Style variations if one theme must serve multiple corps (e.g. `styles/corp-a.json`).

### Phase 2 — Header / footer / navigation (`parts/`)
- `pre-header-bar` → emergency + active-notice bar (phone, after-hours, water shutoff alerts).
- Header: corp logo/wordmark, resident-login link, emergency phone, simplified nav (Notices, Documents, Board & Management, Amenities, Fees & Forms, Contact).
- Footer: corp legal name + registration number, management company + hours, emergency contacts, address/parking, privacy + condo-docs links.

### Phase 3 — Templates (`templates/`)
- Now: `front-page.html` only (one-page scope). Public condo hero + portal entry (`/portal/` link, link-request entry point) + emergency/management contact strip. All corp strings via Site Editor content, not hardcoded.
- Keep valid: `index`, `page`, `404`, `search` fallbacks so Theme Check passes.
- Later (deferred): `archive-notice` / `single-notice`, `page-documents`, `page-board`, `page-amenities`, `page-fees-forms`, `page-contact-emergency`. Retire `archive-product`, `single-product`, `archive-tour` when full IA lands.

### Phase 4 — Patterns (`patterns/`)
- New: `notice-alert-banner`, `notices-list`, `document-library`, `board-grid`, `contact-directory`, `fee-schedule-table`, `amenity-cards`, `emergency-steps`, `meeting-minutes-list`, `hero-club`.
- Rework: `hero-business` → condo hero; `team-grid` → board; `events-list` → notices/meetings; `cta-newsletter` → notice-signup.
- Remove or archive tourism/commerce patterns (`pricing-table`, `hero-cover-tourism`, `cta-donation`).

### Phase 5 — Behavior (`inc/`, `functions.php`, `assets/`)
- Rename functions/constants to `snoka_club_*`.
- Notice ticker / alert dismissal (small vanilla JS, no framework).
- Document helpers: file-type icons, file-size display, "updated" dates.
- Accessibility pass: skip links, focus styles, keyboard nav, contrast ≥ 4.5:1, reduced-motion.
- Performance: keep system fonts if possible; preloading only if custom fonts chosen.

### Phase 6 — Sandbox wiring + QA
- Add bind mount for this theme in `sites/snoka-access-sandbox/.ddev/docker-compose.mounts.yaml`, `ddev restart`, activate theme, assign static front page.
- Seed generic demo content on the one page (no real corp data; "Sandbox Condo" placeholder).
- Quality gate per AGENTS.md: PHPCBF on changed PHP (WSL), Theme Check, `syntax-check`.
- Manual smoke test (mandatory): load front page + `/portal/` with zero console 404/500, portal login-link flow still works, header/footer render on both.

## 4. Out of scope (unless requested)
- Resident portal with logins/permissions (needs membership plugin).
- Online payments (needs payment provider + plugin).
- Amenity booking system (needs booking plugin).
- Multilingual (needs Polylang/WPML decision).
- Migration of old site content.

## 5. Open questions — answered 2026-10-28 (see §0). Remaining: real corp name/branding, full IA go-ahead.

## 6. Status (2026-10-28)

Done: rebrand (`snoka-club` slug/domain/functions), condo palette
(#1F4A5E / #A86B2C), one-page `front-page.html`, new `hero-club` pattern,
pre-header/header/footer with placeholders + `/portal/` links, sandbox mount
+ activation in `snoka-access-sandbox`. Front `/` and `/portal/` both 200,
portal SPA root renders. PHPCBF clean, `php -l` clean.

Deferred: full IA templates, document/board/fee pages, commerce pattern
cleanup, real corp identity.
