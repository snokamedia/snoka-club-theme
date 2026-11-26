/**
 * Snoka views controller: on-demand view code for swup navigation.
 *
 * WordPress enqueues a block's view script only when the block renders
 * server-side. After a swup swap, new markup arrives without its scripts —
 * and HeadPlugin-synced script tags never execute. This controller closes
 * that gap: interactive view roots declare themselves in markup
 * (`data-snoka-view` + `data-snoka-view-src`, styles in
 * `data-snoka-view-css`), and the controller loads + boots them on initial
 * load and on every swup page view. No registry, no manifest, no import
 * maps: the versioned URL travels with the swapped HTML.
 *
 * Full contract: SWUP-DYNAMIC-LOADING.md.
 */

type ViewModule = {
	boot: (el: HTMLElement, ctx: { signal: AbortSignal }) => unknown;
};

type LiveRecord = {
	ac: AbortController;
	cleanup: unknown;
};

export {};

declare global {
	interface Window {
		SnokaViews?: {
			allowedPrefixes?: string[];
		};
	}
}

const STATE_ATTR = 'data-snoka-view-state';
const INERT_SELECTOR = '[data-snoka-inert]';
const VIEW_SELECTOR = '[data-snoka-view]';

const claimed = new WeakSet<Element>();
const live = new Map<Element, LiveRecord>();
const inflight = new Map<string, Promise<unknown>>();

let navigated = false;

function report(err: unknown, ctx: string): void {
	// eslint-disable-next-line no-console
	console.error(`[snoka-views] ${ctx}`, err);
}

function allowedPrefixes(): string[] {
	const configured = window.SnokaViews?.allowedPrefixes;
	if (Array.isArray(configured) && configured.length > 0) {
		return configured.filter((p): p is string => typeof p === 'string');
	}
	return ['/wp-content/plugins/', '/wp-content/themes/'];
}

/**
 * Validate a markup-provided bundle URL before fetching. `data-*`
 * attributes are writable by any author, so same-origin plus an
 * allowlisted path prefix is enforced — never import blindly.
 * @param raw
 */
function allowedSrc(raw: string | undefined): string | null {
	if (!raw) {
		return null;
	}
	let url: URL;
	try {
		url = new URL(raw, document.baseURI);
	} catch {
		return null;
	}
	if (url.origin !== window.location.origin) {
		return null;
	}
	const ok = allowedPrefixes().some((prefix) =>
		url.pathname.startsWith(prefix)
	);
	return ok ? url.href : null;
}

function setState(el: Element, state: 'loading' | 'ready' | 'error'): void {
	el.setAttribute(STATE_ATTR, state);
}

function ensureStyles(hrefs: string[]): Promise<void> {
	const jobs = hrefs.map(
		(href) =>
			new Promise<void>((resolve) => {
				let abs: string;
				try {
					abs = new URL(href, document.baseURI).href;
				} catch {
					resolve();
					return;
				}
				const existing = [
					...document.querySelectorAll<HTMLLinkElement>(
						'link[rel="stylesheet"]'
					),
				].find((link) => link.href === abs);
				if (existing) {
					resolve();
					return;
				}
				const link = document.createElement('link');
				link.rel = 'stylesheet';
				link.href = abs;
				link.setAttribute('data-snoka-view-style', '');
				const done = (): void => resolve();
				link.addEventListener('load', done, { once: true });
				link.addEventListener('error', done, { once: true });
				document.head.append(link);
				window.setTimeout(done, 3000);
			})
	);
	return Promise.all(jobs).then(() => undefined);
}

function loadModule(src: string): Promise<unknown> {
	let pending = inflight.get(src);
	if (!pending) {
		pending = import(/* @vite-ignore */ src);
		inflight.set(src, pending);
		pending.catch(() => {
			inflight.delete(src);
		});
	}
	return pending;
}

function destroy(el: Element): void {
	const rec = live.get(el);
	live.delete(el);
	claimed.delete(el);
	if (!rec) {
		return;
	}
	try {
		rec.ac.abort();
		if (typeof rec.cleanup === 'function') {
			(rec.cleanup as () => void)();
		}
	} catch (err) {
		report(err, 'destroy');
	}
}

