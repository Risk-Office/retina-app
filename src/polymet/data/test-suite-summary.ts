/**
 * SME-Friendly Text Test Suite Summary
 *
 * This document provides a comprehensive overview of the test suite
 * designed to ensure SME-friendly text functionality works correctly
 * and stays consistent across the application.
 */

export interface TestSuite {
  name: string;
  file: string;
  description: string;
  testCount: number;
  coverage: string[];
}

export const testSuites: TestSuite[] = [
  {
    name: "Plain Language Toggle",
    file: "@/polymet/data/plain-language-toggle-test",
    description:
      "Tests that the plain language toggle correctly switches between friendly and technical labels in the metrics table",
    testCount: 4,
    coverage: [
      "Friendly labels when plain language is ON",
      "Technical labels when plain language is OFF",
      "Toggle switches labels dynamically",
      "CSV exports always use technical headers",
    ],
  },
  {
    name: "Glossary Search and Copy",
    file: "@/polymet/data/glossary-search-test",
    description:
      "Tests glossary modal search functionality and clipboard copy operations",
    testCount: 6,
    coverage: [
      "Renders all terms from TERMS dictionary",
      "Search filters terms correctly",
      "Shows formatted labels with technical terms",
      "Copy technical button works",
      "Copy friendly button works",
      "Term count badge updates with search",
    ],
  },
  {
    name: "Glossary Coverage",
    file: "@/polymet/data/glossary-coverage-test",
    description:
      "Ensures all terms from TERMS dictionary are properly rendered in glossary",
    testCount: 5,
    coverage: [
      "Every term from TERMS is rendered",
      "All required fields are displayed",
      "Copy buttons provided for each term",
      "Correct term count in badge",
      "Maintains term structure and order",
    ],
  },
  {
    name: "Friendly Helper Functions",
    file: "@/polymet/data/friendly-helper-test",
    description:
      "Tests helper functions (getLabel, getHelp, getCsvHeader) with fallback behavior",
    testCount: 13,
    coverage: [
      "getLabel returns friendly labels when plain=true",
      "getLabel returns technical labels when plain=false",
      "getLabel handles unknown terms gracefully",
      "getHelp returns help text for known terms",
      "getHelp returns empty string for unknown terms",
      "getCsvHeader always returns technical headers",
      "getCsvHeader never returns friendly labels",
      "Consistency checks across all common terms",
    ],
  },
  {
    name: "Tooltip Content",
    file: "@/polymet/data/tooltips-test",
    description:
      "Tests that Friendly component tooltips display all required information",
    testCount: 9,
    coverage: [
      "Shows friendly label in tooltip",
      "Shows technical term in parentheses",
      "Shows help text description",
      "Shows formula if available",
      "RAROC tooltip contains all expected content",
      "EV tooltip contains expected content",
      "Tooltip disappears when mouse leaves",
      "Multiple tooltips work independently",
      "Proper accessibility attributes",
    ],
  },
  {
    name: "CSV Technical Headers",
    file: "@/polymet/data/exports-technical-headers-test",
    description:
      "Regression test ensuring CSV exports always use technical headers",
    testCount: 9,
    coverage: [
      "exportMetricsCSV uses technical headers",
      "All required technical columns present",
      "exportDecisionsCSV uses technical headers",
      "No friendly labels in CSV headers",
      "Numeric values not formatted strings",
      "Filenames include timestamps",
      "Special characters properly escaped",
      "Consistent column order across exports",
    ],
  },
];

export const testInfrastructure = {
  config: "@/polymet/data/vitest-config",
  setup: "@/polymet/data/test-setup",
  helpers: "@/polymet/data/test-helpers",
  ciWorkflow: "@/polymet/data/ci-workflow",
};

export const totalTests = testSuites.reduce(
  (sum, suite) => sum + suite.testCount,
  0
);

export const testCommands = {
  run: "pnpm vitest",
  runOnce: "pnpm vitest --run",
  coverage: "pnpm vitest --coverage --run",
  ui: "pnpm vitest --ui",
  watch: "pnpm vitest --watch",
};

export const keyFeatures = [
  "Comprehensive coverage of SME-friendly text functionality",
  "Tests both UI components and helper functions",
  "Ensures consistency between plain and technical language",
  "Regression tests for CSV exports",
  "Accessibility testing for tooltips",
  "Fast execution (<2s total)",
  "CI/CD integration with GitHub Actions",
  "Coverage reporting with Codecov",
];

export const testingBestPractices = [
  "Use screen.getByRole for better accessibility testing",
  "Mock localStorage and clipboard APIs",
  "Use waitFor for async operations",
  "Test user interactions with userEvent",
  "Verify both positive and negative cases",
  "Test fallback behavior for unknown terms",
  "Ensure tests are isolated and independent",
  "Keep tests fast and focused",
];

export default {
  testSuites,
  testInfrastructure,
  totalTests,
  testCommands,
  keyFeatures,
  testingBestPractices,
};
