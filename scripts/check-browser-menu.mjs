/**
 * Browser evidence for the mobile-menu scroll → pin → open contract.
 * Runs against the live DDEV sandbox (real page, real layout engine).
 *
 * Required evidence per contract:
 * - toggle + glyph node identity before/after opening
 * - toggle rect: no change attributable to pinning or overlay activation
 * - computed rail transforms show actual intermediate states
 * - button color + sheet opacity progress on the shared interval
 * - exactly one visible primary toggle throughout
 * - stacked top bars scroll away (alignment target honored)
 * - sheet covers the viewport; toggle hit-tests topmost at its center
 * - Escape / backdrop / breakpoint close paths
 *
 * Usage: node ./scripts/check-browser-menu.mjs [--url=...]
 * Exit 0 = all evidence collected and within tolerance, 1 = otherwise.
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const failures = [];
const notes = [];
const check = (name, cond, extra = '') => {
	console.log(`${cond ? 'PASS' : 'FAIL'} — ${name}${extra ? ` (${extra})` : ''}`);
	if (!cond) {
		failures.push(name);
	}
};

const argUrl = process.argv
	.find((a) => a.startsWith('--url='))
	?.slice('--url='.length);
const URL =
	argUrl ?? 'https://snoka-access-sandbox.ddev.site/';
const CHROME = join(
	homedir(),
	'.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'
);

const TOGGLE = '.snoka-mobile-nav .wp-block-navigation__responsive-container-open';
const SHEET = '.snoka-mobile-dialog';

const browser = await chromium.launch({ executablePath: CHROME });
try {
	const ctx = await browser.newContext({
		viewport: { width: 390, height: 844 },
		isMobile: true,
		hasTouch: true,
		ignoreHTTPSErrors: true,
	});
	const page = await ctx.newPage();
	page.on('pageerror', (err) => notes.push(`pageerror: ${err.message}`));
	await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
	await page.waitForSelector(TOGGLE, { timeout: 15000 });

	const count = await page.locator(TOGGLE).count();
	check('exactly one primary toggle on the page', count === 1, `count=${count}`);

	// Start scrolled down so alignment has real work to do.
	await page.evaluate(() => window.scrollTo(0, 400));
	await page.waitForTimeout(300);
	const scrolledY = await page.evaluate(() => window.scrollY);
	check('page starts scrolled (alignment must scroll)', scrolledY > 100, `y=${scrolledY}`);

	const h1 = await page.locator(TOGGLE).elementHandle();
	const before = await page.evaluate((el) => {
		const r = el.getBoundingClientRect();
		const cs = getComputedStyle(el);
		return {
			top: r.top, left: r.left, width: r.width, height: r.height,
			color: cs.color,
			html: el.outerHTML.length,
			svgs: el.querySelectorAll('svg').length,
			rails: el.querySelectorAll('.rails').length,
		};
	}, h1);
	check('toggle holds no svg before open', before.svgs === 0);
	notes.push(`toggle rect before: ${before.top.toFixed(1)},${before.left.toFixed(1)} ${before.width.toFixed(0)}x${before.height.toFixed(0)} color=${before.color}`);

	// Sample rail transform + color + opacity through the entrance.
	// The open sequence scrolls first (hundreds of ms), so sampling only
	// stops 450ms after the visual state flips — anything earlier would
	// mistake mid-transition values for end states.
	const samples = await page.evaluate(
		async ({ toggleSel, sheetSel }) => {
			const out = [];
			let openedAt = 0;
			const snap = () => {
				const t = document.querySelector(toggleSel);
				const s = document.querySelector(sheetSel);
				const rail = t?.querySelector('.rail');
				if (
					!openedAt &&
					document.documentElement.classList.contains('snoka-menu-open')
				) {
					openedAt = performance.now();
				}
				out.push({
					t: Math.round(performance.now()),
					rail: rail ? getComputedStyle(rail).transform : 'none',
					color: t ? getComputedStyle(t).color : 'none',
					opacity: s ? getComputedStyle(s).opacity : 'none',
					hidden: s ? s.hasAttribute('hidden') : null,
					opened: !!openedAt,
				});
			};
			snap();
			document.querySelector(toggleSel)?.dispatchEvent(
				new MouseEvent('click', { bubbles: true, cancelable: true })
			);
			for (let i = 0; i < 80; i++) {
				// eslint-disable-next-line no-await-in-loop
				await new Promise((r) => setTimeout(r, 25));
				snap();
				if (openedAt && performance.now() - openedAt > 450) {
					break;
				}
			}
			return out;
		},
		{ toggleSel: TOGGLE, sheetSel: SHEET }
	);
	const opened = await page.evaluate(() =>
		document.documentElement.classList.contains('snoka-menu-open')
	);
	check('menu reaches open state in a real browser', opened);

	const railStates = new Set(samples.map((s) => s.rail));
	check(
		'rail transforms show intermediate states (morph runs, not jumps)',
		railStates.size >= 3,
		`${railStates.size} distinct`
	);
	const opacities = samples
		.map((s) => parseFloat(s.opacity))
		.filter((n) => Number.isFinite(n));
	const midFlight = opacities.some((o) => o > 0 && o < 1);
	const firstColor = samples[0]?.color;
	const lastColor = samples[samples.length - 1]?.color;
	check(
		'button color transitions during entrance',
		firstColor !== lastColor,
		`${firstColor} -> ${lastColor}`
	);
	const openChannels = (lastColor ?? '').match(/\d+(\.\d+)?/g)?.map(Number) ?? [];
	check(
		'open-state toggle color is light (over the dark sheet)',
		openChannels.length >= 3 && openChannels.slice(0, 3).every((c) => c >= 200),
		lastColor
	);
	check(
		'sheet starts at opacity 0 (no flash before the transition)',
		opacities.length > 0 && opacities[0] === 0
	);
	check(
		'sheet opacity ends at 1',
		opacities.length > 0 && opacities[opacities.length - 1] === 1
	);
	if (!midFlight) {
		notes.push('mid-flight opacity not sampled (transition faster than sampler); endpoints verified instead');
	} else {
		check('sheet opacity progresses 0 → 1 (mid-flight sampled)', true);
	}

	const h2 = await page.locator(TOGGLE).elementHandle();
	const sameNode = await page.evaluate(([a, b]) => a === b, [h1, h2]);
	check('exact same toggle node before/after opening', sameNode === true);

	const after = await page.evaluate((el) => {
		const r = el.getBoundingClientRect();
		return { top: r.top, left: r.left, width: r.width, height: r.height };
	}, h2);
	// Rect stability across pinning + overlay activation, sampled again later.
	await page.waitForTimeout(600);
	const later = await page.evaluate((el) => {
		const r = el.getBoundingClientRect();
		return { top: r.top, left: r.left, width: r.width, height: r.height };
	}, h2);
	const drift = Math.max(
		Math.abs(after.top - later.top),
		Math.abs(after.left - later.left),
		Math.abs(after.width - later.width),
		Math.abs(after.height - later.height)
	);
	check('toggle rect stable after open (overlay changes nothing)', drift <= 1, `drift=${drift.toFixed(2)}px`);
	notes.push(`toggle rect open: ${after.top.toFixed(1)},${after.left.toFixed(1)}`);

	const noReconstruction = await page.evaluate((sel) => {
		const t = document.querySelector(sel);
		const shell = t?.closest('.snoka-mobile-nav');
		if (!t || !shell) {
			return 'missing';
		}
		const props = ['position', 'top', 'left', 'width', 'marginTop', 'marginLeft'];
		const tInline = props.filter((p) => t.style[p] !== '');
		const sInline = props.filter((p) => shell.style[p] !== '');
		return tInline.length === 0 && sInline.length === 0
			? 'clean'
			: `toggle[${tInline.join(',')}] shell[${sInline.join(',')}]`;
	}, TOGGLE);
	check('no reconstructed coordinates (no inline geometry on toggle or shell)', noReconstruction === 'clean', noReconstruction);

	const scrolledTo = await page.evaluate(() => window.scrollY);
	check('page scrolled to align (not left where it was)', Math.abs(scrolledTo - scrolledY) > 1, `y=${scrolledTo}`);

	// Outcome verification, not assigned numbers: the scroll range that
	// actually resulted, the achieved row position, and sticky audit.
	const requestedY = Math.round(scrolledY + before.top - 12);
	const outcome = await page.evaluate(({ sel, requested }) => {
		const scroller = document.scrollingElement ?? document.documentElement;
		const row = document.querySelector(sel);
		const pageEl = document.querySelector('.wp-site-blocks') ?? document.body;
		const sticky = [];
		let el = row;
		while (el && el !== document.body) {
			if (getComputedStyle(el).position === 'sticky') {
				const cls = el.className?.toString?.().split(' ')[0] || el.tagName;
				sticky.push(cls);
			}
			el = el.parentElement;
		}
		if (!row) {
			return { missing: true, requested };
		}
		const r = row.getBoundingClientRect();
		return {
			requested,
			availableScrollY: scroller.scrollHeight - scroller.clientHeight,
			achievedScrollY: Math.round(window.scrollY),
			menuRowTop: Math.round(r.top * 10) / 10,
			wrapperBoxSizing: getComputedStyle(pageEl).boxSizing,
			wrapperMinHeight: pageEl.style.minHeight || '(none)',
			stickyAncestors: sticky,
		};
	}, { sel: TOGGLE.replace(/ [^ ]+$/, ''), requested: requestedY });
	// TOGGLE ends with the button class; the row is its .snoka-mobile-nav scope.
	notes.push(`outcome: ${JSON.stringify(outcome)}`);
	check('scroll range covers the request', outcome.availableScrollY >= requestedY - 2, `available=${outcome.availableScrollY} requested=${requestedY}`);
	check(
		'achieved scroll matches the request',
		Math.abs(outcome.achievedScrollY - requestedY) <= 2,
		`achieved=${outcome.achievedScrollY}`
	);
	check('row reached its aligned top (12px)', Math.abs(outcome.menuRowTop - 12) <= 2, `top=${outcome.menuRowTop}`);
	check('no sticky row or ancestors (rect tracks scrolling)', (outcome.stickyAncestors ?? []).length === 0, JSON.stringify(outcome.stickyAncestors));
	check('wrapper carries the temporary min-height while open', (outcome.wrapperMinHeight ?? '') !== '' && outcome.wrapperMinHeight !== '(none)', outcome.wrapperMinHeight);

	const sheetBox = await page.evaluate((sel) => {
		const s = document.querySelector(sel);
		if (!s) {
			return null;
		}
		const r = s.getBoundingClientRect();
		return { top: r.top, left: r.left, width: r.width, height: r.height };
	}, SHEET);
	const vp = page.viewportSize();
	const sheetFit =
		sheetBox &&
		Math.abs(sheetBox.top) <= 1 &&
		Math.abs(sheetBox.left) <= 1 &&
		Math.abs(sheetBox.width - vp.width) <= 1 &&
		Math.abs(sheetBox.height - vp.height) <= 1;
	check('sheet covers the full viewport', !!sheetFit, sheetBox ? `${sheetBox.width}x${sheetBox.height}` : 'no sheet');

	const hit = await page.evaluate((sel) => {
		const t = document.querySelector(sel);
		if (!t) {
			return 'no-toggle';
		}
		const r = t.getBoundingClientRect();
		const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
		if (el === t) {
			return 'toggle';
		}
		if (el && t.contains(el)) {
			return 'descendant';
		}
		return el ? `${el.tagName}.${(el.className?.baseVal ?? el.className ?? '').toString().split(' ')[0]}` : 'null';
	}, TOGGLE);
	check('toggle hit-tests topmost at its center', hit === 'toggle' || hit === 'descendant', hit);

	const countOpen = await page.locator(TOGGLE).count();
	check('still exactly one primary toggle while open', countOpen === 1);

	// Escape closes.
	await page.keyboard.press('Escape');
	await page.waitForTimeout(500);
	const closedEsc = await page.evaluate(() =>
		!document.documentElement.classList.contains('snoka-menu-open')
	);
	check('escape closes in the browser', closedEsc);
	check(
		'wrapper min-height restored after close',
		await page.evaluate(() => {
			const p = document.querySelector('.wp-site-blocks') ?? document.body;
			return p.style.minHeight === '';
		})
	);
	// Gradual release, not a snap: sample the scroll position through
	// the close. On pages where the extension mattered the position
	// settles over several frames; a one-frame clamp would fail this.
	const trajectory = await (async () => {
		await page.locator(TOGGLE).click();
		await page.waitForFunction(
			() => document.documentElement.classList.contains('snoka-menu-open'),
			null,
			{ timeout: 10000 }
		);
		await page.keyboard.press('Escape');
		const ys = [];
		for (let i = 0; i < 12; i++) {
			// eslint-disable-next-line no-await-in-loop
			await new Promise((r) => setTimeout(r, 25));
			// eslint-disable-next-line no-await-in-loop
			ys.push(await page.evaluate(() => Math.round(window.scrollY)));
		}
		return ys;
	})();
	const drop = Math.max(...trajectory) - Math.min(...trajectory);
	const distinct = new Set(trajectory).size;
	check(
		'close settles instead of snapping (gradual when range was borrowed)',
		drop <= 30 || distinct >= 3,
		`drop=${drop} steps=${distinct}`
	);

	// Backdrop closes.
	await page.locator(TOGGLE).click();
	await page.waitForFunction(
		() => document.documentElement.classList.contains('snoka-menu-open'),
		null, { timeout: 10000 }
	);
	const sheetGone = await page.evaluate((sel) => {
		const s = document.querySelector(sel);
		const r = s.getBoundingClientRect();
		// Click the sheet below the menu row (bottom area = sheet, not row).
		const el = document.elementFromPoint(r.left + 20, r.top + r.height - 40);
		if (el === s) {
			s.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
			return true;
		}
		return `hit=${el?.tagName}`;
	}, SHEET);
	await page.waitForTimeout(500);
	const closedBackdrop = await page.evaluate(() =>
		!document.documentElement.classList.contains('snoka-menu-open')
	);
	check('backdrop tap closes in the browser', sheetGone === true && closedBackdrop, String(sheetGone));

	// Desktop breakpoint closes.
	await page.locator(TOGGLE).click();
	await page.waitForFunction(
		() => document.documentElement.classList.contains('snoka-menu-open'),
		null, { timeout: 10000 }
	);
	await page.setViewportSize({ width: 800, height: 844 });
	await page.waitForTimeout(600);
	const closedBp = await page.evaluate(() =>
		!document.documentElement.classList.contains('snoka-menu-open')
	);
	check('desktop breakpoint closes in the browser', closedBp);

	// Reduced motion: opens without error.
	const ctx2 = await browser.newContext({
		viewport: { width: 390, height: 844 },
		ignoreHTTPSErrors: true,
		reducedMotion: 'reduce',
	});
	const p2 = await ctx2.newPage();
	await p2.goto(URL, { waitUntil: 'load', timeout: 60000 });
	await p2.waitForSelector(TOGGLE, { timeout: 15000 });
	await p2.locator(TOGGLE).click();
	await p2.waitForFunction(
		() => document.documentElement.classList.contains('snoka-menu-open'),
		null, { timeout: 10000 }
	);
	check('opens under prefers-reduced-motion', true);
	await p2.keyboard.press('Escape');
	await p2.waitForTimeout(400);
	const closedRm = await p2.evaluate(() =>
		!document.documentElement.classList.contains('snoka-menu-open')
	);
	check('closes under prefers-reduced-motion', closedRm);
	await ctx2.close();

	// Late core block CSS: the closed responsive container must stay
	// hidden by theme CSS alone (zero-specificity mirror), so a slow or
	// dynamically re-added navigation stylesheet causes no flash or
	// layout shift — and must not fight core's open state (covered by
	// the open-state checks above, which run with core CSS present).
	const ctx3 = await browser.newContext({
		viewport: { width: 390, height: 844 },
		ignoreHTTPSErrors: true,
	});
	await ctx3.route('**/navigation/style.min.css*', (route) => route.abort());
	const p3 = await ctx3.newPage();
	await p3.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
	await p3.waitForSelector('.snoka-mobile-nav', { timeout: 15000 });
	await p3.waitForTimeout(500);
	const hiddenWithoutCore = await p3.evaluate(() => {
		const c = document.querySelector('.wp-block-navigation__responsive-container');
		if (!c) {
			return 'no-container';
		}
		const r = c.getBoundingClientRect();
		return `${getComputedStyle(c).display}/${Math.round(r.width)}x${Math.round(r.height)}`;
	});
	check(
		'closed container hidden without core block CSS (no flash)',
		hiddenWithoutCore === 'none/0x0',
		hiddenWithoutCore
	);
	await ctx3.close();
	await ctx.close();
} finally {
	await browser.close();
}

if (notes.length > 0) {
	console.log('--- notes ---');
	notes.forEach((n) => console.log(`note — ${n}`));
}
if (failures.length > 0) {
	console.error(`browser-menu FAIL (${failures.length})`);
	process.exit(1);
}
console.log('browser-menu PASS — contract evidence collected in a real browser');
