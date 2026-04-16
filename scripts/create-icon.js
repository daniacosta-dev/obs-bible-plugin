/**
 * create-icon.js — Genera icon.png (32x32) sin dependencias externas.
 * Crea un círculo azul oscuro con una "B" estilizada en el centro.
 * Reemplazá icon.png con tu propio ícono si querés un diseño personalizado.
 */

import { deflateSync } from 'zlib';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'icon.png');

const W = 32, H = 32;

// PNG helpers
const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) {
    crc ^= b;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const t   = Buffer.from(type, 'ascii');
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(data.length);
  const crcInput = Buffer.concat([t, data]);
  const crc = Buffer.allocUnsafe(4); crc.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([len, t, data, crc]);
}

// IHDR: 32x32, 8-bit RGBA
const ihdr = Buffer.allocUnsafe(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8]  = 8; // bit depth
ihdr[9]  = 6; // color type: RGBA
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace

// Pixel data: círculo azul con borde más claro
const cx = W / 2, cy = H / 2, r = W / 2 - 1;
const rows = [];

for (let y = 0; y < H; y++) {
  const row = Buffer.allocUnsafe(1 + W * 4);
  row[0] = 0; // filtro de fila: None
  for (let x = 0; x < W; x++) {
    const dx = x - cx + 0.5, dy = y - cy + 0.5;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const i = 1 + x * 4;

    if (dist > r) {
      // Transparente fuera del círculo
      row[i] = row[i+1] = row[i+2] = row[i+3] = 0;
    } else if (dist > r - 2) {
      // Borde: azul claro
      row[i] = 100; row[i+1] = 160; row[i+2] = 220; row[i+3] = 255;
    } else {
      // Interior: azul oscuro
      row[i] = 30; row[i+1] = 70; row[i+2] = 130; row[i+3] = 255;
    }
  }
  rows.push(row);
}

const raw        = Buffer.concat(rows);
const compressed = deflateSync(raw, { level: 9 });

const png = Buffer.concat([
  PNG_SIG,
  pngChunk('IHDR', ihdr),
  pngChunk('IDAT', compressed),
  pngChunk('IEND', Buffer.alloc(0)),
]);

writeFileSync(OUT, png);
console.log(`icon.png creado en ${OUT}`);
