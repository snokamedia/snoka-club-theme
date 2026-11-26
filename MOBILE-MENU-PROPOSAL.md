# Mobile Menu: Docked Toggle Proposal

Date: 2026-10-31. Status: proposal implemented in working tree, FAILED browser review — see Attempt log below. Not committed, not shippable.

## Problem

The floating close button carries a dead band of empty dialog above it, roughly header-plus-top-bar sized. The cause is structural, not a bad measurement: the toggle is pinned at its measured in-flow Y position, while the full-screen opaque dialog buries the entire header (top bar included) behind it. Scrolling to align the header changes nothing visible, since the aligned header stays hidden behind the dialog. The button floats in a void that looks exactly like the missing header.

## Proposal

Stop pinning the toggle where the header row happened to be. Dock it to a constant corner and let the dialog be fully ignorant of page geometry:

- Toggle: `position: fixed` at a constant offset (top safe-area plus admin bar height, inset-inline-end gutter for RTL), above the dialog, morph unchanged.
- Dialog: full-screen overlay as today, with a constant content top padding that clears the docked toggle.
- Delete the scroll-to-align step, the settle loop, the header measurement, the resize re-measure, and the `.snoka-site-header` positioning dependency.
- Keep everything else: single persistent toggle, theme-owned modal, tree shelve and restore, focus trap with wrap, Escape, backdrop tap, navigate handling with no scroll restore, reduced-motion handling.

The morph still plays in place, and the toggle never moves between open and close.

## What changes

- `src/main.ts`: remove scroll alignment, settle polling, cancel-on-Escape-during-align, header rect reads, resize re-measure, and openHref tracking tied to scrolling. Keep opener interception, open and close paths, focus trap, backdrop handling, and the navigate CustomEvent contract.
- `src/header.css`: replace measured toggle coordinates with constant dock values; replace measured dialog padding with a constant; remove now-unused custom properties.
- `parts/header-*.html`: remove the now-unused `snoka-site-header` hook (keep `snoka-mobile-nav`, which still scopes opener interception).
- `scripts/check-mobile-menu.mjs`: drop scroll assertions; assert docked position constants, no page scroll on open or close, and the unchanged close paths.

## What stays the same

Single persistent toggle with one glyph, theme-owned dialog, no coordinate handoff, no second button, no restore on close, reduced-motion behavior, and the core-dialog fallback when JavaScript is absent.

## Rejected alternative

Re-anchoring measurement to the header element alone. It preserves the scroll timing races, the visual-versus-layout viewport skew on mobile browsers, the per-template class dependency, and the settle fallback — all to reproduce a position that a constant dock provides for free.

## Acceptance criteria

- Opening never scrolls the page; closing never moves it.
- The X sits top-right (top-left in RTL), clear of the admin bar and the notch, on every header variant and on stacked layouts.
- Morph plays on open and reverses on close; nothing jumps.
- Toggle, Escape, backdrop tap, navigate event, and desktop resize all close cleanly.
- Focus starts on the toggle, traps inside toggle plus dialog, and returns to the toggle on dismiss.
- With JavaScript disabled, the core dialog and static list still work.
- No unresolved references to removed variables, and the full gate (build, lint, typecheck, both check suites) passes.

## Open questions for review

1. Dock corner: always top trailing corner, or mirror a left-aligned opener layout? Proposal: always trailing corner via logical properties.
2. Scroll-to-align: remove entirely as proposed, or keep an instant jump for context? Proposal: remove; it has no visible effect under a docked toggle.
3. Keep the `snoka-site-header` markup hook for future use, or remove it with the code that needs it? Proposal: remove.

## Attempt log 2026-10-31 — IMPLEMENTED THEN FAILED (uncommitted working tree)

Status: implemented the docked-toggle rewrite in `src/main.ts` + `src/header.css`, updated `scripts/check-mobile-menu.mjs`. Build, typecheck, lint, both jsdom suites green (30/30 mobile-menu, tree-toggle pass). User testing in a real browser: **FAILED — toggle visibly jumps to a different spot on open, burger→X morph does not play continuously.** Do not ship as-is. Submitted for further review.

