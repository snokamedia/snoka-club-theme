/**
 * Functional check for initMobileMenu (built main bundle) under jsdom.
 * Theme-owned mobile modal: one persistent toggle + glyph, no core open.
 * Scroll → lock → open: the opener scrolls the menu row to its aligned
 * position, then a single class opens the full-screen sheet behind the
 * raised nav layer. The toggle is never measured, positioned, moved, or
 * cloned; no button is ever inside the sheet.
 *
 * Usage: node ./scripts/check-mobile-menu.mjs
 */
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const themeRoot = join(root, '..');
const manifest = JSON.parse(
	readFileSync(join(themeRoot, 'dist', '.vite', 'manifest.json'), 'utf8')
);

const dom = new JSDOM(
	'<!doctype html><html><head></head><body><div class="wp-site-blocks"><main id="main">' +
		'<div class="snoka-site-header" id="hdr"><div class="snoka-mobile-nav" id="nav">' +
		'<button type="button" class="wp-block-navigation__responsive-container-open" aria-expanded="false" aria-label="Open menu" id="open">' +
		'<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7.5h16v1.5H4z"></path><path d="M4 15h16v1.5H4z"></path></svg>' +
		'</button>' +
		'<nav class="rounded-tree" aria-label="Menu"><ul>' +
		'<li><div class="tree-row"><a href="https://example.invalid/a">A link</a></div></li>' +
		'<li><div class="tree-row"><a href="https://example.invalid/b">B link</a></div></li>' +
		'</ul></nav>' +
		'</div></div></main></div></body></html>',
	{ url: 'https://example.invalid/', pretendToBeVisual: true }
);
for (const key of [
	'window',
	'document',
	'navigator',
	'HTMLElement',
	'Element',
	'Node',
	'MutationObserver',
	'Event',
	'MouseEvent',
	'FocusEvent',
	'KeyboardEvent',
	'CustomEvent',
]) {
	try {
		globalThis[key] = dom.window[key];
	} catch {
		Object.defineProperty(globalThis, key, {
			value: dom.window[key],
			configurable: true,
			writable: true,
		});
	}
}
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
let desktopMatches = false;
let reduceMotionMatches = false;
const mqStub = (query) => ({
	get matches() {
		if (query.includes('(prefers-reduced-motion')) {
			return reduceMotionMatches;
		}
		return query.includes('(min-width: 600px)') ? desktopMatches : false;
	},
	addEventListener: () => {},
	removeEventListener: () => {},
});
globalThis.matchMedia = mqStub;
dom.window.matchMedia = mqStub;
const scrollCalls = [];
// Simulated page: the menu row lives at document Y = 180. scrollTo moves
// the viewport; the row's viewport rect follows like a real layout.
let navDocTop = 180;
Object.defineProperty(dom.window, 'scrollY', {
	configurable: true,
	writable: true,
	value: 0,
});
Object.defineProperty(dom.window, 'scrollX', {
	configurable: true,
	writable: true,
	value: 0,
});
dom.window.scrollTo = (...args) => {
	scrollCalls.push(args);
	const opts = args[0];
	if (opts && typeof opts.top === 'number') {
		dom.window.scrollY = opts.top;
	}
	if (opts && typeof opts.left === 'number') {
		dom.window.scrollX = opts.left;
	}
};
globalThis.scrollTo = dom.window.scrollTo;
const savedRect = dom.window.Element.prototype.getBoundingClientRect;
dom.window.Element.prototype.getBoundingClientRect = function () {
	if (this.id === 'nav') {
		const top = navDocTop - dom.window.scrollY;
		return {
			x: 0, y: top, left: 0, top, right: 390,
			bottom: top + 72, width: 390, height: 72, toJSON: () => {},
		};
	}
	return savedRect.call(this);
};

await import(join(themeRoot, 'dist', manifest['src/main.ts'].file));

const failures = [];
const check = (name, cond) => {
	console.log(`${cond ? 'PASS' : 'FAIL'} — ${name}`);
	if (!cond) failures.push(name);
};
const doc = dom.window.document;
const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms));
const opener = () => doc.getElementById('open');
const dialog = () => doc.querySelector('.snoka-mobile-dialog');
const clickOpener = () =>
	opener().dispatchEvent(
		new dom.window.MouseEvent('click', { bubbles: true, cancelable: true })
	);
const isOpen = () =>
	document.documentElement.classList.contains('snoka-menu-open');

// 1. Non-tree navs pass through to core (no interception).
const plain = doc.createElement('button');
plain.className = 'wp-block-navigation__responsive-container-open';
doc.body.appendChild(plain);
let plainDefault = true;
plain.addEventListener('click', (e) => {
	plainDefault = !e.defaultPrevented;
});
plain.dispatchEvent(
	new dom.window.MouseEvent('click', { bubbles: true, cancelable: true })
);
check('nav without tree is left alone', plainDefault === true);
plain.remove();

