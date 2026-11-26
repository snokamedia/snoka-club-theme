<?php
/**
 * Content types inherited from the club's previous theme.
 *
 * The `gallery` post type backs years of photo galleries (single views and
 * the /gallery/ archive). It was registered by the retired GeneratePress
 * child theme, so the block theme owns it now to keep those URLs alive.
 *
 * @package Snoka_Club
 */

declare(strict_types=1);

defined( 'ABSPATH' ) || exit;

/**
 * Register the public Gallery post type.
 */
function snoka_club_register_gallery_post_type(): void {
	register_post_type(
		'gallery',
		array(
			'labels'       => array(
				'name'          => __( 'Galleries', 'snoka-club' ),
				'singular_name' => __( 'Gallery', 'snoka-club' ),
				'add_new_item'  => __( 'Add New Gallery', 'snoka-club' ),
				'edit_item'     => __( 'Edit Gallery', 'snoka-club' ),
				'new_item'      => __( 'New Gallery', 'snoka-club' ),
				'view_item'     => __( 'View Gallery', 'snoka-club' ),
				'search_items'  => __( 'Search Galleries', 'snoka-club' ),
				'not_found'     => __( 'No galleries found', 'snoka-club' ),
				'all_items'     => __( 'All Galleries', 'snoka-club' ),
			),
			'public'       => true,
			'has_archive'  => true,
			'rewrite'      => array( 'slug' => 'gallery' ),
			'show_in_rest' => true,
			'supports'     => array( 'title', 'editor', 'thumbnail', 'excerpt', 'custom-fields', 'revisions' ),
			'menu_icon'    => 'dashicons-format-gallery',
		)
	);
}
add_action( 'init', 'snoka_club_register_gallery_post_type' );

/**
 * Title the gallery archive "Galleries".
 *
 * @param string $title Archive title.
 */
function snoka_club_gallery_archive_title( string $title ): string {
	if ( is_post_type_archive( 'gallery' ) ) {
		return __( 'Galleries', 'snoka-club' );
	}
	return $title;
}
add_filter( 'get_the_archive_title', 'snoka_club_gallery_archive_title' );