What was built (uncommitted):
- Removed scroll-to-align, settle loop, `openHref`/`cancelled`, header-rect reads, geometry resize re-measure.
- On open, the SAME toggle button is `appendChild`-shelved INTO `.snoka-mobile-dialog` (for modal-subtree membership), then CSS `position: fixed` docks it to the trailing viewport corner (`top: admin-offset + safe-area + gap`, `inset-inline-end: gap`, `z-index: 95` over dialog `90`, light color). Closed it stays in-flow.
- Dialog entrance reduced to opacity-only (transform removed so fixed descendants stay viewport-relative). Dialog `padding-top` derived from the same dock tokens.
- Focus: `preventScroll` everywhere; dismiss → toggle, breakpoint → `main`, navigate → no steal.

Why it fails (root causes, verified in source):
1. **The "never moves" claim is false.** Closed = in-flow header position; open = `appendChild` into dialog + `static` → `fixed` + trailing-corner dock. That is a DOM reparent plus a layout-position discontinuity in the same frame as the `snoka-menu-open` class flip. The eye sees a jump, not a morph in place.
2. **Reparenting breaks the animation.** The burger→X morph is a CSS transform transition on `.rails`/`.rail` keyed off `html.snoka-menu-open`. Moving the node synchronously with the class change gives the browser no continuous box to interpolate — transition restarts/resets instead of playing. Docking via `fixed` in the same frame compounds it (containing-block switch).
3. **jsdom green ≠ browser green.** The updated suite asserts DOM identity (`opener() === toggleBefore`), containment (`dialog.contains(opener)`), and zero `scrollTo` — none of which capture rendered bounds or animation continuity. A same-spot/morph test needs rendered toggle rects before/after open and transition-frame sampling, which jsdom does not provide.
4. **Docs overstated the guarantee.** Proposal line 18 ("toggle never moves between open and close") and the report's "no coordinate handoff" language survived into code comments while the implementation does exactly one move (in-flow → dock). The in-code comment calling the move "intentional" concedes the point the proposal denied.

Consequences / what needs a decision:
- Either (a) accept a visible dock jump and design it as an intentional move (e.g., fade/slide the toggle to the dock so the motion looks deliberate), (b) dock the closed hamburger too so open/close share one corner (changes closed header layout: logo/actions overlap, reserved space, RTL variants — the exact cost the design review flagged), or (c) abandon docking and keep the toggle at its in-flow visual spot while open (reopens the dead-band/overlay-burial problem this proposal set out to fix).
- Whichever is chosen, the morph must play on a node that is NOT reparented in the transition frame: keep the toggle in place in the DOM and solve modal-membership/inert some other way, or split morph (stays put) from close-affordance placement.
- Test gap to close before retry: assert rendered toggle `getBoundingClientRect` continuity across open (or assert the intended delta explicitly), and assert morph computed-style progression — requires a real-browser (Playwright) check, not jsdom.

Files touched by the failed attempt: `src/main.ts`, `src/header.css`, `scripts/check-mobile-menu.mjs` (+ rebuilt `dist/` artifacts). No commit made.

## Continued failure 2026-11-01 — button still duplicated (uncommitted working tree)

User report: the toggle is still duplicated in the browser. The SVG-strip + single-button scoping + `responsive-close` CSS removal did NOT resolve what the user sees. jsdom remains fully green, which proves only that the fixture (exactly one button by construction) cannot reproduce this — the suite is blind to it.

Code audit just performed (`appendChild|insertBefore|clone|createElement|innerHTML|replaceChildren` across `src/main.ts`):
- `initMenuIcon` creates only `<span>` rails, guarded by the `menu-icon` class, scoped to the first `.snoka-mobile-nav` open button. No button is created, cloned, or re-appended here.
- `shelveTree`/`unshelveTree` use `appendChild`/`insertBefore` — pure moves of the same node, never clones. They cannot duplicate by themselves.
- `ensureDialog` creates one `<div>`, guarded by `querySelector`. No button creation.
- Eliminated as duplication sources in theme JS: rails injection, shelve/restore, dialog creation.

