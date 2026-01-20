const fs = require("fs");
const path = require("path");
const pngToIco = require("png-to-ico");

const src = path.join(__dirname, "..", "images", "mountify.png");
const dest = path.join(__dirname, "..", "images", "mountify.ico");

if (!fs.existsSync(src)) {
  console.error("Source PNG not found:", src);
  process.exit(1);
}

pngToIco(src)
  .then((buf) => {
    fs.writeFileSync(dest, buf);
    console.log("Created ICO at", dest);
  })
  .catch((err) => {
    console.error("Failed to create ICO:", err);
    process.exit(1);
  });
