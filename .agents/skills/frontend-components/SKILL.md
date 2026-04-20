---
name: frontend-components
description: Component design rules and patterns. Use when creating new components, analyzing component structure, or deciding what a component should do.
tags: [frontend, components, patterns, atomic, composition]
---

# Component Patterns

## 1. Atomic Design Principle

### Layers

```
┌─────────────────────────────────────────────┐
│  1. UI Components (Atomic)                  │
│     Button, Input, Modal, Dropdown...       │
│     - No business logic                     │
│     - No data fetching                      │
│     - Only receive props and render UI      │
├─────────────────────────────────────────────┤
│  2. Feature Components (Molecular)          │
│     PostCard, UserMenu, ProductList...      │
│     - Has light business logic              │
│     - Use hooks to fetch data               │
│     - Compose from UI components            │
├─────────────────────────────────────────────┤
│  3. Page Components (Organism)              │
│     PostsPage, ProfilePage, DashboardPage  │
│     - Page layouts                          │
│     - Compose feature components            │
│     - Server/Client boundary                │
└─────────────────────────────────────────────┘
```

### Example: Post Feature

```typescript
// 1. UI Components (Atomic)
components/ui/
├── Button.tsx      // Only renders button
├── Input.tsx      // Only renders input
└── Modal.tsx      // Only renders modal

// 2. Feature Components
features/posts/
├── components/
│   ├── PostCard.tsx        // Uses Button, Input
│   ├── PostForm.tsx        // Uses Button, Input, Modal
│   ├── PostList.tsx        // Composes PostCard
│   └── CreatePostDialog.tsx
└── hooks/
    └── use-posts.ts

// 3. Page Components
app/posts/
├── page.tsx            // Server Component, fetch data
└── [id]/page.tsx      // Server Component, fetch detail
```

## 2. Component Structure Pattern

### Presentational vs Container Components

```typescript
// Presentational Component - Only renders UI
// components/PostCard.tsx
interface PostCardProps {
  title: string;
  author: string;
  likes: number;
  onLike: () => void;
}

function PostCard({ title, author, likes, onLike }: PostCardProps) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p>By {author}</p>
      <button onClick={onLike}>{likes} ❤️</button>
    </div>
  );
}

// Container Component - Has logic and data
// features/posts/components/PostCardContainer.tsx
'use client';
function PostCardContainer({ postId }: { postId: string }) {
  const { data: post } = usePost(postId);
  
  if (!post) return null;
  
  return (
    <PostCard
      title={post.title}
      author={post.author.name}
      likes={post.likes}
      onLike={() => useLikePost(postId)}
    />
  );
}
```

### Why Separate?

- ✅ Easier to test (presentational only tests render)
- ✅ Higher reuse (presentational doesn't depend on logic)
- ✅ Clear separation of concerns

## 3. Component Props Pattern

### Use Interface for Props

```typescript
// ✅ Correct
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

function Button({ variant = 'primary', size = 'md', children, onClick, disabled }: ButtonProps) {
  return (
    <button className={`btn btn-${variant} btn-${size}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

// ❌ Wrong - No interface
function Button(props) {
  const { variant, children, onClick } = props;
  // Unclear about required/optional
}
```

### Extends Native Elements

```typescript
// Use HTMLAttributes to extend
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

function Button({ variant = 'primary', loading, children, ...props }: ButtonProps) {
  return (
    <button {...props} disabled={disabled || loading}>
      {loading ? <Spinner /> : children}
    </button>
  );
}
```

## 4. Composition Pattern

### Using Children

```typescript
// Container component
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="card-header">{children}</div>;
}

function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="card-body">{children}</div>;
}

// Usage
<Card>
  <CardHeader>
    <h2>Title</h2>
  </CardHeader>
  <CardBody>
    <p>Content</p>
  </CardBody>
</Card>
```

### Using Render Props

```typescript
interface DataFetcherProps<T> {
  queryKey: string[];
  render: (data: T | undefined, loading: boolean) => React.ReactNode;
}

function DataFetcher<T>({ queryKey, render }: DataFetcherProps<T>) {
  const { data, isLoading } = useQuery({ queryKey });
  return <>{render(data, isLoading)}</>;
}

// Usage
<DataFetcher
  queryKey={['posts']}
  render={(posts, loading) => (
    loading ? <Spinner /> : posts.map(p => <PostCard key={p.id} post={p} />)
  )}
/>
```

## 5. Controlled vs Uncontrolled Components

### Controlled (UI state in React)

```typescript
// ✅ Controlled - Use when real-time validation is needed
function SearchInput() {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  
  return (
    <input
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        if (e.target.value.length < 3) {
          setError('Min 3 characters');
        } else {
          setError('');
        }
      }}
    />
  );
}
```

### Uncontrolled (UI state in DOM)

```typescript
// ✅ Uncontrolled - Use with form libraries
function SearchForm() {
  const { register, handleSubmit } = useForm();
  
  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <input {...register('search')} />
      <button type="submit">Search</button>
    </form>
  );
}
```

## 6. Error Handling Pattern

### Component-Level Error Boundary

```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <div>Something went wrong</div>;
    }
    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <PostList />
