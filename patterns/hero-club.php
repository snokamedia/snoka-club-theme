<?php
/**
 * Title: Hero Club
 * Slug: snoka-club/hero-club
 * Categories: snoka-hero, banner
 * Description: Placeholder club hero with portal sign-in actions. Replace corp name and contacts with the real corporation before launch.
 * Keywords: club, hero, portal, sign in
 *
 * @package Snoka_Club
 */

?>
<!-- wp:cover {"url":"<?php echo esc_url( get_theme_file_uri( 'assets/hero-club.jpg' ) ); ?>","alt":"Condominium residence tower","dimRatio":60,"overlayColor":"contrast","minHeight":440,"align":"full","className":"snoka-hero-mesh","layout":{"type":"constrained"}} -->
<div class="wp-block-cover alignfull snoka-hero-mesh" style="min-height:440px"><img class="wp-block-cover__image-background" alt="Condominium residence tower" src="<?php echo esc_url( get_theme_file_uri( 'assets/hero-club.jpg' ) ); ?>" data-object-fit="cover"/><span aria-hidden="true" class="wp-block-cover__background has-contrast-background-color has-background-dim-60 has-background-dim"></span><div class="wp-block-cover__inner-container"><!-- wp:paragraph {"align":"center","fontSize":"small","style":{"typography":{"textTransform":"uppercase","letterSpacing":"2px"}},"textColor":"base"} -->
<p class="has-text-align-center has-base-color has-text-color has-small-font-size" style="text-transform:uppercase;letter-spacing:2px"><?php esc_html_e( 'Sandbox Club', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":1,"textAlign":"center","fontSize":"xx-large","fontFamily":"heading","textColor":"base"} -->
<h1 class="wp-block-heading has-text-align-center has-base-color has-text-color has-heading-font-family has-xx-large-font-size"><?php esc_html_e( 'Your building, minus the bulletin board', 'snoka-club' ); ?></h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"align":"center","fontSize":"large","textColor":"base"} -->
<p class="has-text-align-center has-base-color has-text-color has-large-font-size"><?php esc_html_e( 'Notices, documents, requests, and votes — in one resident portal. No shared passwords.', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons"><!-- wp:button {"backgroundColor":"base","textColor":"contrast"} -->
<div class="wp-block-button"><a class="wp-block-button__link has-contrast-color has-base-background-color has-text-color has-background wp-element-button" href="/portal/"><?php esc_html_e( 'Resident sign in', 'snoka-club' ); ?></a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-snoka-outline-light"} -->
<div class="wp-block-button is-style-snoka-outline-light"><a class="wp-block-button__link wp-element-button" href="/portal/#/forms"><?php esc_html_e( 'Submit a request', 'snoka-club' ); ?></a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div></div>
<!-- /wp:cover -->
