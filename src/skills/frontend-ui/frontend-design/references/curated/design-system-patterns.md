# Design System Patterns

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `design-system-patterns-skill.md`

_Source topic: design-system-patterns_

**Purpose:** Build scalable design systems with design tokens, theming infrastructure, and component architecture patterns. Use when creating design tokens, implementing theme switching, building component libraries, or establishing design system foundations.

# Design System Patterns

Master design system architecture to create consistent, maintainable, and scalable UI foundations across web and mobile applications.

## When to Use This Skill

- Creating design tokens for colors, typography, spacing, and shadows
- Implementing light/dark theme switching with CSS custom properties
- Building multi-brand theming systems
- Architecting component libraries with consistent APIs
- Establishing design-to-code workflows with Figma tokens
- Creating semantic token hierarchies (primitive, semantic, component)
- Setting up design system documentation and guidelines

## Core Capabilities

### 1. Design Tokens

- Primitive tokens (raw values: colors, sizes, fonts)
- Semantic tokens (contextual meaning: text-primary, surface-elevated)
- Component tokens (specific usage: button-bg, card-border)
- Token naming conventions and organization
- Multi-platform token generation (CSS, iOS, Android)

### 2. Theming Infrastructure

- CSS custom properties architecture
- Theme context providers in React
- Dynamic theme switching
- System preference detection (prefers-color-scheme)
- Persistent theme storage
- Reduced motion and high contrast modes

### 3. Component Architecture

- Compound component patterns
...


### From `component-architecture.md`

_Source topic: component-architecture_

# Component Architecture Patterns

## Overview

Well-architected components are reusable, composable, and maintainable. This guide covers patterns for building flexible component APIs that scale across design systems.

## Compound Components

```tsx
// Compound component pattern
import * as React from "react";

interface AccordionContextValue {
  openItems: Set<string>;
  toggle: (id: string) => void;
  type: "single" | "multiple";
}

const AccordionContext = React.createContext<AccordionContextValue | null>(
  null,
);

function useAccordionContext() {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within an Accordion");
  }
...
```

## Polymorphic Components

```tsx
// Polymorphic component with proper TypeScript support
import * as React from "react";

type AsProp<C extends React.ElementType> = {
  as?: C;
};

type PropsToOmit<C extends React.ElementType, P> = keyof (AsProp<C> & P);

type PolymorphicComponentProp<
  C extends React.ElementType,
  Props = {},
> = React.PropsWithChildren<Props & AsProp<C>> &
  Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;

type PolymorphicRef<C extends React.ElementType> =
  React.ComponentPropsWithRef<C>["ref"];

...
```

## Slot Pattern
...


### From `design-tokens.md`

_Source topic: design-tokens_

# Design Tokens Deep Dive
## Overview
Design tokens are the atomic values of a design system - the smallest pieces that define visual style. They bridge the gap between design and development by providing a single source of truth for colors, typography, spacing, and other design decisions.
## Token Categories
### Color Tokens
```json
{
  "color": {
    "primitive": {
      "gray": {
        "0": { "value": "#ffffff" },
        "50": { "value": "#fafafa" },
        "100": { "value": "#f5f5f5" },
        "200": { "value": "#e5e5e5" },
        "300": { "value": "#d4d4d4" },
        "400": { "value": "#a3a3a3" },
        "500": { "value": "#737373" },
        "600": { "value": "#525252" },
        "700": { "value": "#404040" },
        "800": { "value": "#262626" },
        "900": { "value": "#171717" },
        "950": { "value": "#0a0a0a" }
      },
      "blue": {
        "50": { "value": "#eff6ff" },
        "100": { "value": "#dbeafe" },
        "200": { "value": "#bfdbfe" },
        "300": { "value": "#93c5fd" },
        "400": { "value": "#60a5fa" },
        "500": { "value": "#3b82f6" },
        "600": { "value": "#2563eb" },
        "700": { "value": "#1d4ed8" },
        "800": { "value": "#1e40af" },
        "900": { "value": "#1e3a8a" }
      },
      "red": {
        "500": { "value": "#ef4444" },
        "600": { "value": "#dc2626" }
      },
      "green": {
        "500": { "value": "#22c55e" },
        "600": { "value": "#16a34a" }
      },
      "amber": {
        "500": { "value": "#f59e0b" },
        "600": { "value": "#d97706" }
      }
    }
  }
}
```
### Typography Tokens
```json
{
  "typography": {

### From `theming-architecture.md`

_Source topic: theming-architecture_

# Theming Architecture
## Overview
A robust theming system enables applications to support multiple visual appearances (light/dark modes, brand themes) while maintaining consistency and developer experience.
## CSS Custom Properties Architecture
### Base Setup
```css
/* 1. Define the token contract */
:root {
  /* Color scheme */
  color-scheme: light dark;
  /* Base tokens that don't change */
  --font-sans: Inter, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  /* Animation tokens */
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  /* Z-index scale */
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 300;
  --z-popover: 400;
  --z-tooltip: 500;
}
/* 2. Light theme (default) */
:root,
[data-theme="light"] {
  --color-bg: #ffffff;
  --color-bg-subtle: #f8fafc;
  --color-bg-muted: #f1f5f9;
  --color-bg-emphasis: #0f172a;
  --color-text: #0f172a;
  --color-text-muted: #475569;
  --color-text-subtle: #94a3b8;
  --color-border: #e2e8f0;
  --color-border-muted: #f1f5f9;
  --color-accent: #3b82f6;
  --color-accent-hover: #2563eb;
  --color-accent-muted: #dbeafe;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
/* 3. Dark theme */
[data-theme="dark"] {
  --color-bg: #0f172a;
  --color-bg-subtle: #1e293b;
  --color-bg-muted: #334155;
  --color-bg-emphasis: #f8fafc;
  --color-text: #f8fafc;
  --color-text-muted: #94a3b8;
  --color-text-subtle: #64748b;
  --color-border: #334155;
  --color-border-muted: #1e293b;