</ErrorBoundary>
```

### Async Error Handling

```typescript
// ✅ Use Error Boundary for async errors
function PostPage({ postId }) {
  return (
    <ErrorBoundary fallback={<ErrorMessage />}>
      <Suspense fallback={<Spinner />}>
        <PostDetail postId={postId} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

## 7. Loading States

### Skeleton Loading

```typescript
// components/Skeleton.tsx
function Skeleton({ width, height }: { width?: string; height?: string }) {
  return <div className="skeleton" style={{ width, height }} />;
}

// Usage
function PostCardSkeleton() {
  return (
    <div className="card">
      <Skeleton width="60%" height="20px" />
      <Skeleton width="100%" height="16px" />
      <Skeleton width="40%" height="16px" />
    </div>
  );
}
```

### Suspense with Data Fetching

```typescript
// ✅ Server Components with Suspense
async function PostsPage() {
  return (
    <Suspense fallback={<PostListSkeleton />}>
      <PostList />
    </Suspense>
  );
}

// ✅ Client with useQuery
function PostList() {
  const { data: posts } = useQuery(getPostsQueryOptions());
  
  if (!posts) return <PostListSkeleton />;
  
  return posts.map(post => <PostCard key={post.id} post={post} />);
}
```

## 8. Compound Components Pattern

```typescript
// Tabs compound component
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function Tabs({ children, defaultTab }: { children: React.ReactNode; defaultTab: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

function TabsList({ children }: { children: React.ReactNode }) {
  return <div className="tabs-list">{children}</div>;
}

function Tab({ value, children }: { value: string; children: React.ReactNode }) {
  const { activeTab, setActiveTab } = useContext(TabsContext)!;
  
  return (
    <button
      className={`tab ${activeTab === value ? 'active' : ''}`}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
}

function TabPanel({ value, children }: { value: string; children: React.ReactNode }) {
  const { activeTab } = useContext(TabsContext)!;
  
  if (activeTab !== value) return null;
  return <div className="tab-panel">{children}</div>;
}

// Usage
<Tabs defaultTab="posts">
  <TabsList>
    <Tab value="posts">Posts</Tab>
    <Tab value="users">Users</Tab>
  </TabsList>
  <TabPanel value="posts">Posts content</TabPanel>
  <TabPanel value="users">Users content</TabPanel>
</Tabs>
```

## 9. Component Checklist

```
Task Progress:
- [ ] 1. Identify type: UI / Feature / Page?
- [ ] 2. UI: Props interface complete?
- [ ] 3. Feature: Using hooks for data?
- [ ] 4. Server/Client correct?
- [ ] 5. Error boundary?
- [ ] 6. Loading state?
- [ ] 7. Accessible (aria labels)?
- [ ] 8. Tests written?
```

## Anti-Patterns

```typescript
// ❌ God Component (does too many things)
function DashboardPage() {
  const users = useQuery(getUsersQueryOptions());
  const posts = useQuery(getPostsQueryOptions());
  const stats = useQuery(getStatsQueryOptions());
  const notifications = useQuery(getNotificationsQueryOptions());
  // 1000 lines of code...
}

// ✅ Smaller, focused components
function DashboardPage() {
  return (
    <Grid>
      <StatsPanel />
      <UsersPanel />
      <PostsPanel />
      <NotificationsPanel />
    </Grid>
  );
}
```

```typescript
// ❌ Props drilling too deep
<A data={data} onChange={onChange}>
  <B data={data} onChange={onChange}>
    <C data={data} onChange={onChange}>
      <D /> // Receives 4 levels of props
    </C>
  </B>
</A>

// ✅ Context or composition
<Context.Provider value={{ data, onChange }}>
  <A>
    <B>
      <C>
        <D /> // Use useContext
      </C>
    </B>
  </A>
</Context.Provider>
```

## Additional Resources

- [Architecture](frontend-arch)
- [Data Fetching](frontend-data-fetching)

## Quick Reference

| Task | Solution | Example |
|------|----------|---------|
| Atomic UI | Place in `components/ui/` | `Button.tsx` |
| Feature component | Place in `features/{name}/components/` | `PostCard.tsx` |
| Props interface | Use TypeScript interface | `interface ButtonProps` |
| Controlled input | useState + onChange | SearchInput |
| Uncontrolled input | useForm + register | Form |
| Loading state | Skeleton + Suspense | PostCardSkeleton |
| Error state | ErrorBoundary | `<ErrorBoundary>` |
| Compound component | Context + children | `Tabs`, `Dialog` |