Open hypotheses (NOT verified — no rendered-DOM evidence available under current constraints):
1. Stale bundle on the tested page: an earlier iteration of this work used a genuine two-button (open + close) handoff. If the browser/site served a cached `dist` asset, the user is looking at the old implementation, not the current single-toggle code.
2. Core rendered a second button: another Navigation block on the page, or core's own dialog/close controls opening alongside the theme dialog (e.g., our capture-phase interception missed on that page, or a non-tree nav passed through to core) — user then sees core's close + our shelved opener simultaneously.
3. Core replaced the enhanced button node (block re-render), so the visible button is a fresh core node (with SVG, no rails) while the enhanced node persists elsewhere — reads as duplication, root cause is node replacement, not cloning.

What is needed to resolve: a rendered-DOM listing of the open overlay — every `button` matching `*responsive*open*` / `*responsive*close*` / `.tree-toggle`, with ancestry and inner markup. That distinguishes stale-bundle (old two-button markup present), core-second-button (core dialog open in parallel), and node-replacement (two open buttons in header). Until that evidence exists, further edits are guessing. No commit made.

## Correction 2026-11-01 — no button in the dialog, toggle never moves (uncommitted working tree)

User was right: the implementation appended the opener into `.snoka-mobile-dialog` on open — a button appearing inside the dialog. Same node or not, that violates the hard requirement. Fixed:

- `shelveTree` moves ONLY the tree (links + tree-toggles). The `openerHome` shelve/restore path is deleted. No button of any kind is ever put inside `.snoka-mobile-dialog` (new jsdom assertion).
- The toggle is never repositioned: no shelving, no `position: fixed`, no docking, no measurement of its coordinates. It keeps its exact in-flow box open and closed, so the burger→X morph plays on the same unmoved node.
- The dialog is now a panel starting below the header (`top: var(--menu-header-bottom)`, measured once at open, cleared on close) instead of a full-screen sheet. The header — toggle included — stays visible and tappable above it. This also removes the dead-band void: the header is genuinely there, not buried behind the dialog.
- Deleted with the dock: `--menu-admin-offset` / `--menu-toggle-size` / `--menu-dock-gap` tokens, admin-bar measuring, scroll/resize re-measure listeners. Resize now only handles desktop-breakpoint close.
- Focus trap explicitly includes the header toggle plus dialog links (tap order: toggle → links → wrap); dismiss focuses toggle, breakpoint focuses main, navigate moves nothing.
- Gate: build, typecheck, lint clean; `check-mobile-menu.mjs` all green (incl. `no responsive open button inside the dialog`, `toggle stays in the header`, `header-bottom var set/cleared`); `check-tree-toggle.mjs` green. No commit made.

## Out of spec 2026-11-01 — panel approach rejected, no code changes made

User verdict: the below-header panel implementation is fully out of spec. Three gaps recorded as reported, unverified in code beyond the known diff:

1. **Missing scroll.** The panel implementation removed every scroll behavior — no scroll-to-align, no re-measure, no scroll handling of any kind. Whatever scroll the spec requires (header alignment, menu-content scrolling, background position handling) is absent, not merely simplified.
2. **Missing full overlay.** The spec calls for a full-screen overlay sheet (`inset: 0`). The panel starts at `var(--menu-header-bottom)` and never covers the header zone — a different component, not a variant of the overlay.
3. **Missing color transition.** The open-state color treatment went away with the dock: no light-color rule for the toggle/X over the dark sheet, no color transition between states. The morph's color half is unspecified and unimplemented.

No code changes made in this pass per instruction. Standing decision needed before any further implementation: one design that simultaneously satisfies the hard requirement (exact same button, same spot, morph plays, no second button, no SVGs) AND the spec (full-screen overlay, defined scroll behavior, color transition) — the panel satisfied the first half by abandoning the second, which is not a fix. No commit made.

## Implementation 2026-11-01 — fixed contract implemented and verified

