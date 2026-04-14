/**
 * Servidor principal — OBS Bible Overlay
 * Express + WebSocket en el mismo puerto (3000)
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const BIBLE_FILE = path.join(__dirname, 'data', 'rv1909.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// --- Carga de datos bíblicos ---

let bibleData = null; // { version, lang, books: [...] }
let bookIndex = null; // Map: bookId → libro completo

async function loadBible() {
  try {
    const raw = await fs.readFile(BIBLE_FILE, 'utf8');
    bibleData = JSON.parse(raw);
  } catch {
    console.error('Datos bíblicos no encontrados. Ejecutá: npm run setup');
    process.exit(1);
  }

  // Construir índice para búsqueda rápida
  bookIndex = new Map();
  for (const book of bibleData.books) {
    bookIndex.set(book.id, book);
  }

  console.log(`Biblia cargada: ${bibleData.version} — ${bibleData.books.length} libros`);
}

// --- Helpers de búsqueda ---

function getBook(bookId) {
  return bookIndex.get(Number(bookId)) ?? null;
}

function getChapter(bookId, chapterNum) {
  const book = getBook(bookId);
  if (!book) return null;
  return book.chapters.find((c) => c.chapter === Number(chapterNum)) ?? null;
}

function getVerse(bookId, chapterNum, verseNum) {
  const chapter = getChapter(bookId, chapterNum);
  if (!chapter) return null;
  return chapter.verses.find((v) => v.verse === Number(verseNum)) ?? null;
}

// --- Inicialización ---

await loadBible();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Servir archivos estáticos desde /public
app.use(express.static(PUBLIC_DIR));

// --- API REST ---

// GET /api/books → [{ id, name, abbrev }]
app.get('/api/books', (_req, res) => {
  const books = bibleData.books.map(({ id, name, abbrev }) => ({ id, name, abbrev }));
  res.json(books);
});

// GET /api/chapters?book=1 → { count: 50 }
app.get('/api/chapters', (req, res) => {
  const book = getBook(req.query.book);
  if (!book) return res.status(404).json({ error: 'Libro no encontrado' });
  res.json({ count: book.chapters.length });
});

// GET /api/verses?book=1&chapter=1 → { count: 31 }
app.get('/api/verses', (req, res) => {
  const chapter = getChapter(req.query.book, req.query.chapter);
  if (!chapter) return res.status(404).json({ error: 'Capítulo no encontrado' });
  res.json({ count: chapter.verses.length });
});

// GET /api/chapter-verses?book=1&chapter=1 → [{ verse, text }]
// Devuelve todos los versículos de un capítulo con su texto (para la lista de previsualización)
app.get('/api/chapter-verses', (req, res) => {
  const chapter = getChapter(req.query.book, req.query.chapter);
  if (!chapter) return res.status(404).json({ error: 'Capítulo no encontrado' });
  res.json(chapter.verses);
});

// GET /api/verse?book=1&chapter=1&verse=1 → { version, book, chapter, verse, text }
app.get('/api/verse', (req, res) => {
  const { book: bookId, chapter: chapNum, verse: verseNum } = req.query;
  const book = getBook(bookId);
  if (!book) return res.status(404).json({ error: 'Libro no encontrado' });

  const verseData = getVerse(bookId, chapNum, verseNum);
  if (!verseData) return res.status(404).json({ error: 'Versículo no encontrado' });

  res.json({
    version: bibleData.version,
    book: book.name,
    chapter: Number(chapNum),
    verse: Number(verseNum),
    text: verseData.text,
  });
});

// --- WebSocket ---

// Difundir mensaje a todos los clientes conectados
function broadcast(message) {
  const payload = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === 1) { // OPEN
      client.send(payload);
    }
  }
}

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`Cliente conectado: ${ip} (total: ${wss.clients.size})`);

  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return; // Ignorar mensajes mal formados
    }

    // El panel envía mensajes que el servidor re-difunde a la overlay
    if (msg.type === 'show_verse' || msg.type === 'hide_verse' || msg.type === 'update_css') {
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
