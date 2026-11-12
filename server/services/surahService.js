import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve relative to this file, not the process working directory.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.resolve(HERE, '../../assets/data/chapters.js');

let chapters = null;

function load() {
  if (chapters) return chapters;
  const src = fs.readFileSync(dataPath, 'utf8');
  const m = src.match(/chapters:\s*\[(.*?)\]\s*\}/s);
  if (!m) throw new Error('chapters data could not be parsed');
  const re =
    /\{\s*n:\s*(\d+),\s*ar:\s*"([^"]*)",\s*en:\s*"([^"]*)",\s*bn:\s*"([^"]*)"\s*\}/g;
  chapters = [];
  let x;
  while ((x = re.exec(m[1]))) {
    chapters.push({
      n: Number.parseInt(x[1], 10),
      ar: x[2],
      en: x[3],
      bn: x[4],
    });
  }
  if (chapters.length !== 114) {
    throw new Error(`expected 114 chapters, parsed ${chapters.length}`);
  }
  return chapters;
}

export async function listSurahs() {
  return load();
}

export async function getSurah(id) {
  return load().find((s) => s.n === id) || null;
}

export async function getAyah(surahId, ayahId) {
  const s = await getSurah(surahId);
  if (!s) return null;
  // The public dataset does not include per-ayah tafsir yet; expose the
  // reference explicitly rather than inventing text.
  return { ...s, ayah: ayahId, text: null };
}
