/**
 * Panel de control — OBS Bible Overlay
 */

// --- Tipografías disponibles ---

const GOOGLE_FONTS = [
  // Sistema (sin carga externa)
  { key: 'georgia',     name: 'Georgia',             family: "'Georgia', serif",              url: null,  group: 'Sistema' },
  { key: 'arial',       name: 'Arial',               family: "'Arial', sans-serif",           url: null,  group: 'Sistema' },
  // Serif
  { key: 'playfair',    name: 'Playfair Display',    family: "'Playfair Display', serif",     url: 'Playfair+Display:ital,wght@0,400;0,700;1,400',          group: 'Serif' },
  { key: 'lora',        name: 'Lora',                family: "'Lora', serif",                 url: 'Lora:ital,wght@0,400;0,600;1,400',                      group: 'Serif' },
  { key: 'merriweather',name: 'Merriweather',        family: "'Merriweather', serif",          url: 'Merriweather:ital,wght@0,300;0,400;1,300',              group: 'Serif' },
  { key: 'eb-garamond', name: 'EB Garamond',         family: "'EB Garamond', serif",           url: 'EB+Garamond:ital,wght@0,400;0,500;1,400',               group: 'Serif' },
  { key: 'cormorant',   name: 'Cormorant Garamond',  family: "'Cormorant Garamond', serif",    url: 'Cormorant+Garamond:ital,wght@0,400;0,600;1,400',        group: 'Serif' },
  { key: 'cinzel',      name: 'Cinzel',              family: "'Cinzel', serif",                url: 'Cinzel:wght@400;600;700',                               group: 'Serif' },
  // Sans-serif
  { key: 'inter',       name: 'Inter',               family: "'Inter', sans-serif",           url: 'Inter:ital,opsz,wght@0,14,300;0,14,400;0,14,600;1,14,400', group: 'Sans-serif' },
  { key: 'montserrat',  name: 'Montserrat',          family: "'Montserrat', sans-serif",      url: 'Montserrat:ital,wght@0,300;0,400;0,600;1,400',          group: 'Sans-serif' },
  { key: 'poppins',     name: 'Poppins',             family: "'Poppins', sans-serif",         url: 'Poppins:ital,wght@0,300;0,400;0,600;1,400',             group: 'Sans-serif' },
  { key: 'raleway',     name: 'Raleway',             family: "'Raleway', sans-serif",         url: 'Raleway:ital,wght@0,300;0,400;0,600;1,400',             group: 'Sans-serif' },
  { key: 'nunito',      name: 'Nunito',              family: "'Nunito', sans-serif",          url: 'Nunito:ital,wght@0,300;0,400;0,600;1,300',              group: 'Sans-serif' },
];

const FONT_KEY = 'bible-overlay-font';

// Conjunto de fuentes ya cargadas en el panel (evita <link> duplicados)
const loadedFonts = new Set();

/** Carga una fuente Google en el <head> del panel (para la preview) */
function cargarFuenteEnPanel(font) {
  if (!font.url || loadedFonts.has(font.key)) return;
  const link = document.createElement('link');
  link.rel  = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${font.url}&display=swap`;
  document.head.appendChild(link);
  loadedFonts.add(font.key);
}

/** Genera el CSS que se inyecta en el overlay para la fuente */
function generarCssFuente(font) {
  // Apunta tanto a la variable como directamente a los elementos,
  // para ganar frente a cualquier preset que también defina --verse-font-family.
  const vars    = `:root { --verse-font-family: ${font.family}; }`;
  const direct  = `#verse-text, #verse-ref { font-family: ${font.family} !important; }`;
  const body    = `${vars}\n${direct}`;

  if (font.url) {
    return `@import url('https://fonts.googleapis.com/css2?family=${font.url}&display=swap');\n${body}`;
  }
  return body;
}

/** Aplica la fuente seleccionada: carga en panel, envia al overlay, actualiza preview */
function aplicarFuente(fontKey) {
  const font = GOOGLE_FONTS.find((f) => f.key === fontKey);
  if (!font) return;

  cargarFuenteEnPanel(font);

  const css = generarCssFuente(font);
  enviar({ type: 'update_font', css });

  // Actualizar preview del panel
  const previewEl = document.getElementById('font-preview-text');
  if (previewEl) previewEl.style.fontFamily = font.family;

  localStorage.setItem(FONT_KEY, fontKey);
}

// --- Presets de CSS ---

const PRESET_CLASICO = `:root {
  --verse-font-family: 'Georgia', serif;
  --verse-font-size: 2.2rem;
  --verse-color: #ffffff;
  --ref-color: #ffe08a;
  --bg-color: rgba(0,0,0,0.55);
  --overlay-position-bottom: 10%;
}`;

