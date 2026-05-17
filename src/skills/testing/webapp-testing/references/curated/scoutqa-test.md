# Scoutqa Test

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `scoutqa-test-skill.md`

_Source topic: scoutqa-test_

**Purpose:** |

# ScoutQA Testing Skill

Perform AI-powered exploratory testing on web applications using the `scoutqa` CLI.

**Think of ScoutQA as an intelligent testing partner** that can autonomously explore, discover issues, and verify features. Delegate testing to multiple parallel ScoutQA executions to maximize coverage while saving time.

## When to Use This Skill

Use this skill in two scenarios:

1. **User requests testing** - When the user explicitly asks to test a website or verify functionality
2. **Proactive verification** - After implementing web features, automatically run tests to verify the implementation works correctly

**Example proactive usage:**
- After implementing a login form → Test the authentication flow
- After adding form validation → Verify validation rules and error handling
- After building a checkout flow → Test the end-to-end purchase process
- After fixing a bug → Verify the fix works and didn't break other features

**Best practice**: When you finish implementing a web feature, proactively start a ScoutQA test in the background to verify it works while you continue with other tasks.

## Running Tests

### Testing Workflow

Copy this checklist and track your progress:

Testing Progress:
- [ ] Write specific test prompt with clear expectations
- [ ] Run scoutqa command in background
- [ ] Inform user of execution ID and browser URL
- [ ] Extract and analyze results

**Step 2: Run scoutqa command**

**IMPORTANT**: Use the Bash tool's timeout parameter (5000ms = 5 seconds) to capture execution details:
...

# Test 1: Authentication & security
scoutqa --url "https://app.example.com" --prompt "
Explore authentication: login/logout, session handling, password reset,
and security edge cases.
"

# Test 2: Core features (runs in parallel)
scoutqa --url "https://app.example.com" --prompt "
Test dashboard and main user workflows. Verify data loading,
CRUD operations, and search functionality.
"

# Test 3: Accessibility (runs in parallel)
scoutqa --url "https://app.example.com" --prompt "
Conduct accessibility audit: WCAG compliance, keyboard navigation,
screen reader support, color contrast.
"
```

**Implementation**: Send a single message with three Bash tool calls. For each Bash tool invocation, set the `timeout` parameter to `5000` milliseconds. After 5 seconds, each Bash call returns with a task ID while the processes continue running in the background. This captures the execution ID and browser URL from each test in the initial output, then all three continue running in parallel (both as background tasks locally and remotely on ScoutQA's infrastructure).

**Key guidelines:**

- Describe **what to test**, not **how to test** (ScoutQA figures out the steps)
- Focus on goals, edge cases, and concerns
- Run multiple parallel executions for different test areas
- Trust ScoutQA to autonomously explore and discover issues
- Always set the Bash tool's `timeout` parameter to `5000` milliseconds when calling scoutqa commands (this returns control after 5 seconds while the process continues in the background)
- For parallel tests, make multiple Bash tool calls in a single message
- Remember: Bash tool timeout ≠ Unix timeout command (Bash timeout continues the process in background, Unix timeout kills it)

### Common Test Scenarios

**Post-deployment smoke test:**

```bash
```

**Accessibility audit:**

```bash
```

**E-commerce testing:**

```bash
```

**SaaS application:**

```bash
