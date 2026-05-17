# Visual Design Foundations

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `visual-design-foundations-skill.md`

_Source topic: visual-design-foundations_

**Purpose:** Apply typography, color theory, spacing systems, and iconography principles to create cohesive visual designs. Use when establishing design tokens, building style guides, or improving visual hierarchy and consistency.

# Visual Design Foundations

Build cohesive, accessible visual systems using typography, color, spacing, and iconography fundamentals.

## When to Use This Skill

- Establishing design tokens for a new project
- Creating or refining a spacing and sizing system
- Selecting and pairing typefaces
- Building accessible color palettes
- Designing icon systems and visual assets
- Improving visual hierarchy and readability
- Auditing designs for visual consistency
- Implementing dark mode or theming

## Core Systems

### 1. Typography Scale

```css
:root {
  --font-size-xs: 0.75rem; /* 12px */
  --font-size-sm: 0.875rem; /* 14px */
  --font-size-base: 1rem; /* 16px */
  --font-size-lg: 1.125rem; /* 18px */
  --font-size-xl: 1.25rem; /* 20px */
  --font-size-2xl: 1.5rem; /* 24px */
  --font-size-3xl: 1.875rem; /* 30px */
  --font-size-4xl: 2.25rem; /* 36px */
  --font-size-5xl: 3rem; /* 48px */
}
```

| Text Type | Line Height |
|-----------|-------------|
| Headings | 1.1 - 1.3 |
...


### From `color-systems.md`

_Source topic: color-systems_

# Color Systems Reference

## Color Palette Generation

### Perceptually Uniform Scales

Using OKLCH for perceptually uniform color scales:

```css
/* OKLCH: Lightness, Chroma, Hue */
:root {
  /* Generate a blue scale with consistent perceived lightness steps */
  --blue-50: oklch(97% 0.02 250);
  --blue-100: oklch(93% 0.04 250);
  --blue-200: oklch(86% 0.08 250);
  --blue-300: oklch(75% 0.12 250);
  --blue-400: oklch(65% 0.16 250);
  --blue-500: oklch(55% 0.2 250); /* Primary */
  --blue-600: oklch(48% 0.18 250);
  --blue-700: oklch(40% 0.16 250);
  --blue-800: oklch(32% 0.12 250);
  --blue-900: oklch(25% 0.08 250);
  --blue-950: oklch(18% 0.05 250);
}
```

### Programmatic Scale Generation

```tsx
function generateColorScale(
  hue: number,
  saturation: number = 100,
): Record<string, string> {
  const lightnessStops = [
    { name: "50", l: 97 },
    { name: "100", l: 93 },
    { name: "200", l: 85 },
    { name: "300", l: 75 },
    { name: "400", l: 65 },
    { name: "500", l: 55 },
    { name: "600", l: 45 },
    { name: "700", l: 35 },
    { name: "800", l: 25 },
    { name: "900", l: 18 },
    { name: "950", l: 12 },
  ];

...
```

## Semantic Color Tokens
...


### From `spacing-iconography.md`

_Source topic: spacing-iconography_

# Spacing and Iconography Reference
## Spacing Systems
### 8-Point Grid System
The 8-point grid is the industry standard for consistent spacing.
```css
:root {
  /* Base spacing unit */
  --space-unit: 0.25rem; /* 4px */
  /* Spacing scale */
  --space-0: 0;
  --space-px: 1px;
  --space-0-5: calc(var(--space-unit) * 0.5); /* 2px */
  --space-1: var(--space-unit); /* 4px */
  --space-1-5: calc(var(--space-unit) * 1.5); /* 6px */
  --space-2: calc(var(--space-unit) * 2); /* 8px */
  --space-2-5: calc(var(--space-unit) * 2.5); /* 10px */
  --space-3: calc(var(--space-unit) * 3); /* 12px */
  --space-3-5: calc(var(--space-unit) * 3.5); /* 14px */
  --space-4: calc(var(--space-unit) * 4); /* 16px */
  --space-5: calc(var(--space-unit) * 5); /* 20px */
  --space-6: calc(var(--space-unit) * 6); /* 24px */
  --space-7: calc(var(--space-unit) * 7); /* 28px */
  --space-8: calc(var(--space-unit) * 8); /* 32px */
  --space-9: calc(var(--space-unit) * 9); /* 36px */
  --space-10: calc(var(--space-unit) * 10); /* 40px */
  --space-11: calc(var(--space-unit) * 11); /* 44px */
  --space-12: calc(var(--space-unit) * 12); /* 48px */
  --space-14: calc(var(--space-unit) * 14); /* 56px */
  --space-16: calc(var(--space-unit) * 16); /* 64px */
  --space-20: calc(var(--space-unit) * 20); /* 80px */
  --space-24: calc(var(--space-unit) * 24); /* 96px */
  --space-28: calc(var(--space-unit) * 28); /* 112px */
  --space-32: calc(var(--space-unit) * 32); /* 128px */
}
```
### Semantic Spacing Tokens
```css
:root {
  /* Component-level spacing */
  --spacing-xs: var(--space-1); /* 4px - tight spacing */
  --spacing-sm: var(--space-2); /* 8px - compact spacing */
  --spacing-md: var(--space-4); /* 16px - default spacing */
  --spacing-lg: var(--space-6); /* 24px - comfortable spacing */
  --spacing-xl: var(--space-8); /* 32px - loose spacing */
  --spacing-2xl: var(--space-12); /* 48px - generous spacing */
  --spacing-3xl: var(--space-16); /* 64px - section spacing */
  /* Specific use cases */
  --spacing-inline: var(--space-2); /* Between inline elements */
  --spacing-stack: var(--space-4); /* Between stacked elements */
  --spacing-inset: var(--space-4); /* Padding inside containers */
  --spacing-section: var(--space-16); /* Between major sections */
  --spacing-page: var(--space-24); /* Page margins */
}
```
### Spacing Utility Functions

### From `typography-systems.md`

_Source topic: typography-systems_

# Typography Systems Reference

## Type Scale Construction

### Modular Scale

A modular scale creates harmonious relationships between font sizes using a mathematical ratio.

```tsx
// Common ratios
const RATIOS = {
  minorSecond: 1.067, // 16:15
  majorSecond: 1.125, // 9:8
  minorThird: 1.2, // 6:5
  majorThird: 1.25, // 5:4
  perfectFourth: 1.333, // 4:3
  augmentedFourth: 1.414, // √2
  perfectFifth: 1.5, // 3:2
  goldenRatio: 1.618, // φ
};

function generateScale(
  baseSize: number,
  ratio: number,
  steps: number,
): number[] {
  const scale: number[] = [];
...
```

### CSS Custom Properties

```css
:root {
  /* Base scale using perfect fourth (1.333) */
  --font-size-2xs: 0.563rem; /* ~9px */
  --font-size-xs: 0.75rem; /* 12px */
  --font-size-sm: 0.875rem; /* 14px */
  --font-size-base: 1rem; /* 16px */
  --font-size-md: 1.125rem; /* 18px */
  --font-size-lg: 1.333rem; /* ~21px */
  --font-size-xl: 1.5rem; /* 24px */
  --font-size-2xl: 1.777rem; /* ~28px */
  --font-size-3xl: 2.369rem; /* ~38px */
  --font-size-4xl: 3.157rem; /* ~50px */
  --font-size-5xl: 4.209rem; /* ~67px */

  /* Font weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
...
```

## Font Loading Strategies
...
