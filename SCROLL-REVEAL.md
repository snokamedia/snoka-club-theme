# Scroll-Reveal Spec — snoka-club

How homepage sections animate on scroll, and the rule that decides *what*
exactly animates. Enforced with `snoka-intro-animate` (workspace plugin,
v1.3.x); verified with `pnpm validate:blocks` + headless DOM checks.

## The rule

**If a section has a background image or a dark background, animate the
contents inside it — never the whole container.**

Rationale:

- A full-bleed cover or ink band flashing/fading as one slab looks like a
  loading glitch. Text rising over a *stable* backdrop reads as intentional
  motion and keeps the backdrop painted the whole time (less repaint, no
  dark flash).
- On light/plain sections the container itself may animate — there is no
  heavy surface to flash, and moving the card/slab as one keeps the
  composition together.

Header/footer chrome never animates. It is interface, not content.

## The mechanism (snoka-intro-animate)

- One shared `IntersectionObserver` (10% visibility threshold) watches
  registered cards; each card animates once via the Web Animations API
  (600ms ease-out rise, 90ms stagger, DOM-order chaining across groups).
- No hidden-state CSS: content is fully visible with JS disabled and can
  never get stuck invisible. Cards already in view on page load still play.
- `prefers-reduced-motion` disables everything. No jQuery, no build step.
- Gated to `is_front_page()` / `is_home()` — hooks elsewhere are inert.
- Hook classes (all content-agnostic, picked up by one document query):
  - `.snoka-columns-intro` — group; direct `.snoka-column-intro`
    children stagger left-to-right (row by row, RTL-aware).
  - `.feature-block-grid` / `.feature-block-card` — same idea for
    feature-block grids.
  - Standalone `.snoka-intro` / `.snoka-column-intro` (not inside a
    group) — animates alone as its own one-card group. Several in a
    row cascade in DOM order via the shared cursor.
- One-shot: a card that plays never replays. Consequence (accepted):
  on a slow first paint, a below-fold card can intersect during early
  layout and spend its animation before the user scrolls to it. The
  content is still fully visible — nothing breaks, nothing sticks.

## Section map (front page)

| Section | Background | Hook | Why |
|---|---|---|---|
| Hero cover | Photo + contrast scrim | `.snoka-intro` on the eyebrow, H1, lede, and button row *inside* the cover | Rule: bg image → contents cascade up over the stable photo, each its own one-card group |
| Start here | Tertiary wash | `.snoka-columns-intro` group + `.snoka-column-intro` on the 3 cards | Light bg → container-level group stagger is correct |
| Coaching media-text | None (base) | `.snoka-intro` on the block | Plain section → whole-block rise |
| Juniors media-text | None (base) | `.snoka-intro` on the block | Same as above |
| Membership CTA band | Contrast (ink) | `.snoka-intro` on the H2, paragraph, and button row *inside* the band | Rule: dark bg → contents rise over the stable band, never the band itself |
| Visit / events columns | None (base) | `.snoka-columns-intro` group + `.snoka-column-intro` on the 2 columns | Light bg → group stagger |

## Authoring constraints (hard-won, do not relax)

1. **Block markup must round-trip.** Every `className` in a block comment
   must appear verbatim in the saved HTML or the editor flags the block
   for recovery. Verify with:
   `SNOKA_SANDBOX_DIR=<sandbox> pnpm validate:blocks`
   (expects `CLEAN — no invalid blocks`, static + rendered).
2. **Never hand-edit core-regenerated media markup.** The cover background
   `<img>` and media-text `<figure><img>` are rebuilt by core on
   serialize — extra attributes (`width`/`height`, `style`) invalidate
   the block. The hero cover keeps `min-height` so it never shifts;
   media-text images may shift layout on very slow loads (see one-shot
   note above — accepted, matches the demo).
3. **Keep hooks in template files, not the database.** No
   `wp_template`/`wp_template_part` overrides — the file is the source
   of truth and the validator reads the file.
4. **One concept per hook.** Don't stack group classes
   (e.g. a `.snoka-column-intro` inside a `.snoka-columns-intro` is one
   card of that group, never also standalone).

## Testing a change

1. `pnpm validate:blocks` (with `SNOKA_SANDBOX_DIR` pointed at a sandbox
   running this theme) — must be CLEAN.
2. Load the homepage headless, scroll each section into view, assert each
   animated node reports running WAAPI animations mid-flight and settles
   at opacity 1 with zero console errors. Past probes lived in
   `scripts/verify-*.mjs` (removed after use per local rules).
3. Toggle `prefers-reduced-motion` — everything must render static, no
   half-faded nodes.
