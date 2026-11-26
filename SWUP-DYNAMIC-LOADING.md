# Swup Dynamic Loading: Fact Check and Final Spec

Status: replaces the design proposal. Owner of the router: the theme. Implementers: snoka-events, snoka-modal, snoka-intro-animate, plus one new micro plugin, `snoka-views`.

## Verdict

The problem statement is correct and the evidence holds. The proposed solution (a classic `ensureScript` micro-loader plus `defineReloadableView`) does not meet its own goals. A proof of concept with real swup 4, real HeadPlugin and Chromium reproduced five failures of the sketch (section 2). The replacement is a shared ES module controller, delivered as a WordPress Script Module, driven by a small manifest and a per-element lifecycle. One code path serves direct load and swup arrival. Core WordPress already moved to the same model for its own router, which only loads script modules ([Gutenberg client-side navigation guide](https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/interactivity-api/core-concepts/client-side-navigation.md)).

Recommended answers to the open questions:

| Question | Answer |
|---|---|
| Where the helper lives | A micro plugin `snoka-views` that owns the controller and the PHP registration API. The theme only configures swup. |
| Script Modules or classic loader | Script Modules. No classic fallback. |
| URL plumbing for `import()` | None. Modules are imported by import map ID, and WordPress supplies the versioned URL. |
| Admin and editor exclusion | Enqueue the controller on `wp_enqueue_scripts` only, and guard the controller against editor documents. |

## 1. Fact check

