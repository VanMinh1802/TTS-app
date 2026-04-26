# Enhanced TTS Application Specification

## Overview
This specification outlines the requirements for enhancing the existing TTS application with a Python FastAPI backend and Next.js frontend, maintaining client-side TTS generation while adding enterprise-grade features for a SaaS/PaaS platform. This SPEC intentionally covers the core partials and live-data surfaces already present in the repository, not the full long-term product roadmap.

---

## Agent Workflow v3 - SPEC-First Approach

### New Workflow Design (With SPEC Approval Gate)

This workflow applies to sub-features that are already approved in this SPEC scope. It should not be read as permission to expand the feature set beyond the requirements below.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AGENT WORKFLOW v3 (SPEC-FIRST)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌───────────┐  │
│  │ SPEC PHASE  │───▶│ PLANNING    │───▶│ BUILD       │───▶│ REVIEW   │  │
│  │             │    │ PHASE       │    │ PHASE        │    │ PHASE     │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └───────────┘  │
│         │                 │                 │                │           │
│         ▼                 ▼                 ▼                ▼           │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌────────────┐   │
│  │1.Write SPEC │   │3.Set up work │   │5.Implement  │   │7.Spec      │   │
│  │   for feature│   │   tree      │   │   (TDD)     │   │  review    │   │
│  │2.Get APPROVAL│  │4.Brainstorm │   │6.Test first │   │8.Code      │   │
│  │  (user only) │   │  requirements│   │   write code│   │  review   │   │
│  └──────────────┘   └──────────────┘   └──────────────┘   └────────────┘   │
│                                                                             │
│  ⚠️ GATE: NO IMPLEMENT WITHOUT USER APPROVAL!                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  1.Write SPEC → 2.Present to User → 3.User APPROVES → 4.BUILD       │   │
│  │     ✏️            👤 Clarify/Questions         ✅ OK               🚀  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Workflow Steps with Approval Gate

```
STEP 1: WRITE SPEC FOR SUB-FEATURE
┌─────────────────────────────────────────────────────────┐
│ Before implementing any sub-feature (F1.1, F1.2, etc.) ��
│                                                         │
│ 1. Create detailed SPEC document containing:            │
│    - Functional requirements                           │
│    - Acceptance criteria                             │
│    - API contracts (if backend)                     │
│    - UI/Component specs (if frontend)                │
│    - Database schema (if needed)                     │
│    - Edge cases & error handling                     │
│    - Test strategy                                   │
│                                                         │
│ 2. Format: .sdlc/SPEC<NNN>-<module>-<title>/spec.md   │
└─────────────────────────────────────────────────────────┘
                    ↓
STEP 2: PRESENT TO USER (APPROVAL GATE)
┌─────────────────────────────────────────────────────────┐
│ Present SPEC to user for review:                        │
│                                                         │
│ 1. Summarize what will be built                       │
│ 2. Clarify any questions                              │
│ 3. Show acceptance criteria                          │
│                                                       │
│ WAIT for user approval BEFORE proceeding!            │
│                                                       │
│ ⚠️ NEVER proceed to implementation without approval │
└─────────────────────────────────────────────────────────┘
                    ↓
USER APPROVES ✅ → PROCEED TO PLANNING
                    ↓
USER REJECTS ❌ → REVISE SPEC → RE-PRESENT
```

### After Approval - Proceed with Rest

```
STEP 3-8: SAME AS PREVIOUS WORKFLOW
(See detailed workflow below)
```

---

### Detailed Workflow After Approval

Implementation should preserve the current product boundaries: backend orchestration only, frontend live-data rendering only, and no server-side TTS rewrite.

```
STEP 3: PLANNING (After Approval)
 STEP 3.1: SETUP WORKTREE
   use: using-git-worktrees
   - Createisolated branch
   
 STEP 3.2: BRAINSTORM (if complex)
   use: brainstorming
   - Clarify requirements
   - Edge cases

STEP 4: BUILD
 STEP 4.1: TDD IMPLEMENTATION
   use: test-driven-development
   - Write FAILING test first
   
 STEP 4.2: WRITE CODE
   use: fastapi-python (backend)
   use: frontend-principles (frontend)

STEP 5: REVIEW
 STEP 5.1: SPEC COMPLIANCE
   use: requesting-code-review
   
 STEP 5.2: CODE QUALITY
   use: fastapi-python + frontend-security

STEP 6: COMPLETE
 use: finishing-a-development-branch
```

---

### SPEC Template for Each Sub-feature

Each sub-feature needs its own SPEC before implementation:

```markdown
# SPEC: [Sub-feature Name]

## Overview
[Brief description of what this sub-feature does]

## Functional Requirements
- [ ] Requirement 1
- [ ] Requirement 2

## Acceptance Criteria
- [ ] Criterion 1 (testable)
- [ ] Criterion 2 (testable)

## API Contract (if backend)
```
GET /api/endpoint
Body: { ... }
Response: { ... }
```

## Database Schema (if needed)
```sql
CREATE TABLE ...;
```

## UI/Components (if frontend)
- Component: [Name]
- Props: { ... }
- State: { ... }
```

