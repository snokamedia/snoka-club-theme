<?php
/**
 * Custom blocks: snoka-club/icon.
 *
 * A dynamic block — save() returns null, the server renders through the
 * allowlisted Tabler helper on every request. No save output means no
 * save-drift and no editor recovery prompts; the canvas previews the exact
 * frontend markup via ServerSideRender.
 *
 * The editor bundle externalizes every @wordpress/* module to the editor's
 * wp.* globals (see vite.blocks.config.mjs). The theme never ships its own
 * React into the editor. Frontend needs nothing: output is server-rendered.
 *
 * @package Snoka_Club
 */

declare(strict_types=1);

defined( 'ABSPATH' ) || exit;

/**
 * Read the blocks manifest (static-cached).
 *
 * @return array<string, array{file: string}>
 */
function snoka_club_blocks_manifest(): array {
	static $manifest = null;

	if ( is_array( $manifest ) ) {
		return $manifest;
	}

	$path = get_template_directory() . '/dist/manifest-blocks.json';
	if ( ! is_readable( $path ) ) {
		$manifest = array();
		return $manifest;
	}

	$decoded  = json_decode( (string) file_get_contents( $path ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
	$manifest = is_array( $decoded ) ? $decoded : array();
	return $manifest;
}

/**
 * Render callback: allowlisted Tabler glyph, decorative, inherits text color.
 *
 * @param array<string,mixed> $attributes Block attributes.
 * @return string
 */
function snoka_club_render_icon( array $attributes ): string {
	$name = $attributes['name'] ?? '';
	if ( ! is_string( $name ) || ! in_array( $name, snoka_club_icon_names(), true ) ) {
		return '';
	}

	ob_start();
	echo '<span class="wp-block-snoka-club-icon">';
	snoka_club_icon( $name, 48 );
	echo '</span>';
	return (string) ob_get_clean();
}

/**
 * Register the editor script and the dynamic block type.
 */
function snoka_club_register_icon_block(): void {
	$manifest = snoka_club_blocks_manifest();
	if ( ! isset( $manifest['src/blocks/icon/index.ts']['file'] ) ) {
		return;
	}

	$handle   = 'snoka-club-icon-block';
	$rel_path = 'dist/' . ltrim( (string) $manifest['src/blocks/icon/index.ts']['file'], '/' );
	$url      = get_theme_file_uri( $rel_path );
	$version  = (string) filemtime( get_template_directory() . '/' . $rel_path );

	wp_register_script(
		$handle,
		$url,
		array(
			'wp-blocks',
			'wp-element',
			'wp-components',
			'wp-block-editor',
			'wp-server-side-render',
			'wp-i18n',
			'react-jsx-runtime',
		),
		$version,
		array( 'in_footer' => true )
	);
	wp_set_script_translations( $handle, 'snoka-club' );
	wp_localize_script(
		$handle,
		'snokaClubIcons',
		array( 'names' => snoka_club_icon_names() )
	);

	register_block_type(
		'snoka-club/icon',
		array(
			'attributes'      => array(
				'name' => array(
					'type'    => 'string',
					'default' => 'bell',
				),
			),
			'editor_script'   => $handle,
			'render_callback' => 'snoka_club_render_icon',
		)
	);
}
add_action( 'init', 'snoka_club_register_icon_block' );
