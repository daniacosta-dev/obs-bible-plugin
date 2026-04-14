#!/usr/bin/env node
/**
 * Descarga y normaliza la Biblia Reina-Valera (dominio público)
 * Fuente: scrollmapper/bible_databases — sources/es/SpaRV/SpaRV.json
 *
 * Formato fuente:
 *   { "books": [ { "name": "Genesis", "chapters": [ { "chapter": 1,
 *     "verses": [ { "verse": 1, "text": "..." } ] } ] } ] }
 *
 * Los nombres de libros en el fuente están en inglés; se mapean por posición
 * (índice 0–65) a los nombres españoles con abreviatura.
 */

import https from 'https';
import fs from 'fs/promises';
import path from 'path';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'rv1909.json');

const SOURCE_URL =
  'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/sources/es/SpaRV/SpaRV.json';

// Mapeo completo de los 66 libros del canon protestante
// id corresponde al b (book) numérico del JSON fuente (1–66)
const BOOK_MAP = [
  { id: 1,  name: 'Génesis',           abbrev: 'Gn'  },
  { id: 2,  name: 'Éxodo',             abbrev: 'Éx'  },
  { id: 3,  name: 'Levítico',          abbrev: 'Lv'  },
  { id: 4,  name: 'Números',           abbrev: 'Nm'  },
  { id: 5,  name: 'Deuteronomio',      abbrev: 'Dt'  },
  { id: 6,  name: 'Josué',             abbrev: 'Jos' },
  { id: 7,  name: 'Jueces',            abbrev: 'Jue' },
  { id: 8,  name: 'Rut',               abbrev: 'Rt'  },
  { id: 9,  name: '1 Samuel',          abbrev: '1 S' },
  { id: 10, name: '2 Samuel',          abbrev: '2 S' },
  { id: 11, name: '1 Reyes',           abbrev: '1 R' },
  { id: 12, name: '2 Reyes',           abbrev: '2 R' },
  { id: 13, name: '1 Crónicas',        abbrev: '1 Cr'},
  { id: 14, name: '2 Crónicas',        abbrev: '2 Cr'},
  { id: 15, name: 'Esdras',            abbrev: 'Esd' },
  { id: 16, name: 'Nehemías',          abbrev: 'Neh' },
  { id: 17, name: 'Ester',             abbrev: 'Est' },
  { id: 18, name: 'Job',               abbrev: 'Job' },
  { id: 19, name: 'Salmos',            abbrev: 'Sal' },
  { id: 20, name: 'Proverbios',        abbrev: 'Pr'  },
  { id: 21, name: 'Eclesiastés',       abbrev: 'Ec'  },
  { id: 22, name: 'Cantares',          abbrev: 'Cnt' },
  { id: 23, name: 'Isaías',            abbrev: 'Is'  },
  { id: 24, name: 'Jeremías',          abbrev: 'Jer' },
  { id: 25, name: 'Lamentaciones',     abbrev: 'Lm'  },
  { id: 26, name: 'Ezequiel',          abbrev: 'Ez'  },
  { id: 27, name: 'Daniel',            abbrev: 'Dn'  },
  { id: 28, name: 'Oseas',             abbrev: 'Os'  },
  { id: 29, name: 'Joel',              abbrev: 'Jl'  },
  { id: 30, name: 'Amós',              abbrev: 'Am'  },
  { id: 31, name: 'Abdías',            abbrev: 'Abd' },
  { id: 32, name: 'Jonás',             abbrev: 'Jon' },
  { id: 33, name: 'Miqueas',           abbrev: 'Miq' },
  { id: 34, name: 'Nahúm',             abbrev: 'Nah' },
  { id: 35, name: 'Habacuc',           abbrev: 'Hab' },
  { id: 36, name: 'Sofonías',          abbrev: 'Sof' },
  { id: 37, name: 'Hageo',             abbrev: 'Hag' },
  { id: 38, name: 'Zacarías',          abbrev: 'Zac' },
  { id: 39, name: 'Malaquías',         abbrev: 'Mal' },
  { id: 40, name: 'Mateo',             abbrev: 'Mt'  },
  { id: 41, name: 'Marcos',            abbrev: 'Mr'  },
  { id: 42, name: 'Lucas',             abbrev: 'Lc'  },
  { id: 43, name: 'Juan',              abbrev: 'Jn'  },
  { id: 44, name: 'Hechos',            abbrev: 'Hch' },
  { id: 45, name: 'Romanos',           abbrev: 'Ro'  },
  { id: 46, name: '1 Corintios',       abbrev: '1 Co'},
  { id: 47, name: '2 Corintios',       abbrev: '2 Co'},
  { id: 48, name: 'Gálatas',           abbrev: 'Gá'  },
  { id: 49, name: 'Efesios',           abbrev: 'Ef'  },
  { id: 50, name: 'Filipenses',        abbrev: 'Fil' },
  { id: 51, name: 'Colosenses',        abbrev: 'Col' },
  { id: 52, name: '1 Tesalonicenses',  abbrev: '1 Ts'},
  { id: 53, name: '2 Tesalonicenses',  abbrev: '2 Ts'},
  { id: 54, name: '1 Timoteo',         abbrev: '1 Ti'},
  { id: 55, name: '2 Timoteo',         abbrev: '2 Ti'},
  { id: 56, name: 'Tito',              abbrev: 'Tit' },
  { id: 57, name: 'Filemón',           abbrev: 'Flm' },
  { id: 58, name: 'Hebreos',           abbrev: 'He'  },
  { id: 59, name: 'Santiago',          abbrev: 'Stg' },
  { id: 60, name: '1 Pedro',           abbrev: '1 P' },
  { id: 61, name: '2 Pedro',           abbrev: '2 P' },
  { id: 62, name: '1 Juan',            abbrev: '1 Jn'},
  { id: 63, name: '2 Juan',            abbrev: '2 Jn'},
  { id: 64, name: '3 Juan',            abbrev: '3 Jn'},
  { id: 65, name: 'Judas',             abbrev: 'Jud' },
  { id: 66, name: 'Apocalipsis',       abbrev: 'Ap'  },
];

