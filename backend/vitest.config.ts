import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        conditions: ['@dev'],
    },
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.ts'],
        exclude: ['**/node_modules/**', 'tests/setup.ts', 'tests/helpers/*.ts', 'tests/mocks/*.ts'],
    },
});
