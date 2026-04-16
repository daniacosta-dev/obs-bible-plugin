/**
 * scripts/build.js — Pipeline completo de build
 * 1. Genera icon.ico
 * 2. Bundlea server.js (ESM) → server.bundle.cjs (CJS) con esbuild
 * 3. Compila el .exe con pkg
 */

import { buildSync } from 'esbuild';
import { execFileSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ── Paso 1: ícono ────────────────────────────────────────────
console.log('[1/3] Generando ícono...');
execFileSync(process.execPath, [path.join(__dirname, 'create-icon.js')], { stdio: 'inherit' });

// ── Paso 2: bundle ESM → CJS ─────────────────────────────────
console.log('[2/3] Bundleando server.js con esbuild...');
buildSync({
  entryPoints: [path.join(ROOT, 'server.js')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: path.join(ROOT, 'server.bundle.cjs'),
  // Dejar express y ws como externos: pkg los incluye desde node_modules
  packages: 'external',
  // Mantener import.meta.url funcional dentro del snapshot de pkg
  define: {},
});
console.log('    → server.bundle.cjs generado');

// ── Paso 3: pkg ──────────────────────────────────────────────
console.log('[3/3] Compilando ejecutable con pkg...');
execFileSync(
  process.execPath,
  [
    path.join(ROOT, 'node_modules', '@yao-pkg', 'pkg', 'lib-es5', 'bin.js'),
    'main.cjs',
    '--config', 'pkg.config.json',
    '--target', 'node22-win-x64',
    '--output', path.join(ROOT, 'dist', 'obs-bible-overlay.exe'),
  ],
  { cwd: ROOT, stdio: 'inherit' }
);

// Limpiar bundle temporal
try { unlinkSync(path.join(ROOT, 'server.bundle.cjs')); } catch (_) {}

console.log('\nBuild completado → dist/obs-bible-overlay.exe');