## Edge Cases
- Case 1: [description]
- Case 2: [description]

## Test Strategy
- Unit tests: [what to test]
- Integration tests: [what to test]

## Dependencies
- [ ] Sub-feature X (completed)
- [ ] External: [service]

---

## Approval Template

```
# Sub-feature: F1.1 - FastAPI Project Setup

## Summary
[1 sentence summary]

## Requirements
- [ ] ...

## Acceptance Criteria
- [ ] ...

## Questions for Clarification
1. [Question 1]
2. [Question 2]

👉 APPROVE to proceed with implementation?
```

---

### Skills Required Per Phase

| Skill | When to Use | Purpose |
|-------|------------|---------|
| **using-git-worktrees** | Before starting any feature | Create isolated branch |
| **brainstorming** | Before complex feature | Requirements & design |
| **writing-plans** | Planning phase | Create implementation plan |
| **fastapi-python** | Backend code | FastAPI development |
| **neon-postgres** | Database | PostgreSQL operations |
| **test-driven-development** | Writing code | TDD workflow |
| **subagent-driven-development** | Multi-task | Parallel subagents |
| **frontend-principles** | Frontend work | React/Next.js rules |
| **frontend-components** | UI components | Component patterns |
| **frontend-data-fetching** | API integration | React Query |
| **frontend-security** | Security | Frontend security |
| **playwright-cli** | Browser testing | E2E tests |
| **requesting-code-review** | Code review | Review template |
| **finishing-a-development-branch** | Merge ready | Final review |

### Red Flags (Never Do)

- ❌ Write code BEFORE SPEC is approved
- ❌ Skip SPEC phase entirely
- ❌ Proceed without user approval
- ❌ Skip spec reviewer review
- ❌ Skip code quality review  
- ❌ Skip re-review after fixes
- ❌ Start on main branch
- ❌ Multiple implementers in parallel (conflicts)
┌─────────────────────────────────────────────────────────────────────────┐
│                    AGENT WORKFLOW v2                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────┐    ┌────────────────┐    ┌─────────────────┐     │
│  │ PLANNING PHASE │───▶│ BUILD PHASE    │───▶│ REVIEW PHASE    │     │
│  └────────────────┘    └────────────────┘    └─────────────────┘     │
���         │                     │                      │               │
│         ▼                     ▼                      ▼               │
│  ┌──────────────┐    ┌────────────────┐    ┌────────────────────┐    │
│  │1.Set up work │    │3.Implement     │    │5.Spec review      │    │
│  │   tree       │    │   (TDD)         │    │   checker          │    │
│  │2.Brainstorm │    │4.Test first    │    │6.Code review      │    │
│  │  requirements│    │   write code   │    │   (quality+sec)   │    │
│  └──────────────┘    └────────────────┘    └────────────────────┘    │
│                                                          │
│  Skills Used Per Phase:                                        │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │ PLANNING: using-git-worktrees, brainstorming, writing-plans │      │
│  │ BUILD:    fastapi-python, neon-postgres, test-driven-       │      │
│  │           development, frontend-principles, etc.          │      │
│  │ REVIEW:   requesting-code-review, frontend-security,       │      │
│  │           playwright-cli                                    │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Detailed Worktree Setup (Phase 1)

```
 STEP 1: CREATE WORKTREE
 ┌─────────────────────────────────────────────────────┐
 │ use: using-git-worktrees                             │
 │                                                     │
 │ - Create feature branch: feature/F1.1-backend    │
 │ - Create worktree: worktrees/F1.1-backend        │
 │ - Configure remote tracking                       │
 └─────────────────────────────────────────────────────┘
```

### Detailed Implementation (Phase 2)

```
 STEP 2: IMPLEMENT SUB-FEATURE
 ┌─────────────────────────────────────────────────────┐
 │ A. PRE-IMPLEMENTATION (if complex)                  │
 │    use: brainstorming                                │
 │    - Clarify requirements                           │
 │    - Design approach                               │
 │    - Identify edge cases                           │
 └─────────────────────────────────────────────────────┘
                    ↓
 ┌─────────────────────────────────────────────────────┐
 │ B. TDD IMPLEMENTATION (each sub-feature)            │
 │    use: test-driven-development                   │
 │                                                 │
 │    1. Write FAILING test first                   │
 ��    2. Write minimul code to pass                 │
 │    3. Refactor & verify                          │
 │    4. Commit with descriptive message           │
 └─────────────────────────────────────────────────────┘
                    ↓
STEP 3: WRITE CODE (use appropriate skill)
 ┌─────────────────────────────────────────────────────┐
 │ Backend (Python):                                 │
 │    use: fastapi-python                             │
 │    - Project structure                            │
 │    - API endpoints                                 │
 │    - Database models                               │
 │    - Auth & security                              │
 │                                                 │
 │ Frontend (Next.js):                               │
 │    use: frontend-principles                       │
 │    use: frontend-components                        │
 │    - UI components                                │
 │    - State management                             │
 │    - API integration                              │
 └─────────────────────────────────────────────────────┘
```

