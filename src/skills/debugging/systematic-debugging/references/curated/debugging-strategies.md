# Debugging Strategies

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `debugging-strategies-skill.md`

_Source topic: debugging-strategies_

**Purpose:** Master systematic debugging techniques, profiling tools, and root cause analysis to efficiently track down bugs across any codebase or technology stack. Use when investigating bugs, performance issues, or unexpected behavior.

# Debugging Strategies

Transform debugging from frustrating guesswork into systematic problem-solving with proven strategies, powerful tools, and methodical approaches.

## When to Use This Skill

- Tracking down elusive bugs
- Investigating performance issues
- Understanding unfamiliar codebases
- Debugging production issues
- Analyzing crash dumps and stack traces
- Profiling application performance
- Investigating memory leaks
- Debugging distributed systems

## Core Principles

### 1. The Scientific Method

### 2. Debugging Mindset

- "It can't be X" - Yes it can
- "I didn't change Y" - Check anyway
- "It works on my machine" - Find out why

- Reproduce consistently
- Isolate the problem
- Keep detailed notes
- Question everything
- Take breaks when stuck

### 3. Rubber Duck Debugging

## Systematic Debugging Process

### Phase 1: Reproduce
...

# Continue until bug found
git bisect reset  # when done
```

### Technique 2: Differential Debugging

Compare working vs broken:

```markdown
## What's Different?

| Aspect       | Working     | Broken         |
| ------------ | ----------- | -------------- |
| Environment  | Development | Production     |
| Node version | 18.16.0     | 18.15.0        |
| Data         | Empty DB    | 1M records     |
| User         | Admin       | Regular user   |
| Browser      | Chrome      | Safari         |
| Time         | During day  | After midnight |

```

### Technique 3: Trace Debugging

```typescript

```

### Technique 4: Memory Leak Detection

```typescript

if (process.memoryUsage().heapUsed > 500 * 1024 * 1024) {
  console.warn("High memory usage:", process.memoryUsage());

  beforeMemory = process.memoryUsage().heapUsed;
...


### From `MERGED.md`

_Source topic: MERGED_

# Merged skill: debugging-strategies
Source path: `skills/debugging/debugging-strategies`
Canonical skill: `skills/debugging/systematic-debugging`
