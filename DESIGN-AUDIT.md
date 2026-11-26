# Design Audit — snoka-club front page

Date: 2026-10-28. Method: live markup + token inspection, every claim measured.
Verdict: the user is right on all five counts. Three are objective defects
(contrast, padding, landmark headings), two are craft failures (shape system,
type pairing). Nothing below is a matter of taste — ratios and markup quoted.

## F1 — Links invisible on dark backgrounds (CRITICAL, WCAG failure)

- Measured: link preset `#1F4A5E` on footer/pre-header/contact `#17242E` =
  **1.66:1**. Hover `#A86B2C` on the same = **3.62:1**. Body-text requirement
  is 4.5:1. These links are decoration, not navigation.
- Mechanism (verified in served CSS): core only forces `color:inherit` on
  links inside `p.has-text-color`. Our dark sections set color on the GROUP,
  so plain paragraphs fall through to the global link preset — dark navy on
  near-black. Affected: footer nav + sign-in link, pre-header portal link,
  every link in the contact/emergency section.
- Root cause: one global link token, zero per-context link colors. The palette
  was approved on white and never tested on its own dark surfaces.

## F2 — Text touches the browser edge (HIGH)

- Measured: `--wp--style--root--padding-left: 0px`,
  `--wp--style--root--padding-right: 0px`. Every `alignfull` part
  (pre-header, header, hero, all sections, footer) ships with no side padding
  of its own. Any full-width run wider than its container hits viewport chrome.
- Root cause: `styles.spacing.padding` root was never set in theme.json, and
  no part compensates. `useRootPaddingAwareAlignments` is on but padding is 0,
  so it aligns to nothing.

## F3 — No shape system in use (MEDIUM, looks inconsistent + blocky)

- Measured: zero `border-radius` / shadow declarations in any template or
  part on the front page. Cards are sharp-cornered boxes; buttons alone carry
  the 8px global radius. Tokens exist (`small/medium/large/full` radii,
  `natural/deep/outlined/crisp` shadows) — nothing consumes them.
- Root cause: tokens were declared, never applied. Sharp boxes + round buttons
  + pill close-button in the dialog = three shape languages on one page.

## F4 — Flat full-bleed stacking (MEDIUM, the "blocky" complaint)

- Sections alternate white / pale / white / near-black edge-to-edge with hard
  stops, no dividers, no contained surfaces, no imagery except a CSS mesh the
  user never asked about. It reads as stacked rectangles, not a designed page.
- Root cause: every section is `alignfull` + flat fill. Nothing is ever
  contained, overlapped, or broken up.

## F5 — Type pairing with no rationale (MEDIUM-HIGH)

- Headings: `Georgia, "Times New Roman", Times, serif`. Body: system sans.
  Georgia signals 2000s brochure, not a modern corporation; the two stacks
  were defaults, never chosen. Secondary issues: two `h1`s on the page
  (site title + hero — core default, but still wrong), generous but
  unconsidered scale.
- Root cause: "system fonts for performance" was treated as a type decision.
  It is a loading decision. A pairing was never made.

## F6 — Bare interactive elements (LOW, partially fixed)

- The island trigger styled itself via a global `.wp-element-button` rule —
  a side effect, not a component style. Works, but fragile: any bare button
  anywhere inherits the voice. Acceptable short-term, needs scoping later.

## F7 — Secondary color has no safe job (LOW, guardrail)

- Measured: `#A86B2C` on white **4.37:1** (fails body 4.5), on tertiary
  **3.85:1**, on contrast **3.62:1**. Legal uses: large text, UI accents,
  borders, focus rings (3:1 contexts). It is currently the link-hover color
  everywhere including dark surfaces — illegal in both jobs.

---

# Remediation plan (design pass D1–D5, in order, stop at first red)

## D1 — Links that survive every surface (fixes F1, F7)

- Context link rules in `src/main.css`: any `.has-contrast-background-color`
  scope gets base-colored links (`15.81:1`) with underline; hover changes
  underline offset/thickness, never color. Same treatment for
  `.has-primary-background-color` if introduced.
- Demote secondary to accent-only: borders, focus ring, large display text,
  never body copy or link states. Delete the secondary link-hover token path.
- Acceptance: recompute all four dark-surface pairs ≥ 4.5:1; curl the front
  page and confirm no `a` inherits the navy preset on dark.

## D2 — Edges that breathe (fixes F2)

- Set root side padding in theme.json (`styles.spacing.padding`, fluid,
  ~`var(--wp--preset--spacing--40)` desktop tapering on mobile) so every
  `alignfull` child clears the chrome by default.
- Audit each part: inner constrained groups keep their own rhythm; confirm no
  full-width text runs remain.
- Acceptance: root vars nonzero in served CSS; markup review of all five
  full-bleed sections.

## D3 — One shape language (fixes F3)

- Apply the existing scale, no new tokens: cards `large` radius + `natural`
  shadow; buttons stay `medium`; pills/`full` reserved for chips and the
  dialog close; footer keeps square edges (grounded base is correct).
- Scope the island trigger to its own class instead of the global
  `.wp-element-button` side effect (fixes F6 properly).
- Acceptance: every surface element carries radius + shadow or a documented
  exception; no bare sharp boxes adjacent to round buttons.

## D4 — Break the rectangle stack (fixes F4)

- Contain, don't fill: portal cards become a `wide` rounded container on the
  page background instead of a full-bleed pale slab; sign-in steps keep pale
  fill but gain dividers and numbered markers; footer keeps contrast + its
  new copper rule.
- One imagery decision for the hero: keep the mesh (it tested well) or swap
  to a real building photograph placeholder — owner picks during review.
- Acceptance: no two adjacent sections share a fill without a divider or
  containment change between them.

## D5 — A real type pairing (fixes F5)

- Reverse the "no webfonts" rule deliberately and narrowly: self-host two
  woff2 latin subsets (proposal: **Archivo** 600/700 headings +
  **Inter** 400/500/600 body — modern grotesque, corporate without being
  cold), `@font-face` in `dist`, `preload` the two critical files,
  `font-display:swap`, system stacks stay as fallback. Update
  `performance.php` (it currently asserts no webfonts) and the plan doc.
- Budget: < 150 KB total for four files, else drop a weight.
- Single-`h1` fix within core defaults: evaluate demoting the hero to styled
  `h2` vs. accepting core's site-title `h1` — decide in review, document it.
- Acceptance: zero Georgia in served CSS; no layout shift on load (swap +
  matched fallback metrics); headings hierarchy clean.

## Explicitly out of scope

No page builder, no CDN fonts (self-host only, privacy + determinism), no
new sections or IA, no portal changes, no second style variation yet.

## Definition of done

D1–D5 shipped, chain green (build → typecheck → lint → PHPCBF), sandbox
smoke (front 200, all assets 200, portal 200, pattern registered), ratios
recomputed and recorded, commit + backup. Then a visual review pass with the
owner before calling it finished.