const PRESET_GRANDE = `:root {
  --verse-font-family: 'Arial', sans-serif;
  --verse-font-size: 3.2rem;
  --verse-font-weight: 700;
  --verse-color: #ffffff;
  --ref-color: #ffffff;
  --bg-color: rgba(0,0,0,0.75);
  --overlay-position-bottom: 5%;
}`;

const PRESET_OSCURO = `:root {
  --verse-font-family: 'Georgia', serif;
  --verse-font-size: 2.4rem;
  --verse-color: #f0e6c8;
  --ref-color: #c9a84c;
  --bg-color: rgba(10,10,10,0.88);
  --bg-border-radius: 4px;
  --overlay-padding: 2.4rem 3rem;
}`;

// Presets modernos

const PRESET_GLASS = `:root {
  --verse-font-family: 'Segoe UI', system-ui, sans-serif;
  --verse-font-size: 2.2rem;
  --verse-font-weight: 300;
  --verse-line-height: 1.7;
  --verse-color: #ffffff;
  --ref-color: rgba(255,255,255,0.65);
  --bg-color: rgba(255,255,255,0.1);
  --bg-border-radius: 16px;
  --overlay-padding: 2rem 2.8rem;
  --overlay-position-bottom: 10%;
  --verse-text-shadow: 0 1px 6px rgba(0,0,0,0.5);
}
#verse-box {
  border: 1px solid rgba(255,255,255,0.22);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}`;

const PRESET_LOWER_THIRD = `:root {
  --verse-font-family: 'Segoe UI', system-ui, sans-serif;
  --verse-font-size: 1.9rem;
  --verse-font-weight: 400;
  --verse-line-height: 1.5;
  --verse-color: #ffffff;
  --ref-color: #7eb8ff;
  --bg-color: rgba(8,18,38,0.88);
  --bg-border-radius: 0px;
  --overlay-padding: 1.4rem 2.4rem;
  --verse-text-shadow: none;
}
#overlay-root {
  padding-bottom: 0;
}
#verse-box {
  width: 100%;
  max-width: 100%;
  border-left: 5px solid #4d9ce0;
  box-shadow: 0 -4px 24px rgba(0,0,0,0.5);
}`;

const PRESET_CINEMATICO = `:root {
  --verse-font-family: 'Georgia', serif;
  --verse-font-size: 2.6rem;
  --verse-font-weight: 400;
  --verse-line-height: 1.75;
  --verse-color: #f5f0e8;
  --ref-color: rgba(245,240,232,0.5);
  --bg-color: rgba(0,0,0,0.72);
  --bg-border-radius: 0px;
  --overlay-padding: 2.8rem 5vw;
  --verse-text-shadow: 0 2px 12px rgba(0,0,0,0.8);
}
#overlay-root {
  align-items: center;
  padding-bottom: 0;
}
#verse-box {
  width: 100%;
  max-width: 100%;
  text-align: center;
  box-shadow: 0 0 80px rgba(0,0,0,0.6);
}
#verse-ref {
  letter-spacing: 0.15em;
  text-transform: uppercase;
  font-size: 1rem;
}`;

const PRESET_MINIMAL = `:root {
  --verse-font-family: 'Georgia', serif;
  --verse-font-size: 2.8rem;
  --verse-font-weight: 400;
  --verse-line-height: 1.65;
  --verse-color: #ffffff;
  --ref-color: rgba(255,255,255,0.6);
  --bg-color: transparent;
  --bg-border-radius: 0px;
  --overlay-padding: 2rem 3rem;
  --overlay-position-bottom: 12%;
  --verse-text-shadow: 0 2px 16px rgba(0,0,0,0.95), 0 0 48px rgba(0,0,0,0.7);
}
#verse-box {
  box-shadow: none;
}`;

const PRESET_NEON = `:root {
  --verse-font-family: 'Segoe UI', system-ui, sans-serif;
  --verse-font-size: 2.2rem;
  --verse-font-weight: 300;
  --verse-line-height: 1.65;
  --verse-color: #e0f0ff;
  --ref-color: #64b5f6;
  --bg-color: rgba(4,12,26,0.9);
  --bg-border-radius: 8px;
  --overlay-padding: 2rem 2.8rem;
  --overlay-position-bottom: 10%;
  --verse-text-shadow: 0 0 20px rgba(100,181,246,0.35);
}
#verse-box {
  border: 1px solid rgba(100,181,246,0.35);
  box-shadow:
    0 0 32px rgba(100,181,246,0.12),
    inset 0 0 32px rgba(100,181,246,0.04);
}`;

