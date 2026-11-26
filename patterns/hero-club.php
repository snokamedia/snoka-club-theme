<?php
/**
 * Title: Hero Club
 * Slug: snoka-club/hero-club
 * Categories: snoka-hero, banner
 * Description: Full-width tennis hero with club name, headline, and membership/program actions.
 * Keywords: club, hero, tennis, membership
 *
 * @package Snoka_Club
 */

?>
<!-- wp:cover {"url":"<?php echo esc_url( get_theme_file_uri( 'assets/hero-tennis.jpg' ) ); ?>","alt":"Doubles match on the Yellowknife outdoor courts","dimRatio":60,"overlayColor":"contrast","minHeight":480,"align":"full","className":"snoka-hero-mesh snoka-intro","layout":{"type":"constrained"}} -->
<div class="wp-block-cover alignfull snoka-hero-mesh snoka-intro" style="min-height:480px"><img class="wp-block-cover__image-background" alt="Doubles match on the Yellowknife outdoor courts" src="<?php echo esc_url( get_theme_file_uri( 'assets/hero-tennis.jpg' ) ); ?>" data-object-fit="cover"/><span aria-hidden="true" class="wp-block-cover__background has-contrast-background-color has-background-dim-60 has-background-dim"></span><div class="wp-block-cover__inner-container"><!-- wp:paragraph {"align":"center","fontSize":"small","style":{"typography":{"textTransform":"uppercase","letterSpacing":"2px"}},"textColor":"base"} -->
<p class="has-text-align-center has-base-color has-text-color has-small-font-size" style="text-transform:uppercase;letter-spacing:2px"><?php esc_html_e( 'Yellowknife Tennis Club', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textAlign":"center","fontSize":"xx-large","fontFamily":"heading","textColor":"base"} -->
<h1 class="wp-block-heading has-text-align-center has-base-color has-text-color has-heading-font-family has-xx-large-font-size"><?php esc_html_e( 'Outdoor tennis, all summer long', 'snoka-club' ); ?></h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"align":"center","fontSize":"large","textColor":"base"} -->
<p class="has-text-align-center has-base-color has-text-color has-large-font-size"><?php esc_html_e( 'Leagues, clinics, tournaments, and social play — for every age and every level.', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons"><!-- wp:button {"backgroundColor":"secondary","textColor":"contrast"} -->
<div class="wp-block-button"><a class="wp-block-button__link has-contrast-color has-secondary-background-color has-text-color has-background wp-element-button" href="/membership/"><?php esc_html_e( 'Become a member', 'snoka-club' ); ?></a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-snoka-outline-light"} -->
<div class="wp-block-button is-style-snoka-outline-light"><a class="wp-block-button__link wp-element-button" href="/programs/"><?php esc_html_e( 'Explore programs', 'snoka-club' ); ?></a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div></div>
<!-- /wp:cover -->
