<?php
/**
 * Title: Media Text Feature
 * Slug: snoka-club/media-text-feature
 * Categories: snoka-content, media
 * Description: Feature highlight with gradient visual and a checklist of benefits.
 * Keywords: media, text, feature, checklist, about
 *
 * @package Snoka_Club
 */

?>
<!-- wp:media-text {"mediaPosition":"left","mediaWidth":45} -->
<div class="wp-block-media-text is-stacked-on-mobile" style="grid-template-columns:45% auto"><figure class="wp-block-media-text__media">
<!-- wp:cover {"gradient":"primary-to-secondary","contentPosition":"center center","minHeight":320,"minHeightUnit":"px"} -->
<div class="wp-block-cover" style="min-height:320px"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-100 has-background-dim has-background-gradient has-primary-to-secondary-gradient-background"></span><div class="wp-block-cover__inner-container">
<!-- wp:heading {"level":3,"textAlign":"center","textColor":"base","fontFamily":"heading"} -->
<h3 class="wp-block-heading has-text-align-center has-base-color has-text-color has-heading-font-family"><?php esc_html_e( 'Our promise in action', 'snoka-club' ); ?></h3>
<!-- /wp:heading -->
</div></div>
<!-- /wp:cover -->
</figure><div class="wp-block-media-text__content">
<!-- wp:heading {"fontFamily":"heading"} -->
<h2 class="wp-block-heading has-heading-font-family"><?php esc_html_e( 'Built around your goals', 'snoka-club' ); ?></h2>
<!-- /wp:heading -->
<!-- wp:paragraph -->
<p><?php esc_html_e( 'We listen first, then shape every detail around what matters most to you.', 'snoka-club' ); ?></p>
<!-- /wp:paragraph -->
<!-- wp:list -->
<ul class="wp-block-list">
<!-- wp:list-item -->
<li><?php esc_html_e( '✓ Clear plans with honest timelines', 'snoka-club' ); ?></li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><?php esc_html_e( '✓ Friendly support at every step', 'snoka-club' ); ?></li>
<!-- /wp:list-item -->
<!-- wp:list-item -->
<li><?php esc_html_e( '✓ Results you can measure and share', 'snoka-club' ); ?></li>
<!-- /wp:list-item -->
</ul>
<!-- /wp:list -->
<!-- wp:paragraph -->
<p><a href="#"><?php esc_html_e( 'Learn more about our approach', 'snoka-club' ); ?></a></p>
<!-- /wp:paragraph -->
</div></div>
<!-- /wp:media-text -->