const PRESET_TARJETA = `:root {
  --verse-font-family: 'Segoe UI', system-ui, sans-serif;
  --verse-font-size: 2rem;
  --verse-font-weight: 400;
  --verse-line-height: 1.7;
  --verse-color: #1a1f2e;
  --ref-color: #4a6080;
  --bg-color: rgba(248,250,255,0.96);
  --bg-border-radius: 12px;
  --overlay-padding: 2rem 2.8rem;
  --overlay-position-bottom: 10%;
  --verse-text-shadow: none;
}
#verse-box {
  box-shadow: 0 20px 60px rgba(0,0,0,0.55);
  border-top: 4px solid #4d9ce0;
}`;

// --- Referencias DOM ---

const selVersion     = document.getElementById('sel-version');
const selBook        = document.getElementById('sel-book');
const selChapter     = document.getElementById('sel-chapter');
const verseListEl    = document.getElementById('verse-list');
const verseCountEl   = document.getElementById('verse-count');
const preview        = document.getElementById('verse-preview');
const btnShow        = document.getElementById('btn-show');
const btnHide        = document.getElementById('btn-hide');
const btnPrev        = document.getElementById('btn-prev');
const btnNext        = document.getElementById('btn-next');
const btnAddSession  = document.getElementById('btn-add-session');
const btnClear       = document.getElementById('btn-clear');
const sessionListEl  = document.getElementById('session-list');
const sessionCountEl = document.getElementById('session-count');
const btnClearSession = document.getElementById('btn-clear-session');
const btnApplyCss    = document.getElementById('btn-apply-css');
const wsDot          = document.getElementById('ws-dot');

// --- Estado ---

let currentVerse = null;        // versículo seleccionado en la lista
let chapterVerses = [];         // todos los versículos del capítulo activo
let books = [];                 // lista completa de libros
let totalChapters = 0;          // total de capítulos del libro activo
let currentVersionKey = '';     // clave de la versión activa (ej. 'rv1960')
let currentVersionLabel = '';   // nombre completo (ej. 'Reina-Valera 1960')
let cssEditor = null;           // instancia de CodeMirror

// Sesión persistida en localStorage (sobrevive refrescos del panel)
// Solo guarda la referencia { bookId, book, chapter, verse } — sin texto ni versión
let session = (() => {
  try {
    const raw = JSON.parse(localStorage.getItem('bible-session') || '[]');
    // Migración: si había datos viejos con text/version, descartar esos campos
    return raw.map(({ bookId, book, chapter, verse }) => ({ bookId, book, chapter, verse }));
  }
  catch { return []; }
})();

// --- WebSocket ---

let ws = null;
let reconnectTimer = null;

function conectarWS() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }

  ws = new WebSocket('ws://localhost:3000');

  ws.addEventListener('open', () => {
    wsDot.classList.add('connected');
    wsDot.title = 'Conectado';
  });
  ws.addEventListener('close', () => {
    wsDot.classList.remove('connected');
    wsDot.title = 'Desconectado — reconectando...';
    reconnectTimer = setTimeout(conectarWS, 3000);
  });
  ws.addEventListener('error', () => ws.close());
}

function enviar(msg) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

// --- Carga de versiones ---

async function cargarVersiones() {
  try {
    const versions = await fetch('/api/versions').then((r) => r.json());
    selVersion.innerHTML = '';
    for (const v of versions) {
      const opt = document.createElement('option');
      opt.value = v.key;
      opt.textContent = v.label;
      selVersion.appendChild(opt);
    }
    // Activar la primera versión disponible
    currentVersionKey   = selVersion.value;
    currentVersionLabel = selVersion.options[selVersion.selectedIndex]?.textContent ?? '';
  } catch {
    selVersion.innerHTML = '<option value="">Error al cargar</option>';
  }
}

selVersion.addEventListener('change', () => {
  currentVersionKey   = selVersion.value;
  currentVersionLabel = selVersion.options[selVersion.selectedIndex]?.textContent ?? '';
  // Resetear todo y recargar los libros de la versión elegida
  selBook.value = '';
  resetDesdeCapitulo();
  cargarLibros();
});

// --- Carga de libros ---

async function cargarLibros() {
  try {
    books = await fetch(`/api/books?v=${currentVersionKey}`).then((r) => r.json());
    selBook.innerHTML = '<option value="">Seleccioná un libro...</option>';
    for (const b of books) {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.name;
      selBook.appendChild(opt);
    }
  } catch {
    selBook.innerHTML = '<option value="">Error al cargar</option>';
  }
}

// --- Cambio de libro → cargar capítulos ---

