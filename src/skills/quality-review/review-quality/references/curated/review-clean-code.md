# Review Clean Code

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `review-clean-code-skill.md`

_Source topic: review-clean-code_

**Purpose:** Analyze code quality based on "Clean Code" principles. Identify naming, function size, duplication, over-engineering, and magic number issues with severity ratings and refactoring suggestions. Use when the user requests code quality checks, refactoring advice, Clean Code analysis, code smell detection, or mentions terms like code review, code quality, refactoring check.

# Clean Code Review

Focused on 7 high-impact review dimensions based on "Clean Code" principles.

## Review Workflow

```
Review Progress:
- [ ] 1. Scan codebase: identify files to review
- [ ] 2. Check each dimension (naming, functions, DRY, YAGNI, magic numbers, clarity, conventions)
- [ ] 3. Rate severity (High/Medium/Low) for each issue
- [ ] 4. Generate report sorted by severity
```

## Core Principle: Preserve Functionality

All suggestions target **implementation approach** only—never suggest changing the code's functionality, output, or behavior.

## Check Dimensions

### 1. Naming Issues【Meaningful Names】

- Meaningless names like `data1`, `temp`, `result`, `info`, `obj`
- Inconsistent naming for same concepts (`get`/`fetch`/`retrieve` mixed)

```typescript
// ❌
const d = new Date();
const data1 = fetchUser();

// ✅
const currentDate = new Date();
const userProfile = fetchUser();
```

### 2. Function Issues【Small Functions + SRP】
...


### From `detailed-examples.md`

_Source topic: detailed-examples_

# Detailed Examples by Dimension

## Table of Contents
- 1. Naming Issues
- 2. Function Issues
- 3. Duplication Issues
- 4. Over-Engineering
- 5. Magic Numbers

## 2. Function Issues

### Function Too Long

```typescript
// ❌ 160-line processOrder function
async function processOrder(order) {
  // Validation logic (40 lines)
  // Calculation logic (30 lines)
  // Inventory check (25 lines)
  // Payment processing (35 lines)
  // Notification sending (30 lines)
}

// ✅ Split into single-responsibility functions
async function processOrder(order) {
  await validateOrder(order);
  const total = calculateTotal(order);
  await checkInventory(order.items);
  await processPayment(order, total);
  await sendNotifications(order);
}
```

### Too Many Parameters

```typescript
// ❌
function createUser(name, email, age, address, phone, role, department, manager) {}

// ✅ Use configuration object
interface CreateUserParams {
  name: string;
  email: string;
  profile: { age: number; phone: string };
  organization: { role: string; department: string; manager: string };
}
function createUser(params: CreateUserParams) {}
```

### Side Effects
...


### From `language-patterns.md`

_Source topic: language-patterns_

# ❌
def process(data):
    return data['value']

# ✅
from typing import TypedDict

class DataPayload(TypedDict):
    value: str

def process(data: DataPayload) -> str:
    return data['value']
```
