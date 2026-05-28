const { app, nativeImage } = require("electron");
const fs = require("fs");
const path = require("path");

app.whenReady().then(() => {
    try {
        const buildDir = path.join(__dirname, "..", "build");
        const pngPath = path.join(buildDir, "icon.png");
        const icoPath = path.join(buildDir, "icon.ico");
        const assetsDir = path.join(__dirname, "..", "assets");
        const destPngPath = path.join(assetsDir, "app.png");

        console.log("Starting multi-size icon generation...");

        if (!fs.existsSync(pngPath)) {
            console.error(`Error: Source PNG file not found at: ${pngPath}`);
            process.exit(1);
        }

        if (!fs.existsSync(buildDir)) {
            fs.mkdirSync(buildDir, { recursive: true });
        }

        if (!fs.existsSync(assetsDir)) {
            fs.mkdirSync(assetsDir, { recursive: true });
        }

        // Copy icon.png to assets/app.png for renderer logos
        fs.copyFileSync(pngPath, destPngPath);
        console.log(`Successfully synced app.png to: ${destPngPath}`);

        // Load the image using Electron's nativeImage
        const image = nativeImage.createFromPath(pngPath);
        if (image.isEmpty()) {
            console.error(`Error: Failed to load image from: ${pngPath}`);
            process.exit(1);
        }

        // Define standard sizes for Windows ICO format
        const sizes = [16, 32, 48, 64, 128, 256];
        const pngBuffers = [];

        console.log("Resizing icon to standard dimensions...");
        for (const size of sizes) {
            const resized = image.resize({ width: size, height: size, quality: "better" });
            pngBuffers.push(resized.toPNG());
        }

        // Pack resized PNG buffers into ICO format
        const count = pngBuffers.length;
        const headerSize = 6;
        const dirSize = 16 * count;

        // ICO Header
        const header = Buffer.alloc(headerSize);
        header.writeUInt16LE(0, 0);   // Reserved (must be 0)
        header.writeUInt16LE(1, 2);   // Resource Type: 1 for ICO
        header.writeUInt16LE(count, 4); // Number of images

        const entries = [];
        let currentOffset = headerSize + dirSize;

        for (let i = 0; i < count; i++) {
            const buffer = pngBuffers[i];
            const size = sizes[i];
            const width = size >= 256 ? 0 : size;
            const height = size >= 256 ? 0 : size;

            // ICO Directory Entry (16 bytes)
            const entry = Buffer.alloc(16);
            entry.writeUInt8(width, 0);       // Width
            entry.writeUInt8(height, 1);      // Height
            entry.writeUInt8(0, 2);           // Color count: 0 (if no color palette used)
            entry.writeUInt8(0, 3);           // Reserved (must be 0)
            entry.writeUInt16LE(1, 4);        // Color planes: 1
            entry.writeUInt16LE(32, 6);       // Bits per pixel: 32
            entry.writeUInt32LE(buffer.length, 8); // Size of the PNG image data in bytes
            entry.writeUInt32LE(currentOffset, 12);  // Offset of PNG image data

            entries.push(entry);
            currentOffset += buffer.length;
        }

        const icoBuffer = Buffer.concat([header, ...entries, ...pngBuffers]);
        fs.writeFileSync(icoPath, icoBuffer);
        console.log(`Successfully generated valid multi-size Windows ICO at: ${icoPath}`);
        
        process.exit(0);
    } catch (err) {
        console.error("Failed to generate multi-size ICO:", err);
        process.exit(1);
    }
});
