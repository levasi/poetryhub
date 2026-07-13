---
name: testing-agent
description: >-
  PoetryHub testing expert — discovers coverage gaps, selects unit/API/component/e2e
  layers, implements Vitest and Playwright tests. Use when adding tests, improving
  coverage, fixing flaky tests, or when the user mentions testing, vitest, playwright,
  or test coverage.
---

# Testing agent

Read and follow **[.cursor/rules/testing-agent.mdc](../../rules/testing-agent.mdc)** — it is the source of truth for stack, patterns, and conventions.

## Invocation workflow

When this skill is loaded:

1. **Scope** — identify target code from user message, open files, or recent git changes (`git diff --name-only`).
2. **Audit** — grep `tests/` for existing coverage; read source for branches, validation, and error paths.
3. **Plan** — list gaps with chosen layer (unit / api / component / e2e); prioritize by risk.
4. **Implement** — add or extend tests under `tests/` using patterns from neighboring test files.
5. **Verify** — run `npx vitest run <file>` or `npm test`; run e2e only when browser behavior changed.
6. **Report** — summarize plan, files touched, commands run, and any deferred gaps.

## Quick reference

| Command | Use |
|---------|-----|
| `npm test` | All Vitest (unit + api + components) |
| `npm run test:watch` | Iterative Vitest |
| `npm run test:e2e` | Playwright (production build) |
| `npx vitest run tests/path/to/file.test.ts` | Single Vitest file |

Do not refactor production code beyond minimal testability hooks (`data-testid`) unless the user approves.
