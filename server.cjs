'use strict';

/**
 * Servidor principal — OBS Bible Overlay
 * Express + WebSocket en el mismo puerto (3000)
 * Versión CJS para compatibilidad con pkg.
 */

const express   = require('express');
const { WebSocketServer } = require('ws');
const { createServer }    = require('http');
const path = require('path');
const fs   = require('fs').promises;

// En CJS, __dirname ya está disponible de forma nativa.
// DATA_DIR se sobreescribe vía env var cuando corre dentro del .exe.
const PORT       = 3000;
const DATA_DIR   = path.join(process.env.BIBLE_BASE_DIR ?? __dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');

// --- Carga de datos bíblicos ---

const bibles = new Map();

const BIBLE_FILES = [
  { key: 'rv1909', file: 'rv1909.json' },
  { key: 'rv1960', file: 'rv1960.json' },
  { key: 'ntv',    file: 'ntv.json'    },
  { key: 'dhh',    file: 'dhh.json'    },
  { key: 'nvi',    file: 'nvi.json'    },
  { key: 'lbla',   file: 'lbla.json'   },
];

async function loadBibles() {
  for (const { key, file } of BIBLE_FILES) {
    const filePath = path.join(DATA_DIR, file);
    try {
      const raw  = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(raw);
      const bookIndex = new Map();
      for (const book of data.books) bookIndex.set(book.id, book);
      bibles.set(key, { ...data, bookIndex });
      console.log(`Biblia cargada: [${key}] ${data.version} — ${data.books.length} libros`);
    } catch {
      console.warn(`  [${key}] no encontrado (${file}) — omitido`);
    }
  }

  if (bibles.size === 0) {
    console.error('No se encontró ningún archivo de datos bíblicos. Ejecuta: npm run setup');
    process.exit(1);
  }
}

// --- Helpers ---

function getBible(vKey) {
  return bibles.get(vKey) ?? bibles.values().next().value;
}
function getBook(bible, bookId) {
  return bible.bookIndex.get(Number(bookId)) ?? null;
}
function getChapter(bible, bookId, chapterNum) {
  const book = getBook(bible, bookId);
  if (!book) return null;
  return book.chapters.find((c) => c.chapter === Number(chapterNum)) ?? null;
}
function getVerse(bible, bookId, chapterNum, verseNum) {
  const chapter = getChapter(bible, bookId, chapterNum);
  if (!chapter) return null;
  return chapter.verses.find((v) => v.verse === Number(verseNum)) ?? null;
}

// --- Estado del overlay ---

const overlayState = { css: '', font: '' };

// --- Bootstrap: exporta una Promise que resuelve cuando el servidor está listo ---

module.exports = (async () => {
  await loadBibles();

  const app    = express();
  const server = createServer(app);
  const wss    = new WebSocketServer({ server });

  app.use(express.static(PUBLIC_DIR));

  // API REST
  app.get('/api/versions', (_req, res) => {
    res.json([...bibles.entries()].map(([key, b]) => ({ key, label: b.version })));
  });

  app.get('/api/books', (req, res) => {
    const bible = getBible(req.query.v);
    res.json(bible.books.map(({ id, name, abbrev }) => ({ id, name, abbrev })));
  });

  app.get('/api/chapters', (req, res) => {
    const bible = getBible(req.query.v);
    const book  = getBook(bible, req.query.book);
    if (!book) return res.status(404).json({ error: 'Libro no encontrado' });
    res.json({ count: book.chapters.length });
  });

  app.get('/api/verses', (req, res) => {
    const bible   = getBible(req.query.v);
    const chapter = getChapter(bible, req.query.book, req.query.chapter);
    if (!chapter) return res.status(404).json({ error: 'Capítulo no encontrado' });
    res.json({ count: chapter.verses.length });
  });

  app.get('/api/chapter-verses', (req, res) => {
    const bible   = getBible(req.query.v);
    const chapter = getChapter(bible, req.query.book, req.query.chapter);
    if (!chapter) return res.status(404).json({ error: 'Capítulo no encontrado' });
    res.json(chapter.verses);
  });

  app.get('/api/verse', (req, res) => {
    const { book: bookId, chapter: chapNum, verse: verseNum, v } = req.query;
    const bible = getBible(v);
    const book  = getBook(bible, bookId);
    if (!book) return res.status(404).json({ error: 'Libro no encontrado' });
    const verseData = getVerse(bible, bookId, chapNum, verseNum);
    if (!verseData) return res.status(404).json({ error: 'Versículo no encontrado' });
    res.json({
      version: bible.version,
      book:    book.name,
      chapter: Number(chapNum),
      verse:   Number(verseNum),
      text:    verseData.text,
    });
  });

  // WebSocket
  function broadcast(message) {
    const payload = JSON.stringify(message);
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(payload);
    }
  }

  wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`Cliente conectado: ${ip} (total: ${wss.clients.size})`);

    if (overlayState.font) ws.send(JSON.stringify({ type: 'update_font', css: overlayState.font }));
    if (overlayState.css)  ws.send(JSON.stringify({ type: 'update_css',  css: overlayState.css  }));

    ws.on('message', (data) => {
      let msg;
      try { msg = JSON.parse(data.toString()); } catch { return; }

      if (msg.type === 'show_verse' || msg.type === 'hide_verse') {
        broadcast(msg);
      } else if (msg.type === 'update_css') {
        overlayState.css = msg.css;
        broadcast(msg);
      } else if (msg.type === 'update_font') {
        overlayState.font = msg.css;
        broadcast(msg);
      }
    });

    ws.on('close', () => console.log(`Cliente desconectado (total: ${wss.clients.size})`));
    ws.on('error', (err) => console.error('Error WebSocket:', err.message));
  });

  // Arranque — resolver la Promise cuando el puerto esté activo
  await new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`Servidor en http://localhost:${PORT}`);
      console.log(`  Overlay: http://localhost:${PORT}/overlay.html`);
      console.log(`  Panel:   http://localhost:${PORT}/panel.html`);
      resolve();
    });
  });
})();
