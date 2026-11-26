# Calendar page fails on block themes — plugin report

**To:** snoka-events maintainers
**From:** theme integration testing (snoka-club, block theme)
**Date:** 2026-11-18
**Plugin:** snoka-events 0.11.15
**Environment:** WordPress (ver tag 7.1.5 on core assets), PHP 8.4, theme `snoka-club` 0.3.0 (block theme, no `header.php`/`footer.php` by design)
**URL:** `/events-calendar/?view=dayGridMonth&date=2026-11-01`
**Verdict: plugin issue, not a theme issue.** No theme change required or recommended.

## What breaks

On any block theme, the full-page calendar renders:

1. A PHP deprecation notice emitted into the output (`display_errors` on) / error log (production):
   `File Theme without header.php is deprecated since version 3.0.0 with no alternative available. Please include a header.php template in your theme.`
2. Core's legacy kubrick-era `theme-compat/header.php` as the document head (`<link rel="profile" href="https://gmpg.org/xfn/11">` present) instead of the theme's head handling.
3. **No site header, footer, or navigation at all** — the calendar renders chromeless. Verified in the DOM: no `.snoka-site-header`, no template-part header/footer, no `nav.wp-block-navigation`.

(The empty month grid on the sandbox is correct behavior — the sandbox has zero events and `/wp-json/snoka-events/v1/occurrences` correctly returns `[]`. The favicon 404 is unrelated benign noise. Neither is part of this report.)

## Root cause (verified, with backtrace)

`includes/class-frontend.php::handle_templates()` forces the classic PHP template for the calendar page **before** its own block-theme guard:

```php
// handle_templates(), ~line 2597-2618
if ( $calendar_page_id && is_page( $calendar_page_id ) ) {
    $cal_template = SNOKA_EVENTS_PATH . 'templates/calendar.php';
    if ( file_exists( $cal_template ) ) {
        return $cal_template;   // <-- runs on ALL themes, including block themes
    }
}
// ...
if ( wp_is_block_theme() ) {
    return $template;           // <-- archive/taxonomy branches are correctly guarded; calendar is not
}
```

`templates/calendar.php:14` then calls `get_header()` (and `:183` calls `get_footer()`). The block theme has no `header.php`, so `locate_template()` falls through to core's `wp-includes/theme-compat/header.php`, whose line 9 calls:

```php
_deprecated_file(
    sprintf( __( 'Theme without %s' ), basename( __FILE__ ) ),
    '3.0.0', ...
```

Captured backtrace on the live page (via temporary error-handler probe, since removed):

```
_deprecated_file            <- called from theme-compat/header.php:9
require_once                template.php:880
load_template               template.php:815
locate_template             general-template.php:48
get_header                  calendar.php:14   (plugin template)
include                     template-loader.php:132
```

The plugin's own docblock on `handle_templates()` already states the intended behavior — *"For block/FSE themes, skip PHP template overrides — registered block templates handle rendering instead"* — but the calendar branch contradicts it. All other branches (archive/taxonomy) comply because they sit after the guard.

## Suggested fix (plugin-side)

Mirror the singles pattern already used in this codebase ("`the_content` filters inject … so block themes render the full view"):

1. In `handle_templates()`, return the theme template unmodified for the calendar page when `wp_is_block_theme()` — i.e. move/extend the block-theme guard above the calendar branch.
2. Render the calendar shell through a `the_content` filter on the calendar page on block themes (refactor the `data-settings` shell markup out of `templates/calendar.php` into a reusable renderer), keeping the PHP template as the classic-theme fallback only.

What NOT to do:

- Do not ask themes to add empty `header.php`/`footer.php` shims. That is wrong for FSE themes (it would further bypass block template parts while still rendering no site chrome) and only hides the notice.
- The theme cannot fix this from its side: there is no correct block-theme code that makes classic `get_header()` output site chrome.

## Reproduction

1. Activate any block theme without `header.php` (e.g. snoka-club, Twenty Twenty-Five).
2. Visit `/events-calendar/?view=dayGridMonth&date=2026-11-01` with `WP_DEBUG_DISPLAY` on.
3. Observe the deprecation text before/within the document, the `rel="profile"` kubrick head link, and the absence of site header/footer/nav in the DOM.

## Addendum 2026-11-18 — calendar dead after swup navigation (theme-side fix applied)

Separate failure on the same page, found while verifying the above:
navigating to `/events-calendar/` via the theme's swup page transitions
showed the `<noscript>` fallback text ("Our calendar requires JavaScript…")
with a dead, uninitialized shell — no JS errors.

Root cause, confirmed by reproduction: the plugin boots exclusively on
`DOMContentLoaded` (`src/blocks/events/view.js`, also `mini-cal` and
`add-to-calendar`), which never refires after a swup container swap —
and content swapped in via `innerHTML` parses `<noscript>` as visible
markup. Before fix: fallback visibly rendered (1200×27), shell stuck at
bare `snoka-event-calendar`, 0 cells. After fix: full navigation, shell
`is-ready`, fallback absent, no errors.

