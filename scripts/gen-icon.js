const { exec } = require('child_process');
const path = require('path');

const src = path.join(__dirname, '..', 'images', 'mountify.png');
const dest = path.join(__dirname, '..', 'images', 'mountify.ico');

// Use ImageMagick `magick` to auto-resize and create .ico
const cmd = `magick "${src}" -define icon:auto-resize=256,128,64,48,32,16 "${dest}"`;

console.log('Running:', cmd);
exec(cmd, (err, stdout, stderr) => {
  if (err) {
    console.error('Failed to generate .ico automatically.');
    console.error('Error:', err.message);
    if (stderr) console.error(stderr);
    console.log('If you do not have ImageMagick installed, you can create the .ico manually with:');
    console.log(`magick ${src} -define icon:auto-resize=256,128,64,48,32,16 ${dest}`);
    process.exit(1);
  }
  console.log('mountify.ico created at', dest);
  console.log(stdout);
});