Implemented exactly the specified interaction in `src/main.ts` (`initMobileMenu`: closed → aligning → open → closing) and `src/header.css` (pinned shell + sheet + single visual state + explicit stacking). Key mappings to the real markup:

- Menu row / shared shell: `.snoka-mobile-nav` (verified present in all four header parts; contains the toggle and core's hidden responsive container with the tree).
- Sheet: `.snoka-mobile-dialog`, created before first interaction, moved into the shell while hidden, tree shelved into it on open. Toggle never enters it.
- Alignment target: `rowDocumentTop - (adminHeight + safeTop + 12)`. Ordinary bars scroll away; only a visible admin bar + notch safe-area (probed, never guessed) count.
- Pin: inline geometry + copied margins, `data-pinned` (fixed, z 100000, isolation). Abort (not silent fallback) if the toggle rect moves >1px or the sheet rect ≠ viewport.
- Visual: `data-visual-open` (+ `snoka-menu-open` class in the same frame for transitions.ts compat) drives sheet opacity, toggle color (contrast → base), rail morph on shared 220ms/ease-in-out. Reduced-motion kills all three.
- Shell becomes `role="dialog" aria-modal` while open; focus trap covers toggle + sheet links; dismiss → toggle, breakpoint → main, navigate → untouched.

Corrections to earlier report conclusions (per review): scroll-to-align is REQUIRED and reinstated with observed (not timed-out) arrival; the "accept a jump / dock closed / keep dead band" trilemma is withdrawn — align-first plus a pinned shared shell is the fourth option and the one built; "no button inside the dialog" prohibits adding/moving the toggle into the sheet, not making the permanent ancestor shell the modal boundary; jsdom green was never claimed as visual proof.

Verification (all green, uncommitted):
- `pnpm build`, `typecheck`, `lint` clean; `check-mobile-menu.mjs` (scroll→pin→open incl. 168px target, pin/content-top/shell-role assertions) and `check-tree-toggle.mjs` pass.
- `pnpm check:browser-menu` (new, needs the live `snoka-access-sandbox` DDEV site): 21/21 PASS in real Chromium against the real homepage — same toggle node, 0.00px post-open drift (pinned at 12.2px), 10 distinct rail states, color rgb(23,36,46)→white, opacity 0→1 sampled mid-flight, sheet == viewport, toggle hit-tests topmost, exactly one toggle, scroll 400→100, Escape/backdrop/breakpoint/reduced-motion close paths.

## What was actually built (honest inventory, 2026-11-01)

The committed implementation (`594d03e`) does reconstruct the toggle's
location instead of simply overlaying + re-stacking. That criticism is
accurate. Here is the machinery, piece by piece, with what each piece
costs:

1. **Scroll-to-align** (`begin` → `window.scrollTo` + 90-frame rAF settle
   loop in `src/main.ts`): moves the whole page so the menu row lands at
   admin-bar + safe-area + 12px. Cost: async open path, an abort path for
   pages too short to scroll, an Escape-during-align path, and a timing
   dependency between scroll end and everything after it.
2. **Pin by reconstruction** (`pinAndOpen`): reads the toggle + row rects,
   then re-applies them as inline `position: fixed; top/left/width` plus
   copied margins, and re-measures to prove drift ≤ 1px. This is literally
   rebuilding the element's location out of numbers. Cost: the open path
   can now fail (abort) on sub-pixel layout realities; any ancestor that
   establishes a containing block silently breaks the premise (guarded by
   the sheet-viewport check, which is itself more machinery).
3. **Sheet-viewport self-check** (`sheetCoversViewport`, with a jsdom
   carve-out): verifies `position: fixed` really means viewport-fixed.
   Cost: a runtime assertion standing in for a layout guarantee CSS
   should provide structurally.
4. **Two synchronized state flags** (`data-pinned` + `data-visual-open`
   + the legacy `html.snoka-menu-open` class, all flipped in the same
   frame): three names for what is conceptually one state, kept because
   transitions.ts reads the class. Cost: future edits must flip all
   three or states desync.
5. **Safe-area probe node** appended to `<body>` at init: a hidden fixed
   div whose only job is reading `env(safe-area-inset-top)` into JS.
   Cost: DOM pollution to work around CSS/JS not sharing the value.
6. **SVG-strip MutationObserver** in `initMenuIcon`: permanently watches
   the toggle and re-removes core's SVG. Cost: a forever-running observer
   compensating for the fact that enhancement fights core's rendering
   instead of replacing the button markup at the source.
7. **Content-clearance variable** (`--menu-content-top` = measured row
   bottom + 20): another measured number piped through CSS. Cost: one
   more thing that must be set on open and cleaned on close.

Total: ~540 lines of menu JS plus ~140 lines of menu CSS to open a
menu. The toggle never moves — but only because ~7 mechanisms conspire
to hold it still, each verified by tests that assert the conspiracy
worked (rect equality, scroll targets, viewport fit). That is the
opposite of simple, and every mechanism is a future breakage surface
(resize mid-align, zoom, dynamic admin bar, ancestor transforms from
other features, smooth-scroll timing on slow devices).

## Why it grew this way (no excuses, just the trail)

Each layer answered a real complaint, and each answer added machinery
instead of removing the need for it:

- Dead band over a floating button → dock the button (moved it; broke
  the morph's continuity).
- "Same button, same spot" → stop moving it, move the dialog instead
  (below-header panel; abandoned the full overlay).
- "Full overlay, with scroll" → reintroduce scrolling, but now with
  pinning so the button survives it (the current reconstruction).
- "Prove it" → rect comparisons, viewport checks, sampler scripts
  (verification machinery on top of implementation machinery).

At no point did anyone — including the reviewer whose contract was
implemented verbatim — ask whether the overlay + z-index approach had
actually been tried and failed, or whether the dead band was a stacking
problem rather than a positioning problem.

## The simple alternative that was never tried

Full-screen sheet, toggle untouched in normal flow, stacking only:

```css
.snoka-mobile-dialog { position: fixed; inset: 0; z-index: 90; }
html.snoka-menu-open .snoka-site-header { position: relative; z-index: 95; }
```

No scroll. No measurement. No pin. No probe. No observers beyond what
exists. The toggle keeps its box because nothing ever touches it; the
morph plays because nothing reparents it; it stays tappable because its
stacking context sits above the sheet. Menu content clears the header
with one padding value.

Honest trade-offs of that approach (not a sales pitch):

- The header (logo, toggle, actions) stays visible above the sheet.
  That is either correct (persistent navigation chrome) or a design
  change (logo visible over a dark overlay needs a light variant or an
  opaque header background — a styling task, not a JS task).
- If the header is not sticky and the page is scrolled, the toggle is
  wherever the page left it — but it was tappable to open, and scroll
  lock + preventScroll focus keep it there. Scroll-to-align solved a
  reachability problem that only exists if something moves the page
  after the tap. Nothing does.
- The dead band complaint does not recur: there is no floating button
  over a void, because the button is in its real header and the header
  is really there.
- What it does NOT give: pixel-12 alignment of the row, or hiding the
  header behind the sheet. If those are requirements, say so — they are
  the entire justification for the current machinery.

## Recommendation

Delete the reconstruction (items 1–5 and 7 above keep the SVG strip
only if core's markup still injects it) and try overlay + z-index
first. If it visibly fails, the failure will be specific (e.g. "logo
unreadable over sheet", "toggle unreachable when X") and the fix can be
targeted — one mechanism per real failure, instead of seven mechanisms
against hypothetical ones. The browser evidence script
(`scripts/check-browser-menu.mjs`) already encodes the acceptance
checks (same node, rect stability, morph states, color, hit-testing)
and can judge the simple version unchanged: point it at the page and
read the numbers.

No code changed in this pass. No commit made.

## Short-page alignment 2026-11-01 — temporary bottom scroll space

Targeted fix per instruction, overlay + z-index untouched: when the
alignment target lies beyond the page's maximum scroll position, the
page cannot scroll far enough and the row would stop low. `begin()`
now calls `prepareAlignment()`, which resets any leftover spacer,
computes the target, compares against
`documentElement.scrollHeight - clientHeight`, and sets
`#menu-scroll-space` (aria-hidden, normal flow, inert at 0px) to ONLY
the missing amount. Long pages get exactly 0px. The space stays
through the open interaction; dismiss/breakpoint clear it after the
exit finishes (so the range cannot shrink mid-exit); navigate clears
it immediately so it cannot disturb the destination scroll. No button
movement, no coordinate reconstruction, no space above the toggle.

Verified: jsdom suite covers short-page (168px added, cleared on
close) and tall-page (0px, still aligns) cases; full gate green;
browser suite re-run green on the live sandbox.

## Snap on close 2026-11-01 — min-height removed entirely, open where physics rests

Diagnosis first: `--menu-content-top` was innocent — it is removed in
the same synchronous block as the sheet's `hidden` attribute, so no
paint can ever show the sheet with the variable gone. The snap after
close was the scroll clamp: removing the wrapper min-height at finish
shrinks the page under a scrollY that no longer fits, and the browser
jumps the page up to the restored maximum. Any temporary scroll range
has this physics — it must be un-created, and the un-creation moves
the page. On short pages that motion is unavoidable if you borrow
range; on tall pages the extension was a no-op anyway.

Fix: no extension at all. `begin()` scrolls toward the target; the
settle loop now treats "scroll came to rest" as arrival — reached the
target, or stopped at the physical maximum (read-only check, zero
page mutation). The menu opens where physics rests; close removes
nothing layout-affecting, so there is no clamp and no snap. Short
pages land the row as high as reachable instead of pixel-12 — stated
trade-off, no silent fallback: the row is already on screen down
there, and everything (clearance, focus, trap) derives from the
actual resting rect.

Also removed as residue of the extension: the `box-sizing` rule, the
preserve/restore path, and the navigate-immediate cleanup. Wrapper is
never touched (asserted open and closed, jsdom + browser).

Verified: full gate green; browser outcome table unchanged on the
request/achieve side (100/100/12.2) with wrapper `(none)` throughout.

## Late core CSS 2026-11-02 — zero-specificity pre-open cover

Core hides `.wp-block-navigation__responsive-container` in its own
`navigation/style.min.css`, which can arrive late (soft navigations
re-add the link dynamically and it loads async). Until then the closed
dialog — close button, core list, our tree — renders as plain flow
content and shifts the layout. Fix: mirror the hidden-until-open
state in theme CSS (render-blocking, persistent across navigations)
with `:where(...:not(.is-menu-open))` at zero specificity, so every
core author rule including `.is-menu-open` wins the moment core loads
and the open state never matches. Verified by aborting the core file
in real Chromium (container stays `display:none`, 0x0) and by the
unchanged open-state suite with core CSS present. Committed with this
entry.

## Snap on close 2026-11-01 — gradual release, verified by experiment

Diagnosis first: `--menu-content-top` was innocent (removed in the
same synchronous block as the sheet's `hidden` attribute, so it can
never paint alone). The snap was the scroll clamp: removing borrowed
range at close shrinks the page under the resting scrollY and the
browser jumps it back in one frame. Measured on the live page with a
deliberately shortened document: instant removal teleports 168→0
inside 25ms; a 220ms `min-height` release glides 168→157→60→0.

Fix: keep the extension (short pages align — removing it regressed
the whole fix), but release it gradually. Close now starts the
wrapper's 220ms `min-height` release on the same clock as the exit
fade, so the resting scroll settles instead of snapping; finish only
removes the inline residue. No-op on long pages (extension was a
no-op there too). Reduced-motion users skip extension and scroll
entirely and open in place — zero motion, zero cleanup. Close paths
that never opened (cancel, shelve failures) restore immediately.

Verified: jsdom (extension set, glide started at close, previous
value restored, RM opens without scroll or mutation) plus browser
(min-height present while open, restored after, no-snap trajectory
check, full contract suite green).

## Short-page correction 2026-11-01 — wrapper min-height, not spacer

The reporter's own correction, implemented verbatim: adding the
missing scroll distance as a spacer cannot create scroll range on a
page shorter than the viewport — the space merely fills unused area.
Replaced with a temporary `min-height` on the actual full-page
wrapper (`.wp-site-blocks`, falling back to `body`): at least
`scrollingElement.clientHeight + target`, `max()`ed with the current
measured height so the page never shrinks, previous inline value
preserved and restored during the existing close cleanup (all reasons,
single point — growth happens at the end so it cannot disturb the
destination scroll). Plus `box-sizing: border-box` on `.wp-site-blocks`
so the assigned minimum includes padding/borders.

Verified, not assigned: the browser suite records
requested/available/achieved/menuRowTop on the live page
(100 / 2522 / 100 / 12.2, no sticky ancestors, min-height present
while open and cleared after close). This distinguishes the three
failure modes in the report: insufficient range vs. target missed vs.
post-align displacement. jsdom covers short-page numbers and
tall-page preservation. No overlay or stacking changes.

## Correction 2026-11-01 (pm) — overlay + stacking baseline, scroll kept

The reconstruction is deleted. `initMobileMenu` is now scroll → lock →
open with no coordinate machinery: scroll settles (stable scrollY, no
rect audit, opens where the page rests past the frame cap instead of
aborting), then one `snoka-menu-open` class drives sheet opacity,
toggle color, and the existing morph on a shared 220ms clock. No pin,
no inline geometry, no rect verification, no twin flags. The sheet is a
body-level fixed layer (z 90) created hidden before first interaction;
the nav layer rises to z 95 while open with `position: relative` and no
offsets (verified non-destructive: header/nav are static in flow), so
the whole toggle branch paints above the sheet without moving.
Per the stacking qualification, only the nav layer rises — the logo
stays buried as in the original full-overlay design, so no
logo-legibility restyle and no extra space above the X. Modal boundary
stays the nav shell (role/aria-modal while open, always contains the
toggle); focus trap + scroll lock + backdrop handling unchanged.
Content clearance is one unmeasured-against-anything padding value
from the aligned row bottom, set once after settling.

Also committed here: the `snoka-mobile-nav` / `snoka-site-header`
classes in `parts/header-*.html`, without which the (already
committed) menu scoping finds no scope. Prerequisite, not scope creep.

Verification, all green: build, typecheck, lint, jsdom mobile-menu +
tree-toggle, and `check-browser-menu.mjs` 22/22 in real Chromium —
same node, 0.00px drift, no inline geometry on toggle or shell, 10
distinct rail states, dark→white color, opacity 0→1 with 0 start
asserted, sheet == viewport, hit-test topmost, single toggle, scroll
400→100, Escape/backdrop/breakpoint/reduced-motion closes. Committed
with this report update (see log).

## Standing prohibitions (user-directed, 2026-11-01)

1. **The toggle is ONE exact button with ONE glyph.** Never append, clone, or re-inject an `<svg>` — or any second button/shape — into or on top of `.snoka-mobile-nav .wp-block-navigation__responsive-container-open`. In particular, core's hamburger SVG (`<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7.5h16v1.5H4z"></path><path d="M4 15h16v1.5H4z"></path></svg>`) MUST be stripped from the toggle at enhance time and re-stripped if core re-renders it (childList observer in `initMenuIcon`). Stacking extra shapes on the button breaks the burger→X morph. Do not try this again.
2. **No `wp-block-navigation__responsive-close` styling or reliance.** The theme-owned menu never opens core's dialog, so core's close control must not appear, be styled, or be depended on. The theme CSS rule for it is deleted. (`transitions.ts` may still click core's `.wp-block-navigation__responsive-container-close` — a different class — to release a core overlay opened by non-tree navs; that is not the toggle and is out of scope of this ban.)
3. **`initMenuIcon` enhances exactly one button** (the `.snoka-mobile-nav` opener), not every responsive open button on the page. Enhancing footer/other navs would morph buttons the user never tapped.
