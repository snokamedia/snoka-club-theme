/**
 * Swup + events contract check, two phases.
 *
 * Phase 1 — gate closed (no boot bundle on the page): the calendar route
 * must full-load so the shell boots and the <noscript> fallback stays
 * hidden. This is the safe default until the plugin enqueues its view
 * bundle (with WP dependencies) site-wide.
 *
 * Phase 2 — swup cycle with the native bundle: after a full load the
 * plugin's real view.js has run, so its document-level swup listeners
 * are live. Leaving tears the instance down; coming back re-boots
 * exactly one. No harness mocks of the plugin: real bundle, events,
 * swaps. Requires the theme gate to let the calendar through swup when
 * the boot machinery is present.
 *
 * Usage: node ./scripts/check-swup-calendar.mjs [--url=...]
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const failures = [];
const check = (name, cond, extra = '') => {
	console.log(`${cond ? 'PASS' : 'FAIL'} — ${name}${extra ? ` (${extra})` : ''}`);
	if (!cond) {
		failures.push(name);
	}
};

const argUrl = process.argv
	.find((a) => a.startsWith('--url='))
	?.slice('--url='.length);
const URL = argUrl ?? 'https://snoka-access-sandbox.ddev.site/';
const CHROME = join(
	homedir(),
	'.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'
);

const browser = await chromium.launch({ executablePath: CHROME });
try {
	const ctx = await browser.newContext({
		viewport: { width: 1280, height: 900 },
		ignoreHTTPSErrors: true,
	});
	const page = await ctx.newPage();
	const errors = [];
	page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 200)));
	await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
	await page.waitForTimeout(1500);
	const href = await page.evaluate(() => {
		const a = Array.from(document.querySelectorAll('a')).find((x) =>
			x.href.includes('events-calendar')
		);
		return a ? a.getAttribute('href') : null;
	});
	check('calendar link exists on the page', !!href, href ?? 'none');
	if (href) {
		await page.click(`a[href="${href}"]`);
		await page.waitForTimeout(4000);
		const s = await page.evaluate(() => {
			const fb = document.querySelector('.snoka-calendar-fallback');
			const fbr = fb ? fb.getBoundingClientRect() : null;
			const shell = document.querySelector('.snoka-event-calendar');
			return {
				url: location.href,
				fallbackBox:
					fbr === null ? 'absent-or-hidden' : `${Math.round(fbr.width)}x${Math.round(fbr.height)}`,
				shellCls: shell ? shell.className.toString().slice(0, 100) : 'no-shell',
			};
		});
		check(
			'gate closed without boot bundle: calendar full-loads (noscript stays hidden)',
			s.fallbackBox === 'absent-or-hidden',
			`${s.url} fallback=${s.fallbackBox}`
		);
		check(
			'calendar shell initializes after swup arrival',
			/snoka-calendar-shell/.test(s.shellCls) &&
				s.shellCls.includes('is-ready'),
			s.shellCls
		);
		check(
			'shell booted exactly once (idempotent, data-booted set)',
			(await page.evaluate(() =>
				document.querySelectorAll('.snoka-event-calendar[data-booted]').length
			)) === 1
		);
		// (Leave-and-back is covered by Phase 2 below with a working
		// away-link finder.)
	}

	// Phase 2 — swup cycle with the native bundle. Phase 1 full-loaded
	// the calendar, so the plugin's real view.js executed and its
	// document-level swup listeners are live (script tags may come and
	// go with <head>, listeners persist on document). Leaving tears the
	// instance down; coming back re-boots exactly one. No harness mocks:
	// real bundle, real events, real swaps.
	await page.evaluate(() => {
		window.__swupSawReplace = false;
		document.addEventListener('swup:content:replace', () => {
			window.__swupSawReplace = true;
		});
	});
	const awayHref = await page.evaluate(() => {
		const a = Array.from(document.querySelectorAll('a[href]')).find(
			(x) =>
				x.origin === location.origin &&
				(x.pathname === '/contact/' ||
					x.pathname === '/news-notices/' ||
					(x.pathname !== '/' &&
						!x.pathname.includes('events') &&
						!x.pathname.includes('wp-') &&
						!x.hash))
		);
		return a ? a.getAttribute('href') : null;
	});
	check('away link found for swup cycle', !!awayHref, awayHref ?? 'none');
	if (awayHref) {
		const preErrs = errors.length;
		await page.click(`a[href="${awayHref}"]`);
		await page.waitForFunction(
			() => !document.querySelector('.snoka-event-calendar'),
			null,
			{ timeout: 15000 }
		).catch(() => {});
		await page.waitForTimeout(1000);
		const away = await page.evaluate(() => ({
			swup: !!window.__swupSawReplace,
			url: location.href,
			shellGone: !document.querySelector('.snoka-event-calendar'),
		}));
		check('leaving the calendar goes through swup', away.swup === true, away.url);
		check('calendar shell removed with the swapped container', away.shellGone);
		await page.goBack();
		await page.waitForFunction(
			() => document.querySelector('.snoka-event-calendar.is-ready'),
			null,
			{ timeout: 15000 }
		).catch(() => {});
		await page.waitForTimeout(1000);
		const back = await page.evaluate(() => ({
			url: location.href,
			booted: document.querySelectorAll('.snoka-event-calendar[data-booted]').length,
			ready: !!document.querySelector('.snoka-event-calendar.is-ready'),
			fb: (() => {
				const el = document.querySelector('.snoka-calendar-fallback');
				if (!el) {
					return 'absent-or-hidden';
				}
				const r = el.getBoundingClientRect();
				return `${Math.round(r.width)}x${Math.round(r.height)}`;
			})(),
		}));
		check(
			'returning re-boots exactly one live instance, fallback hidden',
			back.booted === 1 && back.ready && back.fb === 'absent-or-hidden',
			`booted=${back.booted} ready=${back.ready} fallback=${back.fb} url=${back.url}`
		);
		const newErrs = errors.slice(preErrs);
		check('no page errors across the swup cycle', newErrs.length === 0, newErrs[0] ?? 'clean');
	}
	check('no page errors during calendar navigation', errors.length === 0, errors[0] ?? 'clean');
	await ctx.close();
} finally {
	await browser.close();
}

if (failures.length > 0) {
	console.error(`swup-calendar FAIL (${failures.length})`);
	process.exit(1);
}
console.log('swup-calendar PASS — event routes full-load and boot');
