---
name: frontend-arch
description: Architecture rules and project structure for Frontend. Use when creating new features, organizing folders, or deciding where to place code.
tags: [frontend, architecture, structure, folders, feature-based]
---

# Architecture & Project Structure

## Core Principles

### 1. Feature-Based Architecture

**Each feature is an independent module:**

```
features/
└── posts/
    ├── api/              # API definitions (fetch functions)
    │   ├── get-posts.ts
    │   └── create-post.ts
    ├── components/       # Feature-specific components
    │   ├── PostList.tsx
    │   ├── PostCard.tsx
    │   └── CreatePostForm.tsx
    ├── hooks/           # Feature hooks
    │   └── use-posts.ts
    ├── types/           # Feature types
    │   └── post.types.ts
    ├── utils/           # Feature utilities
    └── index.ts         # Public exports (ONLY export what needs to be public)
```

**Why feature-based?**

- ✅ Easy to find code (know the feature → know the folder)
- ✅ Easy to delete a feature (delete the folder)
- ✅ Independent deployments
- ✅ Clear boundaries

### 2. Colocation Principle

**Place related files in the same folder:**

```
features/posts/
├── PostList.tsx          # Component
├── PostList.test.tsx     # Test here (not in __tests__/)
├── PostList.css          # Styles here
├── use-posts.ts          # Hook
└── use-posts.test.ts     # Hook test
```

**Benefits:**

- Easy to track related files
- Deleting a feature → clean (just delete the folder)
- No "lost" files floating around

### 3. Clear Public API

**Only export what is necessary:**

```typescript
// features/posts/index.ts
export { PostList } from "./components/PostList";
export { CreatePostForm } from "./components/CreatePostForm";
export { useCreatePost, usePosts } from "./hooks/use-posts";
// ❌ DO NOT export internal components
```

**Inner modules must not be imported from outside:**

```typescript
// ❌ BAD - Import internal from another feature
import { PostCard } from "@/features/posts/components/PostCard";

// ✅ GOOD - Import from public API
import { PostList } from "@/features/posts";
```

## Shared vs Feature Code

### Shared (components/ui)

**Use for:**

- Atomic components (Button, Input, Modal, Dropdown)
- Utility functions
- Types shared across features
- Third-party wrappers

**DO NOT use for:**

- Business logic
- Feature-specific data fetching
- Feature-specific state

### Feature-Specific

**Use for:**

- Feature components
- Feature hooks
- Feature API calls
- Feature types
- Feature utils

## Server/Client Boundary

### Server Components (default)

**Use for:**

- Layouts, Pages
- Data fetching (at server)
- Static content
- SEO metadata
- Auth check (server-side)

```typescript
// app/posts/page.tsx - Server Component
async function PostsPage() {
  // ✅ Fetch directly at server
  const posts = await getPosts();

  return <PostList posts={posts} />;
}
```

### Client Components ('use client')

**Use for:**

- Interactivity (onClick, onChange)
- Hooks (useState, useEffect, useQuery)
- Browser APIs
- Event handlers

```typescript
"use client";
// components/PostForm.tsx
function PostForm() {
  const [title, setTitle] = useState("");
  const { mutate } = useCreatePost();

  return <form onSubmit={() => mutate({ title })}>...</form>;
}
```

### Common Mistakes

```typescript
// ❌ Server Component with hooks
async function PostsPage() {
  const [filter, setFilter] = useState(""); // WRONG!
}

// ❌ Client Component fetch data directly
"use client";
function PostList() {
  const data = await fetch("/api/posts"); // WRONG!
}

// ✅ Client component uses React Query
"use client";
function PostList() {
  const { data } = useQuery(getPostsQueryOptions());
}
```

## App Router Folder Organization

```
app/
├── (auth)/               # Route group - no shared layout
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
├── (main)/              # Route group - has shared layout (navbar)
│   ├── layout.tsx       # Shared layout for main routes
│   ├── posts/
│   │   ├── page.tsx     # List posts
│   │   └── [id]/
│   │       └── page.tsx # Post detail
│   └── profile/
│       └── page.tsx
├── api/                 # API routes
│   └── posts/
│       └── route.ts
├── layout.tsx           # Root layout (Server Component)
└── providers.tsx       # Client providers (QueryClient, etc)
```

## Naming Conventions

| Type       | Convention                | Example                          |
| ---------- | ------------------------- | -------------------------------- |
| Folders    | kebab-case                | `post-list`, `user-menu`         |
| Components | PascalCase                | `PostList.tsx`, `UserMenu.tsx`   |
| Hooks      | camelCase with use prefix | `use-posts.ts`, `use-auth.ts`    |
| Types      | PascalCase                | `Post.types.ts`, `User.types.ts` |
| Query keys | Array with kebab          | `['posts']`, `['post', postId]`  |
| Files      | kebab-case                | `get-posts.ts`, `api-client.ts`  |

## Dependency Rule

**Only import from:**

1. `node_modules`
2. `@/` (src paths)
3. Feature's own files

**Forbidden:**

- Import from feature's internal modules by other features
- Circular dependencies

```
✅ features/posts/components → features/posts/hooks → features/posts/types
✅ features/posts/components → lib/api-client
✅ components/ui/Button → features/posts/components
❌ features/posts/hooks → features/users/components (forbidden!)
```

## Checklist: Creating a New Feature

```
Task Progress:
- [ ] 1. Create folder structure
- [ ] 2. Define types (Zod + TypeScript)
- [ ] 3. Create API functions (pure functions)
- [ ] 4. Create query options (SSOT for query key)
- [ ] 5. Create hooks (useXxx)
- [ ] 6. Create components
- [ ] 7. Export public API from index.ts
- [ ] 8. Write tests
```

## Anti-Patterns

```typescript
// ❌ Shared component with business logic
components/
└── UserDashboard.tsx  // Contains user fetching, auth logic

// ✅ Feature component
features/
└── users/
    ├── components/
    │   └── UserDashboard.tsx  // Uses hook useUser()
    └── hooks/
        └── use-user.ts
```

```typescript
// ❌ Props drilling too deep
<A onChange={onChange} data={data}>
  <B onChange={onChange} data={data}>
    <C onChange={onChange} data={data}>
      <D />  // Receives 4 levels of props
    </C>
  </B>
</A>

// ✅ Use composition or context
<A>
  <B>
    <C>
      <D />  // Use useData() hook or children
    </C>
  </B>
</A>
```

```typescript
// ❌ Flat structure
src/
├── components/
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── PostList.tsx
│   ├── PostCard.tsx
│   ├── UserList.tsx
│   └── ... (hundreds of files!)

// ✅ Feature-based
src/
├── components/ui/        # Atomic (10-20 files)
├── features/posts/      # Post feature
├── features/users/      # User feature
└── features/auth/       # Auth feature
```

## Additional Resources

- [Data Fetching & Auth](frontend-data-fetching)
- [Component Patterns](frontend-components)

## Quick Reference

| Task | Solution | Example |
|------|----------|---------|
| Create new feature | Feature folder in `features/{name}/` | `features/posts/` |
| Add API | Pure function in `features/{name}/api/` | `api/get-posts.ts` |
| Add component | Feature component in `features/{name}/components/` | `PostList.tsx` |
| Add UI component | Atomic in `components/ui/` | `Button.tsx` |
| Create types | Zod schema in `features/{name}/types/` | `post.types.ts` |
| Props drilling | Use context or composition | `useContext` |
| Folder naming | kebab-case | `post-list` |
| Component naming | PascalCase | `PostList.tsx` |
