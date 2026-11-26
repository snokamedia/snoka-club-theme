<?php
/**
 * Block editor support: pattern categories, block styles, inserter curation.
 *
 * @package Snoka_Club
 */

declare(strict_types=1);

defined( 'ABSPATH' ) || exit;

/**
 * Register Snoka pattern categories before patterns register.
 */
function snoka_club_pattern_categories(): void {
	$categories = array(
		'snoka-hero'    => __( 'Snoka Heroes', 'snoka-club' ),
		'snoka-cta'     => __( 'Snoka Calls to Action', 'snoka-club' ),
		'snoka-cards'   => __( 'Snoka Cards & Lists', 'snoka-club' ),
		'snoka-content' => __( 'Snoka Content Sections', 'snoka-club' ),
		'snoka-events'  => __( 'Snoka Events & Schedules', 'snoka-club' ),
		'snoka-pricing' => __( 'Snoka Pricing', 'snoka-club' ),
		'snoka-layout'  => __( 'Snoka Layout Primitives', 'snoka-club' ),
	);

	foreach ( $categories as $slug => $label ) {
		if ( WP_Block_Pattern_Categories_Registry::get_instance()->is_registered( $slug ) ) {
			continue;
		}
		register_block_pattern_category( $slug, array( 'label' => $label ) );
	}
}
add_action( 'init', 'snoka_club_pattern_categories', 5 );

/**
 * Register theme block styles (card variant for Group, etc.).
 */
function snoka_club_block_styles(): void {
	register_block_style(
		'core/group',
		array(
			'name'  => 'snoka-card',
			'label' => __( 'Snoka Card', 'snoka-club' ),
		)
	);

	register_block_style(
		'core/columns',
		array(
			'name'  => 'snoka-cards-gap',
			'label' => __( 'Snoka Cards Gap', 'snoka-club' ),
		)
	);

	register_block_style(
		'core/button',
		array(
			'name'  => 'snoka-outline-light',
			'label' => __( 'Snoka Outline (Light)', 'snoka-club' ),
		)
	);
}
add_action( 'init', 'snoka_club_block_styles' );

/**
 * Enqueue block-style CSS for Group card + button state coverage.
 *
 * Two theme.json gaps are closed here with real-specificity rules
 * (element :hover/:focus compiles to :where(), i.e. zero specificity):
 * the snoka-outline-light variant ships no hover at all, and any button
 * with custom color utilities keeps its colors on hover/focus because
 * .has-*-background-color outranks the element styles.
 */
function snoka_club_block_style_css(): void {
	$css = <<<'CSS'
	.is-style-snoka-card {
		border-radius: var(--wp--preset--border-radius--medium);
		box-shadow: var(--wp--preset--shadow--natural);
		padding: var(--wp--preset--spacing--40);
		background: var(--wp--preset--color--base);
	}
	.is-style-snoka-cards-gap {
		gap: var(--wp--preset--spacing--40);
	}
	.is-style-snoka-outline-light .wp-block-button__link {
		border: 2px solid var(--wp--preset--color--base);
		color: var(--wp--preset--color--base);
		background: transparent;
	}
	.wp-block-button__link {
		transition: filter 0.2s ease;
	}
	/* Outline-light hover/focus: fill with base, flip text to contrast. */
	.is-style-snoka-outline-light .wp-block-button__link:hover,
	.is-style-snoka-outline-light .wp-block-button__link:focus-visible {
		background: var(--wp--preset--color--base);
		color: var(--wp--preset--color--contrast);
	}
	/* Custom-color buttons: shade on hover/focus so the state reads
	   regardless of the chosen colors. Plain buttons keep the
	   theme.json primary-to-contrast swap. */
	.wp-block-button__link.has-background:hover,
	.wp-block-button__link.has-background:focus-visible {
		filter: brightness(0.93);
	}
	/* Press feedback, paired per branch so :active wins over :hover. */
	.wp-block-button__link.has-background:active {
		filter: brightness(0.85);
	}
	.wp-block-button__link:not(.has-background):active {
		filter: brightness(0.9);
	}
	.is-style-snoka-outline-light .wp-block-button__link:active {
		filter: brightness(0.92);
	}
	/* Keep the 8px button radius under keyboard focus: the global
	   :focus-visible rule would otherwise square buttons to 2px. */
	a.wp-block-button__link:focus-visible {
		border-radius: var(--wp--preset--border-radius--medium);
	}
	@media (prefers-reduced-motion: reduce) {
		.wp-block-button__link {
			transition: none;
		}
	}
	CSS;

	wp_add_inline_style( 'snoka-club-style', $css );
	wp_add_inline_style( 'wp-block-library', $css );
}
add_action( 'wp_enqueue_scripts', 'snoka_club_block_style_css', 20 );
add_action( 'enqueue_block_editor_assets', 'snoka_club_block_style_css', 20 );

/**
 * Curate the inserter: hide core patterns that clash with the Snoka system.
 * Theme patterns remain the primary building blocks for AI builders.
 */
function snoka_club_curate_patterns(): void {
	remove_theme_support( 'core-block-patterns' );
}
add_action( 'after_setup_theme', 'snoka_club_curate_patterns' );
