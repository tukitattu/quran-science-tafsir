import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import surahRoutes from './routes/surah.js';
import progressRoutes from './routes/progress.js';
import { errorHandler } from './middleware/errorHandler.js';

// Optional API prototype. The real site is served statically by GitHub Pages;
// this process only exposes JSON endpoints and never the repository tree.
const app = express();
const PORT = Number(process.env.PORT || 3000);

// Public read-only API: opt in to cross-origin use explicitly.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ||
  'https://tukitattu.github.io,https://equran.alshahriar.dev')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(
  helmet({
    contentSecurityPolicy: false, // JSON API — no documents are rendered
    crossOriginResourcePolicy: { policy: 'same-site' },
  }),
);
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error('Origin not allowed'));
    },
    methods: ['GET', 'POST'],
  }),
);
// Progress payloads are tiny; cap the body so a client cannot exhaust memory.
app.use(express.json({ limit: '32kb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', uptime: process.uptime() }),
);

// Thin controllers; services hold the logic.
app.use('/api/surah', surahRoutes);
app.use('/api/progress', progressRoutes);

// No static file serving: files are published by GitHub Pages, not by Node.
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.use(errorHandler);

const server = app.listen(PORT, () =>
  console.log(`Tafsir API listening on :${PORT} — ${new Date().toISOString()}`),
);

// Fail closed on unexpected shutdown so supervisors can restart cleanly.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  });
}
