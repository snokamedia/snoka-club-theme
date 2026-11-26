# Swup Dynamic Loading — Design Proposal

**Status:** proposal (not implemented). Implements the loading strategy
referenced by `plugins/snoka-events/docs/BLOCK-THEME-CALENDAR-REPORT.md`
(§2b) and `plugins/snoka-modal/docs/MODAL-SWUP-REPORT.md` (§4).
**Owner of this file:** the theme (it owns the router). **Implementers:**
one plugin at a time, converging on the shared contract below.

## 1. Problem

WordPress enqueues a block's `viewScript` only when the block renders
server-side. Under swup client-side navigation, new markup arrives without
its scripts:

- Proven (modal): after home → Membership, the synced `<script>` tag sits
  in `<head>` but is **never fetched** (zero network requests) — cloned
  head tags don't execute. The delegated handler is never bound; clicks
  silently do nothing; zero console errors.
- Proven (calendar): the full view bundle (297 KB) only loads on the
  calendar page; `swup:page:view` arrivals elsewhere never boot widgets
  that need it, and departures never tear down stateful instances.
- Sizes that rule out the lazy fix: modal view 1.6 KB, mini-cal frontend
  73 KB, events view bundle 297 KB. Global enqueue is acceptable **only**
  as a marked interim for the 1.6 KB file — never for the heavy ones.

## 2. Goals

1. Interactive blocks work identically on full load *and* swup arrival,
   with zero duplicated global bundles.
2. Pages without a plugin's markup pay ~nothing (one selector scan per
   navigation).
3. One mechanism for all Snoka interactive plugins — not bespoke wiring
   per plugin.
4. No reliance on swup HeadPlugin script execution, full-page
   `MutationObserver`s, or `persistTags` workarounds (all proven
   unreliable or costly).
5. No-JS and reduced-motion behavior unchanged (content visible, static).

Non-goals: changing swup itself; touching WordPress core enqueue semantics;
covering wp-admin/editor (classic loads only).

## 3. Design

### 3.1 Lifecycle (already standard — no new events)

- `DOMContentLoaded` → boot present markup.
- `swup:page:view` → boot swapped-in markup.
- `swup:visit:start` → teardown stateful instances *before* the swap
  (calendars, EventCalendar instances, fetch abort). Stateless delegation
  (modals, menus, toasts) needs no teardown.

The theme already emits these (swup v4 core); plugins only listen.

### 3.2 Boot units (per plugin)

Each interactive view exposes:

- `boot(root)` — scan `root` for unbooted hooks (guard flag, e.g.
  existing `data-booted` or `data-swup-booted`), initialize exactly those,
  mark them. Idempotent: re-running boots only newcomers.
- `teardown(root)` — stateful views only: destroy instances, clear flags
  so the next view re-boots, abort in-flight fetches.

The events codebase already has this shape (`bootCalendars` /
`teardownCalendars` in `src/calendar-core/`); the modal needs only the
`boot` half (its delegation is inherently idempotent and benign under
double-binding — separate closures converge).

### 3.3 Delivery (the actual fix)

Code must be *present* to run. In preference order:

1. **Script Modules (preferred, WP 6.5+).** Ship the view as
   `viewScriptModule` (`block.json`): WordPress serves it via import maps —
   deduped, cached, dependency-managed. First import binds the lifecycle
   listeners; re-imports are free. A block using it loads it when rendered;
   post-swap arrivals trigger a dynamic `import()` of the known module.
2. **Micro-loader (fallback).** A ~300-byte stub that on each lifecycle
   point checks for its hooks and injects the classic bundle **exactly
   once** (promise cache keyed in module scope — never trust DOM presence,
   since synced tags exist without executing). Detection cost on
   hook-less pages: one `querySelectorAll` per navigation.

### 3.4 Shared helper (one convention, not per-plugin wiring)

A tiny `snoka-swup` convention — new micro-package, shared snippet, or
theme-provided global; location is an open question (§6). Sketch:

```js
const loaded = new Map(); // src -> Promise<void>, module scope: DOM presence ≠ executed

export function ensureScript( src ) {
	if ( ! loaded.has( src ) ) {
		loaded.set( src, new Promise( ( resolve, reject ) => {
			const el = document.createElement( 'script' );
			el.src = src;
			el.onload = () => resolve();
			el.onerror = () => reject( new Error( `swup loader: failed ${ src }` ) );
			document.head.appendChild( el ); // fresh element: always executes
		} ) );
	}
	return loaded.get( src );
}

export function defineReloadableView( { selector, load, boot, teardown } ) {
	const scan = ( root = document ) => {
		const fresh = [ ...root.querySelectorAll( selector ) ]
			.filter( ( el ) => ! el.dataset.swupBooted );
		if ( ! fresh.length ) {
			return Promise.resolve( 0 );
		}
		const run = () => {
			boot( root, fresh );
			fresh.forEach( ( el ) => { el.dataset.swupBooted = '1'; } );
			return fresh.length;
		};
		return load ? load().then( run ) : Promise.resolve( run() );
	};
	document.addEventListener( 'DOMContentLoaded', () => scan() );
	document.addEventListener( 'swup:page:view', () => scan() );
	if ( teardown ) {
		document.addEventListener( 'swup:visit:start', () => teardown( document ) );
	}
	return { scan };
}
```

Usage per plugin is then a declaration, not machinery:

```js
defineReloadableView( {
	selector: '.snoka-event-calendar:not([data-booted])',
	load: () => ensureScript( window.SnokaEvents.viewUrl ),
	boot: ( root, shells ) => bootCalendars( root, initCalendar ),
	teardown: ( root ) => teardownCalendars( root ),
} );
```

### 3.5 Division of responsibility

| Layer | Owns |
|---|---|
| Plugin | Boot/teardown units, hook selectors, no-JS-safe markup, `[data-booted]` flags. |
| Theme | Emits standard swup lifecycle events (done); holds route gates until each plugin self-boots, then *opens* them (e.g. the `EVENTS_CALENDAR_PATTERN` gate becomes a swup-handled nav instead of a force-reload). No plugin-specific code. |
| WordPress core | `viewScript` for initial render; Script Modules import maps for dynamic path. |

## 4. Migration path

| Plugin | Bundle | Change |
|---|---|---|
| snoka-modal | 1.6 KB | Dynamic per §3.3 (either option); global enqueue acceptable only as marked `@todo` interim. No teardown needed. |
| snoka-events view | 297 KB | Reuse `bootCalendars`/`teardownCalendars`; wrap in §3.4; wire the three lifecycle points. Dynamic loading **required**, never global. |
| snoka-events mini-cal | 73 KB | Same as view; add the two swup listeners it lacks (workspace and installed both miss them). |
| snoka-intro-animate | n/a | Already load-safe (tiny, runs on `DOMContentLoaded`; reveal is one-shot progressive enhancement). No change. |

## 5. Verification protocol

For each migrated view, headless Chromium against a DDEV sandbox:

1. Direct load: widget boots, zero console errors; network log shows the
   bundle fetched exactly once.
2. swup-navigate to the widget (assert `swup-enabled`, no full reload):
   widget boots within the same thresholds; interaction works.
3. Navigate away and back: teardown ran (no duplicate instances/listeners;
   EventCalendar count stable), re-boot clean.
4. Modal-less/calendar-less pages: no plugin bundles in the network log —
   only the micro-loader scan (or nothing, for Script Modules).
5. Reduced-motion + JS-disabled: content visible and static throughout.

## 6. Open questions (for the implementing agent)

1. **Helper home:** new `snoka-swup` micro-package, copy-paste snippet
   per plugin, or theme-provided global (`window.SnokaViews.define…`)?
   Micro-package is cleanest; snippet is fastest.
2. **Script Modules vs classic fallback:** adopt `viewScriptModule` now
   (WP 6.5+ floor is already required) or ship the classic loader first?
3. **URL plumbing for dynamic `import()`:** localized module URLs vs
   fixed build paths — confirm cache-busting (`filemtime`/asset files)
   survives.
4. **Admin/editor exclusion:** loaders must no-op in `wp-admin` and the
   Site Editor canvas (editor uses its own `editorScript` path).

## 7. Costs (measured, `sites/snoka-club-sandbox`)

| Asset | Size | Verdict |
|---|---|---|
| `snoka-modal/build/view.js` | 1.6 KB | Dynamic per standard; global tolerable interim only. |
| `snoka-events/build/frontend-mini-cal.js` | 73 KB | Dynamic required. |
| `snoka-events/build/blocks/events/view.js` | 297 KB (+ styles) | Dynamic required. |
| Loader stub / scan | ~0.3 KB / ~1 selector per nav | Negligible. |
