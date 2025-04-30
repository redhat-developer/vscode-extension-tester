# ExTester UI Test Example Project

This directory contains an example UI test project for the ExTester framework, demonstrating how to set up and run UI tests for VS Code extensions.

## Project Structure

- `src/` - Source code directory
  - `actions/` - Contains test actions and workflows
  - `parser/` - Contains parsers for test data
- `out/` - Compiled JavaScript output directory
- `node_modules/` - Project dependencies
- Configuration files:
  - `package.json` - Project configuration and dependencies
  - `tsconfig.json` - TypeScript configuration
  - `.mocharc.json` - Mocha test runner configuration
  - `.vscodeignore` - VS Code extension ignore patterns

## Prerequisites

- Node.js (version compatible with VS Code ^1.96.0)
- VS Code ^1.96.0
- TypeScript ^5.0.0

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

## Running Tests

The project uses Mocha as the test runner. Tests can be executed using the following command:

```bash
npm test
```

## Configuration

The project is configured with:
- TypeScript for type safety and modern JavaScript features
- Mocha for test running
- Chai for assertions
- VS Code Extension Tester for UI testing

## Dependencies

- `vscode-extension-tester`: ^8.14.1
- `mocha`: ^11.1.0
- `chai`: ^5.2.0
- `typescript`: ^5.0.0
- `ts-node`: ^10.9.2

## License

This project is licensed under the terms specified in the LICENSE file.