selBook.addEventListener('change', async () => {
  const bookId = selBook.value;
  resetDesdeCapitulo();
  if (!bookId) return;

  try {
    const { count } = await fetch(`/api/chapters?book=${bookId}&v=${currentVersionKey}`).then((r) => r.json());
    totalChapters = count;
    selChapter.innerHTML = '<option value="">Capítulo...</option>';
    for (let i = 1; i <= count; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = i;
      selChapter.appendChild(opt);
    }
    selChapter.disabled = false;
  } catch { /* silencioso */ }
});

// --- Cambio de capítulo → cargar lista de versículos con texto ---

selChapter.addEventListener('change', async () => {
  const bookId  = selBook.value;
  const chapNum = selChapter.value;
  resetDesdeVersiculo();
  if (!chapNum) return;

  verseListEl.innerHTML = '<div class="verse-placeholder">Cargando...</div>';
  verseCountEl.textContent = '';

  try {
    chapterVerses = await fetch(`/api/chapter-verses?book=${bookId}&chapter=${chapNum}&v=${currentVersionKey}`).then((r) => r.json());
    verseCountEl.textContent = `(${chapterVerses.length})`;
    renderVerseList();
  } catch {
    verseListEl.innerHTML = '<div class="verse-placeholder">Error al cargar versículos</div>';
  }
});

// --- Renderizar lista de versículos ---

function renderVerseList() {
  verseListEl.innerHTML = '';

  for (const v of chapterVerses) {
    const el = document.createElement('div');
    el.className = 'verse-item';
    el.dataset.verse = v.verse;

    // Marcar si ya está en sesión
    if (estaEnSesion(selBook.value, selChapter.value, v.verse)) {
      el.classList.add('in-session');
    }
    // Marcar si es el versículo actualmente seleccionado
    if (currentVerse && currentVerse.verse === v.verse) {
      el.classList.add('selected');
    }

    const numEl = document.createElement('span');
    numEl.className = 'vnum';
    numEl.textContent = v.verse;

    const textEl = document.createElement('span');
    textEl.className = 'vtext';
    textEl.textContent = v.text;

    el.append(numEl, textEl);
    el.addEventListener('click', () => seleccionarVersiculo(v));
    verseListEl.appendChild(el);
  }
}

// --- Seleccionar un versículo de la lista ---

function seleccionarVersiculo(verseData) {
  const bookId   = Number(selBook.value);
  const chapNum  = Number(selChapter.value);
  const bookName = selBook.options[selBook.selectedIndex]?.textContent ?? '';

  currentVerse = {
    version: currentVersionLabel,
    book:    bookName,
    bookId,
    chapter: chapNum,
    verse:   verseData.verse,
    text:    verseData.text,
  };

  // Resaltar ítem seleccionado en la lista
  verseListEl.querySelectorAll('.verse-item').forEach((el) => {
    el.classList.toggle('selected', Number(el.dataset.verse) === verseData.verse);
  });

  // Hacer scroll al ítem si está fuera de la vista
  const selectedEl = verseListEl.querySelector('.verse-item.selected');
  if (selectedEl) selectedEl.scrollIntoView({ block: 'nearest' });

  // Actualizar vista previa
  preview.value = `${verseData.text}\n\n— ${bookName} ${chapNum}:${verseData.verse}`;

  // Actualizar botones
  btnShow.disabled = false;
  btnPrev.disabled = false;
  btnNext.disabled = false;
  actualizarBtnSesion();
}

// --- Resetear estado al cambiar de libro / capítulo ---

function resetDesdeCapitulo() {
  selChapter.innerHTML = '<option value="">—</option>';
  selChapter.disabled = true;
  resetDesdeVersiculo();
}

function resetDesdeVersiculo() {
  verseListEl.innerHTML = '<div class="verse-placeholder">Seleccioná un capítulo...</div>';
  verseCountEl.textContent = '';
  chapterVerses = [];
  preview.value = '';
  currentVerse = null;
  btnShow.disabled = true;
  btnPrev.disabled = true;
  btnNext.disabled = true;
  btnAddSession.disabled = true;
  btnAddSession.textContent = '☆';
  btnAddSession.classList.remove('in-session');
}

// --- Botones principales ---

btnShow.addEventListener('click', () => {
  if (!currentVerse) return;
  // No enviamos bookId a la overlay (no lo necesita)
  const { bookId: _, ...payload } = currentVerse;
  enviar({ type: 'show_verse', ...payload });
});

btnHide.addEventListener('click', () => enviar({ type: 'hide_verse' }));

btnClear.addEventListener('click', () => {
  selBook.value = '';
  resetDesdeCapitulo();
  enviar({ type: 'hide_verse' });
});

// Enter dispara "Mostrar en pantalla"
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !btnShow.disabled) btnShow.click();
});

// --- Navegación con teclado en la lista de versículos ---

