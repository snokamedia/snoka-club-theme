/**
 * Runtime smoke test: executes the built islands bundle in jsdom and fails
 * on any render error. tsc + vite + eslint never run the code — this does.
 * Catches Base UI context mistakes, bad imports, and mount failures that
 * only explode in a browser (e.g. production error #73).
 *
 * Usage: pnpm smoke:runtime
 */
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.NODE_ENV = 'development';

const root = join( dirname( fileURLToPath( import.meta.url ) ), '..' );
const manifest = JSON.parse(
	readFileSync( join( root, 'dist', '.vite', 'manifest.json' ), 'utf8' )
);
const entry = manifest[ 'src/islands.tsx' ];
if ( ! entry || ! entry.file ) {
	console.error( 'smoke:runtime FAIL — islands entry missing from manifest' );
	process.exit( 1 );
}

const dom = new JSDOM(
	'<!doctype html><html><body><div data-island="emergency-dialog"></div><div data-island="toasts"></div></body></html>',
	{ url: 'https://example.invalid/' }
);
for ( const key of [
	'window',
	'document',
	'navigator',
	'self',
	'HTMLElement',
	'Element',
	'Node',
	'MutationObserver',
	'getComputedStyle',
	'requestAnimationFrame',
	'cancelAnimationFrame',
] ) {
	try {
		globalThis[ key ] =
			key === 'getComputedStyle'
				? dom.window.getComputedStyle.bind( dom.window )
				: dom.window[ key ];
	} catch {
		Object.defineProperty( globalThis, key, {
			value: dom.window[ key ],
			configurable: true,
			writable: true,
		} );
	}
}

const errors = [];
const origError = console.error;
console.error = ( ...args ) => {
	errors.push( args.map( String ).join( ' ' ) );
};
process.on( 'uncaughtException', ( error ) => {
	errors.push( `uncaught: ${ error && error.message }` );
} );

await import( join( root, 'dist', entry.file ) );
// Let React flush render + passive effects.
await new Promise( ( resolve ) => setTimeout( resolve, 500 ) );

console.error = origError;

const trigger = document.querySelector( '[data-island="emergency-dialog"] button' );
const problems = [ ...errors ];
if ( ! trigger ) {
	problems.push( 'emergency dialog trigger button did not render' );
}

if ( problems.length > 0 ) {
	console.error( 'smoke:runtime FAIL:' );
	for ( const problem of problems.slice( 0, 5 ) ) {
		console.error( `  ${ problem.slice( 0, 400 ) }` );
	}
	process.exit( 1 );
}
console.log(
	`smoke:runtime PASS — islands mounted, trigger renders ("${ trigger.textContent.trim().slice( 0, 40 ) }"), no errors`
);
