---
name: frontend-nextjs-16
description: Next.js 16+ specific principles and features. Use when working with Next.js App Router, Server Components, Server Actions, or when applying Next.js latest best practices.
tags: [frontend, nextjs, app-router, server-components, server-actions]
---

# Next.js 16+ Principles

## 1. Server Components (Default)

### Core Principles

**In Next.js 16+, all Components are Server Components by default.**

```typescript
// app/posts/page.tsx - Server Component (default)
// NO 'use server' needed
async function PostsPage() {
  // ✅ Can use async/await
  const posts = await getPosts();
  
  return <PostList posts={posts} />;
}
```

### When to Use Client Component?

```typescript
// Use 'use client' when needing:
// 1. Hooks (useState, useEffect, useQuery)
'use client';
function LikeButton({ postId }) {
  const { mutate } = useLikePost(postId);
  return <button onClick={() => mutate()} />;
}

// 2. Event handlers (onClick, onChange)
'use client';
function SearchInput() {
  const [value, setValue] = useState('');
  return <input onChange={(e) => setValue(e.target.value)} />;
}

// 3. Browser APIs (window, document)
'use client';
function ScrollToTop() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
}
```

### Server Component → Client Component Pattern

```typescript
// ✅ Correct Pattern - Server fetch, Client render
// app/posts/page.tsx
async function PostsPage() {
  const posts = await getPosts(); // Server fetch
  return (
    <div>
      <PostList posts={posts} /> {/* Server Component */}
      <LikeButton postId={posts[0].id} /> {/* Client Component */}
    </div>
  );
}
```

## 2. Server Actions

### Defining Server Actions

```typescript
// app/actions/posts.ts
'use server';

export async function createPost(formData: FormData) {
  // ✅ Runs on server
  const title = formData.get('title');
  const content = formData.get('content');
  
  // Validate at server
  const validated = createPostSchema.parse({ title, content });
  
  // Database operation
  const post = await db.post.create({ data: validated });
  
  // Revalidate cache
  revalidatePath('/posts');
  
  return post;
}
```

### Calling Server Actions from Client

```typescript
// components/CreatePostForm.tsx
'use client';
import { createPost } from '@/app/actions/posts';

function CreatePostForm() {
  async function handleSubmit(formData: FormData) {
    await createPost(formData);
    // Form auto resets or redirects
  }
  
  return (
    <form action={handleSubmit}>
      <input name="title" />
      <textarea name="content" />
      <button type="submit">Create</button>
    </form>
  );
}
```

### Progressive Enhancement

```typescript
// ✅ Server Actions support JavaScript disabled
<form action={createPost}>
  <button type="submit">Create</button>
</form>
```

### Server Action Validation

```typescript
'use server';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

export async function createUser(prevState: any, formData: FormData) {
  const rawData = {
    email: formData.get('email'),
    name: formData.get('name'),
  };
  
  const validated = schema.safeParse(rawData);
  
  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
    };
  }
  
  // Create user...
  revalidatePath('/users');
  return { success: true };
}
```

## 3. Caching & Revalidation

### Static vs Dynamic

```typescript
// Static (cached) - Default if no dynamic data
async function AboutPage() {
  const about = await getAbout(); // Cached
  return <div>{about}</div>;
}

// Dynamic - Changes per request
async function ProfilePage({ params }) {
  const user = await getUser(params.id); // Dynamic
  return <div>{user.name}</div>;
}

// Force dynamic
export const dynamic = 'force-dynamic';

async function DashboardPage() {
  const metrics = await getMetrics(); // Always fresh
  return <Dashboard metrics={metrics} />;
}
```

### Revalidation

```typescript
import { revalidatePath, revalidateTag } from 'next/cache';

// 1. Revalidate by path
revalidatePath('/posts'); // Revalidate all posts
revalidatePath('/posts/[id]', 'page'); // Revalidate specific post

// 2. Revalidate by tag (with fetch)
export const getPosts = async () => {
  const res = await fetch('https://api.example.com/posts', {
    next: { tags: ['posts'] }
  });
  return res.json();
};

revalidateTag('posts'); // Revalidate all fetches with 'posts' tag
```

## 4. Layouts & Templates

### Layouts

```typescript
// app/(main)/layout.tsx
// Layout persists across navigations
export default function MainLayout({ children }) {
  // ✅ Mount once, persists on navigate
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="layout">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
```

### Templates

```typescript
// app/(marketing)/template.tsx
// Template remounts on every navigation (different from Layout)
export default function MarketingTemplate({ children }) {
  // ✅ Remounts when navigating to this route
  useEffect(() => {
    // Analytics tracking on every page view
    trackPageView();
  }, []);
  
  return <div className="page-transition">{children}</div>;
}
```

## 5. Parallel & Intercepting Routes

### Parallel Routes

```typescript
// app/@analytics/(.)@feed/page.tsx
// Display 2 routes simultaneously

export default function AnalyticsLayout({ children }) {
  return (
    <div className="dashboard">
      <div className="main-content">
        {/* Slot 1 */}
        {children}
      </div>
      <div className="analytics-panel">
        {/* Slot 2 - Rendered parallel */}
        <Analytics />
      </div>
    </div>
  );
}
```

### Intercepting Routes

```typescript
// app/@modal/(.)photo/[id]/page.tsx
// Intercept /photo/123 and show modal instead of navigating

// app/photo/[id]/page.tsx
// Full page render when navigating directly
```

