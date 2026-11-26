# Swup Dynamic Loading: Theme-Owned Controller

Status: final spec. Replaces both the original micro-loader proposal and
the `snoka-views` micro-plugin draft (rejected as overbuilt: swup lives in
exactly one theme, so cross-theme coordination machinery — registry,
manifest, import maps, new repo — is unnecessary weight). Owner of the
router *and* the controller: the theme. Plugins only mark up their roots
and keep their view code idempotent.

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

One controller, owned by the theme and shipped in its bundle. No registry,
no manifest, no import maps, no new plugin, no per-plugin loader stubs.

- Each interactive block root carries two attributes, printed at render:
  `data-snoka-view="<name>"` and `data-snoka-view-src="<absolute versioned
  bundle URL>"`. The URL travels *with* the swapped markup, so the
  controller never needs advance knowledge of plugin internals, and there
  is no import map to keep populated (absolute-URL `import()` needs none —
  sidestepping the Firefox multi-import-map gap entirely).
- The controller scans for unclaimed `[data-snoka-view]` roots, claims
  each synchronously (a `WeakSet`, before any `await`, so concurrent
  triggers cannot double-boot), dynamically `import()`s the root's URL
  (browser module cache dedupes repeat visits), and calls the view's
  `boot( el, { signal } )`. Teardown-capable views return a cleanup, run
  on disconnect.
- Lifecycle (swup DOM events, already emitted — no new plumbing):
  `DOMContentLoaded` → scan; `swup:page:load` / `swup:page:preload` →
  prewarm (parse incoming HTML, start fetching for present views, overlapping
  the transition); `swup:content:replace` → reconcile (destroy anything no
  longer connected); `swup:page:view` → reconcile + scan.
- Deploy skew (cached HTML referencing a rotated bundle URL): retry once
  after 300 ms, then one guarded hard reload per URL (sessionStorage key),
  then stop. Never a reload loop.
