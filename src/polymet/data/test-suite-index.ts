/**
 * Test Suite Index
 *
 * Central documentation for all testing utilities
 * for the SME-friendly text functionality.
 *
 * Note: Test helpers and testing libraries are only available
 * in the test environment, not in the application runtime.
 */

/**
 * Test Suite Summary
 *
 * This test suite ensures the SME-friendly text feature works correctly:
 *
 * 1. Plain Language Toggle (plain-language-toggle-test)
 *    - UI labels change based on setting
 *    - CSV exports always use technical headers
 *
 * 2. Glossary Search (glossary-search-test)
 *    - Search filtering works correctly
 *    - Copy functionality works for both friendly and technical terms
 *
 * 3. Glossary Coverage (glossary-coverage-test)
 *    - All TERMS dictionary entries are rendered
 *    - No terms are missing from the glossary
 *
 * 4. Friendly Helpers (friendly-helper-test)
 *    - getLabel() returns correct labels
 *    - getHelp() returns help text
 *    - getCsvHeader() always returns technical
 *    - Unknown terms have safe fallbacks
 *
 * 5. Tooltips (tooltips-test)
 *    - Tooltip content is correct
 *    - Accessibility attributes are present
 *    - Hover behavior works correctly
 *
 * 6. CSV Technical Headers (exports-technical-headers-test)
 *    - Metrics export uses technical headers
 *    - Decisions export uses technical headers
 *    - No friendly labels in CSV files
 *
 * Quick Start:
 * ```bash
 * pnpm test                 # Run all tests
 * pnpm test:watch          # Watch mode for development
 * pnpm test:run            # CI mode (run once)
 * pnpm test:coverage       # Generate coverage report
 * ```
 *
 * Test Configuration:
 * - Framework: Vitest
 * - Testing Library: React Testing Library
 * - Environment: jsdom
 * - Globals: Enabled (no need to import describe, it, expect)
 *
 * Coverage Goals:
 * - Statements: >80%
 * - Branches: >75%
 * - Functions: >80%
 * - Lines: >80%
 */

export const TEST_FILES = {
  "plain-language-toggle":
    "Tests UI label changes based on plain language setting",
  "glossary-search": "Tests glossary search and copy functionality",
  "glossary-coverage": "Ensures all TERMS are rendered in glossary",
  "friendly-helper": "Tests helper functions with fallback behavior",
  tooltips: "Tests tooltip content and accessibility",
  "exports-technical-headers": "Regression test for CSV exports",
} as const;

export const QUICK_COMMANDS = {
  runAll: "pnpm test",
  watch: "pnpm test:watch",
  ci: "pnpm test:run",
  coverage: "pnpm test:coverage",
  specific: "pnpm test <test-name>",
} as const;
