import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mockDir = path.resolve(__dirname, 'src/mocks');

const readJson = (filename) => {
  const filePath = path.join(mockDir, filename);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
};

const sendJson = (res, payload) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const mockApiPlugin = {
  name: 'local-mock-api',
  apply: 'serve',
  configureServer(server) {
    server.watcher.add(mockDir);

    server.watcher.on('change', (changedPath) => {
      if (changedPath.startsWith(mockDir)) {
        server.ws.send({ type: 'full-reload' });
      }
    });

    server.middlewares.use((req, res, next) => {
      if (!req.url?.startsWith('/api')) return next();

      const { pathname } = new URL(req.url, 'http://localhost');
      const locations = readJson('locations.json');
      const boards = readJson('boards.json');
      const slides = readJson('slides.json');

      if (pathname === '/api/locations') {
        sendJson(res, locations);
        return;
      }

      const boardsMatch = pathname.match(/^\/api\/locations\/([^/]+)\/boards\/?$/);
      if (boardsMatch) {
        const [, locationSlug] = boardsMatch;
        const locationBoards = boards
          .filter((board) => board.locationSlug === locationSlug)
          .map((board) => ({
            ...board,
            slides: slides.filter(
              (slide) =>
                slide.locationSlug === locationSlug && slide.boardSlug === board.boardSlug
            ),
          }));

        sendJson(res, locationBoards);
        return;
      }

      const slidesMatch = pathname.match(
        /^\/api\/locations\/([^/]+)\/boards\/([^/]+)\/slides\/?$/
      );
      if (slidesMatch) {
        const [, locationSlug, boardSlug] = slidesMatch;
        const boardSlides = slides.filter(
          (slide) => slide.locationSlug === locationSlug && slide.boardSlug === boardSlug
        );
        sendJson(res, boardSlides);
        return;
      }

      return next();
    });
  },
};

export default defineConfig({
  root: path.resolve(__dirname, 'src'),
  server: {
    port: 3000,
    open: true,
    host: true,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [mockApiPlugin],
});
