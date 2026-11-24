import fs from "fs";
import path from "path";
import sharp from "sharp";

const SOURCE_IMAGE = "C:/Users/asham/.gemini/antigravity/brain/ca512b70-fdd7-49b4-9f62-1dd753a9f3ed/.user_uploaded/media_1795262555813_f97c616e.png";
const PUBLIC_DIR = path.resolve("public");
const SRC_APP_DIR = path.resolve("src/app");

async function main() {
  console.log("Reading source image:", SOURCE_IMAGE);
  
  // Trim transparent edges first, then add clean symmetrical padding
  const trimmed = await sharp(SOURCE_IMAGE)
    .trim()
    .toBuffer();

  const trimmedMeta = await sharp(trimmed).metadata();
  console.log(`Trimmed dimensions: ${trimmedMeta.width}x${trimmedMeta.height}`);

  // Determine square canvas size with comfortable breathing room (~8% margin)
  const maxDim = Math.max(trimmedMeta.width, trimmedMeta.height);
  const targetSize = Math.round(maxDim * 1.12); // clean 6% margin all around

  const paddedSquare = await sharp(trimmed)
    .resize({
      width: targetSize,
      height: targetSize,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  console.log(`Padded square master: ${targetSize}x${targetSize}`);

  // Generate specific icon sizes
  const sizes = [
    { size: 16, name: "favicon-16x16.png" },
    { size: 32, name: "favicon-32x32.png" },
    { size: 48, name: "favicon-48x48.png" },
    { size: 180, name: "apple-icon.png" },
    { size: 192, name: "android-chrome-192x192.png" },
    { size: 512, name: "icon.png" },
    { size: 512, name: "android-chrome-512x512.png" },
  ];

  const buffers = {};

  for (const item of sizes) {
    const buf = await sharp(paddedSquare)
      .resize(item.size, item.size, {
        kernel: sharp.kernel.lanczos3,
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
    
    buffers[item.size] = buf;
    
    // Save to public/
    fs.writeFileSync(path.join(PUBLIC_DIR, item.name), buf);
    console.log(`Saved public/${item.name} (${item.size}x${item.size})`);
  }

  // Also write to src/app/ for Next.js App Router metadata detection
  fs.writeFileSync(path.join(SRC_APP_DIR, "icon.png"), buffers[512]);
  fs.writeFileSync(path.join(SRC_APP_DIR, "apple-icon.png"), buffers[180]);
  console.log("Saved src/app/icon.png and src/app/apple-icon.png");

  // Also copy to public/images/logo-icon-clean.png so any inline icon mark updates too
  fs.writeFileSync(path.join(PUBLIC_DIR, "images/logo-icon-clean.png"), buffers[512]);
  console.log("Updated public/images/logo-icon-clean.png");

  // Create multi-size Windows .ico file containing 16x16, 32x32, 48x48
  const icoSizes = [16, 32, 48];
  const icoData = createIco(icoSizes.map(s => ({ size: s, buffer: buffers[s] })));
  
  fs.writeFileSync(path.join(PUBLIC_DIR, "favicon.ico"), icoData);
  fs.writeFileSync(path.join(SRC_APP_DIR, "favicon.ico"), icoData);
  console.log("Created multi-res favicon.ico in public/ and src/app/ (16, 32, 48px)");
}

function createIco(images) {
  // images: array of { size: number, buffer: Buffer }
  const headerSize = 6;
  const entrySize = 16;
  const numImages = images.length;
  
  let currentOffset = headerSize + (entrySize * numImages);
  
  // Header: 6 bytes
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(numImages, 4); // Number of images

  const entries = [];
  for (const img of images) {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 0); // Width
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Image size in bytes
    entry.writeUInt32LE(currentOffset, 12); // Offset
    
    entries.push(entry);
    currentOffset += img.buffer.length;
  }

  return Buffer.concat([
    header,
    ...entries,
    ...images.map(img => img.buffer)
  ]);
}

main().catch(err => {
  console.error("Error generating favicons:", err);
  process.exit(1);
});
