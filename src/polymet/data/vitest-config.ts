/**
 * Vitest Configuration
 *
 * This configuration sets up the testing environment for SME-friendly text functionality.
 *
 * Usage:
 * - Run tests: pnpm vitest
 * - Run tests once: pnpm vitest --run
 * - Coverage: pnpm vitest --coverage
 *
 * Configuration:
 * - Environment: jsdom (for React component testing)
 * - Globals: true (no need to import describe, it, expect)
 * - Setup files: ./tests/setup.ts
 */

export const vitestConfig = {
  plugins: ["@vitejs/plugin-react"],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
      ],
    },
  },
  resolve: {
    alias: {
      "@/polymet": "./polymet",
      "@/components": "./components",
      "@/lib": "./lib",
    },
  },
};

export default vitestConfig;
