import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    resolve: {
        conditions: ['@dev'],
        alias: [
            { find: /^#app\.js$/, replacement: resolve(__dirname, 'src/app.ts') },
            { find: /^#configs\/(.+)\.js$/, replacement: resolve(__dirname, 'src/configs/$1.ts') },
            { find: /^#modules\/(.+)\.js$/, replacement: resolve(__dirname, 'src/modules/$1.ts') },
            { find: /^#shared\/(.+)\.js$/, replacement: resolve(__dirname, 'src/shared/$1.ts') },
            { find: /^#databases\/(.+)\.js$/, replacement: resolve(__dirname, 'src/databases/$1.ts') },
            { find: /^#docs\/(.+)\.js$/, replacement: resolve(__dirname, 'src/docs/$1.ts') },
            { find: /^#middlewares\/(.+)\.js$/, replacement: resolve(__dirname, 'src/middlewares/$1.ts') },
            { find: /^#tests\/(.+)\.js$/, replacement: resolve(__dirname, 'tests/$1.ts') },
        ],
    },
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.ts'],
        exclude: ['**/node_modules/**', 'tests/setup.ts', 'tests/helpers/*.ts', 'tests/mocks/*.ts'],
    },
});
