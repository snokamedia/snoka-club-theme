<?php
/**
 * Title: Footer Centered
 * Slug: snoka-club/footer-centered-pattern
 * Categories: footer
 * Description: Centered contrast footer with site title, navigation, social links, and copyright.
 * Keywords: footer, centered, navigation, social, copyright
 *
 * @package Snoka_Club
 */

?>
<!-- wp:group {"align":"full","backgroundColor":"contrast","textColor":"base","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-contrast-background-color has-background has-base-color has-text-color">
<!-- wp:site-title {"textAlign":"center"} /-->
<!-- wp:navigation {"overlayMenu":"never","layout":{"type":"flex","justifyContent":"center"},"fontSize":"small"} -->
<!-- wp:page-list /-->
<!-- /wp:navigation -->
<!-- wp:social-links {"className":"is-style-logos-only","layout":{"type":"flex","justifyContent":"center"}} -->
<ul class="wp-block-social-links is-style-logos-only">
<!-- wp:social-link {"url":"#","service":"facebook"} /-->
<!-- wp:social-link {"url":"#","service":"instagram"} /-->
</ul>
<!-- /wp:social-links -->
<!-- wp:separator {"align":"wide"} -->
<hr class="wp-block-separator alignwide has-alpha-channel-opacity"/>
<!-- /wp:separator -->
<!-- wp:paragraph {"align":"center","fontSize":"small"} -->
<p class="has-text-align-center has-small-font-size"><?php esc_html_e( '© 2026 — Built with the Snoka Block Theme.', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
