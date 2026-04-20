---
name: frontend-data-fetching
description: Data fetching rules with React Query and authentication flow. Use when working with API, mutations, caching, authentication, or optimistic updates.
tags: [frontend, data-fetching, react-query, api, authentication, cache]
---

# Data Fetching & Authentication

## 1. Three Layers Pattern (SSOT)

**Each entity needs 3 layers to ensure consistency:**

```typescript
// lib/auth.tsx

// Layer 1: Pure Function (Server + Client)
export const getUser = async (): Promise<User> => {
  const response = (await api.get('/auth/me')) as { data: User };
  return response.data;
};

// Layer 2: Query Options (SSOT - Single Source of Truth)
export const getUserQueryOptions = () => {
  return queryOptions({
    queryKey: ['user'],
    queryFn: getUser,
    staleTime: 5 * 60 * 1000,    // 5 minutes
    gcTime: 10 * 60 * 1000,      // 10 minutes
  });
};

// Layer 3: React Hook (Client Components)
export const useUser = () => useQuery(getUserQueryOptions());
```

### When to Use Which Layer?

| Layer | Use Where | Purpose |
|-------|-----------|---------|
| `getUser()` | Server Components, API routes, Tests | Pure function, no React dependency |
| `getUserQueryOptions()` | Server prefetch, Client prefetch, Invalidate | SSOT for queryKey and config |
| `useUser()` | Client Components | Semantic hook interface |

### Practical Examples:

```typescript
// 1. Server prefetch (Layer 2)
await queryClient.prefetchQuery(getUserQueryOptions());

// 2. Client component (Layer 3)
const { data: user } = useUser();

// 3. Server Action (Layer 1)
const user = await getUser();

// 4. Invalidate (Layer 2)
queryClient.invalidateQueries(getUserQueryOptions());
```

## 2. React Query Cache Lifecycle

### staleTime vs gcTime

```
staleTime: Time data remains "fresh"
gcTime: Time cache persists after unmount
```

```typescript
useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
  staleTime: 5 * 60 * 1000,   // Data "fresh" for 5 minutes
  gcTime: 10 * 60 * 1000,     // Cache persists 10 minutes after unmount
});
```

**Timeline:**
```
0:00  - Fetch → Data fresh ✅
5:00  - staleTime expired → Data stale ⚠️ (no auto refetch!)
10:00 - gcTime expired (if unmounted) → Cache deleted 🗑️
```

### Best Practice: gcTime >= staleTime

```typescript
// ✅ Correct
staleTime: 5 * 60 * 1000,
gcTime: 10 * 60 * 1000,

// ❌ Wrong - Cache deleted before data goes stale
staleTime: 10 * 60 * 1000,
gcTime: 5 * 60 * 1000,
```

### isLoading vs isFetching

| State | Meaning | When |
|-------|---------|------|
| `isLoading` | Fetching + no cache | First time or cache cleared |
| `isFetching` | Fetching (regardless of cache) | Any time fetch occurs (initial, refetch, background) |

```typescript
// First load (no cache): isLoading = true, isFetching = true
// Refetch (has cache): isLoading = false, isFetching = true
// After fetch: isLoading = false, isFetching = false
```

## 3. Cache Manipulation Methods

### invalidateQueries vs setQueryData vs removeQueries

```typescript
// 1. invalidateQueries - Mark as stale + auto refetch
queryClient.invalidateQueries(getUserQueryOptions());
// ✅ Use after UPDATE/CREATE/DELETE (success)

// 2. setQueryData - Update cache directly (optimistic)
queryClient.setQueryData(['user'], (old) => ({ ...old, firstName: 'Jane' }));
// ✅ Use for optimistic update (know result in advance)

// 3. removeQueries - Delete cache completely
queryClient.removeQueries({ queryKey: ['user'] });
// ✅ Use for logout, clear data (no refetch)

// 4. refetch - Force refetch immediately
const { refetch } = useQuery(getUserQueryOptions());
refetch();
// ✅ Use when user clicks "Refresh"
```

### When to Use What?

| Action | Method | Reason |
|--------|--------|--------|
| After UPDATE success | `invalidateQueries` | Data may differ from server |
| After CREATE success | `invalidateQueries` | List needs refetch |
| After DELETE success | `invalidateQueries` + `removeQueries` | List refetch, detail delete |
| Optimistic update | `setQueryData` + `invalidateQueries` | Fast UI + server sync |
| Logout | `removeQueries` | No refetch (session ended) |

## 4. Optimistic Update Pattern

**Use when fast UX is needed (like, follow, toggle):**

