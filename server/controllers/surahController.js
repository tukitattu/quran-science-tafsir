import * as service from '../services/surahService.js';

function parseAyah(value) {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n >= 1 && n <= 286 ? n : null;
}

export async function list(req, res, next) {
  try {
    const data = await service.listSurahs();
    res.json({ count: data.length, data });
  } catch (e) {
    next(e);
  }
}

export async function getOne(req, res, next) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1 || id > 114) {
      return res.status(400).json({ error: 'Invalid surah id' });
    }
    const data = await service.getSurah(id);
    if (!data) return res.status(404).json({ error: 'Surah not found' });
    res.json(data);
  } catch (e) {
    next(e);
  }
}

export async function getAyah(req, res, next) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const ayah = parseAyah(req.params.ayahId);
    if (!Number.isInteger(id) || id < 1 || id > 114 || ayah === null) {
      return res.status(400).json({ error: 'Invalid surah or ayah id' });
    }
    const data = await service.getAyah(id, ayah);
    if (!data) return res.status(404).json({ error: 'Ayah not found' });
    res.json(data);
  } catch (e) {
    next(e);
  }
}
