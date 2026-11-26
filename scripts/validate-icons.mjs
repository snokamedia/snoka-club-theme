/**
 * Name check for wp:icon usage (first slice of pnpm validate-blocks).
 *
 * Dynamic Icon blocks store a comment, not SVG, so the check is names, not
 * markup: collect every `"icon":"collection/name"` from templates, parts,
 * and pattern sources, and fail on any name outside the sandbox-verified
 * core list (scripts/core-icon-names.json) or the theme collection
 * (scripts/theme-icon-names.json, currently empty — no snoka-club/*
 * icons are registered until fill-safe gap icons exist; see
 * DESIGN-METHODS.md §4).
 *
 * Usage: pnpm validate:icons
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join( dirname( fileURLToPath( import.meta.url ) ), '..' );

function collect( dir ) {
	let out = [];
	for ( const entry of readdirSync( dir ) ) {
		const full = join( dir, entry );
		if ( statSync( full ).isDirectory() ) {
			out = out.concat( collect( full ) );
			continue;
		}
		if ( /\.(html|php)$/.test( entry ) ) {
			out.push( full );
		}
	}
	return out;
}

const allowed = new Set( [
	...JSON.parse(
		readFileSync( join( root, 'scripts', 'core-icon-names.json' ), 'utf8' )
	),
	...JSON.parse(
		readFileSync( join( root, 'scripts', 'theme-icon-names.json' ), 'utf8' )
	),
] );

// Helper allowlist (single source of truth, same parse as icons-sync).
const helperPhp = readFileSync( join( root, 'inc', 'icons.php' ), 'utf8' );
const helperAllowed = new Set(
	[ ...helperPhp.matchAll( /^\t\t'([a-z0-9-]+)',/gm ) ].map(
		( match ) => match[ 1 ]
	)
);

const files = [
	...collect( join( root, 'templates' ) ),
	...collect( join( root, 'parts' ) ),
	...collect( join( root, 'patterns' ) ),
];

const found = new Map();
let failed = 0;
for ( const file of files ) {
	const text = readFileSync( file, 'utf8' );
	// Static block comments: <!-- wp:icon {"icon":"core/bell"} /-->.
	// Skip comments whose value is PHP (resolved names come from the
	// 'icon' => 'name' array entries collected below).
	for ( const match of text.matchAll( /"icon"\s*:\s*"([^"<>?]+)"/g ) ) {
		const name = match[ 1 ].trim();
		if ( ! name || name.includes( '<?php' ) ) {
			continue;
		}
		// Feature-block custom cards carry their icon in a single-line
		// snoka-media/feature-block delimiter. Those names live in the Snoka
		// collection, whose theme-curated subset is the helper allowlist —
		// same source of truth as the static icon blocks below.
		const lineStart = text.lastIndexOf( '\n', match.index ) + 1;
		const lineEnd = text.indexOf( '\n', match.index );
		const line = text.slice(
			lineStart,
			lineEnd === -1 ? undefined : lineEnd
		);
		const prefix = line.includes( 'snoka-media' ) ? 'snoka:' : '';
		const key = `${ prefix }${ name }`;
		if ( ! found.has( key ) ) {
			found.set( key, [] );
		}
		if ( prefix === 'snoka:' ) {
			if ( ! helperAllowed.has( name ) ) {
				failed += 1;
				console.error( `FAIL feature-block icon not in Snoka subset: ${ name }` );
				console.error(
					`      ${ file.replace( root + '/', '' ) }`
				);
				continue;
			}
			found.get( key ).push( file.replace( root + '/', '' ) );
			continue;
		}
		found.get( key ).push( file.replace( root + '/', '' ) );
	}
	// PHP pattern data for the stroke helper: 'icon' => 'bell'.
	// Validated against the helper allowlist, not the registry.
	for ( const match of text.matchAll( /'icon'\s*=>\s*'([^']+)'/g ) ) {
		const name = match[ 1 ].trim();
		const key = `helper:${ name }`;
		if ( ! found.has( key ) ) {
			found.set( key, [] );
		}
		if ( ! helperAllowed.has( name ) ) {
			failed += 1;
			console.error( `FAIL helper icon not allowlisted: ${ name }` );
			console.error(
				`      ${ file.replace( root + '/', '' ) }`
			);
			continue;
		}
		found.get( key ).push( file.replace( root + '/', '' ) );
	}
	// Static theme icon blocks: <!-- wp:snoka-club/icon {"name":"bell"} /-->.
	// Same allowlist as the PHP helper — the comment is static, the source
	// of truth stays inc/icons.php.
	for ( const match of text.matchAll( /wp:snoka-club\/icon\s*(\{[^}]*\})/g ) ) {
		const nameMatch = /"name"\s*:\s*"([^"]+)"/.exec( match[ 1 ] );
		if ( ! nameMatch || nameMatch[ 1 ].includes( '<?php' ) ) {
			continue;
		}
		const name = nameMatch[ 1 ].trim();
		const key = `helper:${ name }`;
		if ( ! found.has( key ) ) {
			found.set( key, [] );
		}
		if ( ! helperAllowed.has( name ) ) {
			failed += 1;
			console.error( `icon block with unallowlisted name: ${ name }` );
			console.error(
				`      ${ file.replace( root + '/', '' ) }`
			);
			continue;
		}
		found.get( key ).push( file.replace( root + '/', '' ) );
	}
}

for ( const [ name, locations ] of found ) {
	if ( name.startsWith( 'helper:' ) || name.startsWith( 'snoka:' ) ) {
		console.log( `ok  ${ name } (${ locations.length } use(s))` );
		continue;
	}
	if ( allowed.has( name ) ) {
		console.log( `ok  ${ name } (${ locations.length } use(s))` );
		continue;
	}
	failed += 1;
	console.error( `FAIL ${ name } not in a verified collection:` );
	for ( const location of locations ) {
		console.error( `      ${ location }` );
	}
}

if ( found.size === 0 ) {
	console.log( 'ok  no wp:icon usages found (registry untouched this change)' );
}
process.exit( failed > 0 ? 1 : 0 );