| Claim in the proposal | Result | Evidence |
|---|---|---|
| WordPress enqueues a block's view script only when the block renders | Confirmed. `viewScriptModule` behaves the same. | [Make WordPress, viewScriptModule](https://make.wordpress.org/core/2024/03/04/block-metadata-viewscriptmodule-field-in-6-5/) |
| Under swup, scripts for the new page's blocks are missing | Confirmed. Swup only swaps the configured containers and the head. | [swup common issues](https://swup.js.org/getting-started/common-issues/) |
| HeadPlugin inserts the script tag but it never runs (modal case) | Confirmed. HeadPlugin clones head nodes with `cloneNode(true)`. A cloned script keeps the "already started" flag and does not execute. In the proof of concept, classic and module scripts inserted this way produced zero requests. Footer scripts are not touched at all. | [mergeHeadContents.ts](https://raw.githubusercontent.com/swup/head-plugin/master/src/mergeHeadContents.ts), [HTML spec](https://html.spec.whatwg.org/multipage/scripting.html), [Stack Overflow](https://stackoverflow.com/questions/28771542/why-dont-clonenode-script-tags-execute) |
| Initial load fires no swup page event, so DOMContentLoaded is needed | Confirmed | [swup reloading JavaScript](https://swup.js.org/getting-started/reloading-javascript/) |
| `swup:page:view` and `swup:visit:start` exist as DOM events | Confirmed. DOM events are named `swup:<hook>` with detail `{hook, args, visit}`. They fire after the hook handlers and are not dispatched for finished visits. | [swup hooks](https://swup.js.org/hooks/), [Hooks.ts](https://raw.githubusercontent.com/swup/swup/main/src/modules/Hooks.ts) |
| Tear down on `swup:visit:start` | Not advised. The old page is still visible at that point and the visit can still abort. Swup's own docs use `content:replace`. | [swup reloading JavaScript](https://swup.js.org/getting-started/reloading-javascript/) |
| ScriptsPlugin is a possible fix | Works but is a last resort. It re-creates and re-runs every script on each visit, and the docs warn about leaks. | [Scripts Plugin](https://swup.js.org/plugins/scripts-plugin/) |
| `awaitAssets` covers what the page needs | Only stylesheets | [Head Plugin](https://swup.js.org/plugins/head-plugin/) |
| Dynamic `import()` plus Script Modules is the right primitive | Confirmed. Dynamic dependencies land in the import map without being preloaded. Modules cannot depend on classic scripts, and importing the same module under two URLs evaluates it twice. | [Script Modules in 6.5](https://make.wordpress.org/core/2024/03/04/script-modules-in-6-5/) |
| Per-module data can be passed to a module | Confirmed since 6.7. The data prints as JSON in `<script id="wp-script-module-data-{id}">` | [Script Modules in 6.7](https://make.wordpress.org/core/2024/10/14/updates-to-script-modules-in-6-7/) |
| Mini-cal lacks swup listeners | Not checked against the repository. Taken from the proposal. | n/a |
| intro-animate is "already load-safe" because it runs on DOMContentLoaded | Wrong for swup. DOMContentLoaded never fires on swup arrival, so the intro does not run on arrival, and any "hidden until intro" CSS leaves the content hidden. | Same swup docs as above, plus the proof of concept |
| Measured loader stub 0.3 KB | Plausible for the sketch. The replacement controller is 2.6 KB minified, about 1.3 KB gzip, and removes the per-plugin stub. | Proof of concept build |

Platform context verified while researching:

- WordPress 7.0 shipped on 2026-05-20 ([WordPress.org](https://wordpress.org/documentation/wordpress-version/version-7.0/)). It adds script module translations and lets classic scripts depend on modules ([Gutenberg PR 77214](https://github.com/WordPress/gutenberg/pull/77214), [7.0 field guide](https://make.wordpress.org/core/2026/05/14/wordpress-7-0-field-guide/)).
- In block themes, script modules print in `wp_head`, because the template canvas renders the block template before the head ([template-canvas.php](https://raw.githubusercontent.com/WordPress/wordpress-develop/trunk/src/wp-includes/template-canvas.php)).
- The core Interactivity router handles only script modules marked `loadOnClientNavigation`, and it states that vanilla JS blocks are incompatible ([compatibility guide](https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/interactivity-api/core-concepts/client-side-navigation-compatibility.md), [6.9 dev note](https://make.wordpress.org/core/2025/11/12/interactivity-apis-client-navigation-improvements-in-wordpress-6-9/)). It does not solve this problem for a swup site.
- Multiple import maps are unsupported in Firefox through version 160, and supported in Chrome and Edge 133 and later and Safari 18.4 and later, about 87 percent of global usage ([caniuse](https://caniuse.com/wf-import-maps-multiple)). The design below never needs a second import map.

## 2. Defects in the proposed sketch

Each item was reproduced in Chromium against real swup 4 and HeadPlugin, using the sketch code unchanged.

| # | Defect | Measured result |
|---|---|---|
| 1 | `window.SnokaEvents.viewUrl` comes from an inline localize global in the footer. Swup does not carry footer inline scripts, so arriving from a page without the globals leaves it undefined. | TypeError, 0 boots, 0 fetches |
| 2 | On direct load, WordPress already emits the bundle tag and `ensureScript` injects it again, because DOM presence is not tracked. | Bundle executed 2 times, 2 fetches. The "fetched exactly once" goal fails. |
| 3 | The `data-swup-booted` flag is set after the load resolves, so overlapping triggers (DOMContentLoaded, `page:view`, a late import) pass the guard together. | 2 boots from concurrent scans |
| 4 | A module imported after DOMContentLoaded never boots elements that are already present. | 0 boots after a late import |
| 5 | A rejected load promise is cached for the page lifetime. | 2 rejections from 1 request, no retry |
| 6 | Teardown on `visit:start` runs while the old page is still visible, and also on visits that later abort. | Calendar still in the DOM when teardown ran |
| 7 | The usage sketch is circular: `boot` comes from the bundle that `load` is still fetching. `boot(root, shells)` does not match the real `bootCalendars(root, initCalendar)` signature. | Does not run as written |
| 8 | `data-booted` and `data-swup-booted` are two flags with overlapping meaning. | Conflicting state possible |
| 9 | Styles are not handled. Footer styles are not synced by HeadPlugin, and per-instance config has no carrier. | Unstyled or unconfigured views on arrival |
| 10 | The intro-animate row in the migration table is wrong (see section 1). | Content can stay hidden on arrival |

## 3. Methods compared

| Method | Works under swup | Runs code once | Pages without markup pay nothing | Failure recovery | Verdict |
|---|---|---|---|---|---|
| Global enqueue of every bundle | Yes | Yes | No. 1.6 KB modal is tolerable, 73 KB mini-cal and 297 KB events are not. | n/a | Reject beyond the modal interim |
| HeadPlugin script sync | No. Cloned scripts never execute. | n/a | Yes | None | Reject |
| ScriptsPlugin | Yes | No. Re-runs scripts on each visit. | Yes | None | Last resort only |
| Proposal sketch (classic micro-loader) | Partly | No (defects 2 to 5) | Yes | None | Reject |
| Classic micro-loader, corrected | Yes | Yes | Yes | Possible | Works, but no module identity, no import map dedupe, no modern dependency graph, one more loader per plugin |
| Core Interactivity router | Not applicable to swup. Only handles modules marked for client navigation. | Yes | Yes | Core managed | Wrong router for this site. Adopting it means dropping swup. |
| Cross-document view transitions, no swup | Yes, as a native navigation | Yes | Yes | Native | Not a drop-in. Firefox has not shipped it ([web features explorer](https://web-platform-dx.github.io/web-features-explorer/features/cross-document-view-transitions/)). Worth tracking. |
| Turbo style head-script append | Yes in Turbo | Yes | Yes | None | Same constraint as HeadPlugin in swup ([Turbo handbook](https://turbo.hotwired.dev/handbook/building)). Not available here. |
| Shared module controller, manifest and import map (recommended) | Yes | Yes, by module identity | Yes. Only the manifest and import map entries are paid. | Retry, then one guarded reload | Adopt |

## 4. Architecture

### 4.1 Pieces

| Piece | Owner | Role |
|---|---|---|
| `@snoka/views` (controller module) | `snoka-views` | Scans, claims, loads, mounts, destroys. About 1.3 KB gzip. |
| `@snoka/views-entry` (entry module) | `snoka-views` | Contains `import '@snoka/views';`. Exists so view modules can appear as dynamic dependencies without a cycle. |
| Manifest | `snoka-views`, filled by each plugin | JSON printed by the `script_module_data_@snoka/views` filter. Maps view name to module ID, optional selector, optional styles. |
| View module `@snoka/{name}-view` | each plugin | Imports `defineView` from `@snoka/views` and registers a `mount` function. |
| Swup config | theme | HeadPlugin options and route gates. No view code. |

### 4.2 Why this shape

- The controller is static and tiny, so every page loads it. View code is never loaded unless a matching element exists in the DOM or in an incoming page.
- Each view module is registered as a dynamic dependency of the entry module. That puts every view in the import map of the first document, with WordPress's own version query, and nothing is preloaded. A later `import('@snoka/events-calendar-view')` resolves through that map, so no second import map is needed. This matters because Firefox does not support multiple import maps.
- Using the import map ID everywhere means a module has one identity. Hand built URLs with a different `ver` evaluate the module twice (measured: `evalCount` 2).
- The block's `render_callback` also enqueues its view module. On a direct load WordPress then prints the module tag for that page and the controller's `import()` resolves to the same, already evaluated module. This is the fast path for first paint.
- The controller never reads URLs, globals or localized data. Per-instance configuration travels in the markup.

### 4.3 PHP contract

```php
Snoka_Views::register( string $name, array $args ): void
// $args: src (string, required), version (string|false), selector (string, optional),
//        styles (string[], optional absolute URLs), deps (string[] of other script module IDs, optional)

Snoka_Views::enqueue( string $name ): void
// Call from the block render_callback. Wraps wp_enqueue_script_module for the direct load fast path.
```

Rules:

- Register on `init`. Enqueue the controller and entry on `wp_enqueue_scripts` priority 20, so editor and admin screens never get them.
- The module ID is always `@snoka/{name}-view`. Each view module depends statically on `@snoka/views`.
- Do not use `viewScriptModule` in `block.json` for these views. It would require the build tool to externalize `@snoka/views`, and the `render_callback` call keeps the plugin independent of the build step.
- View bundles must be self-contained ES modules. Importing other modules is allowed only through registered IDs. Classic `@wordpress/*` script dependencies are not available to modules before WordPress 7.0, so avoid them or require 7.0.
- Floor: WordPress 6.7, for `script_module_data`. Recommended: 7.0 or later. Each plugin declares the helper with the `Requires Plugins` header ([Plugin Dependencies, 6.5](https://make.wordpress.org/core/tag/6-5+dev-notes/)), and calls `Snoka_Views::register` only if the class exists.
- The manifest prints on every page. Keep each entry to a module ID plus optional selector and styles.

### 4.4 Manifest

```json
{ "views": {
  "events-calendar": { "module": "@snoka/events-calendar-view", "styles": ["https://example.com/events/view.css"] },
  "modal":           { "module": "@snoka/modal-view" }
} }
```

The default selector is `[data-snoka-view="<name>"]`. Server markup for a view root must carry that attribute.

### 4.5 Lifecycle

| Moment | Trigger | Action |
|---|---|---|
| Direct load | Document already past `loading`, or DOMContentLoaded | `scan()` |
| View module evaluates late | `defineView()` | Registers the view and queues `scan()` in a microtask, so present elements still boot |
| Swup starts loading a page, or preloads one | `swup:page:load`, `swup:page:preload` | Parse `detail.args.page.html`, start `ensure()` for views present. Overlaps with the out animation. |
| Old content removed | `swup:content:replace` | `reconcile()` destroys every tracked element no longer connected |
| New page visible | `swup:page:view` | `reconcile()`, then `scan()` |
| Element claimed | `scan()` | Claimed in a WeakSet synchronously, before any await. Concurrent scans cannot double boot. |
| Load | `ensure(name)` | Loads styles and `import(moduleId)`. Promise cached per name and evicted on failure. |
| Load failure | `run()` | Retry once after 300 ms. If it still fails after an in-page navigation, set state `error` and do one hard reload per URL, guarded by a sessionStorage key. |
| Mount | `def.mount(el, { signal })` | May return a cleanup function. State attribute `data-snoka-view-state` moves through `loading`, `ready` or `error`. |
| Destroy | `reconcile()` | `AbortController.abort()` then cleanup. Listeners added with `{ signal }` are removed automatically. |
| Excluded content | `[data-snoka-inert]` ancestor | Skipped. Use this for the Parallel plugin's cloned outgoing content. |

### 4.6 View module contract

```js
import { defineView } from '@snoka/views';

defineView( 'events-calendar', {
  async mount( el, { signal } ) {
    const { bootCalendars, teardownCalendars } = await import( './calendar-core/index.js' );
    bootCalendars( el );
    return () => teardownCalendars( el );
  },
} );
```

- `mount` receives one root element. It must be idempotent per element and must not touch `document` globals without removing them on abort.
- Add listeners with `{ signal }`, or return a cleanup.
- Read per-instance settings from `data-*` attributes or a `<script type="application/json">` inside the root. Never read localize globals. Do not put nonces in cached HTML. Fetch nonces through a REST endpoint at mount time.

### 4.7 Styles

- List view styles in the manifest. The controller adds a `<link data-snoka-view-style>` unless a stylesheet with the same resolved href exists, and waits for it to load (3 s cap) before mount.
- Theme HeadPlugin options:

```js
new SwupHeadPlugin( { persistTags: 'link[data-snoka-view-style]', awaitAssets: true } )
```

`persistTags` keeps controller added links from being removed on the next visit. Block styles that WordPress prints for the server render are handled by HeadPlugin as usual.

### 4.8 Theme responsibilities

- Keep swup, containers and animations.
- Remove the `EVENTS_CALENDAR_PATTERN` force reload gate. The controller loads the code on arrival.
- Exclude cloned outgoing content with `data-snoka-inert` when using the Parallel plugin.
- Do not add scripts to swup's ScriptsPlugin for Snoka views.

## 5. Reference implementation

All code below was run in the proof of concept.

### 5.1 Controller, `views.js`

```js
/* @snoka/views: shared view controller (reference implementation).
 * Always enqueued on the front end as a script module. Views register through defineView().
 * Per element: claim synchronously, load code, mount, destroy when the element leaves the DOM. */
const DATA_ID = 'wp-script-module-data-@snoka/views';
let manifest = {};
try {
  manifest = JSON.parse( document.getElementById( DATA_ID )?.textContent || '{}' ).views || {};
} catch ( e ) { /* manifest stays empty: controller is inert */ }

const defs = new Map();      // name -> { mount }
const claimed = new WeakSet(); // elements already handled (set synchronously, before any await)
const live = new Map();      // element -> { ac, cleanup }
const loads = new Map();     // name -> Promise (code + styles); evicted on failure
let navigated = false;       // true after the first swup navigation

const report = ( err, ctx ) => console.error( '[snoka-views]', ctx || '', err );
const names = () => Object.keys( manifest );
const selectorOf = ( n ) => manifest[ n ].selector || `[data-snoka-view="${ n }"]`;
const nameOf = ( el ) => names().find( ( n ) => el.matches( selectorOf( n ) ) );

function ensureStyles( hrefs = [] ) {
  return Promise.all( hrefs.map( ( href ) => new Promise( ( resolve ) => {
    const abs = new URL( href, document.baseURI ).href;
    let link = [ ...document.querySelectorAll( 'link[rel~="stylesheet"]' ) ].find( ( l ) => l.href === abs );
    if ( ! link ) {
      link = document.createElement( 'link' );
      link.rel = 'stylesheet';
      link.href = abs;
      link.setAttribute( 'data-snoka-view-style', '' );
      document.head.append( link );
    }
    if ( link.sheet ) return resolve();
    link.addEventListener( 'load', () => resolve(), { once: true } );
    link.addEventListener( 'error', () => resolve(), { once: true } );
    setTimeout( resolve, 3000 );
  } ) ) );
}

function ensure( name ) {
  let p = loads.get( name );
  if ( ! p ) {
    const m = manifest[ name ];
    p = Promise.all( [ ensureStyles( m.styles ), import( m.module ) ] ).then( () => undefined );
    p.catch( () => loads.delete( name ) );
    loads.set( name, p );
  }
  return p;
}

function destroy( el ) {
  const rec = live.get( el );
  claimed.delete( el );
  if ( ! rec ) return;
  live.delete( el );
  try { rec.ac.abort(); rec.cleanup?.(); } catch ( e ) { report( e, 'destroy' ); }
}

function reconcile() {
  for ( const el of [ ...live.keys() ] ) if ( ! el.isConnected ) destroy( el );
}

async function run( name, el ) {
  el.setAttribute( 'data-snoka-view-state', 'loading' );
  try {
    try {
      await ensure( name );
    } catch ( first ) {
      // One retry (the failed entry was evicted). Browsers differ in whether a failed import() is retried.
      await new Promise( ( r ) => setTimeout( r, 300 ) );
      await ensure( name );
    }
  } catch ( err ) {
    el.setAttribute( 'data-snoka-view-state', 'error' );
    report( err, `load ${ name }` );
    // Deploy skew or network failure after an in-page navigation: one hard reload per URL.
    const key = `snoka-views-reload:${ location.href }`;
    if ( navigated && ! sessionStorage.getItem( key ) ) {
      sessionStorage.setItem( key, '1' );
      location.reload();
    }
    return;
  }
  const def = defs.get( name );
  if ( ! el.isConnected ) { claimed.delete( el ); return; }
  if ( ! def ) { el.setAttribute( 'data-snoka-view-state', 'error' ); report( new Error( 'not registered' ), name ); return; }
  const rec = { ac: new AbortController(), cleanup: undefined };
  live.set( el, rec );
  try {
    rec.cleanup = await def.mount( el, { signal: rec.ac.signal } );
    if ( ! el.isConnected ) return destroy( el );
    el.setAttribute( 'data-snoka-view-state', 'ready' );
  } catch ( err ) {
    destroy( el );
    claimed.add( el ); // do not retry in a loop
    el.setAttribute( 'data-snoka-view-state', 'error' );
    report( err, `mount ${ name }` );
  }
}

export function scan( root = document ) {
  const sel = names().map( selectorOf ).join( ',' );
  if ( ! sel ) return;
  for ( const el of root.querySelectorAll( sel ) ) {
    if ( claimed.has( el ) || el.closest( '[data-snoka-inert]' ) ) continue;
    const name = nameOf( el );
    if ( ! name ) continue;
    claimed.add( el ); // synchronous claim: concurrent scans cannot double-boot
    run( name, el );
  }
}

export function defineView( name, def ) {
  if ( defs.has( name ) ) return console.warn( `[snoka-views] duplicate view "${ name }"` );
  if ( ! manifest[ name ] ) manifest[ name ] = { selector: def.selector };
  defs.set( name, def );
  queueMicrotask( () => scan() );
}

function prewarm( html ) {
  if ( ! html ) return;
  const doc = new DOMParser().parseFromString( html, 'text/html' );
  for ( const n of names() ) if ( doc.querySelector( selectorOf( n ) ) ) ensure( n ).catch( () => {} );
}

const on = ( type, fn ) => document.addEventListener( type, fn );
on( 'swup:page:load', ( e ) => prewarm( e.detail?.args?.page?.html ) );
on( 'swup:page:preload', ( e ) => prewarm( e.detail?.args?.page?.html ) );
on( 'swup:content:replace', () => reconcile() );
on( 'swup:page:view', () => { navigated = true; reconcile(); scan(); } );
if ( document.readyState === 'loading' ) on( 'DOMContentLoaded', () => scan() ); else scan();
```

### 5.2 Entry module, `entry.js`

```js
import '@snoka/views';
```

### 5.3 PHP registration, tested on WordPress 7.1.5

```php
<?php
/**
 * Plugin Name: Snoka Views (PoC)
 */
final class Snoka_Views {
	private static $views = array();
	private static $hooked = false;

	public static function register( $name, $args ) {
		$args = wp_parse_args( $args, array( 'src' => '', 'version' => false, 'selector' => '', 'styles' => array() ) );
		self::$views[ $name ] = $args;
		if ( ! self::$hooked ) {
			self::$hooked = true;
			add_action( 'wp_enqueue_scripts', array( __CLASS__, 'boot' ), 20 );
			add_filter( 'script_module_data_@snoka/views', array( __CLASS__, 'manifest' ) );
		}
		wp_register_script_module( "@snoka/{$name}-view", $args['src'], array( '@snoka/views' ), $args['version'] );
	}
	public static function boot() {
		wp_register_script_module( '@snoka/views', plugins_url( 'snoka-views/js/views.js', __FILE__ ), array(), '1' );
		$dyn = array();
		foreach ( array_keys( self::$views ) as $n ) {
			$dyn[] = array( 'id' => "@snoka/{$n}-view", 'import' => 'dynamic' );
		}
		wp_register_script_module( '@snoka/views-entry', plugins_url( 'snoka-views/js/entry.js', __FILE__ ), array_merge( array( '@snoka/views' ), $dyn ), '1' );
		wp_enqueue_script_module( '@snoka/views-entry' );
	}
	public static function manifest( $data ) {
		$views = array();
		foreach ( self::$views as $n => $a ) {
			$views[ $n ] = array_filter( array( 'module' => "@snoka/{$n}-view", 'selector' => $a['selector'], 'styles' => $a['styles'] ) );
		}
		return array( 'views' => $views );
	}
	public static function enqueue( $name ) {
		wp_enqueue_script_module( "@snoka/{$name}-view" );
	}
}
```

Production checklist for the PHP class: wrap `boot()` so it returns early in `is_admin()` and in editor contexts, support the `deps` and `styles` arguments, escape and validate `styles` URLs, and bail on `register()` before `init` if the class is loaded twice.

### 5.4 Example views (test fixtures)

```js
import { defineView } from '@snoka/views';
( window.__log ||= [] ).push( 'events-view:evaluated' );
window.__evalCount = ( window.__evalCount || 0 ) + 1;
defineView( 'events-calendar', {
  mount( el, { signal } ) {
    window.__mounts = ( window.__mounts || 0 ) + 1;
    el.textContent = 'Calendar ready #' + window.__mounts;
    const t = setInterval( () => {}, 1000 );
    signal.addEventListener( 'abort', () => { clearInterval( t ); window.__aborts = ( window.__aborts || 0 ) + 1; } );
    return () => { window.__destroys = ( window.__destroys || 0 ) + 1; };
  },
} );
```

```js
import { defineView } from '@snoka/views';
defineView( 'modal', {
  mount( el, { signal } ) {
    el.addEventListener( 'click', () => { window.__modalOpen = ( window.__modalOpen || 0 ) + 1; }, { signal } );
  },
} );
```

## 6. Migration

| Plugin | Change |
|---|---|
| snoka-modal | Register view `modal`. Mount per trigger with `addEventListener( ..., { signal } )`. Remove the global enqueue and the `@todo` interim. Cost: 1.6 KB loads only on pages with triggers. |
| snoka-events (calendar and events view) | Register view `events-calendar`. `mount` calls `bootCalendars( el )` and returns a cleanup calling `teardownCalendars( el )`. Add `data-snoka-view="events-calendar"` to the block root. Remove the theme route gate. The 297 KB bundle loads only on arrival at, or prewarm of, a page with the block. |
| snoka-events (mini-cal) | Register view `mini-cal` the same way. The missing swup listeners are no longer needed. |
| snoka-intro-animate | Register view `intro`. Mount runs the intro for its root. Hidden-until-intro CSS must be scoped to a class set by JS and must reveal on `error`, on reduced motion, and without JS. Verify the arrival case explicitly. |
| Theme | Add the HeadPlugin options above. Delete route gates and any `ensureScript` style code. |

## 7. Verification protocol

Run headless Chromium on the DDEV sandbox. Count requests per bundle and record `data-snoka-view-state`.

| # | Case | Pass condition |
|---|---|---|
| 1 | Direct load of a page with the view | Mount count 1, module evaluated once, view bundle fetched once, state `ready` |
| 2 | Swup navigate from a page without the view | Same document (no reload), mount 1, 1 bundle fetch |
| 3 | Leave and return, then back and forward | Abort and destroy counts match mounts. Module evaluated once. Bundle fetched once per document. |
| 4 | Pages without the markup | No view bundle requests, only the controller, entry and manifest |
| 5 | Reduced motion, and JavaScript disabled | Server content visible, no hidden-until-ready state stuck |
| 6 | Five concurrent scan triggers | Mount count 1 |
| 7 | Click away while the bundle is loading | No mount, no console error |
| 8 | Bundle returns 500 once | Recovers on retry, no reload |
| 9 | Bundle fails permanently after swup navigation | State `error`, exactly one hard reload per URL, no reload loop |
| 10 | Slow network with prewarm | View `ready` at or near `page:view`. Measured: 0 ms with prewarm against 157 ms without, on a 150 ms server delay. |
| 11 | Cloudflare cache, logged out and logged in | No nonces or user specific data in cached HTML or manifest |
| 12 | Firefox and Safari | Cases 1 to 4 pass |
| 13 | Editor and admin screens | Controller and entry absent |
| 14 | Page with `@wordpress/interactivity` loaded | Back navigation handled by swup (see section 8) |
| 15 | Cloudflare Rocket Loader on | Module scripts unaffected. Evidence of problems is weak ([one report](https://www.golodiuk.com/news/when-mermaid-diagrams-break-in-production/)), so confirm or disable it for module scripts. |

## 8. Test results to date

Proof of concept in Chromium, real swup 4 and HeadPlugin 2:

- Direct load: 1 mount, 1 module evaluation, 1 bundle fetch, 1 stylesheet fetch, state `ready`, no errors.
- Swup arrival: same document, 1 mount, 1 fetch. Home and about pages fetched no view bundles.
- Leave, return, back and forward: aborts and destroys equal mounts. Module evaluated once. Bundle fetched once.
- Modal click after swup arrival worked with 1 fetch of the modal bundle.
- Concurrent scans: 5 triggers, 1 mount. Mid-load abort: 0 mounts, no errors. A single 500: recovered on retry, no reload.
- Module identity: `import()` by import map ID and the WordPress script tag shared one evaluation. A different `?ver` evaluated twice.
- Chromium retried a failed `import()`. Other engines may cache the failure, which is why the guarded hard reload remains.

Real WordPress (Playground, WordPress 7.1.5, block theme, mu-plugin with the PHP above, swup on `main`):

- The import map on every page, including a plain page, listed `@snoka/views` and both view modules. On the plain page only the controller and entry loaded. No view bundle was requested.
- The manifest printed in `wp-script-module-data-@snoka/views`.
- On the calendar page, `render_callback` enqueued the module tag in `<head>` with the same URL as the import map entry. The entry design had no dependency cycle.
- Browser run: direct load of the calendar page gave 1 mount, 1 evaluation, 1 view fetch, state `ready`, no errors. Swup arrival from the plain page stayed in the same document, fetched the view bundle once, and mounted once. Swup leave destroyed the view once (abort 1, destroy 1).
- One open observation: on browser Back into a swup entry, the document did a full navigation instead of a swup visit when `@wordpress/interactivity` was loaded on the page. With that module blocked, swup handled Back in place. The cause was not isolated. The result after the full navigation was correct (1 mount, 1 evaluation), so the design degrades safely, but case 14 should be investigated on the real theme.

Not tested: Firefox, Safari, Rocket Loader, the real snoka plugins (`bootCalendars` against the actual calendar bundle), Parallel plugin, Cloudflare caching, and the editor and admin exclusion. The Playground slow response (about 2 s per request on a single worker) required long waits in the test and does not reflect production timing.

## 9. Risks

| Risk | Mitigation |
|---|---|
| Deploy skew: the cached page references a bundle URL that no longer exists | Retry once, then one guarded hard reload per URL |
| Firefox has no multiple import maps | All views are in the first document's import map as dynamic dependencies. Adding a new view requires one full page load. |
| Cycle between the controller and view modules | Entry module with dynamic dependencies, as built |
| Manifest and import map entries on every page | Roughly 100 to 150 bytes per view. Keep the number of views small. |
| View code assuming `document` globals | Review each plugin against the view module contract |
| Parallel plugin keeps cloned outgoing content in the DOM | `data-snoka-inert` on the clone, scanned out by the controller |
| Interactivity module and swup history interaction | Verification case 14. Fallback is a full navigation. |
| Rocket Loader and module scripts | Verification case 15 |
| Plugin installed without `snoka-views` | `Requires Plugins` header, plus a class exists check that skips registration |

## 10. Open items

1. Confirm in the real repositories that mini-cal has no swup listeners and that `bootCalendars` and `teardownCalendars` accept a single root element.
2. Decide whether intro-animate keeps its current hidden-until-intro CSS or moves to the `html` class pattern in section 6.
3. Isolate the Back navigation behavior with `@wordpress/interactivity` loaded.
4. Run the full protocol in section 7 on DDEV, including Firefox and Safari.

## Sources

- [swup hooks](https://swup.js.org/hooks/), [Hooks.ts](https://raw.githubusercontent.com/swup/swup/main/src/modules/Hooks.ts), [reloading JavaScript](https://swup.js.org/getting-started/reloading-javascript/), [common issues](https://swup.js.org/getting-started/common-issues/), [Head Plugin](https://swup.js.org/plugins/head-plugin/), [Scripts Plugin](https://swup.js.org/plugins/scripts-plugin/), [Preload Plugin](https://swup.js.org/plugins/preload-plugin/)
- [HeadPlugin mergeHeadContents.ts](https://raw.githubusercontent.com/swup/head-plugin/master/src/mergeHeadContents.ts)
- [Script Modules in 6.5](https://make.wordpress.org/core/2024/03/04/script-modules-in-6-5/), [viewScriptModule](https://make.wordpress.org/core/2024/03/04/block-metadata-viewscriptmodule-field-in-6-5/), [Script Modules in 6.7](https://make.wordpress.org/core/2024/10/14/updates-to-script-modules-in-6-7/), [WordPress 7.0 field guide](https://make.wordpress.org/core/2026/05/14/wordpress-7-0-field-guide/), [WordPress 7.0](https://wordpress.org/documentation/wordpress-version/version-7.0/), [Gutenberg PR 77214](https://github.com/WordPress/gutenberg/pull/77214)
- [Interactivity API client navigation, 6.9](https://make.wordpress.org/core/2025/11/12/interactivity-apis-client-navigation-improvements-in-wordpress-6-9/), [client-side navigation guide](https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/interactivity-api/core-concepts/client-side-navigation.md), [compatibility guide](https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/interactivity-api/core-concepts/client-side-navigation-compatibility.md), [PR 70353](https://github.com/WordPress/gutenberg/pull/70353)
- [template-canvas.php](https://raw.githubusercontent.com/WordPress/wordpress-develop/trunk/src/wp-includes/template-canvas.php)
- [caniuse, multiple import maps](https://caniuse.com/wf-import-maps-multiple), [cross-document view transitions](https://web-platform-dx.github.io/web-features-explorer/features/cross-document-view-transitions/), [Turbo handbook](https://turbo.hotwired.dev/handbook/building)
- [HTML spec, scripting](https://html.spec.whatwg.org/multipage/scripting.html), [Stack Overflow, cloned scripts](https://stackoverflow.com/questions/28771542/why-dont-clonenode-script-tags-execute)
