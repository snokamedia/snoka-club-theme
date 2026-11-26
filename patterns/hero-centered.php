<?php
/**
 * Title: Hero Centered
 * Slug: snoka-club/hero-centered
 * Categories: snoka-hero, banner
 * Description: Centered minimal hero with label, headline, lead, and actions.
 * Keywords: hero, centered, banner, minimal
 *
 * @package Snoka_Club
 */

?>
<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)">
<!-- wp:paragraph {"align":"center","fontSize":"small","style":{"typography":{"textTransform":"uppercase","letterSpacing":"2px"}}} -->
<p class="has-text-align-center has-small-font-size" style="text-transform:uppercase;letter-spacing:2px"><?php esc_html_e( 'Welcome to our site', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textAlign":"center","fontSize":"xx-large","fontFamily":"heading"} -->
<h1 class="wp-block-heading has-text-align-center has-heading-font-family has-xx-large-font-size"><?php esc_html_e( 'Simple solutions for big ideas', 'snoka-club' ); ?></h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"align":"center","fontSize":"medium"} -->
<p class="has-text-align-center has-medium-font-size"><?php esc_html_e( 'Everything you need to get started, all in one place.', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"primary"} -->
<div class="wp-block-button"><a class="wp-block-button__link has-primary-background-color has-background wp-element-button"><?php esc_html_e( 'Get Started Today', 'snoka-club' ); ?></a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline"} -->
<div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button"><?php esc_html_e( 'Explore Our Work', 'snoka-club' ); ?></a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:group -->
