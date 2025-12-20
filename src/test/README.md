# Testing Guide

This project uses [Vitest](https://vitest.dev/) for unit testing.

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:ci

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

Tests are located alongside the source files with `.test.ts` or `.spec.ts` extensions:

```
src/
  lib/
    parsers/
      mysql/
        mysql.ts
        mysql.test.ts
      sqlite/
        sqlite.ts
        sqlite.test.ts
      postgresql/
        postgresql.ts
        postgresql.test.ts
    utils.ts
    utils/index.test.ts
```

## Writing Tests

### Basic Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './my-module';

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Async Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { asyncFunction } from './my-module';

describe('asyncFunction', () => {
  it('should handle async operations', async () => {
    const result = await asyncFunction('input');
    expect(result).toBeDefined();
  });
});
```

## Coverage

Coverage reports are generated in the `coverage/` directory when running `npm run test:coverage`.

## Test Files

- **Parser Tests**: Test SQL parsing for MySQL, SQLite, and PostgreSQL
- **Utils Tests**: Test utility functions like ID generation, deep copy, etc.
- **Integration Tests**: Test the full SQL import pipeline

