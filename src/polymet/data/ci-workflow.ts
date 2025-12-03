/**
 * GitHub Actions CI Workflow
 *
 * This workflow runs the test suite on every push and pull request.
 *
 * To use this workflow:
 * 1. Create .github/workflows/test.yml in your repository
 * 2. Copy the YAML content below
 * 3. Commit and push to trigger the workflow
 */

export const githubActionsWorkflow = `
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'pnpm'

    - name: Install pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 8

    - name: Install dependencies
      run: pnpm install --frozen-lockfile

    - name: Run tests
      run: pnpm test -- --run

    - name: Generate coverage report
      run: pnpm test -- --coverage --run

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/coverage-final.json
        flags: unittests
        name: codecov-umbrella

    - name: Comment PR with coverage
      if: github.event_name == 'pull_request'
      uses: romeovs/lcov-reporter-action@v0.3.1
      with:
        lcov-file: ./coverage/lcov.info
        github-token: \${{ secrets.GITHUB_TOKEN }}
`;

export const packageJsonScripts = {
  test: "vitest",
  "test:run": "vitest --run",
  "test:coverage": "vitest --coverage --run",
  "test:ui": "vitest --ui",
  "test:watch": "vitest --watch",
};

export const requiredDevDependencies = {
  vitest: "^1.0.0",
  "@vitest/ui": "^1.0.0",
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^6.1.0",
  "@testing-library/user-event": "^14.5.0",
  jsdom: "^23.0.0",
  "@vitejs/plugin-react": "^4.2.0",
};

export default {
  workflow: githubActionsWorkflow,
  scripts: packageJsonScripts,
  devDependencies: requiredDevDependencies,
};
