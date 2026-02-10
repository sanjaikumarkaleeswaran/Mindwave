const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Ensure output directory exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

// Base SVG
const svgBuffer = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#9333ea;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#grad1)" />
  <path d="M256 96C273.6 195.2 316.8 238.4 416 256C316.8 273.6 273.6 316.8 256 416C238.4 316.8 195.2 273.6 96 256C195.2 238.4 238.4 195.2 256 96Z" fill="white" />
</svg>
`);

// Icon sizes to generate
const sizes = [
    { name: 'pwa-64x64.png', size: 64 },
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'pwa-512x512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 }, // Standard Apple touch icon size
    { name: 'maskable-icon-512x512.png', size: 512, maskable: true }
];

async function generateIcons() {
    console.log('Generating PWA icons...');

    for (const icon of sizes) {
        const outputPath = path.join(publicDir, icon.name);

        let pipeline = sharp(svgBuffer).resize(icon.size, icon.size);

        if (icon.maskable) {
            // For maskable icon, we might want less padding or a different background logic,
            // but resizing the rounded rect SVG usually works "okay" as a maskable 
            // if the important content is centered.
            // Let's add a solid background to be safe for maskable
            pipeline = pipeline.flatten({ background: '#09090b' });
        }

        await pipeline.toFile(outputPath);
        console.log(`Created ${icon.name}`);
    }
    console.log('Icon generation complete!');
}

generateIcons().catch(console.error);
