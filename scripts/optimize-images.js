const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const inputDir = path.join(__dirname, '..', 'assets', 'images');
const outDir = path.join(__dirname, '..', 'assets', 'optimized');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const sizes = [
  { suffix: 'sm', width: 480 },
  { suffix: 'md', width: 1024 },
  { suffix: 'lg', width: 1600 }
];

async function processFile(file) {
  const ext = path.extname(file).toLowerCase();
  const name = path.basename(file, ext);
  const inputPath = path.join(inputDir, file);

  for (const s of sizes) {
    const outName = `${name}-${s.suffix}${ext}`;
    const outPath = path.join(outDir, outName);
    try {
      await sharp(inputPath)
        .resize({ width: s.width })
        .jpeg({ quality: 82 })
        .toFile(outPath);
      console.log('Wrote', outPath);
    } catch (err) {
      console.error('Failed', inputPath, err.message);
    }
  }
}

fs.readdir(inputDir, (err, files) => {
  if (err) return console.error('Could not read images dir', err.message);
  const images = files.filter(f => /\.jpe?g|\.png|\.webp$/i.test(f));
  Promise.all(images.map(processFile)).then(() => console.log('Done'));
});
