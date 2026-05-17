# E2E Testing Patterns

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `e2e-testing-patterns-skill.md`

_Source topic: e2e-testing-patterns_

**Purpose:** Master end-to-end testing with Playwright and Cypress to build reliable test suites that catch bugs, improve confidence, and enable fast deployment. Use when implementing E2E tests, debugging flaky tests, or establishing testing standards.

# E2E Testing Patterns

Build reliable, fast, and maintainable end-to-end test suites that provide confidence to ship code quickly and catch regressions before users do.

## When to Use This Skill

- Implementing end-to-end test automation
- Debugging flaky or unreliable tests
- Testing critical user workflows
- Setting up CI/CD test pipelines
- Testing across multiple browsers
- Validating accessibility requirements
- Testing responsive designs
- Establishing E2E testing standards

## Core Concepts

### 1. E2E Testing Fundamentals

- Critical user journeys (login, checkout, signup)
- Complex interactions (drag-and-drop, multi-step forms)
- Cross-browser compatibility
- Real API integration
- Authentication flows

- Unit-level logic (use unit tests)
- API contracts (use integration tests)
- Edge cases (too slow)
- Internal implementation details

### 2. Test Philosophy

**The Testing Pyramid:**

```
        /\
       /E2E\         ← Few, focused on critical paths
      /─────\
     /Integr\        ← More, test component interactions
    /────────\
   /Unit Tests\      ← Many, fast, isolated
  /────────────\
```

...


### From `MERGED.md`

_Source topic: MERGED_

# Merged skill: e2e-testing-patterns

Source path: `skills/testing/e2e-testing-patterns`

Canonical skill: `skills/testing/webapp-testing`

# Merged skill: e2e-testing-patterns
Source path: `skills/testing/e2e-testing-patterns`
Canonical skill: `skills/testing/webapp-testing`
