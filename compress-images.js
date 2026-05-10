const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const imagesDir = path.join(__dirname, 'images');

// Settings per image type
// Hero images: resize to 1400px wide, quality 78
// Split section images: resize to 900px wide, quality 80
// Equipment cards: resize to 800px wide, quality 82
const config = {
  // Hero full-width backgrounds
  'hero-home.jpg':         { width: 1400, quality: 78 },
  'hero-services.jpg':     { width: 1400, quality: 78 },
  'hero-about.jpg':        { width: 1400, quality: 78 },
  'hero-service-area.jpg': { width: 1400, quality: 78 },
  'hero-contact.jpg':      { width: 1400, quality: 78 },
  'hero-why-us.jpg':       { width: 1400, quality: 78 },
  // Split section images
  'about-story.jpg':       { width: 900,  quality: 80 },
  'about-credentials.jpg': { width: 900,  quality: 80 },
  'area-coverage.jpeg':    { width: 900,  quality: 80 },
  'service-grinding.jpg':  { width: 900,  quality: 80 },
  'service-roots.jpg':     { width: 900,  quality: 82 },
  // Equipment card images
  'equip-large-grinder.jpg':  { width: 800, quality: 82 },
  'equip-compact-grinder.jpg':{ width: 800, quality: 82 },
  'equip-truck.jpg':          { width: 800, quality: 82 },
};

async function compressImages() {
  let totalBefore = 0;
  let totalAfter = 0;

  for (const [filename, opts] of Object.entries(config)) {
    const filePath = path.join(imagesDir, filename);
    if (!fs.existsSync(filePath)) {
      console.log(`SKIP  ${filename} — file not found`);
      continue;
    }

    const sizeBefore = fs.statSync(filePath).size;
    totalBefore += sizeBefore;

    // Write to a temp file first, then replace
    const tempPath = filePath + '.tmp';
    const ext = path.extname(filename).toLowerCase();

    try {
      let pipeline = sharp(filePath).resize({ width: opts.width, withoutEnlargement: true });

      if (ext === '.jpg' || ext === '.jpeg') {
        pipeline = pipeline.jpeg({ quality: opts.quality, mozjpeg: true });
      } else if (ext === '.png') {
        pipeline = pipeline.png({ compressionLevel: 9 });
      } else if (ext === '.webp') {
        pipeline = pipeline.webp({ quality: opts.quality });
      }

      await pipeline.toFile(tempPath);

      const sizeAfter = fs.statSync(tempPath).size;
      totalAfter += sizeAfter;

      // Only replace if compression actually made it smaller
      if (sizeAfter < sizeBefore) {
        fs.renameSync(tempPath, filePath);
        const saved = ((1 - sizeAfter / sizeBefore) * 100).toFixed(1);
        console.log(`OK    ${filename.padEnd(28)} ${kb(sizeBefore)} → ${kb(sizeAfter)}  (-${saved}%)`);
      } else {
        fs.unlinkSync(tempPath);
        console.log(`SKIP  ${filename.padEnd(28)} already optimized (${kb(sizeBefore)})`);
        totalAfter = totalAfter - sizeAfter + sizeBefore;
      }
    } catch (err) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      console.error(`ERR   ${filename}: ${err.message}`);
    }
  }

  console.log('');
  console.log(`Total before: ${kb(totalBefore)}`);
  console.log(`Total after:  ${kb(totalAfter)}`);
  console.log(`Total saved:  ${kb(totalBefore - totalAfter)} (${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%)`);
}

function kb(bytes) {
  return (bytes / 1024).toFixed(0).padStart(6) + ' KB';
}

compressImages();
