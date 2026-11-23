import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// SWC instead of esbuild: Nest's dependency injection needs decorator metadata, which esbuild does not emit.
export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    env: { NODE_ENV: 'test' },
    // Nest reads decorator metadata through this polyfill; main.ts imports it for the server
    setupFiles: ['reflect-metadata'],
  },
  // swcrc: false: .swcrc is for the build and excludes *.spec.ts; tests need their own settings
  plugins: [
    swc.vite({
      swcrc: false,
      module: { type: 'es6' },
      jsc: {
        target: 'es2023',
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        keepClassNames: true,
      },
    }),
  ],
});
