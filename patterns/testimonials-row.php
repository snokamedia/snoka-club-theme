<?php
/**
 * Title: Testimonials Row
 * Slug: snoka-club/testimonials-row
 * Categories: snoka-cards, testimonials
 * Description: Full-width tertiary section with a centered heading and three customer quotes.
 * Keywords: testimonials, quotes, reviews, cards
 *
 * @package Snoka_Club
 */

?>
<!-- wp:group {"align":"full","backgroundColor":"tertiary","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-tertiary-background-color has-background">
<!-- wp:heading {"level":2,"fontSize":"x-large","textAlign":"center"} -->
<h2 class="wp-block-heading has-text-align-center has-x-large-font-size"><?php esc_html_e( 'What our clients say', 'snoka-club' ); ?></h2>
<!-- /wp:heading -->
<!-- wp:columns {"align":"wide"} -->
<div class="wp-block-columns alignwide">
<!-- wp:column -->
<div class="wp-block-column">
<!-- wp:quote {"backgroundColor":"base","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<blockquote class="wp-block-quote has-base-background-color has-background" style="padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)">
<!-- wp:paragraph -->
<p><?php esc_html_e( 'The new site loads fast and bookings doubled within two months of launch.', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<cite><?php esc_html_e( 'Marta Ellis, Bakery Owner', 'snoka-club' ); ?></cite>
</blockquote>
<!-- /wp:quote -->
</div>
<!-- /wp:column -->
<!-- wp:column -->
<div class="wp-block-column">
<!-- wp:quote {"backgroundColor":"base","shadow":"natural","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<blockquote class="wp-block-quote has-base-background-color has-background has-natural-shadow" style="padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)">
<!-- wp:paragraph -->
<p><?php esc_html_e( 'Clear communication, on-time delivery, and training that made our team self-sufficient.', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<cite><?php esc_html_e( 'David Okafor, Nonprofit Director', 'snoka-club' ); ?></cite>
</blockquote>
<!-- /wp:quote -->
</div>
<!-- /wp:column -->
<!-- wp:column -->
<div class="wp-block-column">
<!-- wp:quote {"backgroundColor":"base","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<blockquote class="wp-block-quote has-base-background-color has-background" style="padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)">
<!-- wp:paragraph -->
<p><?php esc_html_e( 'Support is quick and friendly. Every update is explained before anything changes.', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<cite><?php esc_html_e( 'Lena Fischer, Shop Manager', 'snoka-club' ); ?></cite>
</blockquote>
<!-- /wp:quote -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->
