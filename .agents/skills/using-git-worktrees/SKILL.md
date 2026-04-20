---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from current workspace or before executing implementation plans - creates isolated git worktrees in project-local .worktrees/
---

# Using Git Worktrees

## Overview

Git worktrees create isolated workspaces sharing the same repository, allowing
work on multiple branches simultaneously without switching.

**Core principle:** Project-local only. Always hidden. Always verified.

**Announce at start:** "I'm using the using-git-worktrees skill to set up an
isolated workspace."

## Directory Selection

Only one location: `.worktrees/` at project root.

```bash
ls -d .worktrees 2>/dev/null
```

- **Exists** → use it
- **Does not exist** → create it

No global directory. No asking. No alternatives.

## Safety Verification

**MUST verify `.worktrees/` is gitignored before creating worktree:**

```bash
git check-ignore -q .worktrees
```

**If NOT ignored:**

1. Add `.worktrees/` to `.gitignore`
2. Commit the change
3. Proceed with worktree creation

**Why critical:** Prevents accidentally committing worktree contents to
repository.

## Creation Steps

### 1. Create Worktree

```bash
git worktree add .worktrees/$BRANCH_NAME -b "$BRANCH_NAME"
cd .worktrees/$BRANCH_NAME
```

### 2. Run Project Setup

Auto-detect and run appropriate setup:

```bash
# Deno
if [ -f deno.json ]; then deno install; fi

# Node.js
if [ -f package.json ]; then npm install; fi

# Python
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi
```

### 3. Verify Clean Baseline

Run tests to ensure worktree starts clean:

```bash
# Use project-appropriate command
deno task test
npm test
pytest
```

**If tests fail:** Report failures, ask whether to proceed or investigate.

**If tests pass:** Report ready.

### 4. Report Location

```
Worktree ready at .worktrees/<branch-name>
Tests passing (<N> tests, 0 failures)
Ready to implement <feature-name>
```

## Quick Reference

| Situation                  | Action                     |
| -------------------------- | -------------------------- |
| `.worktrees/` exists       | Use it (verify ignored)    |
| `.worktrees/` not ignored  | Add to .gitignore + commit |
| Tests fail during baseline | Report failures + ask      |
| No deno.json/package.json  | Skip dependency install    |

## Common Mistakes

### Skipping ignore verification

- **Problem:** Worktree contents get tracked, pollute git status
- **Fix:** Always use `git check-ignore` before creating worktree

### Proceeding with failing tests

- **Problem:** Can't distinguish new bugs from pre-existing issues
- **Fix:** Report failures, get explicit permission to proceed

### Hardcoding setup commands

- **Problem:** Breaks on projects using different tools
- **Fix:** Auto-detect from project files (deno.json, package.json, etc.)

## Example Workflow

```
You: I'm using the using-git-worktrees skill to set up an isolated workspace.

[Check .worktrees/ - exists]
[Verify ignored - git check-ignore confirms .worktrees/ is ignored]
[Create worktree: git worktree add .worktrees/health-001-crud -b SPEC-health-001-crud-operations]
[Run deno install]
[Run deno task test - 47 passing]

Worktree ready at .worktrees/SPEC-health-001-crud-operations
Tests passing (47 tests, 0 failures)
Ready to implement health crud operations
```

## Red Flags

**Never:**

- Create worktree without verifying `.worktrees/` is ignored
- Skip baseline test verification
- Proceed with failing tests without asking
- Use global or non-project-local directories

**Always:**

- Use `.worktrees/` only
- Verify `.gitignore` before creation
- Auto-detect and run project setup
- Verify clean test baseline

## Integration

**Called by:**

- **brainstorming** — REQUIRED when design is approved and implementation
  follows
- **subagent-driven-development** — REQUIRED before executing any tasks
- **executing-plans** — REQUIRED before executing any tasks

**Pairs with:**

- **finishing-a-development-branch** - REQUIRED for cleanup after work complete