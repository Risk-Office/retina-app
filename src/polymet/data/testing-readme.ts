/**
 * Testing Documentation for SME-Friendly Text Functionality
 *
 * This document describes the test suite for ensuring plain-language
 * terminology works correctly and stays consistent across the application.
 */

export const TESTING_README = `
# SME-Friendly Text Testing Suite

## Overview

This test suite ensures that the plain-language terminology feature works correctly
and maintains consistency across the Retina application. It uses Vitest + React Testing Library
with jsdom environment.

## Test Files

### 1. Plain Language Toggle Test
**File:** \`plain-language-toggle-test\`

Tests that UI labels change based on the plain language setting:
- Shows friendly labels when plain language is ON ("Expected profit", "Return per risk capital")
- Shows technical labels when plain language is OFF ("EV", "RAROC")
- Updates labels dynamically when toggling the setting
- Ensures CSV exports always use technical headers regardless of UI setting

### 2. Glossary Search Test
**File:** \`glossary-search-test\`

Tests glossary modal search and copy functionality:
- Renders all terms when no filter is applied
- Filters terms correctly when searching (e.g., "risk capital")
- Copies technical terms to clipboard ("RAROC")
- Copies friendly terms to clipboard ("Return per risk capital")
- Updates term count badge based on search results

### 3. Glossary Coverage Test
**File:** \`glossary-coverage-test\`

Ensures all TERMS dictionary entries are rendered:
- Verifies every term from TERMS appears in the glossary
- Checks all required fields are displayed (label, tech, help, formula)
- Ensures copy buttons exist for each term
- Validates term count accuracy
- Maintains proper term structure and hierarchy

### 4. Friendly Helper Test
**File:** \`friendly-helper-test\`

Tests helper functions with fallback behavior:
- \`getLabel()\` returns correct labels based on plain language setting
- \`getHelp()\` returns help text for known terms
- \`getCsvHeader()\` always returns technical headers
- Unknown terms return the input key as safe fallback
- Consistency checks across all common terms

### 5. Tooltips Test
**File:** \`tooltips-test\`

Tests tooltip content and behavior:
- Shows friendly label, technical term, help text, and formula on hover
- Respects plain language setting
- Closes when mouse leaves
- Has proper accessibility attributes
- Handles terms without formulas gracefully

### 6. CSV Technical Headers Test
**File:** \`exports-technical-headers-test\`

Regression test for CSV exports:
- Metrics export uses technical headers (RAROC, EV, VaR95, CVaR95, Economic Capital)
- Decisions export uses technical headers
- Never includes friendly labels in CSV headers
- Uses numeric values, not formatted strings
- Handles special characters properly
- Maintains consistent column order

## Running Tests

### Run all tests
\`\`\`bash
pnpm test
# or
npm test
# or
yarn test
\`\`\`

### Run tests in watch mode (development)
\`\`\`bash
pnpm test:watch
# or
npm run test:watch
\`\`\`

### Run tests once (CI)
\`\`\`bash
pnpm test:run
# or
npm run test:run
\`\`\`

### Run specific test file
\`\`\`bash
pnpm test plain-language-toggle
# or
pnpm test glossary-search
\`\`\`

### Run with coverage
\`\`\`bash
pnpm test:coverage
# or
npm run test:coverage
\`\`\`

## Test Helpers

### Available Helpers (\`test-helpers\`)

- **mockLocalStorage()** - Mock localStorage API
- **setupLocalStorage()** - Initialize localStorage with values
- **mockClipboard()** - Mock clipboard API for copy tests
- **renderWithProviders()** - Render components with TenantProvider and BrowserRouter
- **mockTerms** - Sample TERMS data for testing
- **mockSimulationResults()** - Generate mock simulation data

### Example Usage

\`\`\`typescript
import { renderWithProviders, mockClipboard } from '@/polymet/data/test-helpers';

// Render with plain language ON
renderWithProviders(<MyComponent />, { plainLanguage: true });

// Mock clipboard for copy tests
const clipboard = mockClipboard();
// ... perform copy action
expect(clipboard.writeText).toHaveBeenCalledWith('RAROC');
\`\`\`

## CI Integration

### GitHub Actions Workflow

Add this step to your \`.github/workflows/test.yml\`:

\`\`\`yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm test:run
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
\`\`\`

## Test Configuration

### Vitest Config

Tests use the following configuration:
- **Environment:** jsdom (for React component testing)
- **Globals:** true (no need to import describe, it, expect)
- **Setup:** Automatic cleanup after each test
- **Mocks:** localStorage, clipboard, window.matchMedia, IntersectionObserver

### Mock Setup

Global mocks are configured in the test setup:
- localStorage is cleared after each test
- clipboard API is mocked for copy tests
- window.crypto is mocked for hashing operations
- IntersectionObserver and ResizeObserver are mocked for UI components

## Best Practices

1. **Use semantic queries:** Prefer \`getByRole\`, \`getByLabelText\` over \`getByTestId\`
2. **Wait for async updates:** Use \`waitFor\` for async state changes
3. **Mock external dependencies:** Mock TERMS, API calls, etc.
4. **Test user interactions:** Use \`userEvent\` for realistic interactions
5. **Keep tests fast:** Aim for <2s total test suite execution time
6. **Test accessibility:** Verify ARIA attributes and keyboard navigation

## Troubleshooting

### Tests fail with "localStorage is not defined"
- Ensure test setup is imported correctly
- Check that jsdom environment is configured

### Tests fail with "clipboard is not defined"
- Use \`mockClipboard()\` helper before testing copy functionality

### Tests timeout
- Increase timeout in test: \`it('test name', async () => { ... }, 10000)\`
- Check for missing \`await\` on async operations

### Mock data doesn't match
- Verify TERMS mock matches actual data structure
- Update test helpers if data structure changes

## Maintenance

### Adding New Terms

When adding new terms to TERMS dictionary:
1. Update \`glossary-coverage-test\` if needed
2. Add specific test cases for new terms if they have special behavior
3. Verify CSV export includes new terms correctly

### Updating Labels

When changing friendly labels:
1. Update test expectations in \`plain-language-toggle-test\`
2. Update \`glossary-search-test\` search expectations
3. Update \`tooltips-test\` content expectations
4. Ensure CSV headers remain unchanged (technical only)

### Performance

Tests should run in <2 seconds total. If tests become slow:
- Reduce number of rendered components
- Mock heavy computations
- Use \`vi.mock()\` for expensive imports
- Consider splitting large test files

## Coverage Goals

Target coverage:
- **Statements:** >80%
- **Branches:** >75%
- **Functions:** >80%
- **Lines:** >80%

Critical paths should have 100% coverage:
- getLabel() with plain language toggle
- getCsvHeader() always returning technical
- Glossary search and filter logic
- Tooltip content rendering
`;

export default TESTING_README;