### Detailed Review (Phase 3)

```
 STEP 4: SPEC COMPLIANCE REVIEW
 ┌─────────────────────────────────────────────────────┐
 │ use: requesting-code-review                        │
 │                                                  │
 │ Checklist:                                       │
 │ □ All functional requirements implemented?         │
 │ □ All acceptance criteria met?                  │
 │ □ No extra features added?                        │
 │ □ Edge cases handled?                            │
 │ □ Tests pass?                                    │
 └─────────────────────────────────────────────────────┘
                    ↓ (IF ISSUES → FIX → RE-REVIEW)
                    ↓ PASS
 STEP 5: CODE QUALITY REVIEW
 ┌─────────────────────────────────────────────────────┐
 │ use: fastapi-python (backend security)             │
 │ use: frontend-security (frontend security)      │
 │                                                  │
 │ Checklist:                                       │
 │ □ Security vulnerabilities?                       │
 │ □ Code follows patterns?                         │
 │ □ Performance acceptable?                        │
 │ □ Error handling proper?                         │
 │ □ No secrets exposed?                           │
 └─────────────────────────────────────────────────────┘
                    ↓ (IF ISSUES → FIX → RE-REVIEW)
                    ↓ PASS
              MARK SUB-FEATURE COMPLETE
```

### Final Review (All Complete)

```
 STEP 6: FINAL REVIEW
 ┌─────────────────────────────────────────────────────┐
 │ use: finishing-a-development-branch                │
 │                                                  │
 │ - Run full test suite                             │
 │ - E2E test (use: playwright-cli)                  │
 │ - Security scan                                   │
 │ - Lint & type check                               │
 │ - Squash commits                                  │
 │ - Create PR with description                      │
 │ - Request human review                            │
 └─────────────────────────────────────────────────────┘
```

### Skills Required Per Sub-feature

| Skill | When to Use | Purpose |
|-------|------------|---------|
| **using-git-worktrees** | Before starting any feature | Create isolated branch |
| **brainstorming** | Before complex feature | Requirements & design |
| **writing-plans** | Planning phase | Create implementation plan |
| **fastapi-python** | Backend code | FastAPI development |
| **neon-postgres** | Database | PostgreSQL operations |
| **test-driven-development** | Writing code | TDD workflow |
| **subagent-driven-development** | Multi-task | Parallel subagents |
| **frontend-principles** | Frontend work | React/Next.js rules |
| **frontend-components** | UI components | Component patterns |
| **frontend-data-fetching** | API integration | React Query |
| **frontend-security** | Security | Frontend security |
| **playwright-cli** | Browser testing | E2E tests |
| **requesting-code-review** | Code review | Review template |
| **finishing-a-development-branch** | Merge ready | Final review |

### Two-Stage Review Process

```
Sub-feature Implementation
       ↓
┌──────────────────┐
│ SPEC REVIEWER     │ ← Review 1: Does it match spec?
│ requesting-code- │   - All requirements met?
│   review          │   - Acceptance criteria?
└────────┬─────────┘   - No extra/missing features?
         ↓ PASS
┌──────────────────┐
│ CODE REVIEWER     │ ← Review 2: Code quality
│ fastapi-python   │   - Security (backend)
│ +frontend-      │   - Patterns
│   security       │   - Performance
└────────┬─────────┘   - Best practices
         ↓ PASS
    MARK COMPLETE
```

### Red Flags (Never Do)

- ❌ Skip spec reviewer review
- ❌ Skip code quality review  
- ❌ Skip re-review after fixes
- ❌ Start on main branch
- ❌ Multiple implementers in parallel (conflicts)
- ❌ Accept "close enough" on spec compliance
- ❌ Skip TDD (write test first!)
- ❌ Skip worktree setup (always isolate!)

---

## Feature Breakdown for Implementation

### Phase 1: Foundation (Core Infrastructure) - 8 Sub-features

| ID | Sub-feature | Dependency | Priority |
|----|-----------|-----------|----------|
| F1.1 | FastAPI project setup with auth module | None | P0 |
| F1.2 | PostgreSQL database setup | F1.1 | P0 |
| F1.3 | User authentication (JWT) | F1.2 | P0 |
| F1.4 | Quota management system | F1.3 | P0 |
| F1.5 | Cloudflare R2 signed URL generation | F1.1 | P0 |
| F1.6 | API key management | F1.4 | P0 |
| F1.7 | Rate limiting with Redis | F1.1 | P0 |
| F1.8 | Basic analytics logging | F1.2 | P1 |

### Phase 2: Frontend Core - 7 Sub-features

| ID | Sub-feature | Dependency | Priority |
|----|-----------|-----------|----------|
| F2.1 | Next.js 16 project setup | None | P0 |
| F2.2 | shadcn/ui component library | F2.1 | P0 |
| F2.3 | App Router structure (auth/main groups) | F2.1 | P0 |
| F2.4 | Authentication flow (login/callback) | F2.3 | P0 |
| F2.5 | Basic TTS generator UI | F2.2 | P0 |
| F2.6 | IndexedDB model caching | F2.5 | P0 |
| F2.7 | ONNX Runtime Web Worker | F2.5 | P0 |

