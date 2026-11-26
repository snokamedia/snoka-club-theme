/**
 * Runs scripts/smoke-wp.php inside the DDEV sandbox.
 * Skips with a warning (exit 2) when the sandbox is unreachable —
 * that is an environment problem, not a product failure.
 *
 * Usage: pnpm smoke:wp
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join( dirname( fileURLToPath( import.meta.url ) ), '..' );
const sandbox =
	process.env.SNOKA_SANDBOX_DIR ||
	join( root, '..', '..', 'sites', 'snoka-access-sandbox' );

if ( ! existsSync( join( sandbox, '.ddev', 'config.yaml' ) ) ) {
	console.log( `smoke:wp SKIPPED (no DDEV project at ${ sandbox })` );
	process.exit( 2 );
}

try {
	const out = execFileSync(
		'ddev',
		[
			'exec',
			'--raw',
			'wp',
			'eval-file',
			'wp-content/themes/snoka-club/scripts/smoke-wp.php',
			'--allow-root',
		],
		{ cwd: sandbox, encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'pipe' ] }
	);
	console.log( out.trim() );
	console.log( 'smoke:wp: WordPress-side assertions hold' );
} catch ( error ) {
	console.error( 'smoke:wp FAILED' );
	process.exit( 1 );
}
