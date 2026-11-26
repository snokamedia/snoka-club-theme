/**
 * Global vanilla behaviors. No dependencies. Safe to run on any page,
 * including when the islands bundle is absent — dispatches are no-ops then.
 */

import './main.css';
import './fonts.css';
import './header.css';

function setYears(): void {
	const nodes = document.querySelectorAll<HTMLElement>('[data-year]');
	nodes.forEach((el) => {
		el.textContent = String(new Date().getFullYear());
	});
}

function notifyToast(message: string): void {
	document.dispatchEvent(
		new CustomEvent<string>('snoka:toast', { detail: message })
	);
}

function initCopyButtons(): void {
	document.addEventListener('click', (event) => {
		const target = event.target as HTMLElement | null;
		const button = target?.closest<HTMLElement>('[data-copy]');
		if (!button) {
			return;
		}
		const text = button.getAttribute('data-copy') ?? '';
		if (!text || !navigator.clipboard) {
			notifyToast('Copy unavailable — select the text manually.');
			return;
		}
		void navigator.clipboard.writeText(text).then(
			() => notifyToast('Copied to clipboard.'),
			() => notifyToast('Copy failed — select the text manually.')
		);
	});
}

setYears();
initCopyButtons();

/**
 * Secondary flyout auto-flip. Core hard-codes right-justified nested
 * submenus to right:100% (open left) with no viewport check, so they never
 * attempt the right side even when space is free. On hover/focus of a nested
 * .has-child, measure its submenu: right-justified navs optimistically try
 * .snoka-submenu-open-right (left:100%) and keep it when it fits, otherwise
 * fall back to core's left-opening; other justifications keep the default
 * right-opening unless it would overflow, then flip to
 * .snoka-submenu-open-left. Desktop flyouts only (>= 782px, matching core).
 * Delegated on document so swup content swaps need no re-init.
 */
function initSubmenuFlip(): void {
	if (typeof window.matchMedia !== 'function') {
		return;
	}
	const mq = window.matchMedia('(min-width: 782px)');
	const EDGE = 8;

	const isNestedItem = (el: HTMLElement): boolean =>
		el.classList.contains('has-child') &&
		el.parentElement?.closest('.wp-block-navigation__submenu-container') !==
			null;

	const evaluate = (item: HTMLElement): void => {
		if (!mq.matches || !isNestedItem(item)) {
			return;
		}
		const submenu = item.querySelector(
			':scope > .wp-block-navigation__submenu-container'
		);
		if (!(submenu instanceof HTMLElement)) {
			return;
		}
		const nav = item.closest('.wp-block-navigation');
		const isRight =
			nav?.classList.contains('items-justified-right') ?? false;
		if (isRight) {
			item.classList.add('snoka-submenu-open-right');
			requestAnimationFrame(() => {
				if (!item.isConnected || !mq.matches) {
					return;
				}
				const rect = submenu.getBoundingClientRect();
				if (rect.width === 0 && rect.right === 0) {
					return;
				}
				if (rect.right > window.innerWidth - EDGE) {
					item.classList.remove('snoka-submenu-open-right');
				}
			});
		} else {
			requestAnimationFrame(() => {
				if (!item.isConnected || !mq.matches) {
					return;
				}
				const rect = submenu.getBoundingClientRect();
				if (rect.width === 0 && rect.right === 0) {
					return;
				}
				if (rect.right > window.innerWidth - EDGE) {
					item.classList.add('snoka-submenu-open-left');
				} else {
					item.classList.remove('snoka-submenu-open-left');
				}
			});
		}
	};

	const maybeReset = (item: HTMLElement, related: Node | null): void => {
		if (related instanceof Node && item.contains(related)) {
			return;
		}
		item.classList.remove(
			'snoka-submenu-open-right',
			'snoka-submenu-open-left'
		);
	};

	document.addEventListener('mouseover', (event) => {
		const target = event.target as HTMLElement | null;
		const item = target?.closest<HTMLElement>(
			'.wp-block-navigation .has-child'
		);
		if (item) {
			evaluate(item);
		}
	});
	document.addEventListener('focusin', (event) => {
		const target = event.target as HTMLElement | null;
		const item = target?.closest<HTMLElement>(
			'.wp-block-navigation .has-child'
		);
		if (item) {
			evaluate(item);
		}
	});
	document.addEventListener('mouseout', (event) => {
		const e = event as MouseEvent;
		const target = e.target as HTMLElement | null;
		const item = target?.closest<HTMLElement>(
			'.wp-block-navigation .has-child'
		);
		if (item) {
			maybeReset(item, e.relatedTarget as Node | null);
		}
	});
	document.addEventListener('focusout', (event) => {
		const target = event.target as HTMLElement | null;
		const item = target?.closest<HTMLElement>(
			'.wp-block-navigation .has-child'
		);
		if (item) {
			maybeReset(
				item,
				(event as FocusEvent).relatedTarget as Node | null
			);
		}
	});
}