/** Descarga el contenido de una URL HTTPS y lo devuelve como string */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Seguir redirecciones
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

/** Pregunta al usuario y devuelve la respuesta (una línea) */
function pregunta(prompt) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function main() {
  console.log('=== Configuración: Reina-Valera 1909 ===');
  console.log('Fuente: scrollmapper/bible_databases (dominio público)\n');

  // Verificar si el archivo ya existe
  try {
    await fs.access(OUTPUT_FILE);
    const resp = await pregunta('data/rv1909.json ya existe. ¿Sobreescribir? (y/n) ');
    if (resp !== 'y' && resp !== 'yes' && resp !== 's' && resp !== 'si' && resp !== 'sí') {
      console.log('Cancelado. El archivo existente no fue modificado.');
      process.exit(0);
    }
  } catch {
    // El archivo no existe, continuar
  }

  // Asegurar que el directorio data/ exista
  await fs.mkdir(DATA_DIR, { recursive: true });

  // Descargar JSON fuente
  console.log(`Descargando desde:\n  ${SOURCE_URL}\n`);
  let rawJson;
  try {
    rawJson = await fetchUrl(SOURCE_URL);
  } catch (err) {
    console.error('Error al descargar:', err.message);
    process.exit(1);
  }
  console.log('Descarga completada. Normalizando datos...');

  // Parsear fuente
  let source;
  try {
    source = JSON.parse(rawJson);
  } catch (err) {
    console.error('Error al parsear JSON:', err.message);
    process.exit(1);
  }

  // Formato fuente: { "books": [ { "name": "Genesis", "chapters": [...] } ] }
  const sourceBooks = source?.books;
  if (!Array.isArray(sourceBooks) || sourceBooks.length === 0) {
    console.error('Formato inesperado: no se encontró el array "books"');
    process.exit(1);
  }

  if (sourceBooks.length !== BOOK_MAP.length) {
    console.warn(`  Advertencia: el fuente tiene ${sourceBooks.length} libros, se esperaban ${BOOK_MAP.length}`);
  }

  // Construir estructura normalizada mapeando por posición
  const books = [];
  let totalVerses = 0;

  for (let i = 0; i < BOOK_MAP.length; i++) {
    const bookInfo = BOOK_MAP[i];
    const srcBook  = sourceBooks[i];

    if (!srcBook) {
      console.warn(`  Advertencia: libro ${bookInfo.id} (${bookInfo.name}) no encontrado en la fuente`);
      continue;
    }

    const chapters = [];
    for (const srcChap of srcBook.chapters) {
      const verses = srcChap.verses.map((v) => ({
        verse: v.verse,
        // Trim para eliminar espacios sobrantes que trae la fuente
        text: v.text.trim(),
      }));
      chapters.push({ chapter: srcChap.chapter, verses });
      totalVerses += verses.length;
    }

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

  const output = {
    version: 'Reina-Valera 1909',
    lang: 'es',
    books,
  };

  // Guardar archivo
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');

  console.log(`\nListo. ${books.length} libros, ${totalVerses.toLocaleString()} versículos.`);
  console.log(`Guardado en: ${OUTPUT_FILE}`);
  console.log('\nPuedes iniciar el servidor con: npm start');
}

main().catch((err) => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