// 1b. Core hamburger SVG is stripped: same button, single glyph, no SVGs.
check(
	'toggle holds no svg (core hamburger stripped)',
	opener().querySelectorAll('svg').length === 0
);
check(
	'toggle holds exactly one rails glyph',
	opener().querySelectorAll('.rails').length === 1 &&
		opener().querySelectorAll('.rail').length === 3
);

// 2. Open: dialog created, toggle+tree shelved in, toggle flips, focus lands.
const toggleBefore = opener();
clickOpener();
await tick(60);
check('dialog created and shown', !!dialog() && !dialog().hasAttribute('hidden'));
check('state class set', isOpen());
check(
	'same toggle element (identity, never replaced)',
	opener() === toggleBefore && opener().isConnected
);
check(
	'single glyph survives open (never duplicated or reinjected)',
	opener().querySelectorAll('.rails').length === 1 &&
		opener().querySelectorAll('.rail').length === 3 &&
		opener().querySelectorAll('svg').length === 0
);
check('toggle shows expanded state', opener().getAttribute('aria-expanded') === 'true');
check(
	'scroll aligned the row (180 - 12 gap = 168)',
	scrollCalls.length === 1 && scrollCalls[0][0].top === 168
);
const shell = () => doc.getElementById('nav');
check(
	'single toggle button in the shell (never duplicated)',
	shell().querySelectorAll('.wp-block-navigation__responsive-container-open').length === 1
);
check(
	'toggle stays in the shell (never measured, never positioned)',
	!dialog().contains(opener()) &&
		shell().contains(opener()) &&
		opener().style.position === '' &&
		opener().style.top === '' &&
		opener().style.left === ''
);
check(
	'no pinning anywhere (no reconstructed coordinates)',
	shell().getAttribute('data-pinned') === null &&
		shell().style.position === '' &&
		shell().style.top === '' &&
		shell().style.left === '' &&
		shell().style.width === ''
);
check(
	'no responsive open button inside the sheet',
	!dialog().querySelector('.wp-block-navigation__responsive-container-open')
);
check(
	'sheet stays a body-level layer (never reparented into the shell)',
	dialog().parentElement === doc.body
);
check('shell carries the dialog boundary while open', shell().getAttribute('role') === 'dialog');
check(
	'single visual state (html class only, no twin flags)',
	isOpen() &&
		shell().getAttribute('data-visual-open') === null &&
		shell().getAttribute('data-pinned') === null
);
check(
	'tree moved into the sheet',
	!!dialog().querySelector('nav.rounded-tree')
);
check('focus starts on the toggle', doc.activeElement === opener());
check(
	'content clearance derives from the aligned row (12 + 72 + 20 = 104)',
	document.documentElement.style.getPropertyValue('--menu-content-top') === '104px'
);
check(
	'short page gets wrapper min-height for the full target (viewport 0 + 168)',
	doc.querySelector('.wp-site-blocks')?.style.minHeight === '168px'
);
check('open alignment scrolls exactly once', scrollCalls.length === 1);

// 3. Opener click while open closes (dismiss path).
clickOpener();
check(
	'close starts the gradual release (min-height drops while fading)',
	doc.querySelector('.wp-site-blocks')?.style.minHeight === '0px'
);
await tick(400);
check('toggle closes the menu', !dialog() || dialog().hasAttribute('hidden'));
check('state class cleared', !isOpen());
check('toggle back to collapsed', opener().getAttribute('aria-expanded') === 'false');
check(
	'toggle still in the shell on close (it never left)',
	!!doc.getElementById('nav').contains(opener())
);
check(
	'shell released on close (role gone, clearance cleared, height restored)',
	doc.getElementById('nav').getAttribute('role') === null &&
		document.documentElement.style.getPropertyValue('--menu-content-top') === '' &&
		doc.querySelector('.wp-site-blocks')?.style.minHeight === ''
);
check(
	'tree restored to the nav on close',
	!!doc.getElementById('nav').querySelector('nav.rounded-tree')
);
check(
	'dismiss adds no scroll beyond the single alignment',
	scrollCalls.length === 1
);

// 4. Escape closes and returns focus to the toggle.
scrollCalls.length = 0;
clickOpener();
await tick(60);
doc.dispatchEvent(
	new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
);
await tick(400);
check('escape closes the menu', !isOpen());
check('focus restored to the toggle', doc.activeElement === opener());
check(
	'already-aligned row opens with no repeat scroll',
	scrollCalls.length === 0
);