/**
 * Animated burger icon. Enhances the ONE true toggle only: the
 * .snoka-mobile-nav responsive open button. Strips core's hamburger SVG
 * so the button holds a single glyph (.rails/.rail spans) that morphs
 * burger->X in place.
 *
 * HARD PROHIBITION: never append, clone, or re-inject an <svg> — or any
 * second button/glyph — into this toggle. The morph only works when this
 * exact button keeps its exact box and its single glyph; any extra shape
 * stacked on top breaks the animation. Core re-renders its SVG on some
 * updates, so a childList observer strips re-added SVGs on sight.
 */
function initMenuIcon(): void {
	const button = document.querySelector<HTMLButtonElement>(
		'.snoka-mobile-nav .wp-block-navigation__responsive-container-open'
	);
	if (!button) {
		return;
	}
	const stripSvgs = (): void => {
		button.querySelectorAll('svg').forEach((svg) => svg.remove());
	};
	const sync = (open: boolean): void => {
		const value = open ? 'true' : 'false';
		if (button.getAttribute('aria-expanded') !== value) {
			button.setAttribute('aria-expanded', value);
		}
	};
	if (!button.classList.contains('menu-icon')) {
		button.classList.add('menu-icon', 'v-classic');
		stripSvgs();
		const rails = document.createElement('span');
		rails.className = 'rails';
		rails.setAttribute('aria-hidden', 'true');
		for (let i = 0; i < 3; i++) {
			const rail = document.createElement('span');
			rail.className = 'rail';
			rails.appendChild(rail);
		}
		button.appendChild(rails);
	}
	stripSvgs();
	sync(document.documentElement.classList.contains('snoka-menu-open'));
	// Keep the single glyph single: strip any SVG core re-injects, and
	// mirror open state. Never add shapes here.
	const observer = new MutationObserver(() => {
		stripSvgs();
		sync(document.documentElement.classList.contains('snoka-menu-open'));
	});
	observer.observe(button, { childList: true });
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['class'],
	});
}

setYears();
initCopyButtons();
initMenuIcon();
initSubmenuFlip();

/**
 * Mobile overlay tree toggles. Branch rows split navigation (the parent
 * link) from expansion (the 48px .tree-toggle button), so a tap can never
 * do the wrong one. Toggles carry aria-expanded/aria-controls; the child
 * list hides via the hidden attribute. Single-open per sibling group
 * mirrors the old <details name> behavior. Delegated on document so swup
 * content swaps need no re-init; link taps are untouched and navigate.
 */
function initTreeToggle(): void {
	const setBranch = (
		toggle: HTMLButtonElement,
		list: HTMLElement,
		open: boolean
	): void => {
		toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
		list.hidden = !open;
	};

	document.addEventListener('click', (event) => {
		const target = event.target as HTMLElement | null;
		const toggle = target?.closest<HTMLButtonElement>(
			'.rounded-tree .tree-toggle'
		);
		if (!toggle) {
			return;
		}
		const controlled = document.getElementById(
			toggle.getAttribute('aria-controls') ?? ''
		);
		const item = toggle.closest('li');
		if (!(controlled instanceof HTMLElement) || !item?.parentElement) {
			return;
		}
		const willOpen = toggle.getAttribute('aria-expanded') !== 'true';
		// Single-open: close open siblings, leave deeper groups alone.
		for (const sibling of Array.from(item.parentElement.children)) {
			if (!(sibling instanceof HTMLElement) || sibling === item) {
				continue;
			}
			const openToggle = sibling.querySelector<HTMLButtonElement>(
				':scope > .tree-row > .tree-toggle[aria-expanded="true"]'
			);
			if (!openToggle) {
				continue;
			}
			const openList = document.getElementById(
				openToggle.getAttribute('aria-controls') ?? ''
			);
			if (openList instanceof HTMLElement) {
				setBranch(openToggle, openList, false);
			}
		}
		setBranch(toggle, controlled, willOpen);
	});
}

initTreeToggle();

type MobileMenuPhase = 'closed' | 'aligning' | 'open' | 'closing';
type MobileMenuCloseReason = 'dismiss' | 'navigate' | 'breakpoint';

/**
 * Theme-owned mobile menu: scroll → lock → open.
 *
 * Baseline is overlay plus stacking — no coordinate reconstruction, no
 * pinning, no button movement, no reparenting:
 * 1. On activate, the menu row (`.snoka-mobile-nav`) scrolls to its
 *    aligned viewport position. Ordinary top bars scroll away and
 *    contribute nothing; only a genuinely obscuring admin bar plus the
 *    notch safe-area plus an intentional gap set the target.
 * 2. The toggle and its glyph stay exactly where they are in the DOM
 *    and layout. Nothing measures them, nothing positions them.
 * 3. Background scrolling locks without displacing the page.
 * 4. A full-screen sheet paints below the toggle's stacking layer
 *    (sheet z-index 90; the nav layer raised to 95 while open).
 * 5. One open-state class (`html.snoka-menu-open`) transitions sheet
 *    opacity, toggle color, and the existing burger-to-X morph on
 *    shared timing.
 *
 * Modal boundary is the nav shell (role="dialog" while open), which
 * permanently contains the toggle. The sheet is a visual layer only:
 * stacking solves painting and hit-testing, the trap + scroll lock
 * solve modality. Core's overlay is never opened.
 */
