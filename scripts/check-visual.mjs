/**
 * Real-browser proof for the Site Editor: logs in, opens the front-page
 * template, and asserts the icon block is registered, insertable by name,
 * and rendering on the canvas with zero unsupported-block notices.
 * Screenshots land in /tmp/opencode/ for human review.
 *
 * Usage: pnpm check:visual
 * Env: SNOKA_ADMIN_USER / SNOKA_ADMIN_PASS (default admin/admin),
 *      SNOKA_SANDBOX_URL (default https://snoka-access-sandbox.ddev.site)
 */
import { chromium } from 'playwright-core';

const home = process.env.HOME || '/home/snoka';
const host =
	process.env.SNOKA_SANDBOX_URL || 'https://snoka-access-sandbox.ddev.site';
const report = {
	login: false,
	editor: false,
	registered: false,
	inserter: false,
	canvasIcons: 0,
	notices: [],
};

const browser = await chromium.launch( {
	executablePath: `${ home }/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,
	args: [ '--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu' ],
} );

try {
	const context = await browser.newContext( { ignoreHTTPSErrors: true } );
	const page = await context.newPage();
	const errors = [];
	page.on( 'pageerror', ( error ) => {
		errors.push( String( error && error.message ).slice( 0, 200 ) );
	} );

	await page.goto( `${ host }/wp-login.php`, { waitUntil: 'networkidle' } );
	await page.fill( '#user_login', process.env.SNOKA_ADMIN_USER || 'admin' );
	await page.fill( '#user_pass', process.env.SNOKA_ADMIN_PASS || 'admin' );
	await Promise.all( [
		page.waitForNavigation( { waitUntil: 'networkidle', timeout: 60000 } ),
		page.click( '#wp-submit' ),
	] );
	report.login = page.url().includes( 'wp-admin' );
	if ( ! report.login ) {
		throw new Error( 'login failed' );
	}

	await page.goto(
		`${ host }/wp-admin/site-editor.php?postType=wp_template&postId=snoka-club%2F%2Ffront-page&canvas=edit`,
		{ waitUntil: 'domcontentloaded', timeout: 120000 }
	);
	await page.waitForFunction(
		() =>
			window.wp &&
			window.wp.blocks &&
			window.wp.blocks.getBlockTypes().length > 50,
		undefined,
		{ timeout: 180000 }
	);
	report.editor = true;

	report.registered = await page.evaluate( () =>
		window.wp.blocks
			.getBlockTypes()
			.some( ( b ) => b.name === 'snoka-club/icon' )
	);
	if ( ! report.registered ) {
		throw new Error( 'snoka-club/icon missing from editor registry' );
	}

	const opened = await page.evaluate( () => {
		try {
			window.wp.data.dispatch( 'core/edit-site' ).setIsInserterOpened( true );
			return true;
		} catch {
			return false;
		}
	} );
	if ( ! opened ) {
		throw new Error( 'could not open the inserter' );
	}
	await page.waitForTimeout( 3000 );
	const search = await page.waitForSelector(
		'.block-editor-inserter__search input[type="search"], .block-editor-inserter__search-input',
		{ timeout: 60000 }
	).catch( () => null );
	if ( ! search ) {
		throw new Error( 'inserter search box not found' );
	}
	await search.fill( 'Snoka Icon' );
	await page.waitForTimeout( 2500 );
	const items = await page.evaluate( () =>
		Array.from(
			document.querySelectorAll( '.block-editor-block-types-list__item-title' )
		).map( ( el ) => ( el.textContent || '' ).trim() )
	);
	report.inserter = items.includes( 'Snoka Icon' );
	if ( ! report.inserter ) {
		throw new Error( `Snoka Icon not in inserter results: ${ items.slice( 0, 10 ).join( ', ' ) }` );
	}
	await page.screenshot( { path: '/tmp/opencode/editor-inserter.png' } );

	await page.keyboard.press( 'Escape' );
	await page.waitForTimeout( 1000 );
	const frame = page
		.frames()
		.find( ( candidate ) => candidate.name() === 'editor-canvas' );
	if ( ! frame ) {
		throw new Error( 'no editor canvas frame' );
	}
	const canvas = await frame.evaluate( () => {
		const bodyText = document.body ? document.body.innerText : '';
		const unsupported = [];
		const walker = document.createTreeWalker(
			document.body,
			window.NodeFilter.SHOW_TEXT
		);
		let node = walker.nextNode();
		while ( node && unsupported.length < 5 ) {
			if ( /nclude support for (the|this)/.test( node.nodeValue || '' ) ) {
				let el = node.parentElement;
				let type = '(unknown block)';
				while ( el && el !== document.body ) {
					const dataType = el.getAttribute && el.getAttribute( 'data-type' );
					if ( dataType ) {
						type = dataType;
						break;
					}
					el = el.parentElement;
				}
				unsupported.push( type );
			}
			node = walker.nextNode();
		}
		return {
			unsupported,
			icons: document.querySelectorAll( '.wp-block-snoka-club-icon' ).length,
			svgs: document.querySelectorAll( 'svg.icon-tabler' ).length,
		};
	} );
	report.notices = canvas.unsupported;
	report.canvasIcons = canvas.icons;
	report.consoleErrors = [ ...new Set( errors ) ].slice( 0, 5 );
	if ( canvas.unsupported.length > 0 ) {
		throw new Error( `unsupported blocks on canvas: ${ canvas.unsupported.join( ', ' ) }` );
	}
	if ( canvas.icons < 4 ) {
		throw new Error( `expected 4 rendered icons, found ${ canvas.icons }` );
	}
	if ( report.consoleErrors.length > 0 ) {
		console.log( `console errors: ${ JSON.stringify( report.consoleErrors ) }` );
	}
	console.log( JSON.stringify( report ) );
} catch ( error ) {
	report.message = String( ( error && error.message ) || error ).slice( 0, 300 );
	console.log( JSON.stringify( report ) );
	process.exit( 2 );
} finally {
	await browser.close();
}
