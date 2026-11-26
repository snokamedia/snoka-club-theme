# Tabler Icons (vendored subset)

26 outline icons from [Tabler Icons](https://tabler.io/icons) (MIT License,
Copyright (c) Tabler Contributors) vendored for offline use in patterns and
PHP templates. Upstream files are unmodified.

## Use in patterns (core/image, local asset)

```php
<!-- wp:image {"sizeSlug":"thumbnail"} -->
<figure class="wp-block-image size-thumbnail"><img src="<?php echo esc_url( snoka_block_theme_icon_url( 'briefcase' ) ); ?>" alt="<?php esc_attr_e( 'Briefcase icon', 'snoka-block-theme' ); ?>"/></figure>
<!-- /wp:image -->
```

## Use in PHP templates (inline, decorative)

```php
<?php snoka_block_theme_icon( 'check', 24 ); ?>
```

Only the 26 allowlisted names in `snoka_block_theme_icon_names()` resolve.
To add an icon: download the outline SVG from
`https://cdn.jsdelivr.net/npm/@tabler/icons/icons/outline/<name>.svg` into
this directory, verify `fill="none"`, and append the name to the allowlist.
