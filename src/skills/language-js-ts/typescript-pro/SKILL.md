---
name: typescript-pro
description: TypeScript-first JavaScript/Node development skill. Use when building or reviewing TypeScript apps, JS/TS libraries, Node scripts, type-safe APIs, advanced types, tsconfig, tRPC, type guards, discriminated unions, or when plain JavaScript work appears in a TS-first codebase.
license: MIT
metadata:
  author: https://github.com/Jeffallan
  version: "1.2.0"
  domain: language
  triggers: TypeScript, JavaScript, Node.js, generics, type safety, conditional types, mapped types, tRPC, tsconfig, type guards, discriminated unions
  role: specialist
  scope: implementation
  output-format: code
  related-skills: react-pro, nodejs-backend-patterns
---

# TypeScript Pro

Use for TypeScript-first app/library/tooling work. Plain JavaScript is handled here as a fallback when a repo is JS-only or a generated/tooling file cannot be TypeScript.

## Defaults

- Prefer TypeScript over JavaScript.
- Use strict mode and explicit public API types.
- Use ESM unless repo conventions require CJS.
- Prefer discriminated unions, type guards, branded/domain types, and `satisfies` for contracts.
- Avoid `any`; if unavoidable, isolate it behind typed adapters.

## Workflow

1. Inspect repo conventions: package manager, module system, `tsconfig`, lint/test commands.
2. Model domain/API contracts with types before implementation.
3. Implement minimal runtime code with typed boundaries and actionable errors.
4. Run `tsc --noEmit` or repo typecheck.
5. Run relevant tests/lint.
6. For JS-only files, preserve style but avoid dynamic/implicit shapes where clear JSDoc or guards help.

## Review Checklist

- [ ] `strict` assumptions respected.
- [ ] Public APIs have explicit types.
- [ ] Runtime validation exists at external boundaries.
- [ ] Type assertions are justified and localized.
- [ ] Async errors and cancellation are handled deliberately.
- [ ] Imports/module format match repo conventions.

## Resources

- `references/advanced-types.md` — generics, conditional types, mapped types.
- `references/type-guards.md` — narrowing, predicates, assertion functions.
- `references/utility-types.md` — built-in/custom utility types.
- `references/configuration.md` — `tsconfig`, strict mode, project refs.
- `references/patterns.md` — type-safe API patterns.

### Curated references

Former merged-skill dumps were distilled into these lookup files:

- `references/curated/javascript-pro.md` — Javascript Pro guidance.
- `references/curated/typescript-advanced-types.md` — Typescript Advanced Types guidance.