function reconcile(root: ParentNode = document): void {
	const scope: ParentNode = root === document ? document : root;
	for (const el of [...live.keys()]) {
		if (!el.isConnected || (scope !== document && !scope.contains(el))) {
			destroy(el);
		}
	}
}

function guardedReloadOnce(): void {
	if (!navigated) {
		return;
	}
	const key = `snoka-views-reload:${window.location.href}`;
	try {
		if (window.sessionStorage.getItem(key)) {
			return;
		}
		window.sessionStorage.setItem(key, '1');
	} catch {
		return;
	}
	window.location.reload();
}

async function run(el: HTMLElement, src: string, css: string[]): Promise<void> {
	setState(el, 'loading');
	if (!live.has(el)) {
		live.set(el, { ac: new AbortController(), cleanup: undefined });
	}
	const rec = live.get(el);
	if (!rec) {
		return;
	}
	let mod: unknown;
	try {
		await ensureStyles(css);
		mod = await loadModule(src);
	} catch (err) {
		setState(el, 'error');
		report(err, `load ${el.getAttribute('data-snoka-view') ?? 'unknown'}`);
		destroy(el);
		guardedReloadOnce();
		return;
	}
	if (!el.isConnected) {
		destroy(el);
		return;
	}
	const boot = (mod as Partial<ViewModule> | null)?.boot;
	if (typeof boot !== 'function') {
		setState(el, 'error');
		report(
			new Error('view module has no boot()'),
			el.getAttribute('data-snoka-view') ?? 'unknown'
		);
		destroy(el);
		return;
	}
	try {
		const cleanup = await (boot as ViewModule['boot'])(el, {
			signal: rec.ac.signal,
		});
		if (!el.isConnected) {
			destroy(el);
			return;
		}
		rec.cleanup = cleanup;
		setState(el, 'ready');
	} catch (err) {
		setState(el, 'error');
		report(err, `mount ${el.getAttribute('data-snoka-view') ?? 'unknown'}`);
		destroy(el);
		claimed.add(el);
	}
}

function scan(root: ParentNode = document): void {
	const scope: ParentNode = root === document ? document : root;
	const roots: Element[] =
		root instanceof Element && root.matches(VIEW_SELECTOR) ? [root] : [];
	for (const el of scope.querySelectorAll(VIEW_SELECTOR)) {
		roots.push(el);
	}
	for (const el of roots) {
		if (claimed.has(el) || el.closest(INERT_SELECTOR)) {
			continue;
		}
		const rawSrc = (el as HTMLElement).dataset.snokaViewSrc;
		const src = allowedSrc(rawSrc);
		if (!src) {
			setState(el, 'error');
			report(
				new Error('rejected view src'),
				el.getAttribute('data-snoka-view') ?? 'unknown'
			);
			continue;
		}
		claimed.add(el);
		const css = ((el as HTMLElement).dataset.snokaViewCss ?? '')
			.split(/\s+/)
			.filter((href) => href.length > 0);
		void run(el as HTMLElement, src, css);
	}
}

function prewarm(html: unknown): void {
	if (typeof html !== 'string' || html.length === 0) {
		return;
	}
	let doc: Document;
	try {
		doc = new DOMParser().parseFromString(html, 'text/html');
	} catch {
		return;
	}
	for (const el of doc.querySelectorAll(VIEW_SELECTOR)) {
		const src = (el as HTMLElement).dataset.snokaViewSrc;
		const checked = allowedSrc(src);
		if (checked) {
			loadModule(checked).catch(() => {});
		}
	}
}

type SwupDetail = {
	args?: {
		page?: {
			html?: string;
		};
	};
};

function pageHtml(event: Event): string | undefined {
	return (event as CustomEvent<SwupDetail>).detail?.args?.page?.html;
}

document.addEventListener('swup:page:load', (event: Event) =>
	prewarm(pageHtml(event))
);
document.addEventListener('swup:page:preload', (event: Event) =>
	prewarm(pageHtml(event))
);
document.addEventListener('swup:content:replace', () => reconcile());
document.addEventListener('swup:page:view', () => {
	navigated = true;
	reconcile();
	scan();
});

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => scan(), { once: true });
} else {
	scan();
}
