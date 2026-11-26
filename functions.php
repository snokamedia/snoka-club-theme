<?php
/**
 * Snoka Club theme functions.
 *
 * Generic club block theme. Design tokens live in
 * theme.json; this file wires behavior only. Resident portal, membership,
 * files, notices, requests, and votes are owned by the Snoka Access plugin —
 * the theme only presents public club info and links to /portal/.
 *
 * @package Snoka_Club
 */

declare(strict_types=1);

defined( 'ABSPATH' ) || exit;

const SNOKA_CLUB_VERSION = '0.3.0';
const SNOKA_CLUB_SLUG    = 'snoka-club';

require_once get_template_directory() . '/inc/assets.php';
require_once get_template_directory() . '/inc/blocks.php';
require_once get_template_directory() . '/inc/block-support.php';
require_once get_template_directory() . '/inc/icons.php';
require_once get_template_directory() . '/inc/nav-overlay.php';
require_once get_template_directory() . '/inc/rest-extras.php';
require_once get_template_directory() . '/inc/post-types.php';
require_once get_template_directory() . '/inc/template-tags.php';
require_once get_template_directory() . '/inc/performance.php';

/**
 * Club login branding: logo + steel-blue button to match the theme.
 */
function snoka_club_login_branding(): void {
	$logo = esc_url( get_theme_file_uri( 'assets/login-logo.svg' ) );
	echo '<style>.login h1 a{background-image:url(' . $logo . ');width:250px;height:120px;background-size:contain;background-position:center;margin:0 auto;}'
		. '.login .button-primary{background:#345889;border-color:#345889;}'
		. '.login .button-primary:hover{background:#2B4870;border-color:#2B4870;}</style>';
}
add_action( 'login_head', 'snoka_club_login_branding' );

/**
 * Theme setup: block styles, editor styles, feed links, title tag.
 */
function snoka_club_setup(): void {
	add_theme_support( 'wp-block-styles' );
	add_theme_support( 'editor-styles' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support(
		'html5',
		array( 'comment-list', 'comment-form', 'search-form', 'gallery', 'caption', 'style', 'script' )
	);
	add_editor_style( 'style.css' );
}
add_action( 'after_setup_theme', 'snoka_club_setup' );

/**
 * Enqueue frontend stylesheet (theme.json output + style.css).
 */
function snoka_club_enqueue(): void {
	wp_enqueue_style(
		'snoka-club-style',
		get_stylesheet_uri(),
		array(),
		SNOKA_CLUB_VERSION
	);
}
add_action( 'wp_enqueue_scripts', 'snoka_club_enqueue' );
