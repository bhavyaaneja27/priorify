import { Jimp } from 'jimp';

async function main() {
  const imagePath = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\63cbcaa6-ade2-4527-85de-ece4efb5c232\\media__1782391788820.png';
  console.log('Loading image:', imagePath);
  
  const image = await Jimp.read(imagePath);
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  
  console.log(`Image dimensions: ${width}x${height}`);
  
  let minX = width, maxX = 0, minY = height, maxY = 0;
  let found = false;
  
  for (let y = 0; y < Math.floor(height * 0.55); y++) {
    for (let x = 0; x < Math.floor(width * 0.45); x++) {
      const hex = image.getPixelColor(x, y);
      const r = (hex >> 24) & 255;
      const g = (hex >> 16) & 255;
      const b = (hex >> 8) & 255;
      if (r > 20 || g > 20 || b > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }
  
  if (!found) {
    console.error("Could not find the logo.");
    return;
  }
  
  console.log(`Bounding box: x=${minX}, y=${minY}, w=${maxX - minX}, h=${maxY - minY}`);
  
  const logoWidth = maxX - minX;
  const logoHeight = maxY - minY;
  
  const logo = image.clone().crop({ x: minX, y: minY, w: logoWidth, h: logoHeight });
  
  const targetCanvasSize = 512;
  const targetLogoSize = Math.floor(targetCanvasSize * 0.6);
  
  const scale = targetLogoSize / Math.max(logoWidth, logoHeight);
  const scaledWidth = Math.floor(logoWidth * scale);
  const scaledHeight = Math.floor(logoHeight * scale);
  
  logo.resize({ w: scaledWidth, h: scaledHeight });
  
  const icon512 = new Jimp({ width: 512, height: 512, color: 0x0A0A0AFF });
  
  const posX = Math.floor((512 - scaledWidth) / 2);
  const posY = Math.floor((512 - scaledHeight) / 2);
  
  icon512.composite(logo, posX, posY);
  
  const path512 = 'public/pwa-512x512.png';
  await icon512.write(path512);
  console.log('Saved', path512);
  
  const icon192 = icon512.clone().resize({ w: 192, h: 192 });
  const path192 = 'public/pwa-192x192.png';
  await icon192.write(path192);
  console.log('Saved', path192);
}

main().catch(console.error);
