/**
 * Frontend smoke: front page + portal return 200 with the expected mounts.
 *
 * Usage: pnpm check:front
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const host =
	process.env.SNOKA_SANDBOX_URL || 'https://snoka-access-sandbox.ddev.site';

const failures = [];
async function check( path, markers, label ) {
	const res = await fetch( `${ host }${ path }` );
	if ( ! res.ok ) {
		failures.push( `${ label } HTTP ${ res.status }` );
		return;
	}
	const html = await res.text();
	for ( const marker of markers ) {
		if ( ! html.includes( marker ) ) {
			failures.push( `${ label } missing: ${ marker }` );
		}
	}
	console.log( `ok  ${ label } 200` );
}

await check( '/', [ 'wp-block-snoka-club-icon', 'data-island="toasts"' ], 'front' );
await check( '/portal/', [ 'snoka-access-root' ], 'portal' );

if ( failures.length > 0 ) {
	console.error( 'check:front FAILED:' );
	for ( const failure of failures ) {
		console.error( `  ${ failure }` );
	}
	process.exit( 1 );
}
console.log( 'check:front: frontend serves theme + portal' );