## 6. Route Groups

```typescript
// app/
// ├── (marketing)/          # Marketing routes - share layout
// │   ├── layout.tsx       # Marketing layout
// │   ├── about/page.tsx
// │   └── pricing/page.tsx
// │
// ├── (dashboard)/          # Dashboard routes - share layout
// │   ├── layout.tsx       # Dashboard layout (different from marketing)
// │   ├── overview/page.tsx
// │   └── settings/page.tsx
// │
// └── (auth)/              # Auth routes - no shared layout
//     ├── login/page.tsx
//     └── register/page.tsx
```

## 7. Advanced Patterns

### Route Handler Pattern

```typescript
// app/api/posts/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') ?? '1';
  
  const posts = await getPosts({ page: Number(page) });
  
  return Response.json(posts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const validated = createPostSchema.parse(body);
  
  const post = await db.post.create({ data: validated });
  
  return Response.json(post, { status: 201 });
}
```

### Middleware Pattern

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check auth
  const token = request.cookies.get('auth-token');
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'],
};
```

### Server Component with Streaming

```typescript
// app/posts/page.tsx
import { Suspense } from 'react';

async function PostsPage() {
  return (
    <div>
      <h1>Posts</h1>
      <Suspense fallback={<PostListSkeleton />}>
        <PostList /> {/* Heavy component - stream */}
      </Suspense>
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar /> {/* Lighter - faster */}
      </Suspense>
    </div>
  );
}
```

## 8. Data Fetching with Server Components

### Basic Pattern

```typescript
// ✅ Server Components - fetch directly
async function PostsPage() {
  // Sequential fetch (if needed)
  const posts = await getPosts();
  
  // Parallel fetch (preferred)
  const [posts, users] = await Promise.all([
    getPosts(),
    getUsers(),
  ]);
  
  return (
    <div>
      <PostList posts={posts} />
      <UserList users={users} />
    </div>
  );
}
```

### With React Query (Client)

```typescript
// components/PostList.tsx
'use client';
// Client component using React Query
function PostList() {
  const { data: posts, isLoading } = useQuery(getPostsQueryOptions());
  
  if (isLoading) return <Skeleton />;
  
  return posts.map(post => <PostCard key={post.id} post={post} />);
}

// app/posts/page.tsx
// Server component composing with client component
async function PostsPage() {
  // Prefetch at server
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(getPostsQueryOptions());
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostList />
    </HydrationBoundary>
  );
}
```

## 9. Image & Media Optimization

```typescript
import Image from 'next/image';

// Local images
<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority // Load first
/>

// Remote images (requires domains config)
<Image
  src="https://example.com/image.jpg"
  alt="Remote image"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..." //Blur placeholder
/>
```

## 10. Font Optimization

```typescript
import { Inter, Roboto_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Prevent FOIT
  variable: '--font-inter',
});

const mono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

## 11. Metadata

```typescript
import { Metadata } from 'next';

// Static metadata
export const metadata: Metadata = {
  title: 'My App',
  description: 'My app description',
  openGraph: {
    title: 'My App',
    images: ['/og-image.jpg'],
  },
};

// Dynamic metadata
export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await getProduct(params.id);
  
  return {
    title: product.name,
    description: product.description,
  };
}
```

## 12. Error Handling

```typescript
// app/posts/error.tsx
'use client';
export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}

// app/posts/loading.tsx
export default function Loading() {
  return <div className="skeleton">Loading...</div>;
}

// app/posts/not-found.tsx
export default function NotFound() {
  return <div>Post not found</div>;
}
```

## 13. Checklist: Next.js Feature

```
Task Progress:
- [ ] 1. Determine Server vs Client Component
- [ ] 2. Server Actions for mutations?
- [ ] 3. Revalidation strategy?
- [ ] 4. Error/Loading/NotFound handling?
- [ ] 5. Metadata for SEO?
- [ ] 6. Image optimization?
- [ ] 7. Streaming if needed?
```

## Comparison: Bulletproof React vs Next.js 16+

| Aspect | Bulletproof React | Next.js 16+ |
|--------|-------------------|-------------|
| Data Fetching | React Query | Server Components + React Query |
| Mutations | React Query mutations | Server Actions + React Query |
| Auth | React Query (client) | Server Components (server) |
| Routing | React Router | App Router (built-in) |
| Forms | React Hook Form | Server Actions + React Hook Form |
| State | React Query + Context | Server State + URL State |

## Additional Resources

- [Architecture](frontend-arch)
- [Data Fetching](frontend-data-fetching)
- [Components](frontend-components)
- [Quality Gates](frontend-quality)

## Quick Reference

| Task | Solution | Example |
|------|----------|---------|
| Server Component | async function + fetch | `async function Page()` |
| Client Component | 'use client' + hooks | `'use client'; useState` |
| Server Action | 'use server' + typed | `action: serverFunction` |
| Route param | Use params prop | `params: { id: string }` |
| Search params | Use searchParams prop | `searchParams: { q: string }` |
| Metadata | Export generateMetadata | `export function generateMetadata()` |
| Static data | No revalidation | `export const revalidate = false` |
| Revalidate path | Call in Server Action | `revalidatePath('/posts')` |
| Not Found | Throw notFound() | `throw notFound()` |
| Error | Throw error + ErrorBoundary | `throw new Error()` |
