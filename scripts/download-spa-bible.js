#!/usr/bin/env node
/**
 * Descarga y normaliza versiones bíblicas desde mrk214/bible-data-es-spa
 * Uso: node scripts/download-spa-bible.js <VERSION>
 *
 * Versiones disponibles: NTV, DHH, NVI, LBLA, NBLA, RVA2015, RVC, TLA
 *
 * Estructura fuente (por capítulo):
 *   items: [{ type: "verse", verse_numbers: [N], lines: ["texto..."] }, ...]
 *
 * Se normaliza al mismo formato que rv1909.json / rv1960.json.
 */

import https from 'https';
import fs from 'fs/promises';
import path from 'path';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

// Versiones disponibles en mrk214/bible-data-es-spa
const VERSIONS = {
  NTV:    { file: 'NTV_vid_127.json',    outKey: 'ntv',    label: 'Nueva Traducción Viviente' },
  DHH:    { file: 'DHH94I_vid_52.json',  outKey: 'dhh',    label: 'Dios Habla Hoy' },
  NVI:    { file: 'NVI_vid_128.json',    outKey: 'nvi',    label: 'Nueva Versión Internacional' },
  LBLA:   { file: 'LBLA_vid_89.json',    outKey: 'lbla',   label: 'La Biblia de las Américas' },
  NBLA:   { file: 'NBLA_vid_103.json',   outKey: 'nbla',   label: 'Nueva Biblia de las Américas' },
  RVA2015:{ file: 'RVA2015_vid_1782.json',outKey: 'rva2015',label: 'Reina Valera Actualizada 2015' },
  RVC:    { file: 'RVC_vid_146.json',    outKey: 'rvc',    label: 'Reina Valera Contemporánea' },
  TLA:    { file: 'TLA_vid_176.json',    outKey: 'tla',    label: 'Traducción en Lenguaje Actual' },
};

const BASE_URL = 'https://raw.githubusercontent.com/mrk214/bible-data-es-spa/refs/heads/main/data/es___spa___spa/';

