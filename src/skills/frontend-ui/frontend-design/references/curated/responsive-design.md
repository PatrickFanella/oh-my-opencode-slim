# Responsive Design

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `responsive-design-skill.md`

_Source topic: responsive-design_

**Purpose:** Implement modern responsive layouts using container queries, fluid typography, CSS Grid, and mobile-first breakpoint strategies. Use when building adaptive interfaces, implementing fluid layouts, or creating component-level responsive behavior.

# Responsive Design

Master modern responsive design techniques to create interfaces that adapt seamlessly across all screen sizes and device contexts.

## When to Use This Skill

- Implementing mobile-first responsive layouts
- Using container queries for component-based responsiveness
- Creating fluid typography and spacing scales
- Building complex layouts with CSS Grid and Flexbox
- Designing breakpoint strategies for design systems
- Implementing responsive images and media
- Creating adaptive navigation patterns
- Building responsive tables and data displays

## Core Capabilities

### 1. Container Queries

- Component-level responsiveness independent of viewport
- Container query units (cqi, cqw, cqh)
- Style queries for conditional styling
- Fallbacks for browser support

### 2. Fluid Typography & Spacing

- CSS clamp() for fluid scaling
- Viewport-relative units (vw, vh, dvh)
- Fluid type scales with min/max bounds
- Responsive spacing systems

### 3. Layout Patterns

- CSS Grid for 2D layouts
- Flexbox for 1D distribution
- Intrinsic layouts (content-based sizing)
...


### From `breakpoint-strategies.md`

_Source topic: breakpoint-strategies_

# Breakpoint Strategies
## Overview
Effective breakpoint strategies focus on content needs rather than device sizes. Modern responsive design uses fewer, content-driven breakpoints combined with fluid techniques.
## Mobile-First Approach
### Core Philosophy
Start with the smallest screen, then progressively enhance for larger screens.
```css
/* Base styles (mobile first) */
.component {
  display: flex;
  flex-direction: column;
  padding: 1rem;
}
/* Enhance for larger screens */
@media (min-width: 640px) {
  .component {
    flex-direction: row;
    padding: 1.5rem;
  }
}
@media (min-width: 1024px) {
  .component {
    padding: 2rem;
  }
}
```
### Benefits
1. **Performance**: Mobile devices load only necessary CSS
2. **Progressive Enhancement**: Features add rather than subtract
3. **Content Priority**: Forces focus on essential content first
4. **Simplicity**: Easier to reason about cascading styles
## Common Breakpoint Scales
### Tailwind CSS Default
```css
/* Tailwind breakpoints */
/* sm: 640px  - Landscape phones */
/* md: 768px  - Tablets */
/* lg: 1024px - Laptops */
/* xl: 1280px - Desktops */
/* 2xl: 1536px - Large desktops */
@media (min-width: 640px) {
  /* sm */
}
@media (min-width: 768px) {
  /* md */
}
@media (min-width: 1024px) {
  /* lg */
}
@media (min-width: 1280px) {
  /* xl */
}
@media (min-width: 1536px) {
  /* 2xl */
}

### From `container-queries.md`

_Source topic: container-queries_

# Container Queries Deep Dive
## Overview
Container queries enable component-based responsive design by allowing elements to respond to their container's size rather than the viewport. This paradigm shift makes truly reusable components possible.
## Browser Support
Container queries have excellent modern browser support (Chrome 105+, Firefox 110+, Safari 16+). For older browsers, provide graceful fallbacks.
## Containment Basics
### Container Types
```css
/* Size containment - queries based on inline and block size */
.container {
  container-type: size;
}
/* Inline-size containment - queries based on inline (width) size only */
/* Most common and recommended */
.container {
  container-type: inline-size;
}
/* Normal - style queries only, no size queries */
.container {
  container-type: normal;
}
```
### Named Containers
```css
/* Named container for targeted queries */
.card-wrapper {
  container-type: inline-size;
  container-name: card;
}
/* Shorthand */
.card-wrapper {
  container: card / inline-size;
}
/* Query specific container */
@container card (min-width: 400px) {
  .card-content {
    display: flex;
  }
}
```
## Container Query Syntax
### Width-Based Queries
```css
.container {
  container-type: inline-size;
}
/* Minimum width */
@container (min-width: 300px) {
  .element {
    /* styles */
  }
}
/* Maximum width */
@container (max-width: 500px) {
  .element {

### From `fluid-layouts.md`

_Source topic: fluid-layouts_

# Fluid Layouts and Typography
## Overview
Fluid design creates smooth scaling experiences by using relative units and mathematical functions instead of fixed breakpoints. This approach reduces the need for media queries and creates more natural-feeling interfaces.
## Fluid Typography
### The clamp() Function
```css
/* clamp(minimum, preferred, maximum) */
.heading {
  /* Never smaller than 1.5rem, never larger than 3rem */
  /* Scales at 5vw between those values */
  font-size: clamp(1.5rem, 5vw, 3rem);
}
```
### Calculating Fluid Values
The preferred value in `clamp()` typically combines a base size with a viewport-relative portion:
```css
/* Formula: clamp(min, base + scale * vw, max) */
/* For text that scales from 16px (320px viewport) to 24px (1200px viewport): */
/* slope = (24 - 16) / (1200 - 320) = 8 / 880 = 0.00909 */
/* y-intercept = 16 - 0.00909 * 320 = 13.09px = 0.818rem */
.text {
  font-size: clamp(1rem, 0.818rem + 0.909vw, 1.5rem);
}
```
### Type Scale Generator
```javascript
// Generate a fluid type scale
function fluidType({
  minFontSize,
  maxFontSize,
  minViewport = 320,
  maxViewport = 1200,
}) {
  const minFontRem = minFontSize / 16;
  const maxFontRem = maxFontSize / 16;
  const minViewportRem = minViewport / 16;
  const maxViewportRem = maxViewport / 16;
  const slope = (maxFontRem - minFontRem) / (maxViewportRem - minViewportRem);
  const yAxisIntersection = minFontRem - slope * minViewportRem;
  return `clamp(${minFontRem}rem, ${yAxisIntersection.toFixed(4)}rem + ${(slope * 100).toFixed(4)}vw, ${maxFontRem}rem)`;
}
// Usage
const typeScale = {
  xs: fluidType({ minFontSize: 12, maxFontSize: 14 }),
  sm: fluidType({ minFontSize: 14, maxFontSize: 16 }),
  base: fluidType({ minFontSize: 16, maxFontSize: 18 }),
  lg: fluidType({ minFontSize: 18, maxFontSize: 20 }),
  xl: fluidType({ minFontSize: 20, maxFontSize: 24 }),
  "2xl": fluidType({ minFontSize: 24, maxFontSize: 32 }),
  "3xl": fluidType({ minFontSize: 30, maxFontSize: 48 }),
  "4xl": fluidType({ minFontSize: 36, maxFontSize: 60 }),
};
```
### Complete Type Scale
```css