function initMobileMenu(): void {
	if (typeof window.matchMedia !== 'function') {
		return;
	}
	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const desktop = window.matchMedia('(min-width: 600px)');
	let phase: MobileMenuPhase = 'closed';
	let nav: HTMLElement | null = null;
	let opener: HTMLButtonElement | null = null;
	let dialog: HTMLElement | null = null;
	let cancelled = false;
	let labeledByUs = false;

	const ALIGN_GAP = 12;
	const CONTENT_GAP = 20;
	const SETTLE_MAX_FRAMES = 90;

	/**
	 * Notch safe-area in px, probed from a fixed 0x0 node. Zero when
	 * unsupported — never guessed, never negative.
	 */
	let safeProbe: HTMLElement | null = null;
	const safeTop = (): number => {
		if (!safeProbe || !safeProbe.isConnected) {
			safeProbe = document.createElement('div');
			safeProbe.setAttribute('aria-hidden', 'true');
			safeProbe.style.cssText =
				'position:fixed;top:env(safe-area-inset-top,0px);left:0;' +
				'width:0;height:0;margin:0;padding:0;border:0;' +
				'visibility:hidden;pointer-events:none;';
			document.body.appendChild(safeProbe);
		}
		const top = safeProbe.getBoundingClientRect().top;
		return Number.isFinite(top) && top > 0 ? top : 0;
	};

	/**
	 * Visible admin-bar height, or zero when absent or scrolled out of
	 * view. The only page bar allowed to affect alignment.
	 */
	const adminHeight = (): number => {
		const bar = document.getElementById('wpadminbar');
		if (!(bar instanceof HTMLElement)) {
			return 0;
		}
		const rect = bar.getBoundingClientRect();
		if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
			return 0;
		}
		return Math.max(0, Math.min(rect.height, rect.bottom));
	};

	/** Intended viewport top of the aligned menu row. */
	const alignedTop = (): number => adminHeight() + safeTop() + ALIGN_GAP;

	const rowTarget = (): number => {
		if (!nav) {
			return 0;
		}
		const rowDocumentTop = window.scrollY + nav.getBoundingClientRect().top;
		return Math.max(0, rowDocumentTop - alignedTop());
	};

	/*
	 * Temporary scroll range for short pages. A page shorter than the
	 * viewport cannot scroll far enough to align the row, so the wrapper
	 * gets a minimum height of viewport + target (never shrinking the
	 * page: max() with the measured height). Growth happens at the end
	 * of the document, so nothing on screen moves when it is added.
	 *
	 * Release is gradual, not instant: removing the range in one step
	 * clamps the resting scroll position in a single frame — a visible
	 * snap after the modal closes. Instead the wrapper shortens over
	 * the same 220ms clock as the exit fade (CSS transition below), so
	 * the scroll position settles instead of snapping. Reduced-motion
	 * users skip the extension entirely and open in place.
	 */
	let previousMinHeight: string | null = null;
	let extended = false;

	const pageWrapper = (): HTMLElement =>
		document.querySelector<HTMLElement>('.wp-site-blocks') ?? document.body;

	const restorePageHeight = (): void => {
		if (previousMinHeight !== null) {
			const page = pageWrapper();
			if (previousMinHeight === '') {
				page.style.removeProperty('min-height');
			} else {
				page.style.minHeight = previousMinHeight;
			}
			previousMinHeight = null;
		}
		pageWrapper().style.removeProperty('transition');
		extended = false;
	};

	const ensureScrollRange = (): number => {
		const target = rowTarget();
		const scroller = document.scrollingElement ?? document.documentElement;
		const page = pageWrapper();
		if (previousMinHeight === null) {
			previousMinHeight = page.style.minHeight;
		}
		const requiredHeight = scroller.clientHeight + Math.ceil(target);
		const currentHeight = page.getBoundingClientRect().height;
		extended = requiredHeight > currentHeight;
		// Instant while opening (transition disabled for this write so
		// the range exists before the scroll starts); the CSS rule below
		// animates the release on close.
		page.style.transition = 'none';
		page.style.minHeight = `${Math.max(currentHeight, requiredHeight)}px`;
		void page.offsetWidth;
		page.style.removeProperty('transition');
		return target;
	};

	const setToggle = (open: boolean): void => {
		if (!opener) {
			return;
		}
		opener.setAttribute('aria-expanded', open ? 'true' : 'false');
	};

	const FOCUSABLE =
		'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

	const focusables = (): HTMLElement[] => {
		const els: HTMLElement[] = [];
		if (opener && opener.isConnected) {
			els.push(opener);
		}
		if (dialog) {
			els.push(
				...Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE))
			);
		}
		return els.filter(
			(el) =>
				!el.closest('[hidden]') &&
				el.getAttribute('aria-hidden') !== 'true'
		);
	};

	const focusOpener = (): void => {
		if (opener && opener.isConnected) {
			opener.focus({ preventScroll: true });
		}
	};

	const focusMain = (): void => {
		const main = document.querySelector<HTMLElement>('main, [role="main"]');
		if (main) {
			if (!main.hasAttribute('tabindex')) {
				main.setAttribute('tabindex', '-1');
			}
			main.focus({ preventScroll: true });
		}
	};

	let treeHome: {
		tree: HTMLElement;
		parent: HTMLElement;
		next: Node | null;
	} | null = null;

	const unshelveTree = (): void => {
		if (!treeHome) {
			return;
		}
		const { tree, parent, next } = treeHome;
		treeHome = null;
		if (tree.isConnected) {
			parent.insertBefore(tree, next);
		} else {
			parent.appendChild(tree);
		}
	};

	const releaseShell = (): void => {
		if (!nav) {
			return;
		}
		document.documentElement.style.removeProperty('--menu-content-top');
		nav.removeAttribute('role');
		nav.removeAttribute('aria-modal');
		if (labeledByUs) {
			nav.removeAttribute('aria-label');
			labeledByUs = false;
		}
	};

	const closeMenu = (reason: MobileMenuCloseReason): void => {
		if (phase !== 'open') {
			return;
		}
		phase = 'closing';
		setToggle(false);
		// Reverse the single visual state. The raised nav layer stays
		// above the sheet until the exit finishes so the closing morph
		// never disappears underneath it.
		document.documentElement.classList.remove('snoka-menu-open');
		// Begin releasing the temporary scroll range on the same clock
		// as the exit fade, so the resting scroll position settles
		// instead of snapping when the range is removed. No-op on long
		// pages (the extension was a no-op there too) and under
		// reduced motion (no extension is ever added there).
		if (extended && !reduceMotion.matches) {
			pageWrapper().style.minHeight = '0px';
		}
		const dlg = dialog;
		const finish = (): void => {
			if (phase !== 'closing') {
				return;
			}
			dlg?.setAttribute('hidden', '');
			unshelveTree();
			releaseShell();
			// Restore the wrapper's previous height during the existing
			// close cleanup for all reasons. By now the gradual release
			// above has settled the scroll position, so this is a no-op
			// visually — it only removes the inline residue.
			restorePageHeight();
			if (reason === 'dismiss') {
				focusOpener();
			} else if (reason === 'breakpoint') {
				focusMain();
			}
			// 'navigate': let the navigation contract own focus.
			nav = null;
			opener = null;
			dialog = null;
			phase = 'closed';
		};
		if (reduceMotion.matches) {
			finish();
			return;
		}
		let finished = false;
		const finishOnce = (): void => {
			if (!finished) {
				finished = true;
				finish();
			}
		};
		dlg?.addEventListener('transitionend', finishOnce, { once: true });
		window.setTimeout(finishOnce, 300);
	};

	const ensureSheet = (): HTMLElement | null => {
		let dlg = document.querySelector<HTMLElement>('.snoka-mobile-dialog');
		if (!dlg) {
			dlg = document.createElement('div');
			dlg.className = 'snoka-mobile-dialog';
			dlg.setAttribute('hidden', '');
			const label =
				nav
					?.querySelector('nav.rounded-tree')
					?.getAttribute('aria-label') ?? 'Menu';
			dlg.setAttribute('aria-label', label);
			dlg.addEventListener('click', (event) => {
				if (event.target === dlg) {
					closeMenu('dismiss');
				}
			});
			document.body.appendChild(dlg);
		}
		return dlg;
	};

	const shelveTree = (): HTMLElement | null => {
		if (!nav || treeHome) {
			return (
				treeHome?.tree ?? nav?.querySelector('nav.rounded-tree') ?? null
			);
		}
		const tree = nav.querySelector('nav.rounded-tree');
		const dlg = ensureSheet();
		if (!(tree instanceof HTMLElement) || !dlg) {
			return null;
		}
		const parent = tree.parentElement;
		if (!(parent instanceof HTMLElement)) {
			return null;
		}
		// Only the tree moves, into the body-level sheet. The toggle is
		// never touched: no button of any kind enters the sheet.
		treeHome = { tree, parent, next: tree.nextSibling };
		dlg.appendChild(tree);
		return tree;
	};

	const openMenu = (): void => {
		if (!nav || !opener || cancelled) {
			restorePageHeight();
			nav = null;
			opener = null;
			phase = 'closed';
			return;
		}
		const dlg = ensureSheet();
		if (!dlg) {
			restorePageHeight();
			nav = null;
			opener = null;
			phase = 'closed';
			return;
		}
		dialog = dlg;
		if (!shelveTree()) {
			dialog = null;
			restorePageHeight();
			nav = null;
			opener = null;
			phase = 'closed';
			return;
		}
		// Content clearance from the aligned row's actual bottom plus a
		// gap. One measurement for sheet layout — never button geometry,
		// never verified, never re-measured while open.
		const rowBottom = nav.getBoundingClientRect().bottom;
		document.documentElement.style.setProperty(
			'--menu-content-top',
			`${Math.max(rowBottom, 0) + CONTENT_GAP}px`
		);
		nav.setAttribute('role', 'dialog');
		nav.setAttribute('aria-modal', 'true');
		if (!nav.hasAttribute('aria-label')) {
			const label =
				dialog
					.querySelector('nav.rounded-tree')
					?.getAttribute('aria-label') ?? 'Menu';
			nav.setAttribute('aria-label', label);
			labeledByUs = true;
		}
		// Lock the background without displacing it, reveal the sheet,
		// then flip the single visual state: sheet opacity, toggle
		// color, and rail morph together.
		document.documentElement.classList.add('snoka-menu-open');
		setToggle(true);
		dlg.removeAttribute('hidden');
		void dlg.offsetWidth;
		phase = 'open';
		focusOpener();
	};

	const begin = (scope: HTMLElement, button: HTMLButtonElement): void => {
		if (phase !== 'closed') {
			return;
		}
		nav = scope;
		opener = button;
		cancelled = false;
		// Reduced motion: no scroll, no extension — open in place where
		// the toggle was tapped. Zero motion, zero cleanup.
		if (reduceMotion.matches) {
			phase = 'aligning';
			openMenu();
			return;
		}
		// Short pages cannot reach the target without scroll range, so
		// extend the wrapper first, then run the scroll sequence.
		const target = ensureScrollRange();
		if (Math.abs(target - window.scrollY) <= 1) {
			phase = 'aligning';
			openMenu();
			return;
		}
		// Scroll first: sheet closed, burger unmorphed, closed colors, no
		// open class. Opening follows arrival, not a timer. If the page
		// still cannot scroll far enough, the resting position counts as
		// arrival instead of stranding the user with no menu.
		phase = 'aligning';
		window.scrollTo({
			top: target,
			left: window.scrollX,
			behavior: reduceMotion.matches ? 'auto' : 'smooth',
		});
		let lastY = window.scrollY;
		const startY = lastY;
		let stable = 0;
		let frames = 0;
		const settle = (): void => {
			if (phase !== 'aligning' || cancelled || !nav) {
				return;
			}
			frames += 1;
			const y = window.scrollY;
			const moved = Math.abs(y - startY) >= 1;
			stable = Math.abs(y - lastY) < 1 ? stable + 1 : 0;
			lastY = y;
			// Settle means the scroll came to rest: arrived at the
			// target, or stopped at the physical maximum on a short
			// page (reads only — the page is never extended). Either
			// way the menu opens where the page rests.
			const root = document.documentElement;
			const atMax =
				y >= Math.max(0, root.scrollHeight - root.clientHeight) - 1;
			if (stable >= 2 && (moved || atMax)) {
				openMenu();
				return;
			}
			if (frames > SETTLE_MAX_FRAMES) {
				// Settling took too long: open where the page rests
				// rather than stranding the user with no menu.
				openMenu();
				return;
			}
			requestAnimationFrame(settle);
		};
		requestAnimationFrame(settle);
	};

	const cancelAlign = (): void => {
		if (phase !== 'aligning') {
			return;
		}
		cancelled = true;
		restorePageHeight();
		nav = null;
		opener = null;
		phase = 'closed';
	};

	document.addEventListener(
		'click',
		(event) => {
			const target = event.target as HTMLElement | null;
			const button = target?.closest<HTMLButtonElement>(
				'.snoka-mobile-nav .wp-block-navigation__responsive-container-open'
			);
			if (!button) {
				return;
			}
			if (phase !== 'closed') {
				// Mid-flow: only our own opener is intercepted. Anything
				// else passes through to core. Swallow ours while busy so
				// double-clicks cannot queue another open; Escape remains
				// the way out of a pending alignment.
				if (button !== opener) {
					return;
				}
				event.preventDefault();
				event.stopPropagation();
				if (phase === 'open') {
					closeMenu('dismiss');
				}
				return;
			}
			const scope = button.closest<HTMLElement>('.snoka-mobile-nav');
			if (!scope || !scope.querySelector('nav.rounded-tree')) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			begin(scope, button);
		},
		true
	);

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && phase === 'aligning') {
			cancelAlign();
			return;
		}
		if (phase !== 'open' || !dialog) {
			return;
		}
		if (event.key === 'Escape') {
			closeMenu('dismiss');
			return;
		}
		if (event.key !== 'Tab') {
			return;
		}
		const items = focusables();
		if (items.length === 0) {
			return;
		}
		const first = items[0];
		const last = items[items.length - 1];
		const active = dialog.ownerDocument.activeElement;
		if (event.shiftKey && active === first) {
			last.focus({ preventScroll: true });
			event.preventDefault();
		} else if (!event.shiftKey && active === last) {
			first.focus({ preventScroll: true });
			event.preventDefault();
		}
	});

	window.addEventListener('snoka:mobile-menu-close', (event) => {
		const detail = (event as CustomEvent<{ reason?: string }>).detail;
		closeMenu(detail?.reason === 'navigate' ? 'navigate' : 'dismiss');
	});

	window.addEventListener('resize', () => {
		if (phase === 'aligning') {
			cancelAlign();
			return;
		}
		if (phase === 'closed') {
			return;
		}
		if (desktop.matches) {
			closeMenu('breakpoint');
		}
	});

	// The sheet exists before the first interaction (hidden): opening
	// never creates layout-affecting nodes, only reveals and fills it.
	ensureSheet();
}

initMobileMenu();