verseListEl.addEventListener('keydown', (e) => {
  if (chapterVerses.length === 0) return;

  const idx = currentVerse
    ? chapterVerses.findIndex((v) => v.verse === currentVerse.verse)
    : -1;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const next = chapterVerses[idx + 1];
    if (next) seleccionarVersiculo(next);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const prev = chapterVerses[idx - 1];
    if (prev) seleccionarVersiculo(prev);
  }
});

// ================================================================
// SESIÓN
// ================================================================

function guardarSesion() {
  localStorage.setItem('bible-session', JSON.stringify(session));
}

/** Verifica si un versículo ya está en la sesión */
function estaEnSesion(bookId, chapter, verse) {
  return session.some(
    (s) => s.bookId === Number(bookId) &&
           s.chapter === Number(chapter) &&
           s.verse === Number(verse)
  );
}

/** Actualiza el ícono y estado del botón ☆/★ según el versículo actual */
function actualizarBtnSesion() {
  if (!currentVerse) {
    btnAddSession.disabled = true;
    btnAddSession.textContent = '☆';
    btnAddSession.classList.remove('in-session');
    btnAddSession.title = 'Agregar a sesión';
    return;
  }
  const yaEsta = estaEnSesion(currentVerse.bookId, currentVerse.chapter, currentVerse.verse);
  btnAddSession.disabled = yaEsta;
  btnAddSession.textContent = yaEsta ? '★' : '☆';
  btnAddSession.title = yaEsta ? 'Ya está en sesión' : 'Agregar a sesión';
  btnAddSession.classList.toggle('in-session', yaEsta);
}

/** Agrega el versículo actual a la sesión */
btnAddSession.addEventListener('click', () => {
  if (!currentVerse || estaEnSesion(currentVerse.bookId, currentVerse.chapter, currentVerse.verse)) return;

  // Solo guardar la referencia, sin texto ni versión
  const { bookId, book, chapter, verse } = currentVerse;
  session.push({ bookId, book, chapter, verse });
  guardarSesion();
  renderSession();
  actualizarBtnSesion();

  // Marcar el ítem en la lista como "en sesión"
  const itemEl = verseListEl.querySelector(`.verse-item[data-verse="${currentVerse.verse}"]`);
  if (itemEl) itemEl.classList.add('in-session');
});

/** Limpiar toda la sesión */
btnClearSession.addEventListener('click', () => {
  if (session.length === 0) return;
  session = [];
  guardarSesion();
  renderSession();
  actualizarBtnSesion();
  // Quitar marcas de sesión de la lista actual
  verseListEl.querySelectorAll('.verse-item.in-session').forEach((el) => el.classList.remove('in-session'));
});

/**
 * Navega el panel al libro/capítulo del versículo dado y lo selecciona en la lista.
 * Maneja tres casos: mismo capítulo, mismo libro distinto capítulo, libro diferente.
 */
async function navegarAVersiculo(v) {
  const bookIdActual = Number(selBook.value);
  const chapActual   = Number(selChapter.value);

  if (v.bookId === bookIdActual && v.chapter === chapActual) {
    // Mismo capítulo — solo seleccionar
    const verseData = chapterVerses.find((cv) => cv.verse === v.verse);
    if (verseData) seleccionarVersiculo(verseData);
  } else if (v.bookId === bookIdActual) {
    // Mismo libro, distinto capítulo
    await cargarVersiculosCapitulo(v.bookId, v.chapter);
    const verseData = chapterVerses.find((cv) => cv.verse === v.verse);
    if (verseData) seleccionarVersiculo(verseData);
  } else {
    // Libro diferente
    await cargarLibroDiferente(v.bookId);
    await cargarVersiculosCapitulo(v.bookId, v.chapter);
    const verseData = chapterVerses.find((cv) => cv.verse === v.verse);
    if (verseData) seleccionarVersiculo(verseData);
  }
}

/**
 * Obtiene el texto de un versículo en la versión actualmente seleccionada.
 * Primero busca en chapterVerses (si el capítulo ya está cargado), si no hace fetch.
 */
async function fetchTextoActual(v) {
  if (Number(selBook.value) === v.bookId && Number(selChapter.value) === v.chapter) {
    const found = chapterVerses.find((cv) => cv.verse === v.verse);
    if (found) return found.text;
  }
  try {
    const data = await fetch(
      `/api/verse?book=${v.bookId}&chapter=${v.chapter}&verse=${v.verse}&v=${currentVersionKey}`
    ).then((r) => r.json());
    return data.text ?? '';
  } catch {
    return '';
  }
}

/** Emite show_verse con el texto de la versión activa y navega la lista al capítulo */
async function mostrarDesdeSesion(v, elItem) {
  sessionListEl.querySelectorAll('.session-item').forEach((x) => x.classList.remove('active'));
  elItem.classList.add('active');

  const text = await fetchTextoActual(v);
  enviar({
    type:    'show_verse',
    version: currentVersionLabel,
    book:    v.book,
    chapter: v.chapter,
    verse:   v.verse,
    text,
  });
  navegarAVersiculo(v);
}

