# Review React Best Practices

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `review-react-best-practices-skill.md`

_Source topic: review-react-best-practices_

**Purpose:** Review or refactor React / Next.js code for performance and reliability using a prioritized rule library (waterfalls, bundle size, server/client data fetching, re-renders, rendering). Use when writing React components, Next.js pages (App Router), optimizing bundle size, improving performance, or doing a React/Next.js performance review.

# React Best Practices Review (Performance-First)

Use this skill to turn “React feels slow / Next.js page is heavy / too many requests” into a **repeatable, prioritized review**.

This skill is intentionally built like a rule library:

- `SKILL.md`: how to review + how to search rules
- `references/rules/*`: one rule per file (taggable, sortable, easy to evolve)

## When to apply

Use when:

- Building or refactoring React components
- Working in Next.js (App Router) on RSC boundaries, Server Actions, data fetching
- Reviewing PRs for performance regressions
- Bundle size increases / slow HMR / cold start issues
- UI jank / unnecessary re-renders / hydration issues

## Review method (prioritized)

1. **Start with CRITICAL** rules first (waterfalls + bundle).
2. Only then go to **HIGH** (server patterns + serialization).
3. Then **MEDIUM** (re-render + rendering).
4. Then **LOW-MEDIUM** micro-optimizations (JS hot paths).

## How to use the rules efficiently

### Search by keyword

```bash
rg -n "waterfall|Promise\\.all|defer await" references/rules
rg -n "barrel|optimizePackageImports|dynamic" references/rules
rg -n "cache\\(|React\\.cache|serialization|RSC" references/rules
rg -n "memo\\(|useMemo|useCallback|dependencies" references/rules
```

### Search by tag
...


### From `vercel-react-best-practices-skill.md`

_Source topic: vercel-react-best-practices_

**Purpose:** React and Next.js performance optimization guidelines from Vercel Engineering. This skill should be used when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance patterns. Triggers on tasks involving React components, Next.js pages, data fetching, bundle optimization, or performance improvements.

# Vercel React Best Practices

Comprehensive performance optimization guide for React and Next.js applications, maintained by Vercel. Contains 64 rules across 8 categories, prioritized by impact to guide automated refactoring and code generation.

## When to Apply

Reference these guidelines when:
- Writing new React components or Next.js pages
- Implementing data fetching (client or server-side)
- Reviewing code for performance issues
- Refactoring existing React/Next.js code
- Optimizing bundle size or load times

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Eliminating Waterfalls | CRITICAL | `async-` |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` |
| 3 | Server-Side Performance | HIGH | `server-` |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | `client-` |
| 5 | Re-render Optimization | MEDIUM | `rerender-` |
| 6 | Rendering Performance | MEDIUM | `rendering-` |
| 7 | JavaScript Performance | LOW-MEDIUM | `js-` |
| 8 | Advanced Patterns | LOW | `advanced-` |

## Quick Reference

### 1. Eliminating Waterfalls (CRITICAL)

- `async-defer-await` - Move await into branches where actually used
- `async-parallel` - Use Promise.all() for independent operations
- `async-dependencies` - Use better-all for partial dependencies
- `async-api-routes` - Start promises early, await late in API routes
- `async-suspense-boundaries` - Use Suspense to stream content

### 2. Bundle Size Optimization (CRITICAL)
...


### From `_sections.md`

_Source topic: _sections_

# Sections
This file defines all sections, their ordering, impact levels, and descriptions.
The section ID (in parentheses) is the filename prefix used to group rules.

### From `_template.md`

_Source topic: _template_

## Rule Title Here

**Impact: MEDIUM** (optional impact description)

Brief explanation of the rule and why it matters.

**Detect:**
- Symptoms: ...
- Signals in code: ...

```tsx
// bad example
```

```tsx
// good example
```

- https://example.com


### From `advanced-event-handler-refs.md`

_Source topic: advanced-event-handler-refs_

## Store Event Handlers in Refs for Stable Subscriptions

For global subscriptions where the handler changes often, store the handler in a ref and keep the subscription stable.

**Detect:**
- `useEffect` re-subscribing on every render because handler identity changes.

**Example:**

```tsx
function useWindowScroll(onScroll: () => void) {
  const onScrollRef = useRef(onScroll)
  onScrollRef.current = onScroll

  useEffect(() => {
    const handler = () => onScrollRef.current()
    window.addEventListener("scroll", handler)
    return () => window.removeEventListener("scroll", handler)
  }, [])
}
```


### From `async-api-routes-no-waterfall.md`

_Source topic: async-api-routes-no-waterfall_

## Avoid Waterfall Chains in Route Handlers / Server Actions
In a route handler / server action, start independent work immediately even if you need auth first. Await the minimum dependency, then join the rest.
**Detect:**
- Handler does `await auth()` then `await fetchConfig()` then `await fetchData()`.
**Incorrect (waterfall):**
```ts
export async function GET() {
  const session = await auth()
  const config = await fetchConfig()
  const data = await fetchData(session.user.id)
  return Response.json({ config, data })
}
```
**Correct (start early):**
```ts
export async function GET() {
  const sessionPromise = auth()
  const configPromise = fetchConfig()
  const session = await sessionPromise
  const [config, data] = await Promise.all([configPromise, fetchData(session.user.id)])
  return Response.json({ config, data })
}
```

### From `async-defer-await.md`

_Source topic: async-defer-await_

## Defer Await Until Needed

Move `await` operations into the branches where they’re actually used to avoid blocking fast paths.

**Detect:**
- A function awaits data, then has an early return / branch that doesn’t use it.
- Server Actions / route handlers that always await auth/config before checking cheap conditions.

```ts
async function handleRequest(userId: string, skip: boolean) {
  const user = await fetchUser(userId)
  if (skip) return { skipped: true }
  return processUser(user)
}
```

**Correct (only blocks when needed):**

```ts
async function handleRequest(userId: string, skip: boolean) {
  if (skip) return { skipped: true }
  const user = await fetchUser(userId)
  return processUser(user)
}
```


### From `async-parallel-promises.md`

_Source topic: async-parallel-promises_

## Start Promises Early, Await Late

When operations are independent, start them immediately and await them together. This avoids adding multiple network RTTs to a single request.

**Detect:**
- Multiple awaits in sequence that don’t depend on each other.
- “Fetch A, then fetch B, then fetch C” in server code.

```ts
const user = await fetchUser()
const org = await fetchOrg()
const flags = await fetchFlags()
```

```ts
const userPromise = fetchUser()
const orgPromise = fetchOrg()
const flagsPromise = fetchFlags()

const [user, org, flags] = await Promise.all([userPromise, orgPromise, flagsPromise])
```
