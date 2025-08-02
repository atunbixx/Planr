# PWA Icons

This directory should contain the following icon files for the Progressive Web App:

## Required Icons

### Standard Icons (for any purpose)
- `icon-72x72.png` - 72×72 pixels
- `icon-96x96.png` - 96×96 pixels
- `icon-128x128.png` - 128×128 pixels
- `icon-144x144.png` - 144×144 pixels
- `icon-152x152.png` - 152×152 pixels
- `icon-192x192.png` - 192×192 pixels
- `icon-384x384.png` - 384×384 pixels
- `icon-512x512.png` - 512×512 pixels

### Maskable Icons (for adaptive icons)
- `icon-192x192-maskable.png` - 192×192 pixels with safe zone
- `icon-512x512-maskable.png` - 512×512 pixels with safe zone

### Apple Touch Icons
- `apple-touch-icon.png` - 180×180 pixels
- `favicon-32x32.png` - 32×32 pixels
- `favicon-16x16.png` - 16×16 pixels

### Additional Icons
- `badge-72x72.png` - For notification badges
- `guests-icon.png` - 96×96 pixels for shortcuts
- `budget-icon.png` - 96×96 pixels for shortcuts
- `rsvp-icon.png` - 96×96 pixels for shortcuts

## Icon Design Guidelines

1. **Base Design**: Use a wedding-themed icon (e.g., wedding rings, heart, dove, or flowers)
2. **Color Scheme**: Primary purple (#8B5CF6) with white background
3. **Safe Zone**: For maskable icons, keep important content within the center 80% of the image
4. **Format**: PNG with transparency (except maskable icons which should have a background)

## Generating Icons

You can use online tools like:
- [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
- [Maskable.app](https://maskable.app/) for creating maskable icons
- [RealFaviconGenerator](https://realfavicongenerator.net/) for favicon generation

Or use ImageMagick to generate from a source image:

```bash
# Example: Generate all sizes from a 1024x1024 source image
convert source-icon.png -resize 72x72 icon-72x72.png
convert source-icon.png -resize 96x96 icon-96x96.png
convert source-icon.png -resize 128x128 icon-128x128.png
convert source-icon.png -resize 144x144 icon-144x144.png
convert source-icon.png -resize 152x152 icon-152x152.png
convert source-icon.png -resize 192x192 icon-192x192.png
convert source-icon.png -resize 384x384 icon-384x384.png
convert source-icon.png -resize 512x512 icon-512x512.png

# For Apple touch icon
convert source-icon.png -resize 180x180 apple-touch-icon.png

# For favicons
convert source-icon.png -resize 32x32 favicon-32x32.png
convert source-icon.png -resize 16x16 favicon-16x16.png
```

## Placeholder Icons

For development, you can use placeholder services:
- https://via.placeholder.com/512x512/8B5CF6/FFFFFF?text=WP