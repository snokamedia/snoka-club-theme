<?php
/**
 * Tabler icon integration.
 *
 * Vendored Tabler outline icons (MIT, https://tabler.io/icons) live in
 * assets/icons/<name>.svg. They are stroke icons (fill="none",
 * stroke="currentColor"), so they inherit text color and are safe inside
 * WordPress admin buttons per SVG_ICONS.md.
 *
 * REGISTRY GUARDRAIL (7.1.4): this helper bypasses WP_Icons_Registry, which
 * is why stroke outlines survive here. NEVER point wp_register_icon() at
 * these files — the 7.1.4 sanitizer strips stroke/circle/rect/line/g and the
 * icon renders as a wrong filled shape. Registry-bound icons must be
 * fill-based path/polygon with fill="currentColor" on the path. See
 * DESIGN-METHODS.md §4.
 *
 * Two consumption paths:
 * - PHP templates: snoka_club_icon( 'check', 24 ) (inline, decorative).
 * - Block patterns: core/image with snoka_club_icon_url( 'check' ).
 *
 * @package Snoka_Club
 */

declare(strict_types=1);

defined( 'ABSPATH' ) || exit;

/**
 * Allowlisted Tabler icon names vendored under assets/icons/.
 *
 * @return string[]
 */
function snoka_club_icon_names(): array {
	return array(
		'alert-triangle',
		'arrow-right',
		'arrow-up-right',
		'bell',
		'briefcase',
		'building-community',
		'calendar-event',
		'check',
		'checkbox',
		'chevron-down',
		'clipboard-list',
		'clock',
		'compass',
		'files',
		'folder',
		'gift',
		'heart',
		'home',
		'lifebuoy',
		'mail',
		'map-pin',
		'menu-2',
		'palette',
		'phone',
		'plane',
		'quote',
		'rocket',
		'search',
		'shopping-bag',
		'sparkles',
		'star',
		'ticket',
		'users',
		'x',
	);
}

/**
 * Theme URL for a vendored icon (for core/image blocks in patterns).
 *
 * @param string $name Icon name from snoka_club_icon_names().
 * @return string Empty string when unknown.
 */
function snoka_club_icon_url( string $name ): string {
	if ( ! in_array( $name, snoka_club_icon_names(), true ) ) {
		return '';
	}

	return get_theme_file_uri( 'assets/icons/' . $name . '.svg' );
}

/**
 * Inline decorative icon for PHP templates.
 *
 * @param string $name Icon name from snoka_club_icon_names().
 * @param int    $size Width/height in pixels.
 */
function snoka_club_icon( string $name, int $size = 24 ): void {
	if ( ! in_array( $name, snoka_club_icon_names(), true ) ) {
		return;
	}

	$path = get_template_directory() . '/assets/icons/' . $name . '.svg';
	if ( ! is_readable( $path ) ) {
		return;
	}

	$svg = (string) file_get_contents( $path );
	if ( '' === $svg ) {
		return;
	}

	$svg = (string) preg_replace( '/<svg\b/', '<svg aria-hidden="true" focusable="false"', $svg, 1 );
	$svg = (string) preg_replace( '/\swidth="\d+"/', '', $svg, 1 );
	$svg = (string) preg_replace( '/\sheight="\d+"/', '', $svg, 1 );
	$svg = (string) preg_replace( '/<svg\b/', sprintf( '<svg width="%d" height="%d"', $size, $size ), $svg, 1 );

	echo wp_kses(
		$svg,
		array(
			'svg'  => array(
				'xmlns'           => true,
				'width'           => true,
				'height'          => true,
				'viewbox'         => true,
				'fill'            => true,
				'stroke'          => true,
				'stroke-width'    => true,
				'stroke-linecap'  => true,
				'stroke-linejoin' => true,
				'class'           => true,
				'aria-hidden'     => true,
				'focusable'       => true,
			),
			'path' => array(
				'd'      => true,
				'stroke' => true,
			),
		)
	);
}