// 5. Tab stays inside: opener -> first link -> wrap.
clickOpener();
await tick(60);
opener().focus();
const links = Array.from(doc.querySelectorAll('.snoka-mobile-dialog a[href]'));
check('dialog has focusable links', links.length >= 2);
links[links.length - 1].focus();
doc.dispatchEvent(
	new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
);
check('tab on last wraps to toggle', doc.activeElement === opener());
opener().focus();
doc.dispatchEvent(
	new dom.window.KeyboardEvent('keydown', {
		key: 'Tab',
		shiftKey: true,
		bubbles: true,
	})
);
check('shift+tab on toggle wraps to last', doc.activeElement === links[links.length - 1]);

// 6. Backdrop click closes.
doc
	.querySelector('.snoka-mobile-dialog')
	.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
await tick(400);
check('backdrop tap closes', !isOpen());

// 7. Alignment from a scrolled page: the row (document Y 180) aligns to
// viewport 12, scrolling exactly to 168. Ordinary bars above scroll away;
// dismiss/navigate never scroll again and background position is kept.
dom.window.scrollY = 500;
scrollCalls.length = 0;
clickOpener();
await tick(400);
check(
	'scrolled page aligns the row to the target (scrolls to 168)',
	isOpen() && scrollCalls.length === 1 && scrollCalls[0][0].top === 168
);
const heldY = dom.window.scrollY;
clickOpener();
await tick(400);
check(
	'dismiss keeps the aligned scroll position (no further scroll)',
	!isOpen() && scrollCalls.length === 1 && dom.window.scrollY === heldY
);
dom.window.scrollY = 500;
scrollCalls.length = 0;
clickOpener();
await tick(400);
const focusBeforeNavigate = doc.activeElement;
doc.defaultView.dispatchEvent(
	new dom.window.CustomEvent('snoka:mobile-menu-close', {
		detail: { reason: 'navigate' },
	})
);
await tick(400);
check(
	'navigate closes without touching scroll or moving focus',
	!isOpen() &&
		scrollCalls.length === 1 &&
		dom.window.scrollY === 168 &&
		doc.activeElement === focusBeforeNavigate
);
dom.window.scrollY = 0;

// 8. Desktop breakpoint releases an open menu to main content.
clickOpener();
await tick(60);
desktopMatches = true;
dom.window.dispatchEvent(new dom.window.Event('resize'));
await tick(400);
check('desktop resize closes the menu', !isOpen());
check(
	'breakpoint moves focus to main (toggle hidden on desktop)',
	doc.activeElement === doc.querySelector('main, [role="main"]') ||
		doc.activeElement === doc.body
);
desktopMatches = false;

// 9. Rapid open/close/reopen leaves no stale modal state.
clickOpener();
await tick(20);
clickOpener();
await tick(400);
clickOpener();
await tick(60);
const reopened = isOpen();
clickOpener();
await tick(400);
check(
	'rapid toggle leaves no stale state (reopen then close clean)',
	reopened && !isOpen() && !dialog().hasAttribute('hidden') === false
);

// 10. Tall page: wrapper already exceeds viewport + target, so the
// minimum must not shrink it — and a pre-existing inline value must be
// preserved. (jsdom has no layout so the wrapper measures 0 and the
// required 844 + 168 wins; in a real browser the measured page height
// would win instead. Either way the page never shrinks.)
Object.defineProperty(doc.documentElement, 'clientHeight', {
	configurable: true,
	value: 844,
});
doc.querySelector('.wp-site-blocks').style.minHeight = '50%';
scrollCalls.length = 0;
dom.window.scrollY = 500;
clickOpener();
await tick(400);
check(
	'tall page minimum is a no-op (max keeps measured height)',
	isOpen() && doc.querySelector('.wp-site-blocks')?.style.minHeight === '1012px'
);
check(
	'tall page still aligns to the target',
	scrollCalls.length === 1 && scrollCalls[0][0].top === 168
);
clickOpener();
await tick(400);
check(
	'tall page closes clean with previous height restored',
	!isOpen() &&
		doc.querySelector('.wp-site-blocks')?.style.minHeight === '50%'
);
doc.querySelector('.wp-site-blocks').style.minHeight = '';

// 11. Reduced motion: no scroll, no extension — open in place.
reduceMotionMatches = true;
scrollCalls.length = 0;
dom.window.scrollY = 500;
clickOpener();
await tick(100);
check(
	'reduced motion opens without scrolling',
	isOpen() && scrollCalls.length === 0
);
check(
	'reduced motion adds no page mutation',
	doc.querySelector('.wp-site-blocks')?.style.minHeight === ''
);
doc.dispatchEvent(
	new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
);
await tick(100);
check('reduced motion closes clean', !isOpen());
reduceMotionMatches = false;

if (failures.length > 0) {
	console.error(`mobile-menu FAIL (${failures.length})`);
	process.exit(1);
}
console.log('mobile-menu PASS — all checks green');
