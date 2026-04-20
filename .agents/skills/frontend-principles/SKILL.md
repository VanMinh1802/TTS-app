---
name: frontend-principles
description: Core frontend development principles and workflow. Use when building/rebuilding components, creating features, writing code, or when asked about "frontend principles". This is the ENTRY skill — always read this FIRST before starting any task.
tags: [frontend, principles, workflow, entry, quality, hard-rules]
---

# Frontend Principles - Entry Skill

## Purpose

This skill defines foundational principles, standard workflows, and quality
gates for all frontend development activities. **Always read this skill BEFORE
starting any task.**

## Default Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript (strict mode)
- **State/Data**: TanStack Query (React Query) v5
- **Validation**: Zod
- **Form**: React Hook Form
- **Styling**: Tailwind CSS
- **Testing**: Vitest + Testing Library

## Standard Workflow for Every Task

```
New Task → Read relevant skill(s) → Plan → Implement → Quality Gate Check → Done
```

### Step 1: Identify Task Type

| Task Type          | Relevant Skills                            |
| ------------------ | ------------------------------------------ |
| Create new feature | `frontend-arch` + `frontend-data-fetching` |
| UI Component       | `frontend-components`                      |
| API/Server Action  | `frontend-data-fetching`                   |
| Fix bug            | Check which quality gates were violated    |
| Refactor           | Compare against current principles         |

### Step 2: Read Relevant Skills

- Read related skills BEFORE writing code
- No need to read all skills — only the ones relevant to the task

### Step 3: Implement According to Principles

- Follow Hard Rules (see below)
- Follow the checklist from the relevant skill

### Step 4: Quality Gate Check

BEFORE finishing, verify:

- [ ] TypeScript build passed
- [ ] ESLint passed
- [ ] No hard rules violations
- [ ] Tests written for new logic
- [ ] Component has sufficient comments for non-obvious logic

## Hard Rules (Never Violate)

### 1. Server/Client Boundary

```
✅ Server Component: Backend logic, SEO, static data
✅ Client Component: Interactivity, hooks, browser APIs
❌ NEVER: Server Component using useState/useEffect
❌ NEVER: Client Component using async/await at top-level (except Server Actions)
```

### 2. Data Fetching

```
✅ Use React Query for client-side data
✅ Use direct fetch for Server Components
✅ 3 layers: Pure function → Query options → Hook
❌ NEVER: useEffect for data fetching
❌ NEVER: setState when server state already exists
```

### 3. Component Architecture

```
✅ Feature-based folder structure
✅ Atomic components (small, reusable)
✅ Colocation: tests, styles in same folder as component
❌ NEVER: Shared components containing business logic
❌ NEVER: Props drilling > 2 levels
```

### 4. Type Safety

```
✅ Use Zod for runtime validation
✅ Use infer from Zod schema for types
✅ Strict TypeScript (strict: true)
❌ NEVER: any type
❌ NEVER: type assertions (as) when unnecessary
```

### 5. Error Handling

```
✅ Always have error boundaries
✅ Always handle loading states
✅ Use error boundaries instead of try-catch everywhere
❌ NEVER: Empty catch blocks
❌ NEVER: Silent failures
```

## Standard Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, register)
│   ├── (main)/            # Main app routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout (Server Component)
├── components/
│   ├── ui/               # Atomic: Button, Input, Modal...
│   ├── features/         # Feature-specific: PostList, UserMenu...
│   └── forms/            # Form components
├── features/
│   └── {feature}/        # Feature module
│       ├── api/          # API definitions
│       ├── components/   # Feature components
│       ├── hooks/        # Feature hooks
│       ├── types/        # Feature types
│       └── index.ts      # Public exports
├── lib/
│   ├── api-client.ts     # HTTP client
│   ├── auth.tsx         # Auth queries & mutations
│   └── utils.ts         # Utilities
└── types/                # Shared types
```

## Quick Reference

### Create a New Feature

1. `frontend-arch`: Check folder structure
2. `frontend-data-fetching`: Define API + React Query
3. `frontend-components`: Write components

### Create a New Component

1. `frontend-components`: Check atomicity
2. Check if shared/ or feature-specific
3. Write unit test

### Data Fetching

1. `frontend-data-fetching`: 3 layers pattern
2. React Query cache: staleTime vs gcTime
3. Invalidate vs setQueryData vs removeQueries

### Quick Decision Table

| Scenario | Decision | See Skill |
|----------|----------|-----------|
| New feature? | Feature-based folder in `features/` | `frontend-arch` |
| Need data? | React Query for client, fetch for server | `frontend-data-fetching` |
| UI component? | Atomic in `components/ui/` | `frontend-components` |
| Feature component? | In `features/{name}/components/` | `frontend-components` |
| Server/Client? | Server: async + fetch. Client: hooks + React Query | `frontend-nextjs-16` |
| Type safety? | Zod + TypeScript strict | `frontend-principles` |
| Security? | httpOnly cookies, RBAC, validation | `frontend-security` |
| Bug fix? | Check quality gates first | `frontend-quality` |

## Additional Resources

- [Architecture](frontend-arch)
- [Data Fetching & Auth](frontend-data-fetching)
- [Component Patterns](frontend-components)
- [Quality Gates](frontend-quality)
- [Next.js 16+ Principles](frontend-nextjs-16)
- [Security Patterns](frontend-security)
