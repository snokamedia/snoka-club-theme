<?php
/**
 * Title: CTA Newsletter
 * Slug: snoka-club/cta-newsletter
 * Categories: snoka-cta, call-to-action
 * Description: Tertiary card inviting visitors to subscribe to the newsletter.
 * Keywords: cta, newsletter, subscribe, email
 *
 * @package Snoka_Club
 */

?>
<!-- wp:group {"className":"is-style-snoka-card","backgroundColor":"tertiary","style":{"border":{"radius":"16px"},"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group is-style-snoka-card has-tertiary-background-color has-background" style="border-radius:16px;padding-top:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50);padding-left:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40)">
<!-- wp:heading {"level":3,"fontFamily":"heading"} -->
<h3 class="wp-block-heading has-heading-font-family"><?php esc_html_e( 'Stay in the loop', 'snoka-club' ); ?></h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p><?php esc_html_e( 'Get monthly news, stories, and event invites delivered straight to your inbox.', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<!-- wp:paragraph {"fontSize":"small"} -->
<p class="has-small-font-size"><?php esc_html_e( 'Newsletter signup form goes here — connect your email plugin.', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"left"}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"primary"} -->
<div class="wp-block-button"><a class="wp-block-button__link has-primary-background-color has-background wp-element-button"><?php esc_html_e( 'Subscribe', 'snoka-club' ); ?></a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:group -->
