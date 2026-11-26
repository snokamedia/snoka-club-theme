<?php
/**
 * Title: Content with Sidebar
 * Slug: snoka-club/layout-content-sidebar
 * Categories: snoka-layout, columns
 * Description: Seventy-thirty content and sidebar starter layout with search and page links.
 * Keywords: layout, sidebar, columns, content, starter
 * Inserter: yes
 *
 * @package Snoka_Club
 */

?>
<!-- wp:columns {"align":"wide"} -->
<div class="wp-block-columns alignwide">
<!-- wp:column {"width":"70%"} -->
<div class="wp-block-column" style="flex-basis:70%">
<!-- wp:heading {"level":2,"fontSize":"x-large"} -->
<h2 class="wp-block-heading has-x-large-font-size"><?php esc_html_e( 'Start with this layout', 'snoka-club' ); ?></h2>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p><?php esc_html_e( 'Replace this heading and the paragraphs below with your own page content. The wide column holds the main story while the narrow column stays reserved for helpers.', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<!-- wp:paragraph -->
<p><?php esc_html_e( 'Add images, lists, or quotes here. Delete the buttons once you have published your first draft.', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<!-- wp:buttons -->
<div class="wp-block-buttons">
<!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="#"><?php esc_html_e( 'Start building', 'snoka-club' ); ?></a></div>
<!-- /wp:button -->
<!-- wp:button {"className":"is-style-outline"} -->
<div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button" href="#"><?php esc_html_e( 'Browse documentation', 'snoka-club' ); ?></a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</div>
<!-- /wp:column -->
<!-- wp:column {"width":"30%"} -->
<div class="wp-block-column" style="flex-basis:30%">
<!-- wp:search {"showLabel":false,"buttonPosition":"button-only"} /-->
<!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading"><?php esc_html_e( 'On this page', 'snoka-club' ); ?></h3>
<!-- /wp:heading -->
<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><a href="#"><?php esc_html_e( 'Getting started guide', 'snoka-club' ); ?></a></li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="#"><?php esc_html_e( 'Layout tips', 'snoka-club' ); ?></a></li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><a href="#"><?php esc_html_e( 'Support options', 'snoka-club' ); ?></a></li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->
</div>
<!-- /wp:column -->
</div>
<!-- /wp:columns -->
