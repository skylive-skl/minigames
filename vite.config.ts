import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const designReferencesDirectory = fileURLToPath(new URL('design-refs', import.meta.url));

function designReferencesDevelopmentServer(): Plugin {
  return {
    name: 'design-refs-dev-server',
    apply: 'serve',
    configureServer(server): void {
      server.middlewares.use('/__design-refs__', (request, response, next) => {
        const fileName = path.basename(request.url ?? '');

        if (!fileName.endsWith('.png')) {
          next();
          return;
        }

        void (async (): Promise<void> => {
          try {
            const buffer = await readFile(path.join(designReferencesDirectory, fileName));
            response.setHeader('Content-Type', 'image/png');
            response.end(buffer);
          } catch {
            response.statusCode = 404;
            response.end();
          }
        })();
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  base: '/minigames/',
  plugins: [designReferencesDevelopmentServer()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: mode !== 'production',
    minify: mode === 'production',
  },
}));
