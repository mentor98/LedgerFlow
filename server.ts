import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/api/router.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser with limit
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logger in dev
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      if (req.path.startsWith('/api')) {
        const duration = Date.now() - start;
        console.log(`[LedgerFlow API] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });

  // Mount API Router under /api/v1 and /api
  app.use('/api/v1', apiRouter);
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/healthz', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 LedgerFlow Engine running on http://0.0.0.0:${PORT}`);
    console.log(`📊 REST API ready at http://0.0.0.0:${PORT}/api/v1`);
    console.log(`====================================================`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start LedgerFlow server:', err);
  process.exit(1);
});
