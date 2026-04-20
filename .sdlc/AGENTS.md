# AGENTS.md — SDLC Conventions

> **Scope:** `.sdlc/` — Spec-Driven Development workflow

## Naming Conventions

### Spec Folder Pattern

```
.sdlc/SPEC<NNN>-<module>-<kebab-case-title>/
```

| Part                 | Format     | Description                                                               |
| -------------------- | ---------- | ------------------------------------------------------------------------- |
| `SPEC`               | Literal    | Prefix identifying spec-driven feature                                    |
| `NNN`                | 3-digit    | **Global** sequential counter: 001, 002, 003... reflects dependency order |
| `<module>`           | kebab-case | Must match `backend/src/modules/<module>/`                                |
| `<kebab-case-title>` | kebab-case | Short feature description (max 4 words)                                   |

### Examples

```
.sdlc/
├── SPEC001-project-crud-operations/
├── SPEC002-activity-audit-logging/
├── SPEC003-epic-crud-operations/
├── SPEC004-task-crud-operations/
└── SPEC005-core-auth-middleware/
```

### Rules

1. Module must exist in `backend/src/modules/`
2. Counter is **global**, not per-module — NNN reflects dependency order (001 =
   no deps, 002 depends on 001, etc.)
4. All lowercase except `SPEC` prefix
5. Only `a-z`, `0-9`, `-` allowed
   and add an entry to the SPEC Registry
7. **Cross-cutting features** (auth, logging, config, shared utilities) that
   don't map to a specific module must use `core` as the module:
   `SPEC005-core-auth-middleware`

## Vertical Slice Structure

Each spec folder lives inside `.sdlc/` and contains all artifacts:

```
.sdlc/SPEC<NNN>-<module>-<kebab-case-title>/
├── spec.md    # Functional requirements (WHAT)
└── plan.md    # Technical design (HOW)
```

| File      | Contains                                                    | Does NOT contain          |
| --------- | ----------------------------------------------------------- | ------------------------ |
| `spec.md` | User stories, acceptance criteria, functional requirements  | Tech stack, architecture, code |
| `plan.md` | Architecture, schema design, API contracts, service interfaces | Implementation logic |

## Workflow

```
Spec → Plan → Implement
(spec.md)(plan.md)  (code)
```

### Phase Outcomes

| Phase     | Artifact     | Description                                             |
| --------- | ------------ | ------------------------------------------------------- |
| Spec      | `spec.md`    | User stories, acceptance criteria (Gherkin), tech-agnostic |
| Plan      | `plan.md`    | Architecture, tech stack, data model, API contracts    |
| Implement | Code + tests | Each step = one commit, reviewable                     |

### Change Workflow

| Scenario                                   | Action                                                              |
| ------------------------------------------ | ------------------------------------------------------------------- |
| Problem found before Plan                  | Edit spec.md directly → re-run Plan                                 |
| Problem found after Plan                   | Edit spec.md → add Follow-ups to plan.md                            |
| Problem found after Implement             | Edit spec.md → implement delta                                      |
| Problem found after Deploy                 | Create new SPEC folder → reference old spec → full workflow         |

### Change Log Rules

1. Every change logged in Change Log section (each file)
2. Version: `v{major}.{minor}` — major for scope change, minor for clarification
3. Never delete old entries — append only
4. Removed tasks: mark `[~]`, keep in traceability matrix

## Branch Naming

Match spec folder name:

```
SPEC<NNN>-<module>-<kebab-case-title>
```

| Type    | Pattern                             | Example                                  |
| ------- | ----------------------------------- | ---------------------------------------- |
| Feature | `SPEC<NNN>-<module>-<title>`        | `SPEC001-project-crud-operations`        |
| Bugfix  | `SPEC<NNN>-<module>-<title>-fix`    | `SPEC001-project-crud-operations-fix`    |
| Hotfix  | `SPEC<NNN>-<module>-<title>-hotfix` | `SPEC001-project-crud-operations-hotfix` |

## Templates

Located in `.sdlc/templates/`:

- `spec-template.md` — Feature spec with change log
- `plan-template.md` — Technical plan with follow-ups section

## Git Policy

- `.sdlc/` is **committed** to git — specs are living documentation
- Do NOT commit sensitive data: API keys, passwords, internal URLs with auth
  tokens
- `.sdlc/SPEC-*/spec.md` and `plan.md` are reviewed as part of code review