/** Renderiza la lista de la sesión */
function renderSession() {
  sessionCountEl.textContent = session.length > 0 ? `(${session.length})` : '';

  if (session.length === 0) {
    sessionListEl.innerHTML = '<div class="session-placeholder">Sin versículos en sesión</div>';
    return;
  }

  sessionListEl.innerHTML = '';

  session.forEach((v, i) => {
    const el = document.createElement('div');
    el.className = 'session-item';
    el.title = `${v.book} ${v.chapter}:${v.verse}`;

    // Información del versículo (solo referencia, el texto se obtiene al reproducir)
    const info = document.createElement('div');
    info.className = 'session-info';

    const ref = document.createElement('div');
    ref.className = 'session-ref';
    ref.textContent = `${v.book} ${v.chapter}:${v.verse}`;

    info.append(ref);

    // Botón mostrar en pantalla
    const btnPlay = document.createElement('button');
    btnPlay.className = 'btn-play';
    btnPlay.textContent = '▶';
    btnPlay.title = 'Mostrar en pantalla';
    btnPlay.addEventListener('click', (e) => {
      e.stopPropagation();
      mostrarDesdeSesion(v, el);
    });

    // Botón quitar de sesión
    const btnRemove = document.createElement('button');
    btnRemove.className = 'btn-remove';
    btnRemove.textContent = '✕';
    btnRemove.title = 'Quitar de sesión';
    btnRemove.addEventListener('click', (e) => {
      e.stopPropagation();
      session.splice(i, 1);
      guardarSesion();
      renderSession();
      actualizarBtnSesion();
      const itemEl = verseListEl.querySelector(`.verse-item[data-verse="${v.verse}"]`);
      if (itemEl &&
          Number(selBook.value) === v.bookId &&
          Number(selChapter.value) === v.chapter) {
        itemEl.classList.remove('in-session');
      }
    });

    // Click en el ítem (fuera de los botones) → mostrar en pantalla y navegar
    el.addEventListener('click', () => mostrarDesdeSesion(v, el));

    el.append(info, btnPlay, btnRemove);
    sessionListEl.appendChild(el);
  });
}

// --- Navegación anterior / siguiente ---

/**
 * Carga los versículos de un capítulo específico sin resetear el dropdown de capítulos.
 * Actualiza selChapter.value, verseCountEl y renderiza la lista.
 */
async function cargarVersiculosCapitulo(bookId, chapNum) {
  selChapter.value = chapNum;
  verseListEl.innerHTML = '<div class="verse-placeholder">Cargando...</div>';
  verseCountEl.textContent = '';
  currentVerse = null;
  preview.value = '';
  btnShow.disabled = true;
  btnPrev.disabled = true;
  btnNext.disabled = true;
  actualizarBtnSesion();

  chapterVerses = await fetch(`/api/chapter-verses?book=${bookId}&chapter=${chapNum}&v=${currentVersionKey}`).then((r) => r.json());
  verseCountEl.textContent = `(${chapterVerses.length})`;
  renderVerseList();
}

/**
 * Cambia al libro indicado: actualiza el selector, carga sus capítulos y actualiza totalChapters.
 */
async function cargarLibroDiferente(bookId) {
  selBook.value = bookId;
  resetDesdeCapitulo();

  const { count } = await fetch(`/api/chapters?book=${bookId}&v=${currentVersionKey}`).then((r) => r.json());
  totalChapters = count;
  selChapter.innerHTML = '<option value="">Capítulo...</option>';
  for (let i = 1; i <= count; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i;
    selChapter.appendChild(opt);
  }
  selChapter.disabled = false;
}

async function navSiguiente() {
  if (chapterVerses.length === 0) return;

  const bookId  = Number(selBook.value);
  const chapNum = Number(selChapter.value);

  // Sin versículo activo → ir al primero del capítulo actual
  if (!currentVerse) {
    seleccionarVersiculo(chapterVerses[0]);
    return;
  }

  const idx = chapterVerses.findIndex((v) => v.verse === currentVerse.verse);

  if (idx < chapterVerses.length - 1) {
    // Siguiente versículo del mismo capítulo
    seleccionarVersiculo(chapterVerses[idx + 1]);
    return;
  }

  // Fin del capítulo → pasar al siguiente
  if (chapNum < totalChapters) {
    await cargarVersiculosCapitulo(bookId, chapNum + 1);
    seleccionarVersiculo(chapterVerses[0]);
  } else {
    // Fin del libro → pasar al siguiente libro
    const bookIdx = books.findIndex((b) => b.id === bookId);
    if (bookIdx < books.length - 1) {
      const nextBook = books[bookIdx + 1];
      await cargarLibroDiferente(nextBook.id);
      await cargarVersiculosCapitulo(nextBook.id, 1);
      seleccionarVersiculo(chapterVerses[0]);
    }
  }
}

