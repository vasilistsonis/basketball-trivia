/** Regenerate the Hoops Trivia iOS assets with Node only. No network or fonts required. */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const assets = fileURLToPath(new URL('../ios/App/App/Assets.xcassets/', import.meta.url));
const ink = [17, 17, 17];
const orange = [232, 93, 30];
const paper = [242, 238, 229];

const crcTable = Uint32Array.from({ length: 256 }, (_, n) => {
  for (let bit = 0; bit < 8; bit++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});

function chunk(type, data) {
  const name = Buffer.from(type);
  const output = Buffer.alloc(12 + data.length);
  output.writeUInt32BE(data.length, 0);
  name.copy(output, 4);
  data.copy(output, 8);
  let crc = 0xffffffff;
  for (const byte of Buffer.concat([name, data])) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  output.writeUInt32BE((crc ^ 0xffffffff) >>> 0, 8 + data.length);
  return output;
}

function encodeRGB(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 2; // RGB: App Store app icons must not have an alpha channel.
  const rows = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) pixels.copy(rows, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function basketball(size, isIcon) {
  const pixels = Buffer.alloc(size * size * 3);
  const background = isIcon ? ink : paper;
  const radius = isIcon ? 360 : 464;
  const seamWidth = radius * 0.065;
  const angle = -Math.PI / 12;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const sampleOffsets = [0.25, 0.75];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sum = [0, 0, 0];
      for (const dy of sampleOffsets) {
        for (const dx of sampleOffsets) {
          const u = ((x + dx) / size - 0.5) * 1024;
          const v = ((y + dy) / size - 0.5) * 1024;
          const rx = u * cos - v * sin;
          const ry = u * sin + v * cos;
          const distance = Math.hypot(rx, ry);
          let color = background;
          if (distance <= radius) {
            const sideSeam = Math.abs(Math.hypot(Math.abs(rx) - radius * 1.35, ry) - radius * 0.96);
            const isSeam = distance >= radius - seamWidth
              || Math.abs(rx) <= seamWidth / 2
              || Math.abs(ry) <= seamWidth / 2
              || sideSeam <= seamWidth / 2;
            color = isSeam ? ink : orange;
          }
          for (let channel = 0; channel < 3; channel++) sum[channel] += color[channel];
        }
      }
      const offset = (y * size + x) * 3;
      for (let channel = 0; channel < 3; channel++) pixels[offset + channel] = Math.round(sum[channel] / 4);
    }
  }
  return encodeRGB(size, pixels);
}

await mkdir(join(assets, 'AppIcon.appiconset'), { recursive: true });
await mkdir(join(assets, 'Splash.imageset'), { recursive: true });
await writeFile(join(assets, 'AppIcon.appiconset', 'AppIcon-512@2x.png'), basketball(1024, true));
for (const [filename, size] of [
  ['splash-2732x2732-2.png', 128],
  ['splash-2732x2732-1.png', 256],
  ['splash-2732x2732.png', 384],
]) {
  // Existing catalog filenames are retained to keep the native asset references stable.
  await writeFile(join(assets, 'Splash.imageset', filename), basketball(size, false));
}
console.log('Created opaque 1024px app icon and 128pt launch mark at 1x, 2x and 3x.');
