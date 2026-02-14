# Pre-Review Checklist

Run through this checklist before requesting code review. These are the top 4 recurring categories found across 128+ review findings in Epics 1-3.

---

## 1. onBlur Handlers

- [ ] Every `<Input>`, `<Textarea>`, `<Select>` with direct `onChange` (not react-hook-form `{...field}`) also has an `onBlur` handler
- [ ] `onBlur` triggers persistence or validation — not just logging
- [ ] ESLint rule `classlite/require-onblur-with-onchange` shows 0 new warnings in changed files

## 2. Edge-Case Tests

- [ ] Empty state tested (no data, empty arrays, null values)
- [ ] Boundary values tested (0, negative, max length, special characters)
- [ ] Error paths tested (network failure, invalid input, permission denied)
- [ ] Multi-tenant isolation tested — no cross-center data leaks in new queries
- [ ] Concurrent access tested where applicable (optimistic updates, race conditions)

## 3. Type Safety

- [ ] No `any` types introduced — use `unknown` with narrowing if truly dynamic
- [ ] Zod schemas defined for all new API request/response shapes
- [ ] `z.infer<>` used for TypeScript types — no manual interface duplication
- [ ] Prisma query results properly typed (no implicit `any` from raw queries)

## 4. Dead Code & Imports

- [ ] No unused imports (TypeScript compiler + ESLint catch these)
- [ ] No `console.log` left in production code
- [ ] No commented-out code blocks committed
- [ ] No unused variables or functions (check for `_` prefixed variables that are actually used)
- [ ] No duplicate utility functions — check existing code before creating new helpers
