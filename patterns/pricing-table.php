<?php
/**
 * Title: Pricing Table
 * Slug: snoka-club/pricing-table
 * Categories: snoka-pricing, columns
 * Description: Centered heading with three pricing plan cards, Standard highlighted.
 * Keywords: pricing, plans, table, columns
 *
 * @package Snoka_Club
 */

?>
<!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignwide">
<!-- wp:heading {"level":2,"fontSize":"x-large","textAlign":"center"} -->
<h2 class="wp-block-heading has-text-align-center has-x-large-font-size"><?php esc_html_e( 'Simple, honest pricing', 'snoka-club' ); ?></h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"align":"center"} -->
<p class="has-text-align-center"><?php esc_html_e( 'Pick the plan that fits today. Upgrade or cancel whenever you need to.', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<!-- wp:columns {"align":"wide"} -->
<div class="wp-block-columns alignwide">
<!-- wp:column -->
<div class="wp-block-column">
<!-- wp:group {"className":"is-style-snoka-card","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group is-style-snoka-card">
<!-- wp:heading {"level":3,"textAlign":"center"} -->
<h3 class="wp-block-heading has-text-align-center"><?php esc_html_e( 'Basic', 'snoka-club' ); ?></h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"align":"center","fontSize":"x-large"} -->
<p class="has-text-align-center has-x-large-font-size"><?php esc_html_e( '$19', 'snoka-club' ); ?><span class="has-small-font-size"><?php esc_html_e( '/month', 'snoka-club' ); ?></span></p>
<!-- /wp:paragraph -->
<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><?php esc_html_e( 'One website', 'snoka-club' ); ?></li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><?php esc_html_e( 'Monthly updates', 'snoka-club' ); ?></li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><?php esc_html_e( 'Daily backups', 'snoka-club' ); ?></li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><?php esc_html_e( 'Email support', 'snoka-club' ); ?></li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons">
<!-- wp:button {"className":"is-style-outline"} -->
<div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button" href="#"><?php esc_html_e( 'Choose Basic', 'snoka-club' ); ?></a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:column -->
<!-- wp:column -->
<div class="wp-block-column">
<!-- wp:group {"className":"is-style-snoka-card","backgroundColor":"contrast","textColor":"base","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group is-style-snoka-card has-contrast-background-color has-background has-base-color has-text-color">
<!-- wp:paragraph {"align":"center","fontSize":"small","style":{"typography":{"textTransform":"uppercase"}}} -->
<p class="has-text-align-center has-small-font-size"><?php esc_html_e( 'Most Popular', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<!-- wp:heading {"level":3,"textAlign":"center"} -->
<h3 class="wp-block-heading has-text-align-center"><?php esc_html_e( 'Standard', 'snoka-club' ); ?></h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"align":"center","fontSize":"x-large"} -->
<p class="has-text-align-center has-x-large-font-size"><?php esc_html_e( '$49', 'snoka-club' ); ?><span class="has-small-font-size"><?php esc_html_e( '/month', 'snoka-club' ); ?></span></p>
<!-- /wp:paragraph -->
<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><?php esc_html_e( 'Up to five websites', 'snoka-club' ); ?></li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><?php esc_html_e( 'Weekly updates', 'snoka-club' ); ?></li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><?php esc_html_e( 'Daily backups', 'snoka-club' ); ?></li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><?php esc_html_e( 'Priority support', 'snoka-club' ); ?></li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons">
<!-- wp:button {"backgroundColor":"primary","textColor":"base"} -->
<div class="wp-block-button"><a class="wp-block-button__link has-primary-background-color has-background has-base-color has-text-color wp-element-button" href="#"><?php esc_html_e( 'Choose Standard', 'snoka-club' ); ?></a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:column -->
<!-- wp:column -->
<div class="wp-block-column">
<!-- wp:group {"className":"is-style-snoka-card","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group is-style-snoka-card">
<!-- wp:heading {"level":3,"textAlign":"center"} -->
<h3 class="wp-block-heading has-text-align-center"><?php esc_html_e( 'Premium', 'snoka-club' ); ?></h3>
<!-- /wp:heading -->
<!-- wp:paragraph {"align":"center","fontSize":"x-large"} -->
<p class="has-text-align-center has-x-large-font-size"><?php esc_html_e( '$99', 'snoka-club' ); ?><span class="has-small-font-size"><?php esc_html_e( '/month', 'snoka-club' ); ?></span></p>
<!-- /wp:paragraph -->
<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><?php esc_html_e( 'Unlimited websites', 'snoka-club' ); ?></li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><?php esc_html_e( 'Same-day updates', 'snoka-club' ); ?></li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><?php esc_html_e( 'Hourly backups', 'snoka-club' ); ?></li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><?php esc_html_e( 'Dedicated manager', 'snoka-club' ); ?></li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons">
<!-- wp:button {"className":"is-style-outline"} -->
<div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button" href="#"><?php esc_html_e( 'Choose Premium', 'snoka-club' ); ?></a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:group -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->
