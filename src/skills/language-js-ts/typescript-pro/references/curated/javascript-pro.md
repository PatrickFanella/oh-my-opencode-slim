# Javascript Pro

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `javascript-pro-skill.md`

_Source topic: javascript-pro_

**Purpose:** Writes, debugs, and refactors JavaScript code using modern ES2023+ features, async/await patterns, ESM module systems, and Node.js APIs. Use when building vanilla JavaScript applications, implementing Promise-based async flows, optimising browser or Node.js performance, working with Web Workers or Fetch API, or reviewing .js/.mjs/.cjs files for correctness and best practices.

# JavaScript Pro

## When to Use This Skill

- Building vanilla JavaScript applications
- Implementing async/await patterns and Promise handling
- Working with modern module systems (ESM/CJS)
- Optimizing browser performance and memory usage
- Developing Node.js backend services
- Implementing Web Workers, Service Workers, or browser APIs

## Core Workflow

1. **Analyze requirements** — Review `package.json`, module system, Node version, browser targets; confirm `.js`/`.mjs`/`.cjs` conventions
2. **Design architecture** — Plan modules, async flows, and error handling strategies
3. **Implement** — Write ES2023+ code with proper patterns and optimisations
4. **Validate** — Run linter (`eslint --fix`); if linter fails, fix all reported issues and re-run before proceeding. Check for memory leaks with DevTools or `--inspect`, verify bundle size; if leaks are found, resolve them before continuing
5. **Test** — Write comprehensive tests with Jest achieving 85%+ coverage; if coverage falls short, add missing cases and re-run. Confirm no unhandled Promise rejections

## Reference Guide

| Topic | Reference | Load When |
|-------|-----------|-----------|
| Modern Syntax | `references/modern-syntax.md` | ES2023+ features, optional chaining, private fields |
| Async Patterns | `references/async-patterns.md` | Promises, async/await, error handling, event loop |
| Modules | `references/modules.md` | ESM vs CJS, dynamic imports, package.json exports |
| Browser APIs | `references/browser-apis.md` | Fetch, Web Workers, Storage, IntersectionObserver |
| Node Essentials | `references/node-essentials.md` | fs/promises, streams, EventEmitter, worker threads |

## Constraints

### MUST DO
- Use ES2023+ features exclusively
- Use `X | null` or `X | undefined` patterns
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Use async/await for all asynchronous operations
...


### From `javascript-testing-patterns-skill.md`

_Source topic: javascript-testing-patterns_

**Purpose:** Implement comprehensive testing strategies using Jest, Vitest, and Testing Library for unit tests, integration tests, and end-to-end testing with mocking, fixtures, and test-driven development. Use when writing JavaScript/TypeScript tests, setting up test infrastructure, or implementing TDD/BDD workflows.

# JavaScript Testing Patterns

Comprehensive guide for implementing robust testing strategies in JavaScript/TypeScript applications using modern testing frameworks and best practices.

## When to Use This Skill

- Setting up test infrastructure for new projects
- Writing unit tests for functions and classes
- Creating integration tests for APIs and services
- Implementing end-to-end tests for user flows
- Mocking external dependencies and APIs
- Testing React, Vue, or other frontend components
- Implementing test-driven development (TDD)
- Setting up continuous testing in CI/CD pipelines

## Testing Frameworks

### Jest - Full-Featured Testing Framework

```typescript
// jest.config.ts
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/*.interface.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
...
```

### Vitest - Fast, Vite-Native Testing
...


### From `modern-javascript-patterns-skill.md`

_Source topic: modern-javascript-patterns_

**Purpose:** Master ES6+ features including async/await, destructuring, spread operators, arrow functions, promises, modules, iterators, generators, and functional programming patterns for writing clean, efficient JavaScript code. Use when refactoring legacy code, implementing modern patterns, or optimizing JavaScript applications.

# Modern JavaScript Patterns

Comprehensive guide for mastering modern JavaScript (ES6+) features, functional programming patterns, and best practices for writing clean, maintainable, and performant code.

## When to Use This Skill

- Refactoring legacy JavaScript to modern syntax
- Implementing functional programming patterns
- Optimizing JavaScript performance
- Writing maintainable and readable code
- Working with asynchronous operations
- Building modern web applications
- Migrating from callbacks to Promises/async-await
- Implementing data transformation pipelines

## ES6+ Core Features

### 1. Arrow Functions

**Syntax and Use Cases:**

```javascript
// Traditional function
function add(a, b) {
  return a + b;
}

// Arrow function
const add = (a, b) => a + b;

// Single parameter (parentheses optional)
const double = (x) => x * 2;

// No parameters
const getRandom = () => Math.random();

// Multiple statements (need curly braces)
const processUser = (user) => {
  const normalized = user.name.toLowerCase();
  return { ...user, name: normalized };
...
```

...


### From `async-patterns.md`

_Source topic: async-patterns_

# Asynchronous Patterns

## Promise Patterns

