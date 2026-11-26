/**
 * Block validation harness (answers "recover all over the place" with data).
 *
 * Parses every template, part, and *rendered* pattern with the real core
 * block library and reports any block whose saved markup does not validate
 * (what the Site Editor flags for recovery) or whose type is unknown.
 *
 * Patterns contain PHP, so they are rendered through WordPress first
 * (requires the DDEV sandbox; override with SNOKA_SANDBOX_DIR). Static
 * templates/parts validate without it — if the sandbox is unreachable the
 * pattern half is skipped with a warning, never silently passed.
 *
 * Usage: pnpm validate:blocks
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const root = join( dirname( fileURLToPath( import.meta.url ) ), '..' );
const sandbox =
	process.env.SNOKA_SANDBOX_DIR ||
	join( root, '..', '..', 'sites', 'snoka-access-sandbox' );

const dom = new JSDOM( '', { url: 'https://example.invalid/' } );
function setGlobal( name, value ) {
	try {
		globalThis[ name ] = value;
	} catch {
		Object.defineProperty( globalThis, name, {
			value,
			configurable: true,
			writable: true,
		} );
	}
}
setGlobal( 'window', dom.window );
setGlobal( 'document', dom.window.document );
setGlobal( 'navigator', dom.window.navigator );
setGlobal( 'self', dom.window );
setGlobal( 'HTMLElement', dom.window.HTMLElement );
setGlobal( 'Element', dom.window.Element );
setGlobal( 'Node', dom.window.Node );
setGlobal( 'MutationObserver', dom.window.MutationObserver );
setGlobal( 'getComputedStyle', dom.window.getComputedStyle.bind( dom.window ) );

const { createRequire } = await import( 'node:module' );
const require = createRequire( import.meta.url );
const { parse, getBlockType, serialize, registerBlockType } = require( '@wordpress/blocks' );
const { registerCoreBlocks } = require( '@wordpress/block-library' );
registerCoreBlocks();

// Theme-owned dynamic blocks render server-side (save: null), so they
// cannot drift. The harness registers the shape, not the editor UI.
try {
	registerBlockType( 'snoka-club/icon', {
		title: 'Snoka Icon',
		category: 'media',
		attributes: {
			name: { type: 'string' },
		},
		save: () => null,
	} );
} catch ( error ) {
	console.log( `custom type skipped: ${ error.message }` );
}

function collectHtml( dir ) {
	let out = [];
	for ( const entry of readdirSync( dir ) ) {
		const full = join( dir, entry );
		if ( statSync( full ).isDirectory() ) {
			out = out.concat( collectHtml( full ) );
			continue;
		}
		if ( entry.endsWith( '.html' ) ) {
			out.push( full );
		}
	}
	return out;
}

function walk( blocks, file, issues ) {
	for ( const block of blocks ) {
		if ( ! getBlockType( block.name ) ) {
			issues.push( {
				file: file.replace( root + '/', '' ),
				name: block.name,
				problem: 'unregistered block type',
				snippet: ( block.originalContent || '' ).slice( 0, 160 ),
			} );
		} else if ( block.isValid === false ) {
			let expected = '';
			try {
				expected = serialize( {
					...block,
					innerBlocks: block.innerBlocks || [],
				} );
			} catch {
				expected = '(could not re-serialize)';
			}
			issues.push( {
				file: file.replace( root + '/', '' ),
				name: block.name,
				problem: 'invalid markup (editor would ask for recovery)',
				snippet: ( block.originalContent || '' ).slice( 0, 400 ),
				expected: expected.slice( 0, 400 ),
			} );
		}
		if ( block.innerBlocks && block.innerBlocks.length > 0 ) {
			walk( block.innerBlocks, file, issues );
		}
	}
}

const issues = [];
let checked = 0;

for ( const file of [
	...collectHtml( join( root, 'templates' ) ),
	...collectHtml( join( root, 'parts' ) ),
] ) {
	const content = readFileSync( file, 'utf8' );
	checked += 1;
	try {
		walk( parse( content ), file, issues );
	} catch ( error ) {
		issues.push( {
			file: file.replace( root + '/', '' ),
			name: '(parse)',
			problem: `parser threw: ${ error.message }`,
			snippet: '',
		} );
	}
}
console.log( `static templates/parts: ${ checked } files parsed` );

// Rendered patterns via the sandbox.
let rendered = 0;
try {
	if ( ! existsSync( join( sandbox, '.ddev', 'config.yaml' ) ) ) {
		throw new Error( `no DDEV project at ${ sandbox }` );
	}
	const json = execFileSync(
		'ddev',
		[
			'exec',
			'--raw',
			'wp',
			'eval-file',
			'wp-content/themes/snoka-club/scripts/render-patterns.php',
			'--allow-root',
		],
		{ cwd: sandbox, encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'pipe' ] }
	);
	const patterns = JSON.parse( json );
	for ( const [ file, html ] of Object.entries( patterns ) ) {
		rendered += 1;
		try {
			walk( parse( html ), `patterns/${ file } (rendered)`, issues );
		} catch ( error ) {
			issues.push( {
				file: `patterns/${ file } (rendered)`,
				name: '(parse)',
				problem: `parser threw: ${ error.message }`,
				snippet: '',
			} );
		}
	}
	console.log( `rendered patterns: ${ rendered } validated` );
} catch ( error ) {
	console.log( `patterns SKIPPED (${ error.message.split( '\n' )[ 0 ] })` );
}

if ( issues.length === 0 ) {
	console.log( 'validate:blocks: CLEAN — no invalid blocks' );
	process.exit( rendered === 0 ? 2 : 0 );
}

console.log( `\nvalidate:blocks: ${ issues.length } problem(s):\n` );
for ( const issue of issues ) {
	console.log( `- ${ issue.file}\n  ${ issue.name}: ${ issue.problem }` );
	if ( issue.snippet ) {
		console.log( `  actual:   ${ issue.snippet.replace( /\n/g, ' ' ) }` );
	}
	if ( issue.expected ) {
		console.log( `  expected: ${ issue.expected.replace( /\n/g, ' ' ) }` );
	}
}
process.exit( 1 );
