import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default defineConfig((configEnvironment) =>
  mergeConfig(viteConfig(configEnvironment), {
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.ts'],
      setupFiles: ['src/test/setup.ts'],
      restoreMocks: true,
      unstubGlobals: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['src/**/*.ts'],
        exclude: [
          // Bootstrap only: mounts the app and starts it, no logic of its own.
          'src/main.ts',
          // Dev-only Figma comparison overlay, loaded behind import.meta.env.DEV
          // and never shipped in the production build.
          'src/shared/dev/**',
          // Test infrastructure (jsdom polyfills, helpers) and the tests themselves.
          'src/test/**',
          'src/**/*.test.ts',
          // Ambient type declarations compile to nothing.
          'src/**/*.d.ts',
        ],
      },
    },
  }),
);
