# Sprint 3.1 Test Workflows - Streak Logic

**Status**: In Progress (Phase 3)  
**Last Updated**: January 2026

---

## Overview

Sprint 3.1 focuses on streak logic: rules, current/longest calculations, and
timezone-safe normalization. This document captures the validation workflows.

**Key Features Implemented**:

- Streak rules contract (scheduled-day continuity)
- Current and longest streak calculations
- Timezone-aware "as of" normalization
- Edge-case handling (no schedule, no completions, gaps)

---

## Prerequisites

1. **Dependencies installed**:

   ```bash
   npm install
   ```

2. **Unit test runner is available**:

   ```bash
   npm test
   ```

---

## Test Workflows

### Workflow 1: Current + longest streak unit tests [x]

1. Run streak unit tests.

   ```bash
   npm test -- streaks
   ```

**Expected**: All streak unit tests pass.

---

### Workflow 2: Timezone boundary tests [x]

1. Run streak unit tests (timezone cases included).

   ```bash
   npm test -- streaks
   ```

**Expected**: Tests validate that "as of" day is normalized by timezone and that
future completions are ignored.

---

### Workflow 3: Edge cases (no schedule/completions/gaps) [x]

1. Run streak unit tests.

   ```bash
   npm test -- streaks
   ```

**Expected**: Streaks are `0` for empty schedules or no completions; longest
streak persists even if current streak is broken.

---

## Automated Tests

### Unit Tests

```bash
npm test -- streaks
```

### Full CI

```bash
npm run ci
```

---

## Troubleshooting

### Issue: Streak tests fail on timezone boundary cases

**Symptoms**: Expected current/longest streaks differ around midnight.

**Fixes**:

- Verify test inputs normalize `asOf` using the target timezone.
- Ensure completion dates use UTC date keys, not local timestamps.

---

## Success Criteria

Sprint 3.1 Phase 3 is complete when:

1. Current and longest streak tests pass.
2. Timezone boundary behavior is verified.
3. Edge-case tests pass consistently.

---

## Additional Resources

- [Sprint 3.1 Plan](../sprints/sprint-3.1.md)
- [Streak Helpers](../../src/lib/habits/streaks.ts)
- [Streak Unit Tests](../../src/lib/habits/__tests__/streaks.test.ts)
- [AGENTS](../../AGENTS.md)
