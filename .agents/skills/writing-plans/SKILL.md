---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context
for our codebase and questionable taste. Document everything they need to know:
which files to touch for each task, code, testing, docs they might need to
check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI.
TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset
or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the
implementation plan."

**Context:** This should be run in a dedicated worktree (created by
brainstorming skill).

**Save plan to:** `.sdlc/SPEC<NNN>-<module>-<title>/`

- `plan.md` — use template at `.sdlc/templates/plan-template.md`
- (User preferences for plan location override this default)

## Scope Check

If the spec covers multiple independent subsystems, it should have been broken
into sub-project specs during brainstorming. If it wasn't, suggest breaking this
into separate plans — one per subsystem. Each plan should produce working,
testable software on its own.

## File Structure

Before defining tasks, map out which files will be created or modified and what
each one is responsible for. This is where decomposition decisions get locked
in.

- Design units with clear boundaries and well-defined interfaces. Each file
  should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are
  more reliable when files are focused. Prefer smaller, focused files over large
  ones that do too much.
- Files that change together should live together. Split by responsibility, not
  by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large
  files, don't unilaterally restructure - but if a file you're modifying has
  grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce
self-contained changes that make sense independently.

## Bite-Sized Task Granularity

**Each step is one RED-GREEN-REFACTOR cycle (5-10 minutes):**

> **TDD Required:** Read `test-driven-development` skill before writing implementation code.

```dot
digraph tdd_per_task {
    rankdir=LR;
    red [label="RED\nWrite failing test first", shape=box, style=filled, fillcolor="#ffcccc"];
    green [label="GREEN\nWrite minimal code", shape=box, style=filled, fillcolor="#ccffcc"];
    refactor [label="REFACTOR\n(if needed)", shape=box, style=filled, fillcolor="#ccccff"];

    red -> green -> refactor;
}
```

**Anti-patterns:** When writing mocks, read `@testing-anti-patterns.md` first.

| Violation | Why Wrong | Prevention |
|-----------|-----------|------------|
| Test mock behavior instead of real behavior | Test proves nothing | Don't assert on mock internals |
| Partial mock (missing fields) | Silent integration failures | Mirror real API completely |
| Test-only methods in production | Pollutes production code | Move to test utilities |

**Example task step:**

```markdown
### Task N: Create slugify utility

**Files:** `src/features/blog-transform/utils/slugify.ts`, `slugify.test.ts`

---

**[RED]** Write failing test:

```typescript
// src/features/blog-transform/utils/slugify.test.ts
test('converts "Hello World" to "hello-world"', () => {
  expect(slugify('Hello World')).toBe('hello-world');
});
```

**[RED]** Run: `npm test src/features/blog-transform/utils/slugify.test.ts`
**Expected:** FAIL — "Cannot find module"

**[GREEN]** Write minimal implementation:

```typescript
// src/features/blog-transform/utils/slugify.ts
export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-');
}
```

**[GREEN]** Run: `npm test src/features/blog-transform/utils/slugify.test.ts`
**Expected:** PASS

**[REFACTOR]** (optional)
```

**The Iron Law:**
```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? **Delete it. Start over.**

**No exceptions:**
- Don't keep it as "reference"
- Don't "adapt" it while writing tests
- Don't skip RED phase
- Delete means delete

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> sdlc:subagent-driven-development (recommended) or sdlc:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for
> tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---
```

## Section Structure

Break the plan into logical sections (Architecture, Data Model, API, etc.) with
descriptive headers. Each section contains the necessary implementation details.

## No Placeholders

Every section must contain the actual content an engineer needs. These are
**plan failures** — never write them:

- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Task N" (repeat the code — the engineer may be reading tasks out
  of order)
- Steps that describe what to do without showing how (code blocks required for
  code steps)
- References to types, functions, or methods not defined in any task

## Remember

- Exact file paths always
- Complete code in every step — if a step changes code, show the code
- Exact commands with expected output
- DRY, YAGNI, TDD, frequent commits
- **TDD:** Every task = RED (write failing test first) → GREEN (minimal code) → REFACTOR
- **Anti-patterns:** Read `@testing-anti-patterns.md` before writing mocks

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the
plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec. Can you point
to a task that implements it? List any gaps.

**2. Placeholder scan:** Search your plan for red flags — any of the patterns
from the "No Placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names you
used in later tasks match what you defined in earlier tasks? A function called
`clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

**4. TDD compliance:** Does every task step include RED-GREEN-REFACTOR?
- Every task has failing test written first?
- Every task has `npm test` verification for RED?
- Every task has minimal code for GREEN?
- No test was skipped or written after implementation?

If you find issues, fix them inline. No need to re-review — just fix and move
on. If you find a spec requirement with no task, add the task.

## Execution Handoff

After saving the plan, offer execution choice:

**"Plan complete and saved to `.sdlc/SPEC<NNN>-<module>-<title>/plan.md`. Two
execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task,
review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans,
batch execution with checkpoints

**Which approach?"**

**If Subagent-Driven chosen:**

- **REQUIRED SUB-SKILL:** Use sdlc:subagent-driven-development
- Fresh subagent per task + two-stage review

**If Inline Execution chosen:**

- **REQUIRED SUB-SKILL:** Use sdlc:executing-plans
- Batch execution with checkpoints for review
