# Button Design: snoka-club

Date: 2026-10-31. This merges the state specification and the hierarchy specification into one buildable doc. It applies to theme buttons (core button block, the outline-light variant) and feature-block card buttons. Section 10 records what already conforms in code.

## 1. Hierarchy

One primary action per view. Style carries hierarchy, not arbitrary size. A color means the same thing everywhere in the product. Prominence should communicate the preferred action, while consistent sizing signals that buttons belong to the same choice set. [developer.apple](https://developer.apple.com/design/human-interface-guidelines/buttons.md)

| Type | Meaning | Visual treatment | Use for | Avoid |
|---|---|---|---|---|
| Primary | The main or most likely action | Solid fill, strongest contrast, brand or dark neutral | Continue, Save, Publish, Checkout, Create | More than one per view; decorative accent colors |
| Secondary | Important alternative action | Outline, tonal fill, or neutral solid | Cancel, Back, Preview, Save draft | Competing with the primary action |
| Tertiary | Low-emphasis or supporting action | Text-only, ghost, or quiet link-style | Learn more, Show advanced options, Help | Critical conversions or irreversible actions |
| Destructive | Deletes, removes, disconnects, or causes data loss | Red or warning color, often outline or subtle fill | Delete account, Remove file, Disconnect integration | Routine actions; sitting beside benign actions without separation |
| Success | Confirms or completes a positive outcome | Green, used sparingly | Approve, Confirm payment, Activate | Generic primary actions |
| Loading | Action is processing | Spinner plus unchanged or descriptive label | Submitting, Saving, Processing payment | Changing button width; allowing repeat clicks |

Material guidance assigns high emphasis to the primary action, medium emphasis to supporting actions, and recommends one prominent button per screen. [m2.material](https://m2.material.io/components/buttons)

## 2. What color communicates

Reserve one accent color for the primary action. Do not use that accent as casual decoration elsewhere on the page. [m3.material](https://m3.material.io/components/all-buttons/)

| Color | Reserved meaning | Appropriate use | Do not use for |
|---|---|---|---|
| Brand primary | Main product action | Continue, Save, Publish | Errors, warnings, deletion, decorative links |
| Neutral | Non-primary action | Cancel, Back, Filter, secondary submit | The main conversion action |
| Red | Danger, removal, irreversible harm | Delete, Remove, Disconnect, End session | "No thanks," neutral cancel, marketing emphasis |
| Green | Positive confirmation or completion | Approve, Confirm, Activate | Routine navigation or generic CTA |
| Yellow or amber | Caution or review required | Review changes, Resolve warning | Primary action unless the action itself is a caution |
| Blue | Informational or neutral brand action | Primary action if blue is the brand accent | Error, danger, or success semantics unless clearly established |

Mixing colors works only when each color has a distinct job. One primary brand button plus one neutral secondary plus one red destructive in a settings screen works. Blue, purple, green, orange, and red buttons in the same toolbar with no semantic distinction does not. Red for "Cancel" with blue for "Delete" does not. Changing the primary color page to page without a semantic reason does not. A destructive action and a primary CTA should not compete in the same view; when both are necessary, separate them and reinforce with icon, label, spacing, and confirmation. [m1.material](https://m1.material.io/style/color.html)

## 3. Required states

Never rely on color alone. Pair every color change with a border, outline, shadow, icon, label change, or motion cue. [w3c.github](https://w3c.github.io/wcag21/understanding/21/non-text-contrast.html)

| State | Visual treatment | Accessibility requirement |
|---|---|---|
| Default | Clear fill or border; readable label | Label at least 4.5:1; icon and visible boundary at least 3:1 against adjacent background. [webability](https://www.webability.io/blog/color-contrast-for-accessibility) |
| Hover | Unmistakable change: darken or lighten fill, border emphasis, or elevation shadow | Indicator must meet 3:1 against adjacent colors. [accessibleweb](https://accessibleweb.com/question-answer/what-are-the-contrast-requirements-for-visible-focus-states/) |
| Active / pressed | Stronger change than hover: darker fill, inset shadow, or 1 px downward translation | Must stay clearly distinguishable from default and hover. |
| Focus | 2 px outline, offset 2 px from the button edge | Outline at least 3:1 with adjacent colors; use `:focus-visible` for keyboard focus. [limina](https://limina.co/a-look-at-the-upcoming-web-content-accessibility-guidance-wcag-release-2-2-part-1-focus-indicators/) |
| Disabled | Reduced saturation, `cursor: not-allowed`, no hover animation | Use the `disabled` attribute when non-interactive; WCAG exempts inactive components from 3:1. [callingallminds](https://callingallminds.com/resources/wcag/1.4.11-non-text-contrast) |
| Loading | Spinner plus label; keep button width to avoid layout shift | Announce with `aria-live="polite"` or a loading label; prevent duplicate submission. |
| Destructive | Red or warning color, usually outline or subtle fill | Label still at least 4.5:1; confirm irreversible actions. |

State semantics in plain terms: hover means the control is interactive. Active means the user is pressing it, so make it stronger than hover. Focus means keyboard or assistive-tech interaction is here, so never remove it without an equally visible alternative. Disabled means the control cannot be used now; use `disabled` to drop it from tab order or `aria-disabled="true"` to keep it focusable with an explanation. Loading means the action started and is not complete, so lock repeat activation and keep dimensions stable. [atomica11y](https://www.atomica11y.com/accessible-design/button/)

A hover that shifts only from blue to slightly different blue is hard to perceive. Add a border, shadow, icon, or fill-luminance change. [m3.material](https://m3.material.io/components/all-buttons/)

## 4. Contrast

### Text and icons

Button label text needs at least 4.5:1 against its own fill (3:1 for large text: 24 px regular or 18.66 px bold). Icons that carry meaning need at least 3:1 against the fill. [webability](https://www.webability.io/blog/color-contrast-for-accessibility) A decorative icon needs no accessible name when the text label carries the meaning.

### Button boundary

A border, outline, fill edge, or other visible boundary that identifies the control needs 3:1 against the adjacent page background. [w3c.github](https://w3c.github.io/wcag21/understanding/21/non-text-contrast.html) A filled button whose text already meets 4.5:1 can pass even with a lower-contrast fill edge, provided the text identifies the control. [atomica11y](https://www.atomica11y.com/accessible-design/button/) Ghost and border-only buttons need the border itself at 3:1 plus label text at 4.5:1.

### Hover contrast

WCAG measures state indicators against adjacent colors, not as a ratio between default and hover. Still, make the change obvious and keep the hover fill or border at 3:1 against the surrounding background when it communicates interactivity. [accessibleweb](https://accessibleweb.com/question-answer/what-are-the-contrast-requirements-for-visible-focus-states/)

Practical targets: on a dark filled button on a light background, darken the fill by roughly 8 to 12 percent luminance. On a light filled button on a dark background, lighten slightly or add a subtle glow; never darken toward the page background. A low-emphasis button should gain a visible border or background tint rather than a text-color tweak. Never let hover be the only difference between two adjacent actions.

## 5. Light buttons on dark backgrounds

Use for a high-emphasis action on a dark surface. Prefer off-white fill (`#F5F5F5` to `#FFFFFF`) with near-black text (`#111111`); that pairing easily clears 4.5:1. On hover, lighten slightly or add a subtle outer glow. For focus, a light outline alone can fail against the light fill, so use a two-layer ring: light outline plus dark outer glow. Avoid thin light-gray borders; they often fail the 3:1 boundary requirement on dark backgrounds. [w3c.github](https://w3c.github.io/wcag21/understanding/21/non-text-contrast.html)

```css
.button-light {
  background: #ffffff;
  color: #111111;
  border: 1px solid transparent;
}

.button-light:hover {
  background: #f0f0f0;
}

.button-light:active {
  background: #e6e6e6;
}

.button-light:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.8);
}
```

## 6. Dark buttons on light backgrounds

Use for the main call to action on light surfaces. Fill with dark neutral or dark brand color (`#111827`, `#1F2937`); label in white or near-white at 4.5:1 or better. On hover, darken rather than lighten; lightening can read as disabled. For focus, use a dark outline with 2 px offset and add an outer light ring when the outline color matches the fill, so the ring stays visible against both button and page. [limina](https://limina.co/a-look-at-the-upcoming-web-content-accessibility-guidance-wcag-release-2-2-part-1-focus-indicators/) Avoid dark gray text on medium-gray fills; that combination commonly looks fine and still fails 4.5:1.

```css
.button-dark {
  background: #111827;
  color: #ffffff;
}

.button-dark:hover {
  background: #0b1220;
}

.button-dark:active {
  background: #060b14;
}

.button-dark:focus-visible {
  outline: 2px solid #111827;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.9);
}
```

## 7. Mechanics

### Targets and spacing

Minimum target is 24 by 24 CSS pixels for WCAG 2.2 AA; prefer 44 by 44 for touch-heavy interfaces. [atomica11y](https://www.atomica11y.com/accessible-design/button/) Minimum horizontal padding is 16 px default, 12 px compact. Keep at least 8 px between adjacent buttons, 16 px or more before a destructive action. Keep a consistent height scale (for example 32 px compact, 40 px default, 48 px large) and keep buttons in the same action group the same height. Apple warns that nearby buttons of different sizes look confusing. [developer.apple](https://developer.apple.com/design/human-interface-guidelines/buttons.md) Preserve at least 8 px of clear space around a button so its focus ring never clips inside cards or containers. Do not stretch a button to fill a container unless it is the sole action there.

### Size intent

Default size fits nearly all product actions. Large fits a page-level conversion, a mobile-first action, or an empty-state call to action. Small fits genuinely constrained space: table rows, dense toolbars, cards, inline settings. Do not enlarge a button to make it "pop" (use fill, color, position, or copy instead) and do not shrink a destructive button to hide it.

### Borders

Use 1 px borders for subtle secondary buttons; 1.5 px or 2 px only when the border is the main identifier. A border-only button needs 3:1 against the page background. Do not use a border as the sole hover cue when it is low contrast. Pick one radius scale (4, 8, or 999 px pill) and apply it consistently.

### Outlines

Use `outline`, never `border`, for focus so focus never shifts layout. Offset 2 px to separate the ring from the fill. [accessibility-for-giants.ghyston](https://accessibility-for-giants.ghyston.com/wiki/focus/focusVisible) Use `:focus-visible` rather than styling `:focus` for mouse clicks or removing focus globally. [oidaisdes](https://www.oidaisdes.org/blog/highly-visible-keyboard-focus/) The ring must fully enclose the button and must not hide under overflow, sticky headers, modals, or adjacent elements. [limina](https://limina.co/a-look-at-the-upcoming-web-content-accessibility-guidance-wcag-release-2-2-part-1-focus-indicators/)

### Shadows

Use shadows for elevation and hover feedback, never as the only indicator. On light backgrounds, a soft hover shadow such as `0 2px 6px rgba(0, 0, 0, 0.12)` works. On dark backgrounds shadows read poorly, so prefer fill lightening, border emphasis, or a light glow. Never use a large blurred shadow to compensate for poor contrast. Keep pressed-state shadows smaller or inset so the button reads as physically depressed.

## 8. Anti-patterns

Do not change size without intent: enlarging every CTA because a page feels underdesigned, five different button heights in one interface, a tertiary action larger than the primary, or width shifts between loading, default, and error states.

Do not change color without intent: a new accent per campaign, red for "Decline," green for "Looks good," brand color reused for secondary actions and decoration, light gray that looks disabled but still clicks, or a bright tertiary that outshouts the primary.

Do not blur hierarchy: two equally saturated CTAs side by side, Cancel styled as primary with Confirm secondary, a row of five filled buttons with no clear next step, the primary action placed somewhere less prominent than the secondary, or the primary style reused for filters, tags, and non-action content.

## 9. Copy and placement

Use verb-first labels ("Save changes," "Create project," "Delete file"). Avoid vague labels ("Submit," "OK") when the consequence is unclear. Place the primary action where the product's reading and platform conventions put it. Keep destructive actions away from benign ones and confirm them; sentence case reads easier than all caps, and labels must never truncate.

## 10. Implementation checklist

- [ ] Every button has an accessible name; icon-only buttons carry an `aria-label`.
- [ ] Label text meets 4.5:1, or 3:1 for large text; meaningful icons meet 3:1.
- [ ] Visible boundaries meet 3:1 where they identify the control. [w3c.github](https://w3c.github.io/wcag21/understanding/21/non-text-contrast.html)
- [ ] Hover, active, and focus indicators meet 3:1 against adjacent colors. [accessibleweb](https://accessibleweb.com/question-answer/what-are-the-contrast-requirements-for-visible-focus-states/)
- [ ] Focus uses a 2 px outline with 2 px offset, is never removed, and never clips. [limina](https://limina.co/a-look-at-the-upcoming-web-content-accessibility-guidance-wcag-release-2-2-part-1-focus-indicators/)
- [ ] Light-on-dark and dark-on-light variants each have tested hover, active, and focus treatments.
- [ ] Disabled uses `disabled` or `aria-disabled="true"` appropriately, with an explanation where useful. [atomica11y](https://www.atomica11y.com/accessible-design/button/)
- [ ] Loading prevents duplicate submission, preserves layout, and announces status.
- [ ] Color is never the only signal of state or meaning. [m3.material](https://m3.material.io/components/all-buttons/)
- [ ] Destructive actions sit apart from benign actions and require confirmation. [m1.material](https://m1.material.io/style/color.html)
- [ ] The same action uses the same button style everywhere.

## 11. Current conformance in this repo

Theme (`theme.json` button element): 8 px radius, primary base fill, contrast fill on `:hover` and `:focus`, base label at 4.5:1. Gap closed in `inc/block-support.php`: the outline-light variant and any `has-background` button (both invisible to the zero-specificity element styles) now get hover, `:focus-visible`, and `:active` treatments, and the focus radius stays 8 px instead of collapsing to the global 2 px. Feature-block card buttons (`snoka-feature-block/src/style.scss`): hover, `:focus-visible` ring in the button's own brand color, brightness press, reduced-motion gating; card lift and card-level button state also trigger on keyboard `focusin` (`src/view.js`), not only mouse hover.
