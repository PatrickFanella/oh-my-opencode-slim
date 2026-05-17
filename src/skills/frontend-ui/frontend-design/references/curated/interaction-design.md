# Interaction Design

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `interaction-design-skill.md`

_Source topic: interaction-design_

**Purpose:** Design and implement microinteractions, motion design, transitions, and user feedback patterns. Use when adding polish to UI interactions, implementing loading states, or creating delightful user experiences.

# Interaction Design

Create engaging, intuitive interactions through motion, feedback, and thoughtful state transitions that enhance usability and delight users.

## When to Use This Skill

- Adding microinteractions to enhance user feedback
- Implementing smooth page and component transitions
- Designing loading states and skeleton screens
- Creating gesture-based interactions
- Building notification and toast systems
- Implementing drag-and-drop interfaces
- Adding scroll-triggered animations
- Designing hover and focus states

## Core Principles

### 1. Purposeful Motion

- **Feedback**: Confirm user actions occurred
- **Orientation**: Show where elements come from/go to
- **Focus**: Direct attention to important changes
- **Continuity**: Maintain context during transitions

### 2. Timing Guidelines

| Duration  | Use Case                                  |
| --------- | ----------------------------------------- |
| 100-150ms | Micro-feedback (hovers, clicks)           |
| 200-300ms | Small transitions (toggles, dropdowns)    |
| 300-500ms | Medium transitions (modals, page changes) |
| 500ms+    | Complex choreographed animations          |

### 3. Easing Functions

```css
/* Common easings */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1); /* Decelerate - entering */
--ease-in: cubic-bezier(0.55, 0, 1, 0.45); /* Accelerate - exiting */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1); /* Both - moving between */
--spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Overshoot - playful */
```

## Quick Start: Button Microinteraction
...


### From `animation-libraries.md`

_Source topic: animation-libraries_

# Animation Libraries Reference
## Framer Motion
The most popular React animation library with declarative API.
### Basic Animations
```tsx
import { motion, AnimatePresence } from "framer-motion";
// Simple animation
function FadeIn({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
// Gesture animations
function InteractiveCard() {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="p-6 bg-white rounded-lg shadow"
    >
      Hover or tap me
    </motion.div>
  );
}
// Keyframes animation
function PulseButton() {
  return (
    <motion.button
      animate={{
        scale: [1, 1.05, 1],
        boxShadow: [
          "0 0 0 0 rgba(59, 130, 246, 0.5)",
          "0 0 0 10px rgba(59, 130, 246, 0)",
          "0 0 0 0 rgba(59, 130, 246, 0)",
        ],
      }}
      transition={{ duration: 2, repeat: Infinity }}
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      Click me
    </motion.button>
  );
}
```
### Layout Animations
```tsx
import { motion, LayoutGroup } from "framer-motion";

### From `microinteraction-patterns.md`

_Source topic: microinteraction-patterns_

# Microinteraction Patterns Reference
## Button States
### Loading Button
```tsx
import { motion, AnimatePresence } from "framer-motion";
interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  onClick: () => void;
}
function LoadingButton({ isLoading, children, onClick }: LoadingButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="relative px-4 py-2 bg-blue-600 text-white rounded-lg overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2"
          >
            <Spinner className="w-4 h-4" />
            Processing...
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
// Spinner component
function Spinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
        strokeDasharray="62.83"

### From `scroll-animations.md`

_Source topic: scroll-animations_

# Scroll Animations Reference
## Intersection Observer Hook
```tsx
import { useEffect, useRef, useState, type RefObject } from "react";
interface UseInViewOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
}
function useInView<T extends HTMLElement>({
  threshold = 0,
  rootMargin = "0px",
  triggerOnce = false,
}: UseInViewOptions = {}): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        setIsInView(inView);
        if (inView && triggerOnce) {
          observer.unobserve(element);
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);
  return [ref, isInView];
}
// Usage
function FadeInSection({ children }) {
  const [ref, isInView] = useInView({ threshold: 0.2, triggerOnce: true });
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {children}
    </div>
  );
}
```
## Scroll Progress Indicator
```tsx
import { motion, useScroll, useSpring } from "framer-motion";
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
