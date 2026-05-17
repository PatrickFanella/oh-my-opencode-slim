---
name: react-pro
description: React and Next.js professional development skill covering modern React, App Router, state management, reusable component APIs, performance, bundle hygiene, data fetching, and review. Use when building, refactoring, reviewing, or optimizing React/Next.js apps with TypeScript and Tailwind.
---

# React Pro

Use for React/Next.js implementation and review in the preferred stack: TypeScript, React/Next.js, Tailwind, Go/Postgres backends where relevant.

## Defaults

- TypeScript first.
- Prefer React/Next.js over generic component frameworks.
- Prefer server components/data loading where Next.js supports it.
- Keep client components small and explicit.
- Tailwind acceptable for styling; keep classes readable and intentional.
- Use React Query or framework data primitives for server state; avoid global state for fetched data.
- Design reusable component APIs with clear props, composition slots, and controlled/uncontrolled behavior only when needed.

## Workflow

1. Identify framework: React SPA, Next.js App Router, or component library.
2. Map data ownership: server data, URL state, local UI state, shared client state.
3. Choose rendering boundary: server vs client component, memoization only where measured.
4. Design typed component contracts and composition patterns.
5. Implement with accessible semantics and production styling.
6. Review performance: waterfalls, bundle splits, rerenders, images/fonts, caching.
7. Verify with lint/typecheck/tests and browser check when UI-visible.

## Review Checklist

- [ ] No avoidable client/server waterfall.
- [ ] Server state not duplicated into global client store.
- [ ] Client components are minimal and justified.
- [ ] Props and domain types are explicit.
- [ ] Component API supports composition without over-abstracting.
- [ ] Accessibility basics pass: labels, keyboard, focus, semantics.
- [ ] Bundle-impacting imports reviewed.
- [ ] Tailwind/classes are readable and design-consistent.

## Resources

### Curated references

Former merged-skill dumps were distilled into these lookup files:

- `references/curated/nextjs-app-router-patterns.md` — Nextjs App Router Patterns guidance.
- `references/curated/react-modernization.md` — React Modernization guidance.
- `references/curated/react-state-management.md` — React State Management guidance.
- `references/curated/review-react-best-practices.md` — Review React Best Practices guidance.
- `references/curated/vercel-react-best-practices.md` — Vercel React Best Practices guidance.
- `references/curated/web-component-design.md` — Web Component Design guidance.
