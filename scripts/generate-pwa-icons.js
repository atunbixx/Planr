#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const createSvgIcon = (size) => {
  const padding = size * 0.1;
  const innerSize = size - (padding * 2);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#8B5CF6"/>
  <rect x="${padding}" y="${padding}" width="${innerSize}" height="${innerSize}" rx="${innerSize * 0.1}" fill="white" opacity="0.9"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="${size * 0.3}px" font-weight="bold" fill="#8B5CF6">WP</text>
</svg>`;
};

// Create a maskable icon with safe zone
const createMaskableSvgIcon = (size) => {
  const safeZone = size * 0.8;
  const padding = (size - safeZone) / 2;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#8B5CF6"/>
  <circle cx="${size/2}" cy="${size/2}" r="${safeZone/2}" fill="white" opacity="0.9"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="${size * 0.25}px" font-weight="bold" fill="#8B5CF6">WP</text>
</svg>`;
};

// Icon sizes to generate
const iconSizes = [
  { name: 'icon-72x72.png', size: 72, maskable: false },
  { name: 'icon-96x96.png', size: 96, maskable: false },
  { name: 'icon-128x128.png', size: 128, maskable: false },
  { name: 'icon-144x144.png', size: 144, maskable: false },
  { name: 'icon-152x152.png', size: 152, maskable: false },
  { name: 'icon-192x192.png', size: 192, maskable: false },
  { name: 'icon-384x384.png', size: 384, maskable: false },
  { name: 'icon-512x512.png', size: 512, maskable: false },
  { name: 'icon-192x192-maskable.png', size: 192, maskable: true },
  { name: 'icon-512x512-maskable.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
  { name: 'favicon-32x32.png', size: 32, maskable: false },
  { name: 'favicon-16x16.png', size: 16, maskable: false },
  { name: 'badge-72x72.png', size: 72, maskable: false },
  { name: 'guests-icon.png', size: 96, maskable: false },
  { name: 'budget-icon.png', size: 96, maskable: false },
  { name: 'rsvp-icon.png', size: 96, maskable: false },
];

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Generating placeholder PWA icons...');
console.log('Note: These are placeholder SVG files. For production, replace with proper PNG icons.');

// Generate each icon
iconSizes.forEach(({ name, size, maskable }) => {
  const svgContent = maskable ? createMaskableSvgIcon(size) : createSvgIcon(size);
  const filePath = path.join(iconsDir, name.replace('.png', '.svg'));
  
  fs.writeFileSync(filePath, svgContent);
  console.log(`Created: ${name.replace('.png', '.svg')} (${size}x${size})`);
});

console.log('\nPlaceholder icons generated successfully!');
console.log('To convert to PNG, use a tool like ImageMagick or an online converter.');
console.log('\nFor production, replace these with professionally designed icons.');