import { Router } from 'express';

const r = Router();
const store = new Map(); // In-memory prototype; swap for Redis/DB in production.

const MAX_VISITED = 5000;
const USER_ID = /^[A-Za-z0-9_-]{1,64}$/;

function validUserId(id) {
  return typeof id === 'string' && USER_ID.test(id);
}

r.get('/:userId', (req, res) => {
  if (!validUserId(req.params.userId)) {
    return res.status(400).json({ error: 'Invalid userId' });
  }
  const data = store.get(req.params.userId) || { visited: [], streak: 0 };
  res.json(data);
});

r.post('/:userId', (req, res) => {
  if (!validUserId(req.params.userId)) {
    return res.status(400).json({ error: 'Invalid userId' });
  }
  const { visited, streak } = req.body || {};
  if (!Array.isArray(visited)) {
    return res.status(400).json({ error: 'visited must be an array' });
  }
  if (visited.length > MAX_VISITED) {
    return res.status(413).json({ error: 'visited is too large' });
  }
  const cleanVisited = visited.filter(
    (v) => Number.isInteger(v) && v >= 1 && v <= 6236,
  );
  if (cleanVisited.length !== visited.length) {
    return res.status(400).json({ error: 'visited must contain ayah numbers 1-6236' });
  }
  const cleanStreak =
    Number.isInteger(streak) && streak >= 0 && streak <= 100000 ? streak : 0;
  store.set(req.params.userId, {
    visited: cleanVisited,
    streak: cleanStreak,
    updatedAt: new Date().toISOString(),
  });
  res.json({ ok: true });
});

export default r;
