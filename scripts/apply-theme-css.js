// Reemplaza el bloque <style> de panel.html con la versión basada en variables CSS
import fs from 'fs';

const file = 'public/panel.html';
let html = fs.readFileSync(file, 'utf8');

const styleStart = html.indexOf('<style>');
const styleEnd   = html.indexOf('</style>') + '</style>'.length;
const before     = html.slice(0, styleStart);
const after      = html.slice(styleEnd);

const newStyle = `<style>
    /* ── Temas: variables CSS ── */
    :root {
      --bg:        #1e2630;
      --panel:     #222c38;
      --input:     #2a3441;
      --hover:     #344352;
      --border:    #3a4656;
      --border-hi: #4a5a70;
      --text:      #d7e3f4;
      --sub:       #9fb3c8;
      --muted:     #5a7080;
      --muted2:    #4a6070;
      --accent:    #5aa9ff;
      --acc-dk:    #2a5a8a;
      --acc-ho:    #3a70aa;
      --sel-bg:    #2a5a8a;
      --div-line:  #222c38;
      --green:     #3fa35a;
      --green-bg:  #1a3028;
      --green-bg2: #1a3832;
      --red:       #c0404a;
      --red-ho:    #d05060;
    }
    [data-theme="grey"] {
      --bg:        #3A393A;
      --panel:     #252525;
      --input:     #1c1c1c;
      --hover:     #424242;
      --border:    #3d3d3d;
      --border-hi: #4a4a4a;
      --text:      #ececec;
      --sub:       #aaaaaa;
      --muted:     #666666;
      --muted2:    #555555;
      --accent:    #4d9ce0;
      --acc-dk:    #2b5278;
      --acc-ho:    #336699;
      --sel-bg:    #2b5278;
      --div-line:  #2d2d2d;
      --green:     #4a8c45;
      --green-bg:  #1e3020;
      --green-bg2: #1e3a28;
      --red:       #b03030;
      --red-ho:    #cc5555;
    }
    [data-theme="dark"] {
      --bg:        #141414;
      --panel:     #1c1c1c;
      --input:     #111111;
      --hover:     #2a2a2a;
      --border:    #2e2e2e;
      --border-hi: #3a3a3a;
      --text:      #e8e8e8;
      --sub:       #999999;
      --muted:     #555555;
      --muted2:    #444444;
      --accent:    #4d9ce0;
      --acc-dk:    #1e4878;
      --acc-ho:    #2a5e8a;
      --sel-bg:    #1e4878;
      --div-line:  #141414;
      --green:     #3d8040;
      --green-bg:  #162818;
      --green-bg2: #162e20;
      --red:       #aa3030;
      --red-ho:    #bb4444;
    }

    *, *::before, *::after { box-sizing: border-box; }

    body {
      margin: 0;
      padding: 10px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      background: var(--bg);
      color: var(--text);
      min-width: 260px;
    }

    /* ── Encabezado ── */
    h1 {
      font-size: 13px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    #ws-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--red);
      flex-shrink: 0;
      margin-left: auto;
      transition: background 0.3s;
    }
    #ws-dot.connected { background: var(--green); }

    /* ── Selector de tema ── */
    .theme-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 10px;
    }
    .theme-row > span {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      white-space: nowrap;
    }
    .theme-swatch {
      width: 18px; height: 18px;
      border-radius: 3px;
      border: 2px solid transparent;
      cursor: pointer;
      flex-shrink: 0;
      outline: none;
      transition: border-color 0.15s;
    }
    .theme-swatch:hover { border-color: var(--sub); }
    .theme-swatch.active { border-color: var(--accent); }
    .swatch-yami { background: #1e2630; }
    .swatch-grey { background: #2d2d2d; }
    .swatch-dark { background: #141414; }

    /* ── Etiquetas ── */
    label {
      display: block;
      margin-bottom: 2px;
      color: var(--sub);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* ── Selects ── */
    select {
      width: 100%;
      background: var(--input);
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 5px 8px;
      font-size: 13px;
      margin-bottom: 8px;
      outline: none;
      appearance: none;
    }
    select:focus { border-color: var(--accent); }
    select:disabled { opacity: 0.4; cursor: not-allowed; }

    /* ── Lista de versículos ── */
    #verse-list {
      height: 200px;
      overflow-y: auto;
      background: var(--input);
      border: 1px solid var(--border);
      border-radius: 3px;
      margin-bottom: 8px;
      scroll-behavior: smooth;
    }
    #verse-list:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }

    .verse-item {
      display: flex;
      gap: 7px;
      padding: 5px 8px;
      cursor: pointer;
      border-bottom: 1px solid var(--div-line);
      line-height: 1.45;
      transition: background 0.1s;
    }
    .verse-item:last-child { border-bottom: none; }
    .verse-item:hover { background: var(--hover); }
    .verse-item.selected { background: var(--sel-bg); border-left: 3px solid var(--accent); }
    .verse-item.in-session { background: var(--green-bg); border-left: 3px solid var(--green); }
    .verse-item.selected.in-session { background: var(--green-bg2); border-left: 3px solid var(--green); }

    .vnum {
      flex-shrink: 0; width: 20px;
      font-size: 10px; font-weight: 700;
      color: var(--muted2);
      padding-top: 2px; text-align: right;
    }
    .verse-item.selected .vnum  { color: var(--accent); }
    .verse-item.in-session .vnum { color: var(--green); }

    .vtext {
      font-size: 12px;
      color: var(--sub);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .verse-item.selected .vtext { color: #ffffff; }

    .verse-placeholder {
      padding: 24px 10px;
      text-align: center;
      color: var(--muted2);
      font-size: 12px;
    }

    /* ── Vista previa ── */
    #verse-preview {
      width: 100%; height: 72px;
      background: var(--input);
      color: var(--sub);
      border: 1px solid var(--border);
      border-radius: 3px;
      padding: 5px 8px;
      font-size: 12px; line-height: 1.5;
      resize: none; outline: none;
      margin-bottom: 8px;
    }

    /* ── Navegación ── */
    .nav-row { display: flex; gap: 4px; margin-bottom: 8px; }
    #btn-prev, #btn-next { flex: 1; background: var(--input); color: var(--sub); }
    #btn-prev:not(:disabled):hover,
    #btn-next:not(:disabled):hover { background: var(--hover); filter: none; }

    /* ── Botones ── */
    .btn-row { display: flex; gap: 4px; margin-bottom: 10px; }
    button {
      padding: 6px;
      border: none; border-radius: 3px;
      font-size: 12px; font-weight: 600;
      cursor: pointer;
      transition: background 0.1s, filter 0.1s;
    }
    button:hover:not(:disabled)  { filter: brightness(1.15); }
    button:active:not(:disabled) { filter: brightness(0.88); }
    button:disabled { opacity: 0.35; cursor: not-allowed; filter: none; }

    #btn-show { flex: 1; background: var(--acc-dk); color: var(--text); }
    #btn-show:hover:not(:disabled) { background: var(--acc-ho); filter: none; }
    #btn-hide  { background: var(--input); color: var(--text); padding: 6px 10px; }
    #btn-add-session {
      background: var(--input); color: var(--sub);
      padding: 6px 9px; font-size: 14px; line-height: 1;
    }
    #btn-add-session.in-session { background: var(--green-bg); color: var(--green); }
    #btn-clear { background: var(--input); color: var(--muted); padding: 6px 9px; }

    /* ── Divisor / sección ── */
    .section-title {
      display: flex; align-items: center;
      justify-content: space-between;
      margin: 0 0 5px;
    }
    .section-title span {
      font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--muted);
    }
    .btn-link {
      background: none; border: none;
      color: var(--muted); font-size: 11px;
      padding: 0; cursor: pointer; font-weight: 400;
    }
    .btn-link:hover { color: var(--red-ho); filter: none; }

    /* ── Sesión ── */
    #session-list { margin-bottom: 10px; }

    .session-placeholder {
      padding: 12px 8px; text-align: center;
      color: var(--muted2); font-size: 12px;
      background: var(--input);
      border: 1px dashed var(--border); border-radius: 3px;
    }
    .session-item {
      display: flex; align-items: center; gap: 4px;
      padding: 5px 8px;
      background: var(--panel);
      border: 1px solid var(--border); border-radius: 3px;
      margin-bottom: 3px; cursor: pointer;
      transition: background 0.1s;
    }
    .session-item:hover { background: var(--hover); border-color: var(--border-hi); }
    .session-item.active { border-color: var(--accent); background: var(--sel-bg); }

    .session-info { flex: 1; min-width: 0; }
    .session-ref { font-size: 11px; font-weight: 700; color: var(--accent); white-space: nowrap; }

    .btn-play {
      flex-shrink: 0;
      background: var(--acc-dk) !important; color: var(--text) !important;
      border-radius: 3px; padding: 3px 7px !important;
      font-size: 11px !important; font-weight: 700 !important;
    }
    .btn-play:hover { background: var(--acc-ho) !important; filter: none; }
    .btn-remove {
      flex-shrink: 0;
      background: transparent !important; color: var(--muted2) !important;
      padding: 3px 5px !important; font-size: 13px !important; font-weight: 400 !important;
    }
    .btn-remove:hover { color: var(--red-ho) !important; filter: none; }

    .divider { border: none; border-top: 1px solid var(--border); margin: 10px 0; }

    /* ── CSS personalizado ── */
    details {
      background: var(--panel);
      border: 1px solid var(--border); border-radius: 3px; overflow: hidden;
    }
    summary {
      padding: 7px 10px; cursor: pointer;
      font-weight: 600; font-size: 12px;
      color: var(--sub); user-select: none; list-style: none;
      background: var(--bg);
      border-bottom: 1px solid transparent;
    }
    details[open] summary { border-bottom-color: var(--border); }
    summary::-webkit-details-marker { display: none; }
    summary::before { content: '▶ '; font-size: 10px; display: inline-block; transition: transform 0.2s; }
    details[open] summary::before { transform: rotate(90deg); }

    .css-body { padding: 8px 10px 10px; }

    /* ── CodeMirror ── */
    .CodeMirror {
      font-family: 'Consolas', 'Fira Code', monospace !important;
      font-size: 11px !important;
      height: 130px;
      border: 1px solid var(--border); border-radius: 3px;
      margin-bottom: 6px;
      background: var(--input) !important;
    }
    .CodeMirror:hover { border-color: var(--border-hi); }
    .CodeMirror-focused { border-color: var(--accent) !important; }
    .CodeMirror-scroll { min-height: 130px; }
    .CodeMirror-gutters { background: var(--panel) !important; border-right: 1px solid var(--border) !important; }
    .CodeMirror-linenumber { color: var(--muted2) !important; font-size: 10px; }
    .CodeMirror-cursor { border-left-color: var(--text) !important; }
    .CodeMirror-vscrollbar::-webkit-scrollbar { width: 5px; }
    .CodeMirror-vscrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

    #btn-apply-css { width: 100%; background: var(--acc-dk); color: var(--text); margin-bottom: 8px; }
    #btn-apply-css:hover:not(:disabled) { background: var(--acc-ho); filter: none; }

    .presets-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
    .preset-row { display: flex; flex-direction: column; gap: 3px; }
    .preset-row button { background: var(--input); color: var(--sub); font-weight: 400; font-size: 12px; text-align: left; padding: 5px 10px; }
    .preset-row button:hover { background: var(--hover); filter: none; }

    /* ── Guardar preset ── */
    .save-preset-row { display: flex; gap: 4px; margin-bottom: 8px; }
    #preset-name-input {
      flex: 1; min-width: 0;
      background: var(--input); color: var(--text);
      border: 1px solid var(--border); border-radius: 3px;
      padding: 5px 8px; font-size: 12px; outline: none;
    }
    #preset-name-input::placeholder { color: var(--muted2); }
    #preset-name-input:focus { border-color: var(--accent); }
    #btn-save-preset { flex-shrink: 0; background: var(--input); color: var(--sub); padding: 5px 10px; }
    #btn-save-preset:hover:not(:disabled) { background: var(--hover); filter: none; }

    /* ── Presets personalizados ── */
    #custom-presets-section { margin-top: 8px; }
    .custom-preset-item { display: flex; align-items: center; gap: 3px; margin-bottom: 3px; }
    .custom-preset-name {
      flex: 1; min-width: 0;
      background: var(--acc-dk); color: var(--accent);
      font-weight: 400; font-size: 12px; text-align: left;
      padding: 5px 10px; border-radius: 3px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .custom-preset-name:hover { filter: brightness(1.2); }
    .custom-preset-delete {
      flex-shrink: 0; background: transparent !important;
      color: var(--muted2) !important; padding: 4px 7px !important;
      font-size: 13px !important; font-weight: 400 !important;
    }
    .custom-preset-delete:hover { color: var(--red-ho) !important; filter: none; }

    /* ── Scrollbar global ── */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--border-hi); }
  </style>`;

html = before + newStyle + after;
fs.writeFileSync(file, html, 'utf8');
console.log('Style block replaced OK');
