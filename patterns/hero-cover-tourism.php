<?php
/**
 * Title: Hero Cover Tourism
 * Slug: snoka-club/hero-cover-tourism
 * Categories: snoka-hero, banner
 * Description: Full-width cover hero with gradient overlay for tourism pages.
 * Keywords: hero, cover, tourism, travel, banner
 *
 * @package Snoka_Club
 */

?>
<!-- wp:cover {"gradient":"dark-shroud","contentPosition":"center center","minHeight":70,"minHeightUnit":"vh","align":"full","textColor":"base","layout":{"type":"constrained"}} -->
<div class="wp-block-cover alignfull has-base-color has-text-color" style="min-height:70vh"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-100 has-background-dim has-background-gradient has-dark-shroud-gradient-background"></span><div class="wp-block-cover__inner-container">
<!-- wp:heading {"level":1,"textAlign":"center","fontSize":"xx-large","fontFamily":"heading"} -->
<h1 class="wp-block-heading has-text-align-center has-heading-font-family has-xx-large-font-size"><?php esc_html_e( 'Discover unforgettable destinations', 'snoka-club' ); ?></h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"align":"center","fontSize":"large"} -->
<p class="has-text-align-center has-large-font-size"><?php esc_html_e( 'Plan your next getaway with local guides, hidden gems, and breathtaking views.', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"primary","textColor":"base"} -->
<div class="wp-block-button"><a class="wp-block-button__link has-base-color has-primary-background-color has-text-color has-background wp-element-button"><?php esc_html_e( 'Plan Your Visit', 'snoka-club' ); ?></a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div></div>
<!-- /wp:cover -->