```typescript
const likeMutation = useMutation({
  mutationFn: likePost,
  
  onMutate: async () => {
    // 1. Cancel running refetch
    await queryClient.cancelQueries({ queryKey: ['post', postId] });
    
    // 2. Save old data (for rollback)
    const previousPost = queryClient.getQueryData(['post', postId]);
    
    // 3. Update cache immediately (optimistic)
    queryClient.setQueryData(['post', postId], (old) => ({
      ...old,
      likes: old.likes + 1,
      isLiked: true
    }));
    
    return { previousPost };
  },
  
  onError: (err, variables, context) => {
    // 4. Rollback on error
    queryClient.setQueryData(['post', postId], context.previousPost);
  },
  
  onSuccess: () => {
    // 5. Invalidate to sync with server
    queryClient.invalidateQueries({ queryKey: ['post', postId] });
  }
});
```

### Why Invalidate After Optimistic?

**Because optimistic can be wrong:**
- Race condition (multiple users like simultaneously)
- Server returns different data (new fields added)
- Server validation changes data

```typescript
// Client: likes = 11
// Server: likes = 12 (another user liked before)
// Server also returns: likedBy, trending, timestamp
```

## 5. Authentication Flow

### Server Component Auth (Root Layout)

```typescript
// app/layout.tsx
async function RootLayout({ children }) {
  const queryClient = new QueryClient();
  
  // Prefetch user first
  await queryClient.prefetchQuery(getUserQueryOptions());
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
```

### Client Auth (useUser hook)

```typescript
// components/Navbar.tsx
'use client';
function Navbar() {
  const { data: user } = useUser();
  
  return (
    <nav>
      {user ? (
        <UserMenu user={user} />
      ) : (
        <LoginButton />
      )}
    </nav>
  );
}
```

### Auth Mutations

```typescript
// Logout - Use removeQueries (don't invalidate)
export const useLogout = ({ onSuccess }) => {
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['user'] });
      onSuccess?.();
    }
  });
};

// Login - Use setQueryData (already know the result)
export const useLogin = ({ onSuccess }) => {
  return useMutation({
    mutationFn: loginWithEmailAndPassword,
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data.user);
      onSuccess?.();
    }
  });
};
```

## 6. Server/Client Data Fetching

### Server Component (Server-side fetch)

```typescript
// app/posts/page.tsx - Server Component
async function PostsPage() {
  // ✅ Fetch directly at server
  const posts = await getPosts();
  
  return <PostList posts={posts} />;
}
```

### Client Component (React Query)

```typescript
// components/PostList.tsx - Client Component
'use client';
function PostList() {
  const { data: posts, isLoading } = useQuery(getPostsQueryOptions());
  
  if (isLoading) return <Spinner />;
  
  return posts.map(post => <PostCard key={post.id} post={post} />);
}
```

### Common Mistakes

```typescript
// ❌ Client fetch data directly
'use client';
function PostList() {
  const data = await fetch('/api/posts'); // WRONG!
}

// ❌ Server use React Query
async function PostsPage() {
  const data = useQuery(getPostsQueryOptions()); // WRONG! useQuery only on client
}

// ✅ Server fetch directly
async function PostsPage() {
  const posts = await getPosts();
}
```

## 7. Zod Validation Pattern

```typescript
import { z } from 'zod';

// Schema definition
export const createPostSchema = z.object({
  title: z.string().min(1, 'Title required').max(200),
  content: z.string().min(1, 'Content required'),
  tags: z.array(z.string()).optional(),
});

// Type inference
export type CreatePostInput = z.infer<typeof createPostSchema>;

// Usage with React Hook Form
function CreatePostForm() {
  const form = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { title: '', content: '', tags: [] }
  });
}
```

## Checklist: Data Fetching

```
Task Progress:
- [ ] 1. Define Zod schema (validation)
- [ ] 2. Create pure function (Layer 1)
- [ ] 3. Create query options (Layer 2)
- [ ] 4. Create hooks with mutations (Layer 3)
- [ ] 5. Handle cache (invalidate/setQueryData/remove)
- [ ] 6. Handle loading/error states
- [ ] 7. Write tests
```

## Additional Resources

- [Architecture](frontend-arch)
- [Component Patterns](frontend-components)
- [Quality Gates](frontend-quality)

## Quick Reference

| Task | Layer | Method |
|------|-------|--------|
| Fetch on server | Layer 1 | `const data = await getPosts()` |
| Fetch on client | Layer 3 | `const { data } = usePosts()` |
| Prefetch on server | Layer 2 | `queryClient.prefetchQuery(getPostsQueryOptions())` |
| Invalidate after update | Layer 2 | `queryClient.invalidateQueries(getPostsQueryOptions())` |
| Optimistic update | Layer 2 | `queryClient.setQueryData(['post', id], updatedData)` |
| Logout clear cache | Layer 2 | `queryClient.removeQueries(getUserQueryOptions())` |
| Cache fresh = 5min | Config | `staleTime: 5 * 60 * 1000` |
| Cache persist = 10min | Config | `gcTime: 10 * 60 * 1000` |