### Phase 3: Text Processing - 5 Sub-features

| ID | Sub-feature | Dependency | Priority |
|----|-----------|-----------|----------|
| F3.1 | Backend text normalization endpoint | F1.1 | P1 |
| F3.2 | SSML parser in frontend | F2.5 | P1 |
| F3.3 | Domain preset system (backend) | F3.1 | P2 |
| F3.4 | Custom dictionary management | F3.3 | P2 |
| F3.5 | Multi-language code-switching | F3.2 | P2 |

### Phase 4: Voice Management - 4 Sub-features

| ID | Sub-feature | Dependency | Priority |
|----|-----------|-----------|----------|
| F4.1 | Voice library API | F1.1 | P1 |
| F4.2 | Voice selector component | F2.2 | P1 |
| F4.3 | Voice preview playback | F4.2 | P1 |
| F4.4 | Custom voice presets | F4.1 | P2 |

### Phase 5: Project Workflow - 5 Sub-features

| ID | Sub-feature | Dependency | Priority |
|----|-----------|-----------|----------|
| F5.1 | Project CRUD API | F1.2 | P2 |
| F5.2 | Project list UI | F2.2 | P2 |
| F5.3 | Scene/segment editor | F5.2 | P2 |
| F5.4 | Timeline interface | F5.3 | P2 |
| F5.5 | Export functionality | F5.4 | P2 |

### Phase 6: Developer Tools - 4 Sub-features

| ID | Sub-feature | Dependency | Priority |
|----|-----------|-----------|----------|
| F6.1 | OpenAPI documentation | F1.1 | P1 |
| F6.2 | TypeScript SDK package | F2.1 | P2 |
| F6.3 | Error code standardization | F1.1 | P1 |
| F6.4 | Integration guides | F6.2 | P2 |

### Phase 7: Business & Admin - 4 Sub-features

| ID | Sub-feature | Dependency | Priority |
|----|-----------|-----------|----------|
| F7.1 | Subscription system | F1.3 | P1 |
| F7.2 | Admin dashboard | F1.8 | P1 |
| F7.3 | Usage analytics API | F7.2 | P2 |
| F7.4 | Cloud sync for projects | F5.1 | P2 |

### Phase 8: PWA & Polish - 2 Sub-features

| ID | Sub-feature | Dependency | Priority |
|----|-----------|-----------|----------|
| F8.1 | PWA offline capability | F2.1 | P2 |
| F8.2 | Performance optimization | All | P1 |

---

## Implementation Status Checklist

### Phase 1: Foundation

| ID | Status | Notes |
|---|---|---|
| F1.1 | done | FastAPI backend foundation and auth module exist |
| F1.2 | partial | SQLAlchemy/Postgres scaffolding exists; runtime setup not fully validated |
| F1.3 | done | JWT/login flow exists |
| F1.4 | partial | Quota service/API scaffolding exists |
| F1.5 | partial | R2 voice registry exists; signed URL flow not fully validated |
| F1.6 | partial | API key routes/UI exist; completeness not fully verified |
| F1.7 | partial | Redis rate limiting scaffolding exists |
| F1.8 | partial | Analytics service/API exists; not end-to-end verified |
| F1.9 | n/a | No additional infrastructure tasks are introduced beyond the partials already present in the repo |

### Phase 2: Frontend Core

| ID | Status | Notes |
|---|---|---|
| F2.1 | done | Next.js app builds and lints successfully |
| F2.2 | not started | shadcn/ui not added |
| F2.3 | partial | App Router exists; route-group intent not fully verified |
| F2.4 | partial | Login/auth redirect exists; callback flow not complete |
| F2.5 | done | `/studio` generator UI implemented |
| F2.6 | not started | IndexedDB model caching not implemented |
| F2.7 | not started | ONNX Runtime Web Worker not implemented |
| F2.8 | n/a | No additional frontend foundation work is introduced outside the partials already present |

### Phase 3: Text Processing

| ID | Status | Notes |
|---|---|---|
| F3.1 | partial | Text normalization endpoint exists; integration not complete |
| F3.2 | not started | SSML parser not implemented |
| F3.3 | not started | Domain preset system not implemented |
| F3.4 | partial | Custom dictionary UI exists; persistence/processing incomplete |
| F3.5 | not started | Multi-language code-switching not implemented |
| F3.6 | n/a | No new text-processing sub-features are introduced beyond the existing partial dictionary/normalization work |

### Phase 4: Voice Management

| ID | Status | Notes |
|---|---|---|
| F4.1 | done | Voice registry API shared by `/voices` and `/tts/voices` |
| F4.2 | done | Voice selector component implemented |
| F4.3 | partial | Preview UI exists; true voice preview playback not complete |
| F4.4 | not started | Custom voice presets not implemented |
| F4.5 | n/a | No premium voice marketplace or preset expansion is added in this plan |

### Phase 5: Project Workflow

