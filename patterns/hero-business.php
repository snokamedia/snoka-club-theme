<?php
/**
 * Title: Hero Business
 * Slug: snoka-club/hero-business
 * Categories: snoka-hero, banner
 * Template Types: front-page
 * Description: Asymmetric hero with copy, dual calls to action, and a stat card.
 * Keywords: hero, business, banner, stats
 *
 * @package Snoka_Club
 */

?>
<!-- wp:group {"align":"full","backgroundColor":"tertiary","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-tertiary-background-color has-background" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)">
<!-- wp:columns {"verticalAlignment":"center"} -->
<div class="wp-block-columns are-vertically-aligned-center">
<!-- wp:column {"width":"60%"} -->
<div class="wp-block-column" style="flex-basis:60%">
<!-- wp:paragraph {"fontSize":"small","style":{"typography":{"textTransform":"uppercase","letterSpacing":"2px"}}} -->
<p class="has-small-font-size" style="text-transform:uppercase;letter-spacing:2px"><?php esc_html_e( 'Trusted by local businesses', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"fontSize":"xx-large","fontFamily":"heading"} -->
<h1 class="wp-block-heading has-heading-font-family has-xx-large-font-size"><?php esc_html_e( 'Grow your business with confidence', 'snoka-club' ); ?></h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"fontSize":"large"} -->
<p class="has-large-font-size"><?php esc_html_e( 'We help small teams plan, launch, and measure work that actually moves the needle.', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"left"}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"primary"} -->
<div class="wp-block-button"><a class="wp-block-button__link has-primary-background-color has-background wp-element-button"><?php esc_html_e( 'Start Your Project', 'snoka-club' ); ?></a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline"} -->
<div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button"><?php esc_html_e( 'View Our Services', 'snoka-club' ); ?></a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"40%"} -->
<div class="wp-block-column" style="flex-basis:40%">
<!-- wp:group {"className":"is-style-snoka-card","backgroundColor":"base","style":{"border":{"radius":"16px"},"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group is-style-snoka-card has-base-background-color has-background" style="border-radius:16px;padding-top:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50);padding-left:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40)">
<!-- wp:heading {"fontSize":"x-large","fontFamily":"heading"} -->
<h2 class="wp-block-heading has-heading-font-family has-x-large-font-size"><?php esc_html_e( '240+ projects delivered', 'snoka-club' ); ?></h2>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p><?php esc_html_e( 'A track record of on-time delivery and long-term client partnerships.', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->
