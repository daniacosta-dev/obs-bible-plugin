/**
 * Panel de control — OBS Bible Overlay
 */

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

// --- Referencias DOM ---

const selBook        = document.getElementById('sel-book');
const selChapter     = document.getElementById('sel-chapter');
const verseListEl    = document.getElementById('verse-list');
const verseCountEl   = document.getElementById('verse-count');
const preview        = document.getElementById('verse-preview');
const btnShow        = document.getElementById('btn-show');
const btnHide        = document.getElementById('btn-hide');
const btnAddSession  = document.getElementById('btn-add-session');
const btnClear       = document.getElementById('btn-clear');
const sessionListEl  = document.getElementById('session-list');
const sessionCountEl = document.getElementById('session-count');
const btnClearSession = document.getElementById('btn-clear-session');
const cssInput       = document.getElementById('css-input');
const btnApplyCss    = document.getElementById('btn-apply-css');
const wsDot          = document.getElementById('ws-dot');

// --- Estado ---

let currentVerse = null;        // versículo seleccionado en la lista
let chapterVerses = [];         // todos los versículos del capítulo activo

// Sesión persistida en localStorage (sobrevive refrescos del panel)
let session = (() => {
  try { return JSON.parse(localStorage.getItem('bible-session') || '[]'); }
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

// --- Carga de libros ---

async function cargarLibros() {
  try {
    const books = await fetch('/api/books').then((r) => r.json());
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
    const { count } = await fetch(`/api/chapters?book=${bookId}`).then((r) => r.json());
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
    chapterVerses = await fetch(`/api/chapter-verses?book=${bookId}&chapter=${chapNum}`).then((r) => r.json());
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
    version: 'Reina-Valera 1909',
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

  session.push({ ...currentVerse });
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
    el.title = v.text;

    // Información del versículo
    const info = document.createElement('div');
    info.className = 'session-info';

    const ref = document.createElement('div');
    ref.className = 'session-ref';
    ref.textContent = `${v.book} ${v.chapter}:${v.verse}`;

    const text = document.createElement('div');
    text.className = 'session-text';
    text.textContent = v.text;

    info.append(ref, text);

    // Botón mostrar en pantalla
    const btnPlay = document.createElement('button');
    btnPlay.className = 'btn-play';
    btnPlay.textContent = '▶';
    btnPlay.title = 'Mostrar en pantalla';
    btnPlay.addEventListener('click', (e) => {
      e.stopPropagation();
      const { bookId: _, ...payload } = v;
      enviar({ type: 'show_verse', ...payload });
      // Resaltar el ítem activo
      sessionListEl.querySelectorAll('.session-item').forEach((x) => x.classList.remove('active'));
      el.classList.add('active');
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
      // Si el versículo quitado está en la lista actual, desmarcar
      const itemEl = verseListEl.querySelector(`.verse-item[data-verse="${v.verse}"]`);
      if (itemEl &&
          Number(selBook.value) === v.bookId &&
          Number(selChapter.value) === v.chapter) {
        itemEl.classList.remove('in-session');
      }
    });

    // Click en el ítem (fuera de los botones) → mostrar en pantalla
    el.addEventListener('click', () => {
      const { bookId: _, ...payload } = v;
      enviar({ type: 'show_verse', ...payload });
      sessionListEl.querySelectorAll('.session-item').forEach((x) => x.classList.remove('active'));
      el.classList.add('active');
    });

    el.append(info, btnPlay, btnRemove);
    sessionListEl.appendChild(el);
  });
}

// --- CSS personalizado ---

btnApplyCss.addEventListener('click', () => {
  enviar({ type: 'update_css', css: cssInput.value.trim() });
});

document.getElementById('preset-clasico').addEventListener('click', () => {
  cssInput.value = PRESET_CLASICO;
  enviar({ type: 'update_css', css: PRESET_CLASICO });
});
document.getElementById('preset-grande').addEventListener('click', () => {
  cssInput.value = PRESET_GRANDE;
  enviar({ type: 'update_css', css: PRESET_GRANDE });
});
document.getElementById('preset-oscuro').addEventListener('click', () => {
  cssInput.value = PRESET_OSCURO;
  enviar({ type: 'update_css', css: PRESET_OSCURO });
});

// --- Inicio ---
conectarWS();
cargarLibros();
renderSession();
