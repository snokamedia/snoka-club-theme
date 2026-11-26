# Swup Dynamic Loading: Theme-Owned Controller (Final)

Status: final spec. Replaces the micro-loader proposal *and* the
`snoka-views` micro-plugin draft. Owner of the router and the controller:
the theme. Implements the four hardening fixes from review (allowlisted
URLs, ESM-only, single controller-active switch, styles carrier) plus the
corrected reference code. No registry, no manifest, no import maps, no new
plugin.

## 1. Problem

WordPress enqueues a block's `viewScript` only when the block renders
server-side. Under swup client-side navigation, new markup arrives without
its scripts: HeadPlugin syncs the tags with `cloneNode`, cloned scripts
never execute (measured: tag present, zero fetches), and the view stays
dead with no console errors. Proven on this stack for the modal
(`snoka-modal`) and the events calendar/mini-cal (`snoka-events`); see the
per-plugin reports. Global enqueue closes the hole but ships up to ~370 KB
of unused JS per page — rejected except as a marked interim for the
1.6 KB modal bundle.

## 2. Design

One controller, owned by the theme and shipped in its bundle. Plugins mark
up their roots; the controller does the rest.

- Each interactive block root carries three attributes, printed at render:
  `data-snoka-view="<name>"`,
  `data-snoka-view-src="<absolute versioned bundle URL>"`, and optionally
  `data-snoka-view-css="<absolute stylesheet URLs, space-separated>"`.
  URLs travel *with* the swapped markup, so the controller needs no prior
  knowledge of plugins and no import map (absolute-URL `import()` needs
  none — sidestepping the Firefox multi-import-map gap entirely).
- **URLs are never trusted blindly** (review finding 1). Before importing,
  the controller validates: same origin as `location`, and path under an
  allowlist of plugin/theme build prefixes the theme defines (default:
  `/wp-content/plugins/` and the active theme's directory). Anything else
  is rejected with a console error and an `error` state — never fetched,
  never imported. (Stronger alternative, not required: print a short name
  and resolve it through a server-printed allowlist map.)
- **ESM only** (review finding 2). The classic-fallback branch is deleted:
  importing a classic IIFE does not reject, it silently yields an empty
  namespace, and real network failures would be hidden by the fallback.
  Rebuild the 1.6 KB modal bundle as ESM; cost is nil.
- **One switch kills double execution** (review finding 3). The theme sets
  a server-side flag — filter `snoka_swup_controller_active`, true when
  the controller is enqueued. When active, the plugin skips *both* its own
  `viewScript` enqueue *and* any self-boot path; the controller is the
  sole boot path (direct load included — it scans on
  `DOMContentLoaded` too). Classic themes never set the flag, so their
  current behavior is byte-identical. No `viewScriptModule`, no dual
  registration.
- Lifecycle (swup DOM events, already emitted — no new plumbing):
  `DOMContentLoaded` → scan; `swup:page:load` / `swup:page:preload` →
  prewarm (parse incoming HTML, start fetching for present views);
  `swup:content:replace` → reconcile (destroy anything no longer
  connected — teardown happens here, never on `visit:start`, where the
  old page is still visible and the visit can abort);
  `swup:page:view` → reconcile + scan.
- First paint is protected: the block prints
  `<link rel="modulepreload" href="{same URL}">` on render (review
  finding 6). Same URL string preserves module identity between the
  preload, the controller's `import()`, and any server-printed tag.
- Translations for dynamically imported views do **not** come from
  WordPress module translations (those apply to registered modules only).
  Pass strings in the markup (`data-*` attributes or an adjacent
  `application/json` script), never nonces or user data — fetch those at
  mount (review finding 7).
- State and re-attachment (review finding 8): the synchronous claim is
  released on destroy, so a re-attached node boots again; an element with
  no usable `src` gets `data-snoka-view-state="error"` immediately instead
  of hanging in `loading`.

## 3. Controller reference (corrected)

Fixes the draft's defects: the live record is populated *before* mount so
`signal` is always defined; the guarded reload fires only on load/network
failure, never on mount bugs.

```js
// Theme-owned. One scan path for initial load and swup arrival.
const claimed = new WeakSet(); // set synchronously: concurrent scans can't double-boot
const loaded = new Set();      // module URLs already evaluated
const live = new Map();        // el -> { ac, cleanup }
const inflight = new Map();    // url -> Promise (evicted on failure)

function allowedSrc( src ) {
  let u;
  try {
    u = new URL( src, document.baseURI );
  } catch {
    return null;
  }
  const prefixes = window.SnokaViews?.allowedPrefixes ?? [ '/wp-content/plugins/', '/wp-content/themes/' ];
  const sameOrigin = u.origin === location.origin;
  const onPath = prefixes.some( ( p ) => u.pathname.startsWith( p ) );
  return sameOrigin && onPath ? u.href : null;
}

async function ensureView( el ) {
  if ( claimed.has( el ) ) return;
  claimed.add( el );
  const state = ( s ) => el.setAttribute( 'data-snoka-view-state', s );
  const src = allowedSrc( el.dataset.snokaViewSrc || '' );
  if ( ! src ) {
    state( 'error' );
    console.error( '[snoka-views] rejected view src', el.dataset.snokaView );
    return;
  }
  state( 'loading' );
  if ( ! live.has( el ) ) {
    const ac = new AbortController();
    live.set( el, { ac, cleanup: undefined } );
  }
  const rec = live.get( el );
  try {
    let p = inflight.get( src );
    if ( ! p ) {
      p = import( /* @vite-ignore */ src );
      inflight.set( src, p );
      p.catch( () => inflight.delete( src ) );
    }
    const mod = await p;
    if ( typeof mod.boot !== 'function' ) {
      throw new Error( `view has no boot(): ${ el.dataset.snokaView }` );
    }
    if ( ! el.isConnected ) return destroy( el );
    rec.cleanup = await mod.boot( el, { signal: rec.ac.signal } );
    if ( ! el.isConnected ) return destroy( el );
    state( 'ready' );
  } catch ( err ) {
    // Load/network failure only: mount bugs must surface, never reload.
    if ( err instanceof TypeError ) {
      state( 'error' );
      console.error( '[snoka-views] load failed', el.dataset.snokaView, err );
      guardedReloadOnce();
    } else {
      state( 'error' );
      console.error( '[snoka-views] mount failed', el.dataset.snokaView, err );
    }
  }
}

function destroy( el ) {
  const rec = live.get( el );
  live.delete( el );
  claimed.delete( el ); // re-attached nodes may boot again
  if ( ! rec ) return;
  try {
    rec.ac.abort();
    rec.cleanup?.();
  } catch ( err ) {
    console.error( '[snoka-views] destroy failed', err );
  }
}

function reconcile( root = document ) {
  for ( const el of [ ...live.keys() ] ) {
    if ( ! el.isConnected ) destroy( el );
  }
}

function scan( root = document ) {
  const sel = '[data-snoka-view]';
  if ( root !== document && ! root.matches?.( sel ) && ! root.querySelector( sel ) ) return;
  const scope = root === document ? document : root;
  for ( const el of scope.querySelectorAll( sel ) ) {
    if ( el.closest( '[data-snoka-inert]' ) ) continue;
    void ensureView( el );
  }
}

let navigated = false;
function guardedReloadOnce() {
  if ( ! navigated ) return;
  const key = `snoka-views-reload:${ location.href }`;
  if ( sessionStorage.getItem( key ) ) return;
  sessionStorage.setItem( key, '1' );
  location.reload();
}

function prewarm( html ) {
  if ( ! html ) return;
  const doc = new DOMParser().parseFromString( html, 'text/html' );
  for ( const el of doc.querySelectorAll( '[data-snoka-view][data-snoka-view-src]' ) ) {
    const checked = allowedSrc( el.dataset.snokaViewSrc );
    if ( checked && ! loaded.has( checked ) ) {
      // Warm the module graph only; mounting happens on page:view.
      import( /* @vite-ignore */ checked ).then(
        () => loaded.add( checked ),
        () => {}
      );
    }
  }
}

document.addEventListener( 'DOMContentLoaded', () => scan() );
document.addEventListener( 'swup:page:load', ( e ) => prewarm( e.detail?.args?.page?.html ) );
document.addEventListener( 'swup:page:preload', ( e ) => prewarm( e.detail?.args?.page?.html ) );
document.addEventListener( 'swup:content:replace', () => reconcile() );
document.addEventListener( 'swup:page:view', () => { navigated = true; reconcile(); scan(); } );
if ( document.readyState !== 'loading' ) scan();
```

Notes on the sketch: views export a named `boot`. The `loaded` set
records modules whose side effects already ran (prewarm path); the
`inflight` promise cache dedupes concurrent loads and is evicted on
failure so later navigations retry. Mount errors never trigger the reload
guard — only failed fetches do, and only after a swup navigation.

## 4. Plugin contract (all a plugin does)

1. On each interactive block root, print `data-snoka-view="<name>"`,
   `data-snoka-view-src="<absolute versioned URL>"`, and any view styles
   in `data-snoka-view-css` (space-separated absolute URLs). Print
   `<link rel="modulepreload" href="{same URL}">` on render.
2. Ship the view as an ESM bundle exporting `boot( el, { signal } )`
   (idempotent per element; listeners scoped to `{ signal }` or removed by
   the returned cleanup; teardown-capable views return the cleanup).
3. Gate everything on the controller switch: when the theme signals
   active (filter `snoka_swup_controller_active`), skip the plugin's own
   enqueue *and* self-boot paths entirely. Classic themes keep working
   exactly as today.
4. Keep it no-JS safe (visible content, `prefers-reduced-motion`
   respected). Carry per-instance config and strings in markup, never
   globals or nonces (fetch the latter at mount).
5. Do not rely on HeadPlugin script execution, `persistTags` workarounds,
   full-page `MutationObserver`s, or global enqueue of heavy bundles.

## 5. Theme responsibilities

- Own and bundle the controller above (always enqueued on the frontend;
  ~2 KB, negligible).
- HeadPlugin: `persistTags: 'link[data-snoka-view-style], link[rel="modulepreload"]'`,
  `awaitAssets: true`, so controller-added stylesheets and preloads
  survive swaps.
- Keep the `EVENTS_CALENDAR_PATTERN` force-reload gate until the events
  views self-boot, then open it so calendar navigations become
  swup-handled. No per-plugin code in the theme — selectors and URLs ride
  in the markup.
- Never add Snoka views to ScriptsPlugin.
- Expose the controller-active signal the plugin switch reads (filter
  `snoka_swup_controller_active`, true when the controller is enqueued).

## 6. Migration

| View | Bundle | Change |
|---|---|---|
| Modal (`snoka-modal`) | 1.6 KB, delegation, no teardown | ESM rebuild; stamp the three data attributes + modulepreload at render; gate legacy enqueue/self-boot on the controller switch. Remove the global-enqueue `@todo` interim once landed. |
| Events calendar (`snoka-events`) | 297 KB | Same, plus `bootCalendars` / `teardownCalendars` as mount/cleanup. Remove the theme route gate once verified. |
| Mini-cal (`snoka-events`) | 73 KB | Same pattern; no separate listeners needed — the controller is the listener. |
| Intro-animate | n/a (runs on load today) | Register per-view hooks; hidden-until-intro styling must be JS-scoped and reveal on `error`, reduced motion, and no-JS. Verify the post-swap arrival case explicitly. |

## 7. Verification protocol

Headless Chromium on DDEV, per migrated view. Count bundle requests;
assert machine-readable state (no screenshots).

1. Direct load: mounts once, bundle fetched once, ready state, no errors.
2. Swup navigate from a markup-less page: same document (no reload),
   mount once, exactly one fetch; interaction works (open modal / switch
   month / dots render).
3. Leave, return, back and forward: destroys match mounts; no duplicate
   listeners (click once → one open); no console errors.
4. Pages without the markup: zero view requests, zero view stylesheets —
   and no `data-snoka-view-src` accepted off-allowlist (negative test:
   `https://evil.example/x.js` and path-traversal URLs are rejected
   without a fetch; add one to the suite).
5. Reduced motion + JavaScript disabled: content visible, nothing stuck
   half-faded.
6. Five concurrent scan triggers: exactly one mount.
7. Click/navigate away mid-load: no mount, no console error.
8. Bundle 500s once: recovers on retry, no reload.
9. Bundle fails permanently after swup navigation: `error` state, exactly
   one guarded reload per URL, no loop.
10. Slow network with prewarm: view ready at or near `page:view`.
11. Deploy skew (stale cached HTML, rotated bundle URL): retry + single
    guarded reload, then settles.
12. Cloudflare cache, logged out and in: no nonces or user data in cached
    HTML or attributes.
13. Firefox and Safari: cases 1–4 pass.
14. Editor and admin screens: controller present only where the theme
    enqueues it (frontend); editor keeps its own `editorScript` path.
15. `data-snoka-view` without `src`, and `src` with wrong scheme/host:
    `error` state immediately, no fetch, no hang.

## 8. Risks

| Risk | Mitigation |
|---|---|
| Malicious `data-snoka-view-src` (any author can write `data-*`) | Same-origin + theme-defined path-prefix allowlist, enforced before any fetch; `error` state otherwise. |
| Classic IIFE view bundles | Rebuild as ESM; no classic fallback (silent empty namespace + masked failures). |
| Stale cached HTML references a rotated bundle URL | Retry once, one guarded reload per URL, then stop. |
| `data-snoka-view-src` in cached HTML across deploys | Same skew handling; URLs are versioned so correctness never depends on cache age. |
| A second swup theme appears | Copy the ~120-line controller; plugin markup needs no change. Revisit shared packaging only then. |
| Parallel-plugin cloned content | `[data-snoka-inert]` subtrees are never scanned. |
| Interactivity API + swup history interplay (open observation) | Fallback is a full navigation; verify case 3 covers back/forward. |
| Mount bug vs load failure conflated | Only `TypeError` (fetch/parse) arms the reload guard; mount errors log and set `error` state. |

## 9. Open items

1. Confirm `bootCalendars` / `teardownCalendars` accept a single root
   element (codebase reads that way; verify against the real bundle).
2. Decide intro-animate's hidden-until-intro CSS placement per §6 row.
3. Run the full protocol in §7 on DDEV, including Firefox and Safari
   and the new XSS negative test (case 4).
4. Remove the modal global-enqueue `@todo` interim once its view lands.
5. Remove the theme's `EVENTS_CALENDAR_PATTERN` gate once the calendar
   view lands.
