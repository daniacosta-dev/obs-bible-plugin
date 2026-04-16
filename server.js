/**
 * Servidor principal — OBS Bible Overlay
 * Express + WebSocket en el mismo puerto (3000)
 * Soporta múltiples versiones de la Biblia (rv1909, rv1960, …)
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
// Cuando corre dentro del .exe (pkg), BIBLE_BASE_DIR apunta al directorio real
// junto al ejecutable donde vive data/. En desarrollo, usa __dirname.
const DATA_DIR   = path.join(process.env.BIBLE_BASE_DIR ?? __dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');

// --- Carga de datos bíblicos ---

// bibles: Map<versionKey, { version, lang, books, bookIndex }>
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
      const raw = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(raw);

      const bookIndex = new Map();
      for (const book of data.books) {
        bookIndex.set(book.id, book);
      }

      bibles.set(key, { ...data, bookIndex });
      console.log(`Biblia cargada: [${key}] ${data.version} — ${data.books.length} libros`);
    } catch {
      // Silencioso si el archivo no existe; solo se advierte
      console.warn(`  [${key}] no encontrado (${file}) — omitido`);
    }
  }

  if (bibles.size === 0) {
    console.error('No se encontró ningún archivo de datos bíblicos. Ejecutá: npm run setup');
    process.exit(1);
  }
}

// --- Helpers ---

function getBible(vKey) {
  // Si se pide una versión específica y existe, usarla; si no, la primera disponible
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

// --- Inicialización ---

await loadBibles();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(PUBLIC_DIR));

// --- API REST ---

// GET /api/versions → [{ key, label }]
app.get('/api/versions', (_req, res) => {
  const versions = [...bibles.entries()].map(([key, b]) => ({ key, label: b.version }));
  res.json(versions);
});

// GET /api/books?v=rv1960 → [{ id, name, abbrev }]
app.get('/api/books', (req, res) => {
  const bible = getBible(req.query.v);
  const books = bible.books.map(({ id, name, abbrev }) => ({ id, name, abbrev }));
  res.json(books);
});

// GET /api/chapters?book=1&v=rv1960 → { count: 50 }
app.get('/api/chapters', (req, res) => {
  const bible = getBible(req.query.v);
  const book = getBook(bible, req.query.book);
  if (!book) return res.status(404).json({ error: 'Libro no encontrado' });
  res.json({ count: book.chapters.length });
});

// GET /api/verses?book=1&chapter=1&v=rv1960 → { count: 31 }
app.get('/api/verses', (req, res) => {
  const bible = getBible(req.query.v);
  const chapter = getChapter(bible, req.query.book, req.query.chapter);
  if (!chapter) return res.status(404).json({ error: 'Capítulo no encontrado' });
  res.json({ count: chapter.verses.length });
});

// GET /api/chapter-verses?book=1&chapter=1&v=rv1960 → [{ verse, text }]
app.get('/api/chapter-verses', (req, res) => {
  const bible = getBible(req.query.v);
  const chapter = getChapter(bible, req.query.book, req.query.chapter);
  if (!chapter) return res.status(404).json({ error: 'Capítulo no encontrado' });
  res.json(chapter.verses);
});

// GET /api/verse?book=1&chapter=1&verse=1&v=rv1960 → { version, book, chapter, verse, text }
app.get('/api/verse', (req, res) => {
  const { book: bookId, chapter: chapNum, verse: verseNum, v } = req.query;
  const bible = getBible(v);
  const book = getBook(bible, bookId);
  if (!book) return res.status(404).json({ error: 'Libro no encontrado' });

  const verseData = getVerse(bible, bookId, chapNum, verseNum);
  if (!verseData) return res.status(404).json({ error: 'Versículo no encontrado' });

  res.json({
    version: bible.version,
    book: book.name,
    chapter: Number(chapNum),
    verse: Number(verseNum),
    text: verseData.text,
  });
});

// --- Estado del overlay (persiste mientras el servidor esté corriendo) ---

const overlayState = {
  css:  '',   // último CSS personalizado aplicado
  font: '',   // último CSS de tipografía aplicado
};

// --- WebSocket ---

function broadcast(message) {
  const payload = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
}

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`Cliente conectado: ${ip} (total: ${wss.clients.size})`);

  // Enviar estado actual al cliente recién conectado (restaura apariencia en overlay)
  if (overlayState.font) ws.send(JSON.stringify({ type: 'update_font', css: overlayState.font }));
  if (overlayState.css)  ws.send(JSON.stringify({ type: 'update_css',  css: overlayState.css  }));

  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

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

  ws.on('close', () => {
    console.log(`Cliente desconectado (total: ${wss.clients.size})`);
  });

  ws.on('error', (err) => {
    console.error('Error WebSocket:', err.message);
  });
});

// --- Arranque ---

server.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
  console.log(`  Overlay: http://localhost:${PORT}/overlay.html`);
  console.log(`  Panel:   http://localhost:${PORT}/panel.html`);
});
