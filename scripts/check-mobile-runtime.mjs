/**
 * Real-browser lifecycle check for the theme-owned mobile menu.
 * Assertion-only (no screenshots): opener toggle, dialog visibility,
 * tree placement, and close behavior across repeated cycles.
 *
 * Usage: node ./scripts/check-mobile-runtime.mjs
 */
import { createRequire } from 'node:module';
const require = createRequire(
	new URL('../package.json', import.meta.url)
);
const { chromium } = require('playwright-core');

const failures = [];
const check = (name, cond) => {
	console.log(`${cond ? 'PASS' : 'FAIL'} — ${name}`);
	if (!cond) failures.push(name);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
	ignoreHTTPSErrors: true,
	viewport: { width: 390, height: 844 },
	isMobile: true,
	hasTouch: true,
});
const page = await ctx.newPage();
page.on('pageerror', (error) => {
	console.log(`PAGEERROR: ${String(error && error.message).slice(0, 200)}`);
});
await page.goto('https://snoka-access-sandbox.ddev.site/', {
	waitUntil: 'networkidle',
});

const state = () =>
	page.evaluate(() => {
		const opener = document.querySelector(
			'.snoka-mobile-nav .wp-block-navigation__responsive-container-open'
		);
		const dialogs = document.querySelectorAll('.snoka-mobile-dialog');
		const tree = document.querySelector('nav.rounded-tree');
		const leaf = document.querySelector(
			'nav.rounded-tree a[href="/contact"]'
		);
		const rect = leaf ? leaf.getBoundingClientRect() : { width: 0, height: 0 };
		return {
			hasOpener: !!opener,
			dialogCount: dialogs.length,
			dialogHidden:
				dialogs.length > 0
					? dialogs[0].hasAttribute('hidden')
					: null,
			treeInDialog:
				!!tree &&
				!!tree.closest('.snoka-mobile-dialog'),
			treeVisible: rect.width > 0 && rect.height > 0,
			expanded: opener
				? opener.getAttribute('aria-expanded')
				: null,
		};
	});

const openMenu = async () => {
	await page.locator('.snoka-mobile-nav .wp-block-navigation__responsive-container-open').click();
	await page.waitForTimeout(600);
};

const closeMenu = async () => {
	await page.locator('.snoka-mobile-nav .wp-block-navigation__responsive-container-open').click();
	await page.waitForTimeout(600);
};

// 1. Initial: tree present but not visible, no dialog yet (lazy).
let s = await state();
check('opener exists', s.hasOpener);
check('no dialog before first open', s.dialogCount === 0);
check('tree hidden before open', s.treeVisible === false);

// 2. Open: dialog visible, tree moved in, toggle expanded.
await openMenu();
s = await state();
check('dialog created and unhidden', s.dialogCount === 1 && s.dialogHidden === false);
check('tree moved into the dialog', s.treeInDialog === true);
check('tree visible when open', s.treeVisible === true);
check('toggle shows expanded', s.expanded === 'true');

// 3. Close via toggle: dialog hidden, tree back in nav, opener collapsed.
await closeMenu();
s = await state();
check('still exactly one dialog (no duplicates)', s.dialogCount === 1);
check('dialog hidden after close', s.dialogHidden === true);
check('tree back in the nav after close', s.treeInDialog === false);
check('tree hidden after close', s.treeVisible === false);
check('toggle back to collapsed', s.expanded === 'false');

// 4. Reopen + Escape close.
await openMenu();
await page.keyboard.press('Escape');
await page.waitForTimeout(600);
s = await state();
check('escape closes the menu', s.dialogHidden === true && s.treeVisible === false);

// 5. Reopen + branch toggle + close: nested state does not leak visibility.
await openMenu();
await page.locator('.snoka-mobile-dialog .tree-toggle').first().click();
await page.waitForTimeout(300);
await closeMenu();
s = await state();
check(
	'close with expanded branch still hides everything',
	s.dialogHidden === true && s.treeVisible === false
);
check(
	'single dialog after repeated cycles',
	(await page.$$('.snoka-mobile-dialog')).length === 1
);

if (failures.length > 0) {
	console.error(`mobile-runtime FAIL (${failures.length})`);
	await browser.close();
	process.exit(1);
}
console.log('mobile-runtime PASS — all checks green');
await browser.close();
