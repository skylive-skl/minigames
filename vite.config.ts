import { copyFile, readFile } from 'node:fs/promises';
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

// GitHub Pages has no SPA rewrites: it serves 404.html for unknown paths, so a
// copy of index.html lets deep links like /minigames/library?page=2 boot the app.
function spaFallbackPage(): Plugin {
  let outDirectory = 'dist';

  return {
    name: 'spa-fallback-page',
    apply: 'build',
    configResolved(config): void {
      outDirectory = path.resolve(config.root, config.build.outDir);
    },
    async closeBundle(): Promise<void> {
      await copyFile(path.join(outDirectory, 'index.html'), path.join(outDirectory, '404.html'));
    },
  };
}

export default defineConfig(({ mode }) => ({
  base: '/minigames/',
  plugins: [designReferencesDevelopmentServer(), spaFallbackPage()],
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
