import { defineConfig } from 'vitest/config';

// Firestore rules tests — need the emulator, so they're kept out of `npm test`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.spec.ts'],
    fileParallelism: false,
    testTimeout: 20000,
  },
});
