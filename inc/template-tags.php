<?php
/**
 * Template tags: small, escaped helpers for templates and patterns.
 *
 * @package Snoka_Club
 */

declare(strict_types=1);

defined( 'ABSPATH' ) || exit;

/**
 * Render a linked post author byline (escaped).
 */
function snoka_club_byline(): void {
	printf(
		'<span class="wp-block-post-author">%s <a href="%s" rel="author">%s</a></span>',
		esc_html__( 'By', 'snoka-club' ),
		esc_url( get_author_posts_url( (int) get_the_author_meta( 'ID' ) ) ),
		esc_html( get_the_author() )
	);
}

/**
 * Render the copyright line used by footer parts.
 */
function snoka_club_copyright(): void {
	printf(
		/* translators: %1$s: year, %2$s: site name. */
		esc_html__( '© %1$s %2$s. All rights reserved.', 'snoka-club' ),
		esc_html( gmdate( 'Y' ) ),
		esc_html( get_bloginfo( 'name' ) )
	);
}
