# Codebase Review Tasks

## 1) Typographical correction
- **Issue**: The project README still references the placeholder Lovable project URL (`REPLACE_WITH_PROJECT_ID`), which renders the link unusable and signals unfinished documentation.
- **Task**: Replace the placeholder with the real project identifier (or a generic example URL) so the onboarding link works as written and no longer looks like a typo in published docs. 【F:README.md†L11-L21】

## 2) Bug fix
- **Issue**: `YearProjection` computes `progressPercent` by dividing by `settings.savingsGoal` without guarding against zero, producing `Infinity`/`NaN` when the goal is unset or cleared in the settings modal.
- **Task**: Add a zero-safe calculation (e.g., default to 0 when `savingsGoal` is falsy) and adjust the progress display to avoid rendering invalid values. 【F:src/components/YearProjection.tsx†L24-L160】

## 3) Documentation/comment anomaly
- **Issue**: The README’s “Project info” section is placeholder-only and never tells contributors which environment or deployment this repo targets.
- **Task**: Fill in the “Project info” block with actual project identifiers or clearly mark it as needing configuration, so setup and deployment instructions are accurate. 【F:README.md†L1-L21】

## 4) Test improvement
- **Issue**: Critical finance utilities such as `computeDailyCashflow` and `getTrendData` have no automated coverage, leaving cashflow and trend regressions undetected.
- **Task**: Introduce a lightweight unit test suite (e.g., Vitest) covering these functions for typical and edge cases (initial balance offsets, empty transactions, and expense-only views). 【F:src/utils/computeStats.ts†L1-L120】【F:src/components/DailyCashflowChart.tsx†L1-L90】
