'use strict';

/**
 * main.cjs — Punto de entrada del ejecutable empaquetado
 * Lanza el servidor Express/WS e inicializa el icono en la bandeja del sistema.
 */

const path     = require('path');
const fs       = require('fs');
const os       = require('os');
const { exec } = require('child_process');

// --- Constantes base ---

const IS_PKG  = typeof process.pkg !== 'undefined';
const EXE_DIR = IS_PKG ? path.dirname(process.execPath) : __dirname;

process.env.BIBLE_BASE_DIR = EXE_DIR;

const PORT        = 3000;
const PANEL_URL   = `http://localhost:${PORT}/panel.html`;
const OVERLAY_URL = `http://localhost:${PORT}/overlay.html`;
const LOG_FILE    = path.join(EXE_DIR, 'obs-bible-overlay.log');

// --- Log silencioso a archivo (sin popups) ---

function logError(label, err) {
  const msg = `[${new Date().toISOString()}] ${label}: ${err?.stack ?? err}\n`;
  try { fs.appendFileSync(LOG_FILE, msg); } catch (_) {}
  console.error(label, err);
}

// Capturar errores no manejados sin matar el proceso ni mostrar dialogs
process.on('uncaughtException',  (err) => logError('uncaughtException', err));
process.on('unhandledRejection', (err) => logError('unhandledRejection', err));

// --- Helpers de SO ---

function abrirNavegador(url) {
  exec(`start "" "${url}"`, { shell: 'cmd.exe' });
}

function copiarAlPortapapeles(text) {
  exec(`powershell -command "Set-Clipboard '${text}'"`, { shell: true });
}

function mostrarDialogo(mensaje, titulo) {
  const partes = mensaje
    .split('\n')
    .map((p) => `'${p.replace(/'/g, '')}'`)
    .join(' + [char]10 + ');
  exec(
    `powershell -command "Add-Type -AssemblyName PresentationFramework; ` +
    `[System.Windows.MessageBox]::Show(${partes}, '${titulo.replace(/'/g, '')}')"`,
    { shell: true }
  );
}

// --- Generación del ícono en formato ICO ---

function generarIco() {
  // 1. Generar el PNG 32x32 RGBA sin dependencias externas
  const zlib = require('zlib');
  const W = 32, H = 32;
  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let c = 0xffffffff;
    for (const b of buf) {
      c ^= b;
      for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
    return (c ^ 0xffffffff) >>> 0;
  }
  function pngChunk(type, data) {
    const t = Buffer.from(type, 'ascii');
    const len = Buffer.allocUnsafe(4); len.writeUInt32BE(data.length);
    const crcBuf = Buffer.allocUnsafe(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, crcBuf]);
  }

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = ihdr[11] = ihdr[12] = 0;

  const cx = W / 2, cy = H / 2, r = W / 2 - 1;
  const rows = [];
  for (let y = 0; y < H; y++) {
    const row = Buffer.allocUnsafe(1 + W * 4); row[0] = 0;
    for (let x = 0; x < W; x++) {
      const dx = x - cx + 0.5, dy = y - cy + 0.5, d = Math.sqrt(dx*dx + dy*dy);
      const i = 1 + x * 4;
      if (d > r)      { row[i]=row[i+1]=row[i+2]=row[i+3]=0; }
      else if (d>r-2) { row[i]=100; row[i+1]=160; row[i+2]=220; row[i+3]=255; }
      else            { row[i]=30;  row[i+1]=70;  row[i+2]=130; row[i+3]=255; }
    }
    rows.push(row);
  }

  const pngData = Buffer.concat([
    PNG_SIG,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(Buffer.concat(rows), { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);

  // 2. Envolver el PNG en un contenedor ICO (Windows Vista+ acepta PNG embebido)
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // type: 1 = icon
  icoHeader.writeUInt16LE(1, 4); // count: 1 imagen

  const dirEntry = Buffer.alloc(16);
  dirEntry[0] = 32;                              // width
  dirEntry[1] = 32;                              // height
  dirEntry[2] = 0;                               // color count (0 = 256+)
  dirEntry[3] = 0;                               // reserved
  dirEntry.writeUInt16LE(1, 4);                  // planes
  dirEntry.writeUInt16LE(32, 6);                 // bit depth
  dirEntry.writeUInt32LE(pngData.length, 8);     // tamaño de datos
  dirEntry.writeUInt32LE(6 + 16, 12);            // offset de datos (header + 1 entry)

  return Buffer.concat([icoHeader, dirEntry, pngData]);
}

function cargarIcono() {
  const icoPath = path.join(EXE_DIR, 'icon.ico');
  if (!fs.existsSync(icoPath)) {
    try { fs.writeFileSync(icoPath, generarIco()); } catch (e) { logError('generarIco', e); }
  }
  try { return fs.readFileSync(icoPath).toString('base64'); } catch (_) { return ''; }
}

// --- Main ---

async function main() {
  // 1. Iniciar el servidor Express + WebSocket
  // server.cjs exporta una Promise que resuelve cuando el puerto está activo.
  await require('./server.cjs');

  // 2. Abrir el panel en el navegador
  abrirNavegador(PANEL_URL);

  // 3. Inicializar bandeja del sistema (si falla, el servidor sigue corriendo)
  try {
    const SysTray = require('systray2').default;

    const INSTRUCCIONES_URL = `http://localhost:${PORT}/instructions.html`;

    const ITEMS = {
      PANEL:        'Abrir Panel',
      OVERLAY:      'Copiar URL Overlay',
      INSTRUCCIONES:'Instrucciones',
      ACERCA:       'Acerca de',
      SALIR:        'Salir',
    };

    const tray = new SysTray({
      menu: {
        icon:    cargarIcono(),
        title:   '',
        tooltip: 'OBS Bible Overlay',
        items: [
          { title: ITEMS.PANEL,         tooltip: PANEL_URL,         checked: false, enabled: true },
          { title: ITEMS.OVERLAY,       tooltip: OVERLAY_URL,       checked: false, enabled: true },
          { title: ITEMS.INSTRUCCIONES, tooltip: INSTRUCCIONES_URL, checked: false, enabled: true },
          { title: ITEMS.ACERCA,        tooltip: 'v0.1.0',          checked: false, enabled: true },
          SysTray.separator,
          { title: ITEMS.SALIR,         tooltip: '',                checked: false, enabled: true },
        ],
      },
      debug: false,
      copyDir: path.join(EXE_DIR, '.tray'),
    });

    tray.onClick((action) => {
      switch (action.item.title) {
        case ITEMS.PANEL:
          abrirNavegador(PANEL_URL);
          break;
        case ITEMS.OVERLAY:
          copiarAlPortapapeles(OVERLAY_URL);
          break;
        case ITEMS.INSTRUCCIONES:
          abrirNavegador(INSTRUCCIONES_URL);
          break;
        case ITEMS.ACERCA:
          mostrarDialogo(
            `OBS Bible Overlay v0.1.0\nAutor: Dani Acosta\nServidor en http://localhost:${PORT}`,
            'Bible Overlay'
          );
          break;
        case ITEMS.SALIR:
          tray.kill();
          process.exit(0);
          break;
      }
    });

    tray.onError((err) => logError('tray', err));

  } catch (err) {
    logError('tray-init', err);
    // El servidor sigue corriendo aunque el tray falle
  }
}

main().catch((err) => logError('main', err));