| ID | Status | Notes |
|---|---|---|
| F5.1 | partial | Project backend scaffolding exists; CRUD completeness not verified |
| F5.2 | partial | Project list UI exists; completeness not verified |
| F5.3 | not started | Scene/segment editor not implemented |
| F5.4 | not started | Timeline interface not implemented |
| F5.5 | not started | Export functionality not implemented |
| F5.6 | n/a | Collaboration, version history, and templates remain out of scope for this plan |

### Phase 6: Developer Tools

| ID | Status | Notes |
|---|---|---|
| F6.1 | partial | OpenAPI is present by framework default; not curated as a deliverable |
| F6.2 | not started | TypeScript SDK not implemented |
| F6.3 | partial | Error handling exists but is not standardized across all surfaces |
| F6.4 | not started | Integration guides not implemented |
| F6.5 | n/a | No SDK or guide expansion is included in this partial-completion plan |

### Phase 7: Business & Admin

| ID | Status | Notes |
|---|---|---|
| F7.1 | not started | Subscription system not implemented |
| F7.2 | not started | Admin dashboard not implemented |
| F7.3 | partial | Analytics API exists; dashboard/reporting not complete |
| F7.4 | not started | Cloud sync for projects not implemented |
| F7.5 | n/a | This plan only stabilizes current analytics visibility and existing admin protections |

### Phase 8: PWA & Polish

| ID | Status | Notes |
|---|---|---|
| F8.1 | not started | PWA/offline capability not implemented |
| F8.2 | partial | Build/lint pass; dedicated performance optimization pass still needed |
| F8.3 | n/a | No PWA or broad performance redesign is introduced in this plan |

## Change Log

- v1.0 - Added the official implementation status checklist for F1.1-F8.2 based on the current repository state.

---

## Implementation Order (Recommended)

```
Phase 1 (Foundation)      → Phase 2 (Frontend Core)
    F1.1 ──────────────→    F2.1
    F1.2 ─────────────→    F2.2
    F1.3 ─────────────→    F2.3
    F1.4              F2.4
    F1.5              F2.5
    F1.6              F2.6
    F1.7              F2.7
    F1.8 ───────────────→ Continue to Phase 3-8
```

### Quick Wins (Ship First)

| Order | Sub-feature | Deliverable |
|-------|-----------|-----------|
| 1 | F1.1 + F2.1 | Running FastAPI + Next.js |
| 2 | F1.3 + F2.4 | Working auth |
| 3 | F2.5 + F2.7 | Basic TTS generation |
| 4 | F1.5 + F2.6 | Model loading from R2 |
| 5 | F3.1 + F3.2 | SSML support |

### Critical Path (Must Complete)

```
F1.1 → F1.2 → F1.3 → F2.3 → F2.4 → F2.5 → F2.7 = Basic Working App
```

---

## Functional Requirements (Reference)

### 1. Text Processing Enhancements

> **Scope note:** This section preserves the broader roadmap context for text processing. The current implementation plan only covers the existing partial dictionary and normalization surfaces, not the full SSML, presets, or code-switching roadmap.

- [ ] Support for SSML (Speech Synthesis Markup Language) for fine-grained pronunciation control
- [ ] Domain-specific text presets (medical, legal, technical, etc.)
- [ ] Automatic abbreviation and acronym expansion
- [ ] Custom pronunciation dictionary management
- [ ] Multi-language code-switching support

### 2. Voice Management Features

> **Scope note:** This section defines the broader voice roadmap. The current implementation plan only covers live voice listing, metadata consistency, and sample playback for the existing voices surface.

- [ ] Voice character library with rich metadata (region, gender, style, use case)
- [ ] Custom voice presets with adjustable parameters (pitch, speed, volume)
- [ ] Pre-installed premium voices available for subscription tiers
- [ ] Speaking style presets (narration, conversation, announcement, etc.)

### 3. Project-Based Workflow

> **Execution-plan note:** The current plan only stabilizes the existing project CRUD/export workflow and keeps the current editor usable. Collaboration, version history, templates, and timeline expansion remain roadmap items.

- [ ] Multi-scene project structure support
- [ ] Character assignment per dialogue segment
- [ ] Timeline-based editing interface
- [ ] Flexible export options (single file, chapter-separated, audio stems)
- [ ] Collaboration features (team projects, version history, commenting)
- [ ] Template library for common use cases (ads, audiobooks, podcasts, e-learning)

### 4. Developer Experience Improvements

> **Scope note:** This section preserves the full developer-experience roadmap. The current plan only closes the live API-key, dashboard, and error-code gaps already present in the repository.

- [ ] Comprehensive OpenAPI/Swagger documentation for all backend endpoints
- [ ] TypeScript SDK (genvoice-web-sdk) with full type definitions
- [ ] Standardized error handling with clear error codes and messages
- [ ] Environment-specific configuration management
- [ ] Testing utilities including mock services and test fixtures
- [ ] Detailed integration guides, tutorials, and code examples

### 5. Business Model & Monetization Features

> **Execution-plan note:** The current plan only stabilizes live analytics visibility and API-key/admin protections. Subscription, cloud sync, marketplace, and pricing-model expansion remain roadmap items.

- [ ] Tiered subscription plans (Free, Pro, Enterprise)
- [ ] Voice marketplace with premium voices for Pro/Enterprise tiers
- [ ] Usage-based pricing models (per character or API call)
- [ ] Cloud storage for project synchronization across devices
- [ ] Advanced analytics dashboard (usage, popular voices, geographic data)
- [ ] B2B licensing through API key management system
- [ ] Volume discounts and enterprise SLAs

### 6. Core Architecture Requirements

> **Scope note:** This section keeps the long-term architecture goals visible. The current plan only hardens the already-existing orchestration surfaces and does not introduce new platform primitives such as ONNX workers, IndexedDB model caching, or a PWA offline layer.

- [ ] Maintain client-side TTS generation for privacy and offline capability
- [ ] FastAPI backend as orchestrator (text normalization, auth, quota, model URLs)
- [ ] Secure Cloudflare R2 integration with signed URL generation
- [ ] Comprehensive API key management and rate limiting
- [ ] Admin dashboard for monitoring and system management
- [ ] Progressive Web App capabilities for offline usage

## Non-Functional Requirements

### Performance
- Page load time < 3 seconds (LCP)
- Time to first audio < 1 second for short text (<100 characters)
- 95% cache hit ratio for model loading
- < 100ms API response time for basic endpoints
- Support for 1000+ concurrent users

### Scalability
- Horizontal scaling design for stateless services
- Auto-scaling capabilities for traffic spikes
- Efficient caching strategies (Redis, CDN, browser cache)
- Database connection pooling and query optimization

### Security
- GDPR/CCPA compliance for user data handling
- OWASP Top 10 vulnerability prevention
- Regular security audits and penetration testing
- Secure authentication and authorization (JWT, OAuth2)
- Input validation and sanitization
- Regular dependency vulnerability scanning

### Reliability
- 99.9% uptime SLA for paid tiers
- Graceful degradation for premium features
- Offline mode with core functionality preserved
- Comprehensive logging and monitoring
- Disaster recovery and backup procedures
- Circuit breaker patterns for external dependencies

### Privacy
- Client-side processing ensures user text never leaves browser (except for optional premium features)
- Clear data retention and deletion policies
- Consent mechanisms for voice cloning and data usage
- Privacy impact assessments for new features
- Data processing agreements for enterprise customers

## Acceptance Criteria

### Text Processing
1. User can apply SSML tags to control pronunciation, pitch, rate, and volume
2. Domain presets correctly transform text for specific industries (e.g., medical abbreviations)
3. Custom pronunciation dictionaries are saved and applied consistently
4. Multi-language text is processed correctly with appropriate language switching

### Voice Management
1. Users can browse and preview voices from the voice library
2. Custom voice presets can be created, saved, and reused
3. Premium voices unlocked based on subscription tier
4. Speaking style presets modify prosody appropriately for use case

### Project Workflow
1. Users can create projects with multiple scenes/dialogue segments
2. Different voices can be assigned to different segments
3. Timeline interface allows precise timing control
4. Projects can be exported in various formats (single file, chapter-separated)
5. Team collaboration features work with proper permissions
6. Templates provide starting points for common use cases

### Developer Experience
1. API documentation is complete and accurate
2. TypeScript SDK installs and works without errors
3. Error responses follow standardized format
4. Configuration can be easily adapted for different environments
5. Testing utilities reduce boilerplate for integration tests
6. Integration guides enable developers to get started quickly

### Business Features
1. Subscription tiers provide clear value differentiation
2. Premium voices accessible through Pro/Enterprise subscriptions
3. Usage-based pricing accurately tracks and bills consumption
4. Cloud sync works reliably across devices
5. Analytics dashboard provides actionable insights
6. API key system allows secure third-party integration
7. Volume discounts and enterprise SLAs are configurable

### Architecture & Non-Functional
1. Core TTS generation remains client-side for privacy
2. Backend handles orchestration only (auth, quota, text normalization)
3. Secure model delivery via signed URLs
4. Rate limiting prevents abuse
5. Admin dashboard provides visibility into system health
6. Application works offline with core features
7. System meets all performance, scalability, security, and reliability targets

---

## Challenges & Mitigations

### Technical Challenges

| # | Challenge | Risk Level | Mitigation Strategy |
|---|-----------|-----------|--------------------|
| T1 | **WebGPU Availability** - Only ~50% users have WebGPU | High | Fallback to WebAssembly (slower but works); feature detection on app load |
| T2 | **Browser Memory Limits** - Tab memory ~2GB max | Medium | Chunk long text; don't preload all models; lazy load |
| T3 | **Cross-Origin COOP/COEP Headers** - Required for WASM | Medium | Use same-origin for ONNX files; configure Cloudflare headers |
| T4 | **Model Loading Time** - 50MB first load is slow | Medium | Preload default model; cache in IndexedDB; show progress indicator |
| T5 | **Web Worker Debugging** - Hard to debug in production | Medium | Instrument logging; use DevTools for development |
| T6 | **Cross-Browser Compatibility** - Different WASM support | Medium | Feature detection; graceful degradation; E2E tests |
| T7 | **IndexedDB Storage Limits** - Browser-dependent (50MB-1GB) | Low | Check storage available; implement LRU eviction |

### Resource Challenges

| # | Challenge | Risk Level | Mitigation Strategy |
|---|-----------|-----------|--------------------|
| R1 | **Cloud Costs at Scale** - R2 bandwidth + compute | Medium | Use Cloudflare Workers (free tier generous); implement caching |
| R2 | **Database Scaling** - PostgreSQL connection limits | Low | Use connection pooling (PgBouncer); Redis for hot data |
| R3 | **Model Storage** - R2 object count limits | Low | Organize models by language prefix; cleanup old versions |

### Market Challenges

| # | Challenge | Risk Level | Mitigation Strategy |
|---|-----------|-----------|--------------------|
| M1 | **User Adoption** - Need to educate about client-side benefits | High | Marketing about privacy, offline, zero server costs |
| M2 | **Free Alternatives** - Google TTS, Edge TTS competition | Medium | Focus on Vietnamese quality; unique voices; offline capability |
| M3 | **Vietnamese TTS Market** - Underserved but unknown demand | Medium | Start with free tier to validate interest; gather metrics |

### Development Challenges

| # | Challenge | Risk Level | Mitigation Strategy |
|---|-----------|-----------|--------------------|
| D1 | **Complex Tech Stack** - FastAPI + Next.js + ONNX + IndexedDB | High | Phase implementation; use proven libraries |
| D2 | **Model Conversion** - Need expertise for ONNX conversion | Medium | Use pre-trained models; document conversion process |
| D3 | **Testing Complexity** - Browser-specific behaviors | Medium | Comprehensive Playwright E2E tests; cross-browser CI |
| D4 | **State Management** - Complex state across features | Medium | Use Zustand with clear boundaries; React Query for server state |

### Legal & Compliance Challenges

| # | Challenge | Risk Level | Mitigation Strategy |
|---|-----------|-----------|--------------------|
| L1 | **Voice Licensing** - Must use properly licensed voices | High | Verify voice licenses; only use voices with commercial rights |
| L2 | **GDPR for EU Users** - Data protection requirements | Medium | Implement data deletion; privacy policy; cookie consent |
| L3 | **Content Copyright** - User-generated audio ownership | Low | Clear Terms of Service; user responsible for content |

### Operational Challenges

| # | Challenge | Risk Level | Mitigation Strategy |
|---|-----------|-----------|--------------------|
| O1 | **Monitoring at Scale** - Need observability | Medium | Implement structured logging; Prometheus metrics |
| O2 | **Incident Response** - Bug detection and fixing | Medium | Sentry error tracking; on-call rotation for critical issues |
| O3 | **Backup & Recovery** - Disaster recovery planning | Low | Regular automated backups; documented recovery procedures |

---

## Edge Cases & Handling Methods

### Client-Side TTS Edge Cases

| # | Edge Case | Detection | Handling Method |
|---|----------|-----------|----------------|
| E1 | **WebGPU not available** | Check `navigator.gpu` | Fallback to WebAssembly backend; show indicator |
| E2 | **WASM not supported** | Feature detection | Show error; suggest using modern browser |
| E3 | **Web Workers blocked** | Check Worker availability | Run on main thread with loading indicator |
| E4 | **IndexedDB not available** | Check `window.indexedDB` | Use localStorage as fallback (limited) |
| E5 | **IndexedDB quota exceeded** | Catch QuotaExceededError | LRU eviction; prompt user to clear old data |
| E6 | **AudioContext suspended** | Check `audioContext.state` | Resume on user interaction; show prompt |
| E7 | **Model download interrupted** | Check network status | Retry with exponential backoff; resume download |
| E8 | **Model file corrupted** | Validate ONNX session load | Re-download; show error if persists |
| E9 | **Out of memory** | Catch RangeError | Reduce chunk size; free previous chunks |
| E10 | **Long text causing timeout** | Check text length > 10K chars | Auto-chunk; process in batches |
| E11 | **Browser tab backgrounded** | Check document.visibilityState | Continue generation; pause audio playback |
| E12 | **Network lost during generation** | Check navigator.onLine | Cache work; resume when online |
| E13 | **Concurrent generation requested** | Check busy state | Queue request; show waiting status |
| E14 | **Invalid SSML markup** | Parse error | Show validation error; highlight invalid tag |
| E15 | **Empty text input** | Trim check | Disable generate button; show hint |

### Backend Edge Cases

