<?php
/**
 * Performance layer: speculative loading tuning, self-hosted font preload,
 * and light frontend hints.
 *
 * Fonts are self-hosted woff2 (Archivo + Inter, latin subsets, ~100 KB
 * total) referenced from src/fonts.css via stable theme URLs. The two
 * critical files (body 400 + heading 700) are preloaded below;
 * font-display:swap covers the rest.
 *
 * @package Snoka_Club
 */

declare(strict_types=1);

defined( 'ABSPATH' ) || exit;

/**
 * Tune speculative loading: prerender key paths eagerly, opt out of
 * non-idempotent routes (cart, checkout, dynamic forms).
 *
 * @param array<string,mixed>|null $config Core speculation rules config.
 * @return array<string,mixed>|null
 */
function snoka_club_speculation_rules( $config ): ?array {
	if ( ! is_array( $config ) ) {
		return $config;
	}

	$config['mode']      = 'prerender';
	$config['eagerness'] = 'moderate';

	return $config;
}
add_filter( 'wp_speculation_rules_configuration', 'snoka_club_speculation_rules' );

/**
 * Exclude non-idempotent paths from speculation.
 *
 * @param string[] $paths Excluded paths.
 * @param string   $mode  Speculation mode.
 * @return string[]
 */
function snoka_club_speculation_excludes( array $paths, string $mode ): array {
	unset( $mode );

	return array_merge(
		$paths,
		array(
			'/portal/*',
			'/cart/*',
			'/checkout/*',
			'/my-account/*',
			'/wp-admin/*',
		)
	);
}
add_filter( 'wp_speculation_rules_href_exclude_paths', 'snoka_club_speculation_excludes', 10, 2 );

/**
 * Preload the two critical font files (body 400 + heading 700).
 * Remaining weights load via font-display:swap without blocking.
 */
function snoka_club_preload_fonts(): void {
	if ( is_admin() ) {
		return;
	}

	foreach ( array( 'inter-latin-400.woff2', 'archivo-latin-700.woff2' ) as $file ) {
		printf(
			'<link rel="preload" href="%s" as="font" type="font/woff2" crossorigin>' . "\n",
			esc_url( get_theme_file_uri( 'assets/fonts/' . $file ) )
		);
	}
}
add_action( 'wp_head', 'snoka_club_preload_fonts', 1 );
