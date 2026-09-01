import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Intrinsic pixel size of an image in /public, read straight from its header.
 *
 * The case grid sizes every tile from the real proportions of its photo rather
 * than cropping to a designed aspect ratio, so it needs width/height at render
 * time. Static `import` would give us that for free, but the images are named
 * by string in data/models.js, so we parse the headers instead — a few dozen
 * lines beats a dependency, and it stays correct when the artwork is swapped.
 *
 * Server-only: this touches the filesystem.
 */

// JPEG: walk the marker chain to the start-of-frame, which carries the size.
function jpegSize(buf) {
  let i = 2; // skip SOI
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    // SOF0–SOF15, minus the DHT/JPG/DAC markers that share the range.
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    ) {
      return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
    }
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
      i += 2; // standalone marker, no payload
      continue;
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

// PNG: IHDR is always the first chunk, at a fixed offset.
function pngSize(buf) {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

// WebP: three container flavours, each storing the size differently.
function webpSize(buf) {
  const chunk = buf.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    return {
      width: 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16)),
      height: 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16)),
    };
  }
  if (chunk === "VP8 ") {
    return {
      width: buf.readUInt16LE(26) & 0x3fff,
      height: buf.readUInt16LE(28) & 0x3fff,
    };
  }
  if (chunk === "VP8L") {
    const bits = buf.readUInt32LE(21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
  }
  return null;
}

export async function imageSize(publicPath) {
  try {
    const file = path.join(
      process.cwd(),
      "public",
      publicPath.replace(/^\//, "")
    );
    const buf = await readFile(file);

    if (buf.readUInt16BE(0) === 0xffd8) return jpegSize(buf);
    if (buf.toString("ascii", 1, 4) === "PNG") return pngSize(buf);
    if (buf.toString("ascii", 0, 4) === "RIFF") return webpSize(buf);
    return null;
  } catch {
    return null;
  }
}