async function navAnterior() {
  if (chapterVerses.length === 0) return;

  const bookId  = Number(selBook.value);
  const chapNum = Number(selChapter.value);

  // Sin versículo activo → ir al último del capítulo actual
  if (!currentVerse) {
    seleccionarVersiculo(chapterVerses[chapterVerses.length - 1]);
    return;
  }

  const idx = chapterVerses.findIndex((v) => v.verse === currentVerse.verse);

  if (idx > 0) {
    // Versículo anterior del mismo capítulo
    seleccionarVersiculo(chapterVerses[idx - 1]);
    return;
  }

  // Inicio del capítulo → pasar al anterior
  if (chapNum > 1) {
    await cargarVersiculosCapitulo(bookId, chapNum - 1);
    seleccionarVersiculo(chapterVerses[chapterVerses.length - 1]);
  } else {
    // Inicio del libro → pasar al libro anterior
    const bookIdx = books.findIndex((b) => b.id === bookId);
    if (bookIdx > 0) {
      const prevBook = books[bookIdx - 1];
      await cargarLibroDiferente(prevBook.id);
      // totalChapters ya fue actualizado por cargarLibroDiferente
      await cargarVersiculosCapitulo(prevBook.id, totalChapters);
      seleccionarVersiculo(chapterVerses[chapterVerses.length - 1]);
    }
  }
}

btnPrev.addEventListener('click', navAnterior);
btnNext.addEventListener('click', navSiguiente);

// --- Presets CSS personalizados ---

let customPresets = (() => {
  try { return JSON.parse(localStorage.getItem('bible-css-presets') || '[]'); }
  catch { return []; }
})();

// Nombre del preset personalizado actualmente activo (null si ninguno)
let activeCustomPreset = null;

function setActiveCustomPreset(name) {
  activeCustomPreset = name;
  renderCustomPresets();
}

function guardarCustomPresets() {
  localStorage.setItem('bible-css-presets', JSON.stringify(customPresets));
}

function renderCustomPresets() {
  const section = document.getElementById('custom-presets-section');
  const list    = document.getElementById('custom-presets-list');

  if (customPresets.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = '';
  list.innerHTML = '';

  customPresets.forEach((preset, i) => {
    const row = document.createElement('div');
    row.className = 'custom-preset-item';

    const nameBtn = document.createElement('button');
    nameBtn.className = 'custom-preset-name' + (preset.name === activeCustomPreset ? ' active' : '');
    nameBtn.textContent = preset.name;
    nameBtn.title = `Cargar: ${preset.name}`;
    nameBtn.addEventListener('click', () => {
      setCssValue(preset.css);
      enviar({ type: 'update_css', css: preset.css });
      setActiveCustomPreset(preset.name);
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'custom-preset-delete';
    delBtn.textContent = '✕';
    delBtn.title = 'Eliminar preset';
    delBtn.addEventListener('click', () => {
      if (activeCustomPreset === preset.name) activeCustomPreset = null;
      customPresets.splice(i, 1);
      guardarCustomPresets();
      renderCustomPresets();
    });

    row.append(nameBtn, delBtn);
    list.appendChild(row);
  });
}

const presetNameInput = document.getElementById('preset-name-input');
const btnSavePreset   = document.getElementById('btn-save-preset');

btnSavePreset.addEventListener('click', () => {
  const name = presetNameInput.value.trim();
  const css  = getCssValue().trim();

  if (!name) { presetNameInput.focus(); return; }
  if (!css)  return;

  // Si ya existe un preset con ese nombre, sobreescribir
  const idx = customPresets.findIndex((p) => p.name === name);
  if (idx >= 0) {
    customPresets[idx].css = css;
  } else {
    customPresets.push({ name, css });
  }

  guardarCustomPresets();
  renderCustomPresets();
  presetNameInput.value = '';
  presetNameInput.placeholder = `"${name}" guardado`;
  setTimeout(() => { presetNameInput.placeholder = 'Nombre del preset...'; }, 2000);
});

// Enter en el input de nombre también guarda
presetNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') btnSavePreset.click();
});

// --- CSS personalizado ---

function getCssValue() {
  return cssEditor ? cssEditor.getValue() : '';
}

function setCssValue(text) {
  if (cssEditor) cssEditor.setValue(text);
}

btnApplyCss.addEventListener('click', () => {
  const css = getCssValue().trim();
  enviar({ type: 'update_css', css });

  // Si hay un preset personalizado activo, guardar los cambios en él automáticamente
  if (activeCustomPreset) {
    const idx = customPresets.findIndex((p) => p.name === activeCustomPreset);
    if (idx >= 0) {
      customPresets[idx].css = css;
      guardarCustomPresets();
    }
  }
});

// Helper para cargar un preset integrado (limpia el activo personalizado)
function cargarPresetIntegrado(css) {
  setCssValue(css);
  enviar({ type: 'update_css', css });
  activeCustomPreset = null;
  renderCustomPresets();
}

document.getElementById('preset-clasico').addEventListener('click', () => cargarPresetIntegrado(PRESET_CLASICO));
document.getElementById('preset-grande').addEventListener('click',   () => cargarPresetIntegrado(PRESET_GRANDE));
document.getElementById('preset-oscuro').addEventListener('click',   () => cargarPresetIntegrado(PRESET_OSCURO));
document.getElementById('preset-glass').addEventListener('click',       () => cargarPresetIntegrado(PRESET_GLASS));
document.getElementById('preset-lower-third').addEventListener('click', () => cargarPresetIntegrado(PRESET_LOWER_THIRD));
document.getElementById('preset-cinematico').addEventListener('click',  () => cargarPresetIntegrado(PRESET_CINEMATICO));
document.getElementById('preset-minimal').addEventListener('click',     () => cargarPresetIntegrado(PRESET_MINIMAL));
document.getElementById('preset-neon').addEventListener('click',        () => cargarPresetIntegrado(PRESET_NEON));
document.getElementById('preset-tarjeta').addEventListener('click',     () => cargarPresetIntegrado(PRESET_TARJETA));

// --- Selector de tema ---

const THEME_KEY = 'bible-panel-theme';

function aplicarTema(theme) {
  // Migración: si había 'yami' (tema eliminado) guardado, usar 'slate'
  const t = theme === 'yami' ? 'slate' : theme;
  document.documentElement.setAttribute('data-theme', t);
  document.querySelectorAll('.theme-swatch').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.theme === t);
  });
  localStorage.setItem(THEME_KEY, t);
  if (cssEditor) cssEditor.refresh();
}

