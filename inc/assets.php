<?php
/**
 * Vite manifest-driven asset loader.
 *
 * Reads dist/.vite/manifest.json once per request (static-cached) and
 * enqueues hashed entry files. Entries:
 * - main: vanilla globals, every frontend page.
 * - transitions: swup, every frontend page except the customizer preview.
 * - islands: single React entry, deferred, every frontend page.
 * - views: swup-aware on-demand view loader, every frontend page
 *   except the customizer preview.
 *
 * Never loaded in wp-admin or the block editor. The snoka-access portal
 * (/portal/*) is excluded from swup client-side in transitions.ts; the files
 * may still load there harmlessly (they self-gate on the container).
 *
 * @package Snoka_Club
 */

declare(strict_types=1);

defined( 'ABSPATH' ) || exit;

/**
 * Read the Vite manifest (static-cached).
 *
 * @return array<string, array{file: string, css?: string[]}>
 */
function snoka_club_manifest(): array {
	static $manifest = null;

	if ( is_array( $manifest ) ) {
		return $manifest;
	}

	$path = get_template_directory() . '/dist/.vite/manifest.json';
	if ( ! is_readable( $path ) ) {
		$manifest = array();
		return $manifest;
	}

	$decoded  = json_decode( (string) file_get_contents( $path ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
	$manifest = is_array( $decoded ) ? $decoded : array();
	return $manifest;
}

/**
 * Resolve a Vite entry to its built JS + CSS URLs.
 *
 * @param string $entry Manifest key, e.g. 'src/main.ts'.
 * @return array{js: string, css: string[]}
 */
function snoka_club_entry( string $entry ): array {
	$manifest = snoka_club_manifest();
	$base     = get_theme_file_uri( 'dist/' );

	if ( ! isset( $manifest[ $entry ]['file'] ) ) {
		return array(
			'js'  => '',
			'css' => array(),
		);
	}

	$css = array();
	foreach ( (array) ( $manifest[ $entry ]['css'] ?? array() ) as $file ) {
		$css[] = $base . ltrim( (string) $file, '/' );
	}

	return array(
		'js'  => $base . ltrim( (string) $manifest[ $entry ]['file'], '/' ),
		'css' => $css,
	);
}

/**
 * Enqueue the global + islands bundles.
 *
 * @param bool $editor Whether the editor canvas is the target. When true,
 *                     only stylesheets load (no scripts, no islands runtime).
 */
function snoka_club_enqueue_frontend( bool $editor = false ): void {
	if ( is_admin() && ! $editor ) {
		return;
	}

	foreach ( array(
		'main'    => 'src/main.ts',
		'islands' => 'src/islands.tsx',
	) as $handle => $entry ) {
		$asset = snoka_club_entry( $entry );
		if ( '' === $asset['js'] ) {
			continue;
		}

		$name = 'snoka-club-' . $handle;

		if ( ! $editor ) {
			wp_enqueue_script(
				$name,
				$asset['js'],
				array(),
				SNOKA_CLUB_VERSION,
				array(
					'in_footer' => true,
					'strategy'  => 'defer',
				)
			);
		}

		foreach ( $asset['css'] as $i => $css_url ) {
			wp_enqueue_style( $name . '-style-' . $i, $css_url, array(), SNOKA_CLUB_VERSION );
		}
	}
}
add_action( 'wp_enqueue_scripts', 'snoka_club_enqueue_frontend' );

/**
 * Editor canvas parity: load the same theme stylesheets (tokens, mesh,
 * cards, link contexts, fonts) inside the block editor so it matches the
 * frontend. Scripts and the islands runtime stay frontend-only.
 */
function snoka_club_enqueue_editor(): void {
	snoka_club_enqueue_frontend( true );
}
add_action( 'enqueue_block_editor_assets', 'snoka_club_enqueue_editor' );

/**
 * Enqueue swup transitions (frontend only, never the customizer preview).
 */
function snoka_club_enqueue_transitions(): void {
	if ( is_admin() || is_customize_preview() ) {
		return;
	}

	$asset = snoka_club_entry( 'src/transitions.ts' );
	if ( '' === $asset['js'] ) {
		return;
	}

	wp_enqueue_script(
		'snoka-club-transitions',
		$asset['js'],
		array(),
		SNOKA_CLUB_VERSION,
		array(
			'in_footer' => true,
			'strategy'  => 'defer',
		)
	);

	foreach ( $asset['css'] as $i => $css_url ) {
		wp_enqueue_style( 'snoka-club-transitions-style-' . $i, $css_url, array(), SNOKA_CLUB_VERSION );
	}
}
add_action( 'wp_enqueue_scripts', 'snoka_club_enqueue_transitions' );

/**
 * Enqueue the swup-aware on-demand view loader (frontend only, never the
 * customizer preview). Scans for [data-snoka-view] roots on load and on
 * every swup page view; views opt out of their own legacy boot when the
 * controller switch below is active.
 */
function snoka_club_enqueue_views(): void {
	if ( is_admin() || is_customize_preview() ) {
		return;
	}

	$asset = snoka_club_entry( 'src/views-controller.ts' );
	if ( '' === $asset['js'] ) {
		return;
	}

	wp_enqueue_script(
		'snoka-club-views',
		$asset['js'],
		array(),
		SNOKA_CLUB_VERSION,
		array(
			'in_footer' => true,
			'strategy'  => 'defer',
		)
	);

	foreach ( $asset['css'] as $i => $css_url ) {
		wp_enqueue_style( 'snoka-club-views-style-' . $i, $css_url, array(), SNOKA_CLUB_VERSION );
	}
}
add_action( 'wp_enqueue_scripts', 'snoka_club_enqueue_views' );

/**
 * Signal to interactive plugins that the theme-owned swup view controller
 * is active. Plugins must skip their own viewScript enqueue and
 * DOMContentLoaded self-boot when this filter returns true; the
 * controller is then the sole boot path (it also runs on initial load).
 *
 * @return bool Always true on this theme's frontend.
 */
function snoka_club_views_controller_active(): bool {
	return true;
}
add_filter( 'snoka_swup_controller_active', 'snoka_club_views_controller_active' );

/**
 * Load theme bundles as ES modules.
 *
 * @param string $tag    Script tag.
 * @param string $handle Script handle.
 * @return string
 */
function snoka_club_module_tag( string $tag, string $handle ): string {
	if ( 0 !== strpos( $handle, 'snoka-club-' ) ) {
		return $tag;
	}

	return (string) preg_replace( '/<script\b/', '<script type="module"', $tag, 1 );
}
add_filter( 'script_loader_tag', 'snoka_club_module_tag', 10, 2 );
