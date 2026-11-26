<?php
/**
 * REST extras: keep the theme's content model AI-builder friendly.
 *
 * CPTs themselves are registered by Snoka plugins, never by this theme.
 * This file only ensures theme-relevant core surface is REST-visible and
 * gives plugins a single helper to expose meta the theme renders.
 *
 * @package Snoka_Club
 */

declare(strict_types=1);

defined( 'ABSPATH' ) || exit;

/**
 * Expose a post meta key to the REST API with a sane schema.
 *
 * Thin wrapper so Snoka plugins register theme-rendered meta consistently.
 *
 * @param string $post_type Post type slug.
 * @param string $meta_key  Meta key.
 * @param string $type      REST type: string|boolean|integer|number|array|object.
 */
function snoka_club_register_meta( string $post_type, string $meta_key, string $type = 'string' ): void {
	register_post_meta(
		$post_type,
		$meta_key,
		array(
			'show_in_rest'  => true,
			'single'        => true,
			'type'          => $type,
			'auth_callback' => static function () {
				return current_user_can( 'edit_posts' );
			},
		)
	);
}

/**
 * Ensure featured media and excerpts stay REST-visible for headless/AI use.
 *
 * @param array<string,mixed> $args      Post type registration args.
 * @param string              $post_type Post type slug.
 * @return array<string,mixed>
 */
function snoka_club_rest_visibility( array $args, string $post_type ): array {
	if ( 'page' === $post_type || 'post' === $post_type ) {
		$args['show_in_rest'] = true;
	}

	return $args;
}
add_filter( 'register_post_type_args', 'snoka_club_rest_visibility', 20, 2 );
