<?php
/**
 * Title: Services Grid
 * Slug: snoka-club/services-grid
 * Categories: snoka-cards, columns
 * Description: Section header with heading and link, followed by three service cards.
 * Keywords: services, cards, grid, columns
 *
 * @package Snoka_Club
 */

?>
<!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignwide">
<!-- wp:group {"align":"wide","layout":{"type":"flex","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide">
<!-- wp:heading {"level":2,"fontSize":"x-large"} -->
<h2 class="wp-block-heading has-x-large-font-size"><?php esc_html_e( 'Our services', 'snoka-club' ); ?></h2>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p><a href="#"><?php esc_html_e( 'View all services', 'snoka-club' ); ?></a></p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
<!-- wp:columns {"align":"wide"} -->
<div class="wp-block-columns alignwide">
<!-- wp:column -->
<div class="wp-block-column">
<!-- wp:group {"className":"is-style-snoka-card","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group is-style-snoka-card">
<!-- wp:image {"sizeSlug":"thumbnail"} -->
<figure class="wp-block-image size-thumbnail"><img src="<?php echo esc_url( snoka_club_icon_url( 'palette' ) ); ?>" alt="<?php esc_attr_e( 'Palette icon', 'snoka-club' ); ?>"/></figure>
<!-- /wp:image -->
<!-- wp:paragraph {"fontSize":"small","textColor":"secondary","style":{"typography":{"textTransform":"uppercase"}}} -->
<p class="has-small-font-size has-secondary-color has-text-color"><?php esc_html_e( 'Design', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading"><?php esc_html_e( 'Brand and web design', 'snoka-club' ); ?></h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p><?php esc_html_e( 'Distinctive identities and websites that communicate clearly and convert visitors into customers.', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<!-- wp:paragraph -->
<p><a href="#"><?php esc_html_e( 'Explore design services', 'snoka-club' ); ?></a></p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:column -->
<!-- wp:column -->
<div class="wp-block-column">
<!-- wp:group {"className":"is-style-snoka-card","backgroundColor":"primary","textColor":"base","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group is-style-snoka-card has-primary-background-color has-background has-base-color has-text-color">
<!-- wp:image {"sizeSlug":"thumbnail"} -->
<figure class="wp-block-image size-thumbnail"><img src="<?php echo esc_url( snoka_club_icon_url( 'rocket' ) ); ?>" alt="<?php esc_attr_e( 'Rocket icon', 'snoka-club' ); ?>"/></figure>
<!-- /wp:image -->
<!-- wp:paragraph {"fontSize":"small","style":{"typography":{"textTransform":"uppercase"}}} -->
<p class="has-small-font-size"><?php esc_html_e( 'Development', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading"><?php esc_html_e( 'Custom WordPress builds', 'snoka-club' ); ?></h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p><?php esc_html_e( 'Fast, accessible block themes and plugins engineered around your content and workflow.', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<!-- wp:paragraph -->
<p><a href="#"><?php esc_html_e( 'Explore development services', 'snoka-club' ); ?></a></p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:column -->
<!-- wp:column -->
<div class="wp-block-column">
<!-- wp:group {"className":"is-style-snoka-card","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group is-style-snoka-card">
<!-- wp:image {"sizeSlug":"thumbnail"} -->
<figure class="wp-block-image size-thumbnail"><img src="<?php echo esc_url( snoka_club_icon_url( 'users' ) ); ?>" alt="<?php esc_attr_e( 'Users icon', 'snoka-club' ); ?>"/></figure>
<!-- /wp:image -->
<!-- wp:paragraph {"fontSize":"small","textColor":"secondary","style":{"typography":{"textTransform":"uppercase"}}} -->
<p class="has-small-font-size has-secondary-color has-text-color"><?php esc_html_e( 'Support', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading"><?php esc_html_e( 'Care plans and training', 'snoka-club' ); ?></h3>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p><?php esc_html_e( 'Updates, backups, and hands-on training so your team can publish with confidence.', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<!-- wp:paragraph -->
<p><a href="#"><?php esc_html_e( 'Explore support plans', 'snoka-club' ); ?></a></p>
<!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->
