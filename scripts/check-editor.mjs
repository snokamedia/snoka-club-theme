/**
 * Editor-side proof: log into the sandbox, load the Site Editor, and confirm
 * the block is supported where the user actually works — registered in the
 * editor bootstrap AND its editor script downloads 200.
 *
 * This is the gate that catches "works in eval, unknown in the editor".
 * Needs a sandbox admin login (env SNOKA_ADMIN_USER / SNOKA_ADMIN_PASS,
 * default admin/admin per the sandbox blueprint). Exits 2 on auth/network
 * trouble (environment, not product), 1 on a real failure.
 *
 * Usage: pnpm check:editor
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const host =
	process.env.SNOKA_SANDBOX_URL || 'https://snoka-access-sandbox.ddev.site';
const user = process.env.SNOKA_ADMIN_USER || 'admin';
const pass = process.env.SNOKA_ADMIN_PASS || 'admin';

let jar = '';
function storeCookies( res ) {
	const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
	for ( const line of raw ) {
		jar += ( jar ? '; ' : '' ) + line.split( ';' )[ 0 ];
	}
}
function headers( extra = {} ) {
	return {
		...( jar ? { cookie: jar } : {} ),
		...extra,
	};
}

const loginRes = await fetch( `${ host }/wp-login.php`, {
	method: 'POST',
	redirect: 'manual',
	headers: { 'content-type': 'application/x-www-form-urlencoded' },
	body: new URLSearchParams( {
		log: user,
		pwd: pass,
		'wp-submit': 'Log In',
		testcookie: '1',
	} ).toString(),
} );
storeCookies( loginRes );
const loggedIn = /wordpress_logged_in_/.test( jar );
if ( ! loggedIn ) {
	console.error(
		`check:editor SKIPPED — login failed (HTTP ${ loginRes.status }); set SNOKA_ADMIN_USER/SNOKA_ADMIN_PASS`
	);
	process.exit( 2 );
}

const editorRes = await fetch( `${ host }/wp-admin/site-editor.php`, {
	headers: headers(),
} );
if ( ! editorRes.ok ) {
	console.error(
		`check:editor SKIPPED — site editor unreachable (HTTP ${ editorRes.status })`
	);
	process.exit( 2 );
}
const editorHtml = await editorRes.text();

const failures = [];
if ( ! editorHtml.includes( 'snoka-club/icon' ) ) {
	failures.push( 'block missing from editor bootstrap' );
}
const scriptMatch = editorHtml.match(
	/snoka-club-icon-block-js" src="([^"]+)"/
);
if ( ! scriptMatch ) {
	failures.push( 'editor script tag missing from editor page' );
} else {
	const scriptRes = await fetch( scriptMatch[ 1 ], {
		headers: headers(),
	} );
	if ( ! scriptRes.ok ) {
		failures.push( `editor script HTTP ${ scriptRes.status }` );
	} else {
		console.log( `ok  editor script 200 (${ scriptMatch[ 1 ].split( '/dist/' )[ 1 ] })` );
	}
}

if ( failures.length > 0 ) {
	console.error( 'check:editor FAILED:' );
	for ( const failure of failures ) {
		console.error( `  ${ failure }` );
	}
	process.exit( 1 );
}
console.log( 'check:editor: icon block supported in the Site Editor' );
