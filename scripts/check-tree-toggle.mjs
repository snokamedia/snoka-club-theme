/**
 * Functional check for initTreeToggle (built main bundle) under jsdom.
 * Mirrors the server markup from inc/nav-overlay.php: parent link plus a
 * separate .tree-toggle button driving a hidden child list.
 *
 * Usage: node ./scripts/check-tree-toggle.mjs
 */
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(
	readFileSync(join(root, 'dist', '.vite', 'manifest.json'), 'utf8')
);

const dom = new JSDOM(
	'<!doctype html><html><head></head><body>' +
		'<nav class="rounded-tree" aria-label="Menu"><ul>' +
		'<li><div class="tree-row">' +
		'<a href="https://example.invalid/services">Services</a>' +
		'<button type="button" class="tree-toggle" aria-expanded="false" aria-controls="snoka-tree-0" aria-label="Services submenu"></button>' +
		'</div><ul id="snoka-tree-0" hidden="hidden">' +
		'<li><a href="https://example.invalid/services/a">A</a></li>' +
		'</ul></li>' +
		'<li><div class="tree-row">' +
		'<a href="https://example.invalid/about">About</a>' +
		'<button type="button" class="tree-toggle" aria-expanded="false" aria-controls="snoka-tree-1" aria-label="About submenu"></button>' +
		'</div><ul id="snoka-tree-1" hidden="hidden">' +
		'<li><a href="https://example.invalid/about/b">B</a></li>' +
		'</ul></li>' +
		'<li><a href="https://example.invalid/contact">Contact</a></li>' +
		'</ul></nav></body></html>',
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
globalThis.matchMedia = () => ({
	matches: false,
	addEventListener: () => {},
	removeEventListener: () => {},
});

await import(join(root, 'dist', manifest['src/main.ts'].file));

const failures = [];
const check = (name, cond) => {
	console.log(`${cond ? 'PASS' : 'FAIL'} — ${name}`);
	if (!cond) failures.push(name);
};
const doc = dom.window.document;
const toggles = doc.querySelectorAll('.tree-toggle');
const [t0, t1] = toggles;
const l0 = doc.getElementById('snoka-tree-0');
const l1 = doc.getElementById('snoka-tree-1');
const click = (el) =>
	el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

// Toggle opens without touching the link.
click(t0);
check(
	'toggle opens branch (aria-expanded=true)',
	t0.getAttribute('aria-expanded') === 'true'
);
check('toggle unhides child list', !l0.hidden);
check(
	'parent link untouched by toggle tap',
	doc.querySelector('.tree-row > a').getAttribute('href') ===
		'https://example.invalid/services'
);

// Toggle closes again.
click(t0);
check('toggle closes branch', t0.getAttribute('aria-expanded') === 'false');
check('toggle re-hides child list', l0.hidden);

// Single-open per group.
click(t0);
click(t1);
check('second toggle opens', t1.getAttribute('aria-expanded') === 'true');
check(
	'first toggle auto-closes (single-open)',
	t0.getAttribute('aria-expanded') === 'false' && l0.hidden
);

// Link taps never toggle.
click(doc.querySelector('.tree-row > a'));
check(
	'link tap leaves branch state alone',
	t1.getAttribute('aria-expanded') === 'true' && !l1.hidden
);

if (failures.length > 0) {
	console.error(`tree-toggle FAIL (${failures.length})`);
	process.exit(1);
}
console.log('tree-toggle PASS — all checks green');
