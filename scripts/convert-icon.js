const fs = require("fs");
const path = require("path");

try {
    const buildDir = path.join(__dirname, "..", "build");
    const pngPath = path.join(buildDir, "icon.png");
    const icoPath = path.join(buildDir, "icon.ico");
    const assetsDir = path.join(__dirname, "..", "assets");
    const destPngPath = path.join(assetsDir, "app.png");

    console.log("Starting icon processing...");

    if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir, { recursive: true });
    }

    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }

    // Check if source PNG exists and copy to assets
    if (fs.existsSync(pngPath)) {
        fs.copyFileSync(pngPath, destPngPath);
        console.log(`Successfully synced app.png to: ${destPngPath}`);
    } else {
        console.warn(`Source PNG file not found at: ${pngPath}`);
    }

    // Check if ICO already exists or create a dummy one if needed
    if (!fs.existsSync(icoPath) && fs.existsSync(pngPath)) {
        console.log("Note: ICO generation requires Electron runtime. Using PNG as fallback.");
        fs.copyFileSync(pngPath, icoPath.replace('.ico', '.png'));
    }

    console.log("Icon processing completed successfully.");
    process.exit(0);
} catch (err) {
    console.error("Icon processing failed:", err.message);
    process.exit(1);
}
