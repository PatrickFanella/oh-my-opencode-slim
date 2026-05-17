# React Native Architecture

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `react-native-architecture-skill.md`

_Source topic: react-native-architecture_

**Purpose:** Build production React Native apps with Expo, navigation, native modules, offline sync, and cross-platform patterns. Use when developing mobile apps, implementing native integrations, or architecting React Native projects.

# react-native-architecture

Architect production React Native/Expo apps. Use references for navigation, native modules, offline sync, and platform concerns.

## Workflow

1. Use this skill only when the request matches the frontmatter description.
2. Keep the main context short: read only the relevant reference file for the exact subtask.
3. Prefer existing scripts/templates/assets in this skill before writing ad hoc code.
4. Stop and ask when required credentials, CLIs, project context, or user confirmation are missing.

## Resources

- `references/full-guide.md` — detailed guidance.


### From `vercel-react-native-skills-skill.md`

_Source topic: vercel-react-native-skills_

**Purpose:** React Native and Expo best practices for building performant mobile apps. Use

# React Native Skills

Comprehensive best practices for React Native and Expo applications. Contains
rules across multiple categories covering performance, animations, UI patterns,
and platform-specific optimizations.

## When to Apply

Reference these guidelines when:

- Building React Native or Expo apps
- Optimizing list and scroll performance
- Implementing animations with Reanimated
- Working with images and media
- Configuring native modules or fonts
- Structuring monorepo projects with native dependencies

## Rule Categories by Priority

| Priority | Category         | Impact   | Prefix               |
| -------- | ---------------- | -------- | -------------------- |
| 1        | List Performance | CRITICAL | `list-performance-`  |
| 2        | Animation        | HIGH     | `animation-`         |
| 3        | Navigation       | HIGH     | `navigation-`        |
| 4        | UI Patterns      | HIGH     | `ui-`                |
| 5        | State Management | MEDIUM   | `react-state-`       |
| 6        | Rendering        | MEDIUM   | `rendering-`         |
| 7        | Monorepo         | MEDIUM   | `monorepo-`          |
| 8        | Configuration    | LOW      | `fonts-`, `imports-` |

## Quick Reference

### 1. List Performance (CRITICAL)

- `list-performance-virtualize` - Use FlashList for large lists
- `list-performance-item-memo` - Memoize list item components
...


### From `full-guide.md`

_Source topic: react-native-architecture_

**Purpose:** Build production React Native apps with Expo, navigation, native modules, offline sync, and cross-platform patterns. Use when developing mobile apps, implementing native integrations, or architecting React Native projects.

# React Native Architecture

Production-ready patterns for React Native development with Expo, including navigation, state management, native modules, and offline-first architecture.

## When to Use This Skill

- Starting a new React Native or Expo project
- Implementing complex navigation patterns
- Integrating native modules and platform APIs
- Building offline-first mobile applications
- Optimizing React Native performance
- Setting up CI/CD for mobile releases

## Core Concepts

### 1. Project Structure

```
src/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Auth group
│   ├── (tabs)/            # Tab navigation
│   └── _layout.tsx        # Root layout
├── components/
│   ├── ui/                # Reusable UI components
│   └── features/          # Feature-specific components
├── hooks/                 # Custom hooks
├── services/              # API and native services
├── stores/                # State management
├── utils/                 # Utilities
└── types/                 # TypeScript types
```

### 2. Expo vs Bare React Native

| Feature            | Expo           | Bare RN        |
...

# Create new Expo project
npx create-expo-app@latest my-app -t expo-template-blank-typescript

# Install essential dependencies
npx expo install expo-router expo-status-bar react-native-safe-area-context
npx expo install @react-native-async-storage/async-storage
npx expo install expo-secure-store expo-haptics
```

```typescript
// app/_layout.tsx

```

## Patterns

### Pattern 1: Expo Router Navigation

```typescript

    >

```

### Pattern 2: Authentication Flow

```typescript

```

### Pattern 3: Offline-First with React Query

```typescript

    >

    // Use stale data while revalidating

```

### Pattern 4: Native Module Integration

```typescript
...