// Mapeo USFM → { id, name, abbrev }  (solo los 66 libros canónicos protestantes)
const USFM_MAP = {
  GEN: { id: 1,  name: 'Génesis',           abbrev: 'Gn'   },
  EXO: { id: 2,  name: 'Éxodo',             abbrev: 'Éx'   },
  LEV: { id: 3,  name: 'Levítico',          abbrev: 'Lv'   },
  NUM: { id: 4,  name: 'Números',           abbrev: 'Nm'   },
  DEU: { id: 5,  name: 'Deuteronomio',      abbrev: 'Dt'   },
  JOS: { id: 6,  name: 'Josué',             abbrev: 'Jos'  },
  JDG: { id: 7,  name: 'Jueces',            abbrev: 'Jue'  },
  RUT: { id: 8,  name: 'Rut',               abbrev: 'Rt'   },
  '1SA': { id: 9,  name: '1 Samuel',        abbrev: '1 S'  },
  '2SA': { id: 10, name: '2 Samuel',        abbrev: '2 S'  },
  '1KI': { id: 11, name: '1 Reyes',         abbrev: '1 R'  },
  '2KI': { id: 12, name: '2 Reyes',         abbrev: '2 R'  },
  '1CH': { id: 13, name: '1 Crónicas',      abbrev: '1 Cr' },
  '2CH': { id: 14, name: '2 Crónicas',      abbrev: '2 Cr' },
  EZR: { id: 15, name: 'Esdras',            abbrev: 'Esd'  },
  NEH: { id: 16, name: 'Nehemías',          abbrev: 'Neh'  },
  EST: { id: 17, name: 'Ester',             abbrev: 'Est'  },
  JOB: { id: 18, name: 'Job',               abbrev: 'Job'  },
  PSA: { id: 19, name: 'Salmos',            abbrev: 'Sal'  },
  PRO: { id: 20, name: 'Proverbios',        abbrev: 'Pr'   },
  ECC: { id: 21, name: 'Eclesiastés',       abbrev: 'Ec'   },
  SNG: { id: 22, name: 'Cantares',          abbrev: 'Cnt'  },
  ISA: { id: 23, name: 'Isaías',            abbrev: 'Is'   },
  JER: { id: 24, name: 'Jeremías',          abbrev: 'Jer'  },
  LAM: { id: 25, name: 'Lamentaciones',     abbrev: 'Lm'   },
  EZK: { id: 26, name: 'Ezequiel',          abbrev: 'Ez'   },
  DAN: { id: 27, name: 'Daniel',            abbrev: 'Dn'   },
  HOS: { id: 28, name: 'Oseas',             abbrev: 'Os'   },
  JOL: { id: 29, name: 'Joel',              abbrev: 'Jl'   },
  AMO: { id: 30, name: 'Amós',              abbrev: 'Am'   },
  OBA: { id: 31, name: 'Abdías',            abbrev: 'Abd'  },
  JON: { id: 32, name: 'Jonás',             abbrev: 'Jon'  },
  MIC: { id: 33, name: 'Miqueas',           abbrev: 'Miq'  },
  NAM: { id: 34, name: 'Nahúm',             abbrev: 'Nah'  },
  HAB: { id: 35, name: 'Habacuc',           abbrev: 'Hab'  },
  ZEP: { id: 36, name: 'Sofonías',          abbrev: 'Sof'  },
  HAG: { id: 37, name: 'Hageo',             abbrev: 'Hag'  },
  ZEC: { id: 38, name: 'Zacarías',          abbrev: 'Zac'  },
  MAL: { id: 39, name: 'Malaquías',         abbrev: 'Mal'  },
  MAT: { id: 40, name: 'Mateo',             abbrev: 'Mt'   },
  MRK: { id: 41, name: 'Marcos',            abbrev: 'Mr'   },
  LUK: { id: 42, name: 'Lucas',             abbrev: 'Lc'   },
  JHN: { id: 43, name: 'Juan',              abbrev: 'Jn'   },
  ACT: { id: 44, name: 'Hechos',            abbrev: 'Hch'  },
  ROM: { id: 45, name: 'Romanos',           abbrev: 'Ro'   },
  '1CO': { id: 46, name: '1 Corintios',     abbrev: '1 Co' },
  '2CO': { id: 47, name: '2 Corintios',     abbrev: '2 Co' },
  GAL: { id: 48, name: 'Gálatas',           abbrev: 'Gá'   },
  EPH: { id: 49, name: 'Efesios',           abbrev: 'Ef'   },
  PHP: { id: 50, name: 'Filipenses',        abbrev: 'Fil'  },
  COL: { id: 51, name: 'Colosenses',        abbrev: 'Col'  },
  '1TH': { id: 52, name: '1 Tesalonicenses',abbrev: '1 Ts' },
  '2TH': { id: 53, name: '2 Tesalonicenses',abbrev: '2 Ts' },
  '1TI': { id: 54, name: '1 Timoteo',       abbrev: '1 Ti' },
  '2TI': { id: 55, name: '2 Timoteo',       abbrev: '2 Ti' },
  TIT: { id: 56, name: 'Tito',              abbrev: 'Tit'  },
  PHM: { id: 57, name: 'Filemón',           abbrev: 'Flm'  },
  HEB: { id: 58, name: 'Hebreos',           abbrev: 'He'   },
  JAS: { id: 59, name: 'Santiago',          abbrev: 'Stg'  },
  '1PE': { id: 60, name: '1 Pedro',         abbrev: '1 P'  },
  '2PE': { id: 61, name: '2 Pedro',         abbrev: '2 P'  },
  '1JN': { id: 62, name: '1 Juan',          abbrev: '1 Jn' },
  '2JN': { id: 63, name: '2 Juan',          abbrev: '2 Jn' },
  '3JN': { id: 64, name: '3 Juan',          abbrev: '3 Jn' },
  JUD: { id: 65, name: 'Judas',             abbrev: 'Jud'  },
  REV: { id: 66, name: 'Apocalipsis',       abbrev: 'Ap'   },
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} al descargar ${url}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function pregunta(prompt) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

/**
 * Extrae los versículos de un capítulo desde el array items.
 * Acumula todas las lines de items con el mismo verse_number.
 */