| # | Edge Case | Detection | Handling Method |
|---|----------|-----------|----------------|
| B1 | **Rate limit exceeded** | Check 429 response | Show countdown; tier upgrade prompt |
| B2 | **JWT token expired** | Check 401 + code | Redirect to login; refresh token |
| B3 | **Invalid API key** | Check 403 response | Show error; regenerate key prompt |
| B4 | **Quota exhausted** | Check response | Show upgrade options; queue notification |
| B5 | **Database connection failed** | Catch connection error | Retry with backoff; show maintenance message |
| B6 | **R2 signed URL expired** | Check 403 on model fetch | Regenerate URL; reload model |
| B7 | **Concurrent login attempts** | Track sessions | Invalidate old sessions; notify user |
| B8 | **Large file upload timeout** | Check timeout | Chunk upload; show progress |
| B9 | **Server overloaded** | Check 503 response | Queue request; show estimated wait |
| B10 | **Invalid subscription** | Check subscription status | Downgrade features; prompt upgrade |

### Audio Processing Edge Cases

| # | Edge Case | Detection | Handling Method |
|---|----------|-----------|----------------|
| A1 | **Zero-length audio output** | Check audio duration | Show error; suggest text change |
| A2 | **Audio clipping/distortion** | Check peak amplitude | Apply limiter; reduce gain |
| A3 | **Very long audio (>1 hour)** | Check duration | Warn user; offer chapter split |
| A4 | **Audio play interrupted** | Check playback state | Save position; allow resume |
| A5 | **Multiple audio simultaneous** | Check active sources | Stop previous; start new |
| A6 | **Unsupported audio format** | Check browser support | Convert to WAV; show format options |
| A7 | **Volume too low** | Check RMS amplitude | Normalize audio; suggest volume increase |

### Data & Storage Edge Cases

| # | Edge Case | Detection | Handling Method |
|---|----------|-----------|----------------|
| D1 | **History storage full** | Check IDB quota | Auto-delete oldest; prompt user |
| D2 | **Model cache corrupted** | Validate checksum | Clear cache; re-download |
| D3 | **Sync conflict** | Check timestamp | Last-write-wins; show conflict notice |
| D4 | **Data migration needed** | Check schema version | Run migration; backup first |
| D5 | **Cross-device sync fails** | Check sync status | Queue for retry; notify user |
| D6 | **Privacy data retention** | Check GDPR request | Export data; permanent delete |

### User Experience Edge Cases

| # | Edge Case | Detection | Handling Method |
|---|----------|-----------|----------------|
| U1 | **First-time user** | Check localStorage | Show onboarding; quick tutorial |
| U2 | **Returning user (old browser)** | Check version | Prompt browser update |
| U3 | **Slow network** | Check latency > 3s | Show offline mode; cache assets |
| U4 | **User idle too long** | Check idle timeout | Auto-save progress; reconnect prompt |
| U5 | **Session timeout** | Check JWT expiry | Preserve input; re-authenticate |
| U6 | **Feature not supported** | Feature detection | Show tier upgrade; explain benefits |

### Security Edge Cases

| # | Edge Case | Detection | Handling Method |
|---|----------|-----------|----------------|
| S1 | **XSS in text input** | Sanitize input | Escape HTML; CSP headers |
| S2 | **CSRF on API calls** | Check CSRF token | Validate origin; use SameSite cookies |
| S3 | **Model tampering** | Check file hash | Verify signature; reject if mismatch |
| S4 | **API key leaked** | Detect abuse pattern | Revoke key; notify user; rotate key |
| S5 | **DDoS attack** | Check request rate | Rate limiting; block IP |
| S6 | **JWT algo confusion** | Check algorithm | Only allow RS256; reject none |

### Recovery Procedures

| Scenario | Recovery Steps |
|----------|---------------|
| **Model load failure** | 1. Clear IndexedDB cache, 2. Re-download model, 3. Show error if persists |
| **Audio playback fails** | 1. Recreate AudioContext, 2. Re-decode audio, 3. Fallback to new audio |
| **Auth session lost** | 1. Preserve input text, 2. Redirect login, 3. Resume after auth |
| **Offline data loss** | 1. Check localStorage backup, 2. Sync from cloud, 3. Export option |
| **Database corruption** | 1. Restore from backup, 2. Notify affected users, 3. Document incident |

### Monitoring & Alerting

| Metric | Alert Threshold | Action |
|--------|-----------------|--------|
| Error rate > 5% | Page | On-call notification |
| API latency > 500ms | P95 | Performance review |
| Model load time > 30s | Incident | User support |
| Storage used > 80% | Warning | Cleanup notification |
| Failed logins > 10/min | Security | Block IP temporarily |

### Must Decide Before Starting

1. **Database Choice**: Supabase (PostgreSQL) vs Neon vs traditional VPS
2. **Authentication**: Build custom JWT vs Auth0/Clerk integration
3. **Model Source**: Continue with Piper vs explore Coqui XTTS
4. **Deployment**: Cloudflare Workers vs VPS
5. **Revenue Model**: Subscription-only vs usage-based pricing

### Recommended Decisions

| Decision | Recommended | Rationale |
|----------|-------------|-----------|
| Database | Supabase | Free tier, built-in Auth, easy setup |
| Auth | Custom JWT | Full control, no additional cost |
| Models | Piper | Proven, lightweight, commercial license |
| Deployment | Cloudflare | Best free tier, fast, edge computing |
| Pricing | Tiered subscription | Clear value differentiation |