- Classic IIFE bundles (e.g. the modal's current build) cannot be
  `import()`ed: either rebuild as ESM (preferred) or let the controller
  inject a `<script src>` guarded by a loaded-URL set. Same claim/scan
  flow either way.

## 3. Controller reference

```js
// Theme-owned. One scan path for initial load and swup arrival.
const claimed = new WeakSet();   // set synchronously: concurrent scans can't double-boot
const loaded = new Set();        // classic-script URLs already executed
const live = new Map();          // el -> { ac, cleanup }

async function ensureView( el ) {
  if ( claimed.has( el ) ) return;
  claimed.add( el );
  const src = el.dataset.snokaViewSrc;
  if ( ! src ) return;
  try {
    const mod = await import( /* @vite-ignore */ src ).catch( () => null )
      ?? await loadClassic( src );
    await mod?.boot?.( el, { signal: live.get( el )?.ac.signal } );
  } catch ( err ) {
    report( err, el );
    guardedReloadOnce();
  }
}
```

Full behavior contract (implement against this, not the sketch above):

1. `scan( root )`: for each `[data-snoka-view]` in root, skip claimed and
   `[data-snoka-inert]` subtrees, claim synchronously, then load + boot.
2. `load`: `import( src )` for ESM; classic fallback injects one `<script
   src>` per URL ever (`loaded` set). Record per-URL outcome; evict on
   failure so a later navigation retries.
3. `boot`: call the view's exported `boot( el, { signal } )`; store an
   `AbortController` per element; a returned cleanup runs on destroy.
   Views must be idempotent per element and must scope listeners to
   `{ signal }` (or return a cleanup that removes them).
4. `reconcile()`: destroy every tracked element no longer connected
   (`ac.abort()` + cleanup). Called on `swup:content:replace` (outgoing
   content still visible — only *untrack*, do not animate anything out)
   and again on `swup:page:view` before scanning.
5. `prewarm( html )`: parse incoming page HTML, start `ensureView`-style
   loads for views present (no mount until visible). Best-effort; failures
   are silent (the view pass retries).
6. Errors attribute `data-snoka-view-state="error"` on the root and
   `console.error` once with the view name; the single guarded reload is
   the last resort, never a loop.
7. Excluded subtrees: skip anything under `[data-snoka-inert]` (swup
   Parallel-plugin clones, previews).

## 4. Plugin contract (all a plugin does)

1. On each interactive block root, print `data-snoka-view="<name>"` and
   `data-snoka-view-src="<absolute versioned URL>"` (e.g. via
   `plugins_url()` + `filemtime()` at render).
2. Ship the view as an idempotent `boot( el, { signal } )` (+ optional
   teardown return). Keep `DOMContentLoaded` self-boot as the no-controller
   fallback so classic themes behave exactly as today.
3. No-JS safe: content visible without JS; `prefers-reduced-motion`
   respected; no nonces or user data in cached markup (fetch at mount).
4. Do not rely on HeadPlugin script execution, `persistTags` hacks, full-page
   `MutationObserver`s, or global enqueue of heavy bundles.

## 5. Theme responsibilities

- Own `views-controller.ts` (bundled, always enqueued — ~2 KB, negligible).
- HeadPlugin: `persistTags: 'link[data-snoka-view-style]'`,
  `awaitAssets: true`, so controller-added view stylesheets survive swaps.
- Keep the `EVENTS_CALENDAR_PATTERN` force-reload gate until the events
  views self-boot, then open it so calendar navigations become
  swup-handled. No per-plugin code in the theme — selectors and URLs ride
  in the markup.
- Never add Snoka views to ScriptsPlugin.

## 6. Migration

| View | Bundle | Change |
|---|---|---|
| Modal (`snoka-modal`) | 1.6 KB, delegation, no teardown | Add the two data attributes at render; ESM rebuild or classic-inject path. Interim global enqueue stays `@todo`-marked until this lands. |
| Events calendar (`snoka-events`) | 297 KB | Same, plus `bootCalendars` / `teardownCalendars` as mount/cleanup. Remove the theme route gate once verified. |
| Mini-cal (`snoka-events`) | 73 KB | Same pattern; no separate listeners needed — the controller is the listener. |
| Intro-animate | n/a (runs on load today) | Register per-view hooks; hidden-until-intro CSS must be JS-scoped and reveal on `error`, reduced motion, and no-JS. Verify the post-swap arrival case explicitly. |

## 7. Verification protocol

Headless Chromium on DDEV, per migrated view. Count bundle requests;
assert machine-readable state (no screenshots).

1. Direct load: mounts once, bundle fetched once, ready state, no errors.
2. Swup navigate from a markup-less page: same document (no reload),
   mount once, exactly one fetch; interaction works (open modal / switch
   month / dots render).
3. Leave, return, back and forward: destroys match mounts; no duplicate
   listeners (click once → one open); no console errors.
4. Pages without the markup: zero view requests, zero view stylesheets.
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

## 8. Risks

| Risk | Mitigation |
|---|---|
| Stale cached HTML references a rotated bundle URL | Retry once, one guarded reload per URL, then stop. |
| Classic IIFE view bundles | Rebuild as ESM where possible; otherwise controller-side script injection guarded by the loaded-URL set. |
| `data-snoka-view-src` in cached HTML across deploys | Same skew handling as above; URLs are versioned so correctness never depends on cache age. |
| A second swup theme appears | Copy the ~100-line controller; plugin markup needs no change. Revisit shared packaging only then. |
| Parallel-plugin cloned content | `[data-snoka-inert]` subtrees are never scanned. |
| Interactivity API + swup history interplay (open observation) | Fallback is a full navigation; verify case 3 covers back/forward. |

## 9. Open items

1. Confirm `bootCalendars` / `teardownCalendars` accept a single root
   element (codebase reads that way; verify against the real bundle).
2. Decide intro-animate's hidden-until-intro CSS placement per §6 row.
3. Run the full protocol in §7 on DDEV, including Firefox and Safari.
4. Remove the modal global-enqueue `@todo` interim once its view lands.
5. Remove the theme's `EVENTS_CALENDAR_PATTERN` gate once the calendar
   view lands.
