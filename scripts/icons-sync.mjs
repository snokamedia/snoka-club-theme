/**
 * Sync the PHP icon allowlist with Tabler outline SVGs.
 *
 * Reads icon names from inc/icons.php (single source of truth), copies
 * node_modules/@tabler/icons/icons/outline/<name>.svg into assets/icons/,
 * and fails loudly on any missing name so the allowlist never drifts.
 *
 * OUTPUT SCOPE: these files feed snoka_club_icon() ONLY. They are
 * stroke chrome and MUST NOT be passed to wp_register_icon() — the 7.1.4
 * icon sanitizer strips stroke and the glyph renders wrong. Registry-bound
 * icons must be fill-based; see DESIGN-METHODS.md §4. This script never
 * writes to any registry; it copies files.
 *
 * Usage: pnpm icons:sync
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join( dirname( fileURLToPath( import.meta.url ) ), '..' );
const php = readFileSync( join( root, 'inc', 'icons.php' ), 'utf8' );
const names = [ ...php.matchAll( /^\t\t'([a-z0-9-]+)',/gm ) ].map(
	( match ) => match[ 1 ]
);

if ( names.length === 0 ) {
	console.error( 'icons:sync: no names parsed from inc/icons.php' );
	process.exit( 1 );
}

const fromDir = join(
	root,
	'node_modules',
	'@tabler',
	'icons',
	'icons',
	'outline'
);
const toDir = join( root, 'assets', 'icons' );
mkdirSync( toDir, { recursive: true } );

let missing = 0;
for ( const name of names ) {
	const from = join( fromDir, `${ name }.svg` );
	if ( ! existsSync( from ) ) {
		console.error( `icons:sync: MISSING ${ name }` );
		missing += 1;
		continue;
	}
	copyFileSync( from, join( toDir, `${ name }.svg` ) );
}

console.log( `icons:sync: ${ names.length - missing }/${ names.length } synced` );
if ( missing > 0 ) {
	process.exit( 1 );
}
