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
          'src/main.ts',
          'src/shared/dev/**',
          'src/test/**',
          'src/**/*.test.ts',
          'src/shared/auth/firebase.ts',
          'src/**/*.d.ts',
        ],
      },
    },
  }),
);