Theme-side fix (this repo, `src/transitions.ts`): the events routes are
excluded from swup so they always full-load —
`/events-calendar`, `/events/` (archive + singles + `/category/*`,
`/tag/*`), `/venues/`, `/organizers/`, `/series/`. This matches the
existing exclusion pattern (`/portal/*`, wp-admin, logout, previews).

Durable fix belongs plugin-side (for a future plugin update): make the
calendar boot resilient to client-side navigation — re-initialize on a
documented event or observe the shell's insertion — instead of relying
solely on initial `DOMContentLoaded`. The theme intentionally does not
reach into plugin internals to re-boot them. Permanent regression
check: `pnpm check:swup-calendar` (real Chromium, clicks through from
the homepage).

## Addendum 2026-11-18 (pm) — back-button desync is plugin history pollution

Separate failure, same page, found while verifying leave-and-back: after
leaving the calendar via swup, the browser Back button changes the URL
to the calendar address but leaves the away page rendered — no swup
events, no errors, no shell. Permanent URL/content desync.

Measured root cause (live, real Chromium):

- swup v4 skips popstates whose entry lacks its metadata by default:
  `skipPopStateHandling: (t) => "swup" !== t.state?.source`.
- swup stamps its entries (`pushState({url, random, source:"swup"})`)
  and the initial entry at init — verified: a fresh homepage load
  carries `history.state = {source: "swup", ...}`.
- The calendar page loads with `history.state = null`. The plugin wipes
  the stamp: `updateUrl()` calls `window.history.replaceState(null, …)`
  and `pushState(null, …)` (`init-calendar.js`, URL sync helpers) —
  passing literal `null` instead of preserving existing state. Every
  boot (datesSet → updateUrl with replace) and every filter refresh
  re-wipes it; every pushed view change creates another foreign entry.
- Leaving via swup pushes a stamped away-entry. Going back pops to the
  wiped calendar entry → swup ignores it (no metadata) → popstate never
  reloads by itself → URL says calendar, DOM says away page. Stuck until
  the user navigates manually.

Plugin fix (minimal, no behavior change otherwise): preserve history
state instead of nulling it —

```js
window.history.replaceState({ ...window.history.state }, '', url);
window.history.pushState({ ...window.history.state }, '', url);
```

With the stamp preserved, back-nav goes through swup (render +
`swup:page:view` → fresh boot), which the theme-side suite already
asserts. Also recommended: the popstate handler must no-op when no
live shell is mounted (belt-and-braces for mixed full-load/swup
sequences), since `destroy()` cannot null every path that reaches a
destroyed `ec`.

Theme side: no change required — the gate and the leave-and-back
check already encode the fixed behavior and stay red until the plugin
ships this. Optional fallback (deliberately withheld): hard-reload if
a popstate lands on a calendar URL with no booted shell. That would
mask plugin regressions the suite is meant to catch.

## Addendum 2026-11-18 — keeping swup: plugin-owned SPA support (spec)

Yes — the plugin can own this and swup stays. Verified live that swup v4
fires `swup:visit:start` → `swup:content:replace` → `swup:page:view` →
`swup:visit:end` as bubbling `CustomEvent`s on `document` on every
client-side navigation, with no theme cooperation needed. The theme's
exclusions stay as the safe default until the plugin ships support;
removal condition and re-verification are noted in `src/transitions.ts`.

Contract for the plugin (all small; `initCalendar()` already returns a
working `destroy()`):

1. Extract boot into an idempotent `bootCalendars(root)` helper:
   for each `.snoka-event-calendar:not([data-booted])`, parse settings,
   `initCalendar()`, stash the returned handle on the element, set
   `data-booted`. Call it on `DOMContentLoaded` (unchanged initial load).
2. Re-boot on `swup:page:view` (fires after every swap, incl.
   back/forward out of swup's cache — destroyed instances get a fresh
   boot, already-booted shells are skipped).
3. Tear down on `swup:visit:start`: call the stashed `destroy()` on
   outgoing shells and clear their flags, so listeners, fetches, and
   instances never survive into the next page.
4. Strip the plugin's own `<noscript>` fallback nodes at boot when JS
   runs — in swapped-in fragments they parse as visible junk.
5. Close the leak in `init-calendar.js`: the anonymous `window`
   `popstate` handler (~line 1063) is never removed — `destroy()` drops
   only the `mq` listener. Name the handler and remove it in
   `destroy()` (audit `initFloatingDetails` the same way); otherwise
   repeat visits accumulate zombie handlers driving destroyed instances.
6. Back/forward + swup page cache is covered by 2+3 (destroy on leave,
   fresh boot on view) — but assert it: navigate away and back must
   yield exactly one live instance and zero console errors.

No theme changes are required for any of this; the events routes can
leave the swup exclusion list once the above ships and
`pnpm check:swup-calendar` is extended to cover a swup arrival
(shell `is-ready`, fallback hidden, single live instance after a
leave-and-back cycle).

## Checklist for the fix

- [ ] Calendar page on a block theme: no deprecation, theme head used, site header/footer/nav present.
- [ ] Calendar page on a classic theme: unchanged (PHP template still used).
- [ ] `view=` / `date=` query args, filters, and the occurrences REST feed behave identically on both theme types.
- [ ] No `get_header()`/`get_footer()` reachable on block themes from any of the 7 PHP templates in `templates/`.
