/**
 * assemble-dist.js — Arma la carpeta distribuible después del build.
 * Copia el .exe, el icon.png y la carpeta data/ a dist/obs-bible-overlay/
 */

import { cpSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT  = path.join(ROOT, 'dist', 'obs-bible-overlay');

mkdirSync(OUT, { recursive: true });

// Ejecutable
cpSync(
  path.join(ROOT, 'dist', 'obs-bible-overlay.exe'),
  path.join(OUT, 'obs-bible-overlay.exe')
);

// Ícono
const iconSrc = path.join(ROOT, 'icon.png');
if (existsSync(iconSrc)) {
  cpSync(iconSrc, path.join(OUT, 'icon.png'));
} else {
  console.warn('icon.png no encontrado — ejecutá: npm run create-icon');
}

// Biblias
const dataSrc = path.join(ROOT, 'data');
if (existsSync(dataSrc)) {
  cpSync(dataSrc, path.join(OUT, 'data'), { recursive: true });
} else {
  console.warn('Carpeta data/ no encontrada — ejecutá los scripts de setup primero.');
}

console.log('\nDistribuible listo en dist/obs-bible-overlay/');
console.log('Contenido:');
console.log('  obs-bible-overlay.exe');
console.log('  icon.png');
console.log('  data/  (archivos de Biblias)');