# OTA updates
eas update --branch production --message "Bug fixes"
```

## Best Practices

### From `AGENTS.md`

_Source topic: AGENTS_

# React Native Skills

**Version 1.0.0**
Engineering
January 2026

> **Note:**
> This document is mainly for agents and LLMs to follow when maintaining,
> generating, or refactoring React Native codebases. Humans
> may also find it useful, but guidance here is optimized for automation
> and consistency by AI-assisted workflows.

## Table of Contents

1. Core Rendering — **CRITICAL**
   - 1.1 Never Use && with Potentially Falsy Values
   - 1.2 Wrap Strings in Text Components
2. List Performance — **HIGH**
   - 2.1 Avoid Inline Objects in renderItem
   - 2.2 Hoist callbacks to the root of lists
   - 2.3 Keep List Items Lightweight
   - 2.4 Optimize List Performance with Stable Object References
   - 2.5 Pass Primitives to List Items for Memoization
   - 2.6 Use a List Virtualizer for Any List
   - 2.7 Use Compressed Images in Lists
   - 2.8 Use Item Types for Heterogeneous Lists
3. Animation — **HIGH**
   - 3.1 Animate Transform and Opacity Instead of Layout Properties
   - 3.2 Prefer useDerivedValue Over useAnimatedReaction
   - 3.3 Use GestureDetector for Animated Press States
4. Scroll Performance — **HIGH**
   - 4.1 Never Track Scroll Position in useState
5. Navigation — **HIGH**
   - 5.1 Use Native Navigators for Navigation
   - 6.1 Minimize State Variables and Derive Values
   - 6.2 Use fallback state instead of initialState
...


### From `README.md`

_Source topic: README_

# React Native Guidelines

A structured repository for creating and maintaining React Native Best Practices
optimized for agents and LLMs.

## Structure

- `rules/` - Individual rule files (one per rule)
  - `_sections.md` - Section metadata (titles, impacts, descriptions)
  - `_template.md` - Template for creating new rules
  - `area-description.md` - Individual rule files
- `metadata.json` - Document metadata (version, organization, abstract)
- **`AGENTS.md`** - Compiled output (generated)

## Rules

### Core Rendering (CRITICAL)

- `rendering-text-in-text-component.md` - Wrap strings in Text components
- `rendering-no-falsy-and.md` - Avoid falsy && operator in JSX

### List Performance (HIGH)

- `list-performance-virtualize.md` - Use virtualized lists (LegendList,
- `list-performance-function-references.md` - Keep stable object references
- `list-performance-callbacks.md` - Hoist callbacks to list root
- `list-performance-inline-objects.md` - Avoid inline objects in renderItem
- `list-performance-item-memo.md` - Pass primitives for memoization
- `list-performance-item-expensive.md` - Keep list items lightweight
- `list-performance-images.md` - Use compressed images in lists
- `list-performance-item-types.md` - Use item types for heterogeneous lists

### Animation (HIGH)

- `animation-gpu-properties.md` - Animate transform/opacity instead of layout
- `animation-gesture-detector-press.md` - Use GestureDetector for press
...


### From `_sections.md`

_Source topic: _sections_

# Sections
This file defines all sections, their ordering, impact levels, and descriptions.
The section ID (in parentheses) is the filename prefix used to group rules.

### From `_template.md`

_Source topic: _template_

## Rule Title Here

**Impact: MEDIUM (optional impact description)**

Brief explanation of the rule and why it matters. This should be clear and concise, explaining the performance implications.

**Incorrect (description of what's wrong):**

```typescript
// Bad code example here
const bad = example()
```

```typescript
// Good code example here
const good = example()
```

Reference: Link to documentation or resource


### From `animation-derived-value.md`

_Source topic: animation-derived-value_

## Prefer useDerivedValue Over useAnimatedReaction

When deriving a shared value from another, use `useDerivedValue` instead of
`useAnimatedReaction`. Derived values are declarative, automatically track
dependencies, and return a value you can use directly. Animated reactions are
for side effects, not derivations.

**Incorrect (useAnimatedReaction for derivation):**

```tsx
import { useSharedValue, useAnimatedReaction } from 'react-native-reanimated'

function MyComponent() {
  const progress = useSharedValue(0)
  const opacity = useSharedValue(1)

  useAnimatedReaction(
    () => progress.value,
    (current) => {
      opacity.value = 1 - current
    }
  )

  // ...
}
```

```tsx
import { useSharedValue, useDerivedValue } from 'react-native-reanimated'

function MyComponent() {
  const progress = useSharedValue(0)

  const opacity = useDerivedValue(() => 1 - progress.get())

  // ...
}
```

Use `useAnimatedReaction` only for side effects that don't produce a value
...