function extraerVersiculos(items) {
  const verseMap = new Map();

  for (const item of items) {
    if (item.type !== 'verse') continue;
    if (!Array.isArray(item.verse_numbers) || item.verse_numbers.length === 0) continue;

    const text = (item.lines ?? [])
      .map((l) => l.trim())
      .filter(Boolean)
      .join(' ');

    if (!text) continue;

    // Usar el primer verse_number como clave principal
    const vn = item.verse_numbers[0];
    if (verseMap.has(vn)) {
      verseMap.set(vn, verseMap.get(vn) + ' ' + text);
    } else {
      verseMap.set(vn, text);
    }
  }

  return [...verseMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([verse, text]) => ({ verse, text }));
}

async function main() {
  const versionArg = process.argv[2]?.toUpperCase();

  if (!versionArg || !VERSIONS[versionArg]) {
    const available = Object.keys(VERSIONS).join(', ');
    console.error(`Uso: node scripts/download-spa-bible.js <VERSION>`);
    console.error(`Versiones disponibles: ${available}`);
    process.exit(1);
  }

  const { file, outKey, label } = VERSIONS[versionArg];
  const OUTPUT_FILE = path.join(DATA_DIR, `${outKey}.json`);
  const SOURCE_URL  = BASE_URL + file;

  console.log(`=== Descarga: ${label} (${versionArg}) ===`);
  console.log('Fuente: mrk214/bible-data-es-spa\n');

  try {
    await fs.access(OUTPUT_FILE);
    const resp = await pregunta(`data/${outKey}.json ya existe. ¿Sobreescribir? (y/n) `);
    if (resp !== 'y' && resp !== 'yes' && resp !== 's' && resp !== 'si' && resp !== 'sí') {
      console.log('Cancelado.');
      process.exit(0);
    }
  } catch { /* no existe, continuar */ }

  await fs.mkdir(DATA_DIR, { recursive: true });

  console.log(`Descargando desde:\n  ${SOURCE_URL}`);
  console.log('(Los archivos son grandes ~25-35 MB, puede tardar unos segundos...)\n');

  let rawJson;
  try {
    rawJson = await fetchUrl(SOURCE_URL);
  } catch (err) {
    console.error('Error al descargar:', err.message);
    process.exit(1);
  }
  console.log('Descarga completada. Normalizando datos...');

  let source;
  try {
    source = JSON.parse(rawJson.replace(/^\uFEFF/, ''));
  } catch (err) {
    console.error('Error al parsear JSON:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(source.books)) {
    console.error('Formato inesperado: no se encontró el array "books"');
    process.exit(1);
  }

  const books = [];
  let totalVerses = 0;
  let skipped = 0;

  for (const srcBook of source.books) {
    const usfm = srcBook.book_usfm;
    const bookInfo = USFM_MAP[usfm];

    if (!bookInfo) {
      // Libro deuterocanónico u otro no incluido en el canon protestante
      skipped++;
      continue;
    }

    const chapters = [];

    for (const srcChap of srcBook.chapters) {
      if (!srcChap.is_chapter) continue;

      // Extraer número de capítulo desde "GEN.1" → 1
      const chapNum = parseInt(srcChap.chapter_usfm.split('.')[1], 10);
      if (isNaN(chapNum)) continue;

      const verses = extraerVersiculos(srcChap.items ?? []);
      if (verses.length === 0) continue;

      chapters.push({ chapter: chapNum, verses });
      totalVerses += verses.length;
    }

    if (chapters.length === 0) continue;

    books.push({
      id:      bookInfo.id,
      name:    bookInfo.name,
      abbrev:  bookInfo.abbrev,
      chapters,
    });

    process.stdout.write(
      `  ${bookInfo.id.toString().padStart(2, ' ')}. ${bookInfo.name.padEnd(20, ' ')} — ${chapters.length} capítulos\n`
    );
  }

  // Ordenar por id de libro
  books.sort((a, b) => a.id - b.id);

  if (skipped > 0) {
    console.log(`\n  (${skipped} libros deuterocanónicos omitidos)`);
  }

  const output = {
    version: label,
    lang: 'es',
    books,
  };

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');

  console.log(`\nListo. ${books.length} libros, ${totalVerses.toLocaleString()} versículos.`);
  console.log(`Guardado en: data/${outKey}.json`);
  console.log('\nAgregá la versión al servidor en BIBLE_FILES (server.js) si no está ya.');
}

main().catch((err) => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
