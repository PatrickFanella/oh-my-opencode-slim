# Web Component Design

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `web-component-design-skill.md`

_Source topic: web-component-design_

**Purpose:** Master React, Vue, and Svelte component patterns including CSS-in-JS, composition strategies, and reusable component architecture. Use when building UI component libraries, designing component APIs, or implementing frontend design systems.

# Web Component Design

Build reusable, maintainable UI components using modern frameworks with clean composition patterns and styling approaches.

## When to Use This Skill

- Designing reusable component libraries or design systems
- Implementing complex component composition patterns
- Choosing and applying CSS-in-JS solutions
- Building accessible, responsive UI components
- Creating consistent component APIs across a codebase
- Refactoring legacy components into modern patterns
- Implementing compound components or render props

## Core Concepts

### 1. Component Composition Patterns

```tsx
// Usage
<Select value={value} onChange={setValue}>
  <Select.Trigger>Choose option</Select.Trigger>
  <Select.Options>
    <Select.Option value="a">Option A</Select.Option>
    <Select.Option value="b">Option B</Select.Option>
  </Select.Options>
</Select>
```

```tsx
<DataFetcher url="/api/users">
  {({ data, loading, error }) =>
    loading ? <Spinner /> : <UserList users={data} />
  }
</DataFetcher>
```

...


### From `accessibility-patterns.md`

_Source topic: accessibility-patterns_

# Accessibility Patterns Reference
## ARIA Patterns for Common Components
### Modal Dialog
```tsx
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      dialogRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      (previousActiveElement.current as HTMLElement)?.focus();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") trapFocus(e, dialogRef.current);
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"

### From `component-patterns.md`

_Source topic: component-patterns_

# Component Patterns Reference

## Compound Components Deep Dive

Compound components share implicit state while allowing flexible composition.

### Implementation with Context

```tsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";

// Types
interface TabsContextValue {
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
}

interface TabsProps {
  defaultValue: string;
...
```

### Usage

```tsx
<Tabs defaultValue="overview" onChange={console.log}>
  <Tabs.List>
    <Tabs.Tab value="overview">Overview</Tabs.Tab>
    <Tabs.Tab value="features">Features</Tabs.Tab>
    <Tabs.Tab value="pricing" disabled>
      Pricing
    </Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="overview">
    <h2>Product Overview</h2>
    <p>Description here...</p>
  </Tabs.Panel>
  <Tabs.Panel value="features">
    <h2>Key Features</h2>
    <ul>...</ul>
  </Tabs.Panel>
</Tabs>
```

## Render Props Pattern
...


### From `css-styling-approaches.md`

_Source topic: css-styling-approaches_

# CSS Styling Approaches Reference
## Comparison Matrix
| Approach          | Runtime | Bundle Size    | Learning Curve | Dynamic Styles | SSR   |
| ----------------- | ------- | -------------- | -------------- | -------------- | ----- |
| CSS Modules       | None    | Minimal        | Low            | Limited        | Yes   |
| Tailwind          | None    | Small (purged) | Medium         | Via classes    | Yes   |
| styled-components | Yes     | Medium         | Medium         | Full           | Yes\* |
| Emotion           | Yes     | Medium         | Medium         | Full           | Yes   |
| Vanilla Extract   | None    | Minimal        | High           | Limited        | Yes   |
## CSS Modules
Scoped CSS with zero runtime overhead.
### Setup
```tsx
// Button.module.css
.button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: background-color 0.2s;
}
.primary {
  background-color: #2563eb;
  color: white;
}
.primary:hover {
  background-color: #1d4ed8;
}
.secondary {
  background-color: #f3f4f6;
  color: #1f2937;
}
.secondary:hover {
  background-color: #e5e7eb;
}
.small {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}
.large {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}
```
```tsx
// Button.tsx
import styles from "./Button.module.css";
import { clsx } from "clsx";
interface ButtonProps {
  variant?: "primary" | "secondary";
  size?: "small" | "medium" | "large";
  children: React.ReactNode;
  onClick?: () => void;
}
export function Button({
  variant = "primary",
