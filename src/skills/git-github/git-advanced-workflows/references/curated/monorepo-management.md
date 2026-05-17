# Monorepo Management

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `monorepo-management-skill.md`

_Source topic: monorepo-management_

**Purpose:** Master monorepo management with Turborepo, Nx, and pnpm workspaces to build efficient, scalable multi-package repositories with optimized builds and dependency management. Use when setting up monorepos, optimizing builds, or managing shared dependencies.

# Monorepo Management

Build efficient, scalable monorepos that enable code sharing, consistent tooling, and atomic changes across multiple packages and applications.

## When to Use This Skill

- Setting up new monorepo projects
- Migrating from multi-repo to monorepo
- Optimizing build and test performance
- Managing shared dependencies
- Implementing code sharing strategies
- Setting up CI/CD for monorepos
- Versioning and publishing packages
- Debugging monorepo-specific issues

## Core Concepts

### 1. Why Monorepos?

- Shared code and dependencies
- Atomic commits across projects
- Consistent tooling and standards
- Easier refactoring
- Simplified dependency management
- Better code visibility

- Build performance at scale
- CI/CD complexity
- Access control
- Large Git repository

### 2. Monorepo Tools

- pnpm workspaces (recommended)
- npm workspaces
- Yarn workspaces
...

# Filter by pattern
pnpm --filter "@repo/*" build
pnpm --filter "...web" build  # Build web and dependencies
```

## Nx Monorepo

### Setup

```bash

# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2

      - uses: actions/setup-node@v3

      - name: Install dependencies

      - name: Build

      - name: Test

      - name: Lint

      - name: Type check
```

### Deploy Affected Only

```yaml

# Deploy only changed apps
- name: Deploy affected apps
  run: |
    if pnpm nx affected:apps --base=origin/main --head=HEAD | grep -q "web"; then
      echo "Deploying web app"
      pnpm --filter web deploy
    fi
```
