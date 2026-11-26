/**
 * swup page transitions for all frontend pages.
 *
 * Hard boundaries (never break these):
 * - /portal/* belongs to the snoka-access React SPA — swup must not hijack it.
 * - wp-admin, wp-login, logout, customizer previews: full navigations only.
 * - prefers-reduced-motion: no transition, plain navigation.
 * - The header/footer persist; only #wp--skip-link--target swaps, so the
 *   Navigation block's aria-current is refreshed after every visit.
 */
import Swup from 'swup';
import SwupA11yPlugin from '@swup/a11y-plugin';
import SwupHeadPlugin from '@swup/head-plugin';
import SwupPreloadPlugin from '@swup/preload-plugin';
import './transitions.css';

const CONTAINER = '#wp--skip-link--target';

const EVENTS_CALENDAR_PATTERN = /\/events-calendar(\/|$|[?#])/;

const EXCLUDED_PATTERNS: RegExp[] = [
	/\/portal(\/|$)/,
	/\/wp-(admin|login|cron)/,
	/[?&]action=logout\b/,
	/[?&](preview|customize_changeset_uuid)=/,
	// Events content routes stay excluded: only the calendar page got
	// SPA boot support so far (bootCalendars + teardown + noscript
	// stripping in the plugin's view bundle). Singles, archives, venues,
	// organizers, and series still boot exclusively on DOMContentLoaded.
	/\/events(\/|$|[?#])/,
	/\/venues(\/|$|[?#])/,
	/\/organizers(\/|$|[?#])/,
	/\/series(\/|$|[?#])/,
];

function isExcluded(url: string): boolean {
	return EXCLUDED_PATTERNS.some((pattern) => pattern.test(url));
}

function shouldSkip(): boolean {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		return true;
	}
	if (!document.querySelector(CONTAINER)) {
		return true;
	}
	const classes = document.body.classList;
	if (classes.contains('wp-admin') || classes.contains('login')) {
		return true;
	}
	return false;
}

/**
 * Close the mobile overlay menu before a swup transition replaces <main>.
 * The dialog lives in the persistent header — without this it would stay
 * open over the new page.
 */
function closeOpenMenu(): void {
	if (!document.documentElement.classList.contains('has-modal-open')) {
		return;
	}
	document
		.querySelector<HTMLButtonElement>(
			'.wp-block-navigation__responsive-container-close'
		)
		?.click();
}

/**
 * Re-resolve aria-current after the container swap (header persists).
 * @param url
 */
function refreshNavCurrent(url: string): void {
	let current: URL;
	try {
		current = new URL(url, window.location.origin);
	} catch {
		return;
	}
	const links = document.querySelectorAll<HTMLAnchorElement>(
		'.wp-block-navigation-item__content'
	);
	links.forEach((link) => link.removeAttribute('aria-current'));
	links.forEach((link) => {
		if (link.href === current.href) {
			link.setAttribute('aria-current', 'page');
			return;
		}
		try {
			const target = new URL(link.href);
			if (
				target.origin === current.origin &&
				target.pathname !== '/' &&
				current.pathname.startsWith(target.pathname)
			) {
				link.setAttribute('aria-current', 'page');
			}
		} catch {
			// Ignore unparsable hrefs.
		}
	});
}

/**
 * Refresh the rounded-tree overlay menu after a client-side navigation.
 * The dialog lives in the persistent header, so without this the previous
 * page stays marked current (and its ancestors stay open) until a full
 * reload. Mirrors the server-side rule in inc/nav-overlay.php: exact path
 * match marks current, ancestors open, everything else closes.
 */
function refreshTreeCurrent(): void {
	let currentPath = '/';
	try {
		currentPath =
			new URL(window.location.href).pathname.replace(/\/$/, '') || '/';
	} catch {
		return;
	}
	const setBranch = (toggle: HTMLElement, open: boolean): void => {
		toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
		const controlled = toggle.getAttribute('aria-controls');
		if (controlled) {
			const list = document.getElementById(controlled);
			if (open) {
				list?.removeAttribute('hidden');
			} else {
				list?.setAttribute('hidden', '');
			}
		}
	};
	document
		.querySelectorAll<HTMLElement>('nav.rounded-tree')
		.forEach((nav) => {
			nav.querySelectorAll('a[aria-current]').forEach((link) => {
				link.removeAttribute('aria-current');
			});
			nav.querySelectorAll<HTMLElement>(
				'.tree-toggle[aria-expanded="true"]'
			).forEach((toggle) => {
				setBranch(toggle, false);
			});
			nav.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(
				(link) => {
					let path = '';
					try {
						path =
							new URL(
								link.href,
								window.location.origin
							).pathname.replace(/\/$/, '') || '/';
					} catch {
						return;
					}
					if ('' === path || path !== currentPath) {
						return;
					}
					link.setAttribute('aria-current', 'page');
					let ancestor = link.parentElement;
					while (ancestor) {
						const item = ancestor.closest('li');
						if (!item || !nav.contains(item)) {
							break;
						}
						const toggle = item.querySelector<HTMLElement>(
							':scope > .tree-row > .tree-toggle'
						);
						if (toggle) {
							setBranch(toggle, true);
						}
						ancestor = item.parentElement;
					}
				}
			);
		});
}

if (!shouldSkip()) {
	const swup = new Swup({
		containers: [CONTAINER],
		ignoreVisit: (url, { el } = {}) => {
			if (isExcluded(url)) {
				return true;
			}
			if (el instanceof HTMLElement && el.closest('[data-no-swup]')) {
				return true;
			}
			// Calendar page: swup only when the plugin's boot machinery
			// is present on THIS page (view bundle listens for
			// swup:page:view). The bundle is calendar-page-only today, so
			// arrivals from elsewhere full-load until the plugin enqueues
			// it site-wide — at which point this gate opens by itself and
			// the swup path just works. See check-swup-calendar.
			if (
				EVENTS_CALENDAR_PATTERN.test(url) &&
				!document.querySelector('script[src*="blocks/events/view"]')
			) {
				return true;
			}
			return false;
		},
		plugins: [
			new SwupHeadPlugin(),
			new SwupPreloadPlugin(),
			new SwupA11yPlugin(),
		],
	});

	swup.hooks.on('visit:start', () => {
		// Hold the burger's X while the new page travels: closing the overlay
		// would otherwise morph the icon instantly, desynced from the content
		// fade. Released on arrival (or abort) below.
		if (document.documentElement.classList.contains('has-modal-open')) {
			document.documentElement.classList.add('snoka-hold-burger');
		}
		if (document.documentElement.classList.contains('snoka-menu-open')) {
			document.documentElement.classList.add('snoka-hold-burger');
			// Tell the theme-owned mobile menu this close is a navigation,
			// not a dismissal, so it skips scroll restoration.
			window.dispatchEvent(
				new CustomEvent('snoka:mobile-menu-close', {
					detail: { reason: 'navigate' },
				})
			);
		}
		closeOpenMenu();
		document.documentElement.classList.add('snoka-leaving');
	});

	const releaseBurger = (): void => {
		document.documentElement.classList.remove('snoka-hold-burger');
	};

	swup.hooks.on('visit:end', () => {
		releaseBurger();
		document.documentElement.classList.remove('snoka-leaving');
		refreshNavCurrent(window.location.href);
		refreshTreeCurrent();
	});

	swup.hooks.on('visit:abort', releaseBurger);
}