document.querySelectorAll('.theme-swatch').forEach((btn) => {
  btn.addEventListener('click', () => aplicarTema(btn.dataset.theme));
});

// Aplicar tema guardado (o slate por defecto)
aplicarTema(localStorage.getItem(THEME_KEY) || 'slate');

// --- Inicio ---

// Inicializar editor CodeMirror sobre el textarea #css-input
// Guard: CodeMirror se carga desde CDN; si no está disponible el panel sigue funcionando
if (typeof CodeMirror !== 'undefined') {
  cssEditor = CodeMirror.fromTextArea(document.getElementById('css-input'), {
    mode: 'css',
    theme: 'dracula',
    lineNumbers: true,
    lineWrapping: true,
    tabSize: 2,
    indentWithTabs: false,
    autoCloseBrackets: true,
    matchBrackets: true,
    extraKeys: {
      'Ctrl-Enter': () => btnApplyCss?.click(),
    },
  });

  // CodeMirror necesita refrescarse cuando el <details> se abre por primera vez
  document.querySelector('details')?.addEventListener('toggle', function () {
    if (this.open && cssEditor) cssEditor.refresh();
  });
}

// --- Selector de tipografía ---

function inicializarSelectorFuente() {
  const sel = document.getElementById('sel-font');
  if (!sel) return;

  // Poblar el <select> con grupos
  const grupos = [...new Set(GOOGLE_FONTS.map((f) => f.group))];
  for (const grupo of grupos) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = grupo;
    for (const font of GOOGLE_FONTS.filter((f) => f.group === grupo)) {
      const opt = document.createElement('option');
      opt.value       = font.key;
      opt.textContent = font.name;
      optgroup.appendChild(opt);
    }
    sel.appendChild(optgroup);
  }

  // Restaurar fuente guardada
  const saved = localStorage.getItem(FONT_KEY) || 'georgia';
  sel.value = saved;
  // Cargar la fuente guardada en el panel (para el preview) sin enviar al overlay todavía
  const savedFont = GOOGLE_FONTS.find((f) => f.key === saved);
  if (savedFont) {
    cargarFuenteEnPanel(savedFont);
    const previewEl = document.getElementById('font-preview-text');
    if (previewEl) previewEl.style.fontFamily = savedFont.family;
  }

  sel.addEventListener('change', () => aplicarFuente(sel.value));
}

conectarWS();
cargarVersiones().then(() => cargarLibros());
renderSession();
renderCustomPresets();
inicializarSelectorFuente();
