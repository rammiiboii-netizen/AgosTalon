import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Backend Proxy endpoint for ntfy push notifications
  // Eliminates all browser CORS and Content-Security-Policy restrictions
  app.post('/api/ntfy', async (req, res) => {
    try {
      const payload = req.body;
      const ntfyResponse = await fetch('https://ntfy.sh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!ntfyResponse.ok) {
        const errText = await ntfyResponse.text();
        return res.status(ntfyResponse.status).json({ 
          error: `ntfy error: ${ntfyResponse.status} ${errText}` 
        });
      }

      const data = await ntfyResponse.json();
      return res.json({ success: true, ...data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Server ntfy proxy failed:', msg);
      return res.status(500).json({ error: msg });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