```javascript
// Promise creation
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithTimeout = (url, timeout = 5000) => {
  return Promise.race([
    fetch(url),
    delay(timeout).then(() => Promise.reject(new Error('Timeout')))
  ]);
};

// Promise composition
const fetchUserData = async (userId) => {
  const user = await fetch(`/api/users/${userId}`).then(r => r.json());
  const posts = await fetch(`/api/users/${userId}/posts`).then(r => r.json());
  return { user, posts };
};
```

## Async/Await Best Practices

```javascript
// Parallel execution with Promise.all
const fetchAllData = async () => {
  const [users, posts, comments] = await Promise.all([
    fetch('/api/users').then(r => r.json()),
    fetch('/api/posts').then(r => r.json()),
    fetch('/api/comments').then(r => r.json())
  ]);
  return { users, posts, comments };
};

// Sequential when order matters
const processSteps = async () => {
  const step1 = await executeStep1();
  const step2 = await executeStep2(step1);
  const step3 = await executeStep3(step2);
  return step3;
};

...
```

## Error Handling Strategies
...


### From `browser-apis.md`

_Source topic: browser-apis_

# Browser APIs

## Fetch API

```javascript
// Basic GET request
const response = await fetch('/api/users');
const data = await response.json();

// POST with JSON
const response = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'John', email: 'john@example.com' })
});

// Error handling
const fetchWithErrorHandling = async (url) => {
  try {
    const response = await fetch(url);

...
```

## Web Workers

```javascript
// main.js - Create and communicate with worker
const worker = new Worker('/worker.js');

worker.postMessage({ command: 'process', data: largeArray });

worker.onmessage = (event) => {
  console.log('Result from worker:', event.data);
};

worker.onerror = (error) => {
  console.error('Worker error:', error.message);
};

// Terminate when done
worker.terminate();

// worker.js - Worker code
self.onmessage = (event) => {
...
```

## Service Workers & PWA
...


### From `modern-syntax.md`

_Source topic: modern-syntax_

# Modern JavaScript Syntax (ES2023+)

## Optional Chaining and Nullish Coalescing

```javascript
// Optional chaining - safe property access
const userName = user?.profile?.name;
const firstItem = items?.[0];
const result = api?.fetchData?.();

// Nullish coalescing - default only for null/undefined
const port = config.port ?? 3000;
const name = user.name ?? 'Anonymous';

// Combining both patterns
const displayName = user?.profile?.name ?? user?.email ?? 'Guest';

// Optional chaining with delete
delete user?.temporaryData?.cache;
```

## Private Class Fields

```javascript
class BankAccount {
  // Private fields
  #balance = 0;
  #accountNumber;

  // Private method
  #validateAmount(amount) {
    if (amount <= 0) throw new Error('Invalid amount');
  }

  constructor(accountNumber, initialBalance = 0) {
    this.#accountNumber = accountNumber;
    this.#balance = initialBalance;
  }

  deposit(amount) {
    this.#validateAmount(amount);
    this.#balance += amount;
...
```

## Top-Level Await
...


### From `modules.md`

_Source topic: modules_

# Module Systems

## ES Modules (ESM)

```javascript
// Named exports
export const PI = 3.14159;
export function add(a, b) {
  return a + b;
}

export class Calculator {
  multiply(a, b) {
    return a * b;
  }
}

// Default export
export default class Database {
  async connect() {
    // implementation
  }
}
...
```

## Import Patterns

```javascript
// Named imports
import { add, multiply } from './math.js';
import { add as addition } from './math.js';

// Default import
import Database from './database.js';

// Namespace import
import * as math from './math.js';
math.add(1, 2);

// Mixed imports
import Database, { connect, disconnect } from './database.js';

// Side-effect only import
import './polyfills.js';

// Type-only imports (for documentation)
...
```

## Dynamic Imports
...


### From `node-essentials.md`

_Source topic: node-essentials_

# Node.js Essentials

## File System (fs/promises)

```javascript
import { readFile, writeFile, appendFile, mkdir, rm, readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';

// Read file
const content = await readFile('./file.txt', 'utf-8');

// Write file (overwrites)
await writeFile('./output.txt', 'Hello World');

// Append to file
await appendFile('./log.txt', 'New log entry\n');

// Read JSON file
const readJSON = async (path) => {
  const content = await readFile(path, 'utf-8');
  return JSON.parse(content);
};
...
```

## Path Module

```javascript
import { join, resolve, dirname, basename, extname, parse, format } from 'path';
import { fileURLToPath } from 'url';

// Get current file and directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Join paths (platform-independent)
const filePath = join(__dirname, 'data', 'config.json');

// Resolve to absolute path
const absolutePath = resolve('./relative/path');

// Get filename
const filename = basename('/path/to/file.txt'); // 'file.txt'
const filenameNoExt = basename('/path/to/file.txt', '.txt'); // 'file'

// Get extension
...
```

## Streams
...
