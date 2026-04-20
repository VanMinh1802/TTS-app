---
name: frontend-quality
description: Quality gates, hard rules, and review checklist for Frontend. Use when reviewing code, fixing bugs, or ensuring code quality before commit/deploy.
tags: [frontend, quality, review, testing, linting, typescript]
---

# Quality Gates & Hard Rules

## 1. Hard Rules (Never Violate)

### ❌ Absolute Prohibitions

```typescript
// 1. NEVER use any
// ❌ Wrong
const data: any = fetchData();
function handler(event: any) {}

// ✅ Correct
const data: unknown = fetchData();
if (typeof data === 'string') { /* ... */ }

// Or use Zod
const data = z.object({...}).parse(rawData);

// 2. NEVER use @ts-ignore or @ts-nocheck
// ❌ Wrong
// @ts-ignore
const x = someFunction();

// ✅ Correct - Fix type properly

// 3. NEVER have empty catch blocks
// ❌ Wrong
try {
  await fetchData();
} catch (e) {}

// ✅ Correct
try {
  await fetchData();
} catch (error) {
  console.error('Fetch failed:', error);
  // Or throw error to handle at upper level
}

// 4. NEVER use setState when server state already exists
// ❌ Wrong
async function Component() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetchData().then(setData); // Wrong - use React Query
  }, []);
}

// ✅ Correct - Use React Query
function Component() {
  const { data } = useQuery(getDataQueryOptions());
}

// 5. NEVER use useEffect for data fetching
// ❌ Wrong
useEffect(() => {
  fetchData().then(setData);
}, []);

// ✅ Correct - Use React Query
const { data } = useQuery(getDataQueryOptions());
```

### ⚠️ Serious Warnings

```typescript
// 1. NEVER call Server Action in Server Component
// ❌ Wrong
async function Page() {
  const data = await createPost(); // This is a mutation, not fetch!
  return <div>{data}</div>;
}

// ✅ Correct - Server Action only called from Client Component
'use client';
async function handleSubmit() {
  await createPost();
}

// 2. NEVER mix Server/Client Components incorrectly
// ❌ Wrong - Client Component imports Server Component
'use client';
import ServerComponent from './ServerComponent'; // Wrong!

// ✅ Correct - Server Component imports Client Component
import ClientComponent from './ClientComponent';

// 3. NEVER use window/document in Server Components
// ❌ Wrong
async function Page() {
  if (typeof window !== 'undefined') { // Wrong!
    // ...
  }
}

// ✅ Correct - Or mark as Client Component
'use client';
function Component() {
  useEffect(() => {
    // window/document code here
  }, []);
}
```

## 2. TypeScript Quality Gates

### ✅ Required

```typescript
// 1. Strict mode enabled
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}

// 2. Explicit return types for functions
function add(a: number, b: number): number {
  return a + b;
}

// 3. Explicit types for props
interface Props {
  id: string;
  name: string;
  onClick?: () => void;
  children: React.ReactNode;
}

// 4. Use Zod for runtime validation
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
});

type User = z.infer<typeof UserSchema>; // Type from schema

// Validate runtime data
const user = UserSchema.parse(apiResponse);
```

### ❌ Avoid

```typescript
// ❌ type assertions (as) when unnecessary
const data = response as Data; // Try using Zod parse instead

// ❌ Optional chaining abuse
const x = data?.a?.b?.c?.d; // Too deep - split it out

// ❌ Non-null assertions (!) when uncertain
const x = data!.name; // Use conditional or check first
```

## 3. React Quality Gates

### ✅ Required

```typescript
// 1. Key props when rendering lists
function List({ items }) {
  return items.map(item => (
    <Item key={item.id} {...item} /> // ✅ Use stable ID, not index
  ));
}

// 2. Complete dependencies in useEffect
useEffect(() => {
  fetchData(id);
}, [id]); // ✅ Complete dependencies

// 3. Memoization when needed
const memoizedValue = useMemo(() => computeExpensive(a, b), [a, b]);
const memoizedCallback = useCallback(() => doSomething(a), [a]);

// 4. Cleanup in useEffect
useEffect(() => {
  const subscription = subscribe(handler);
  return () => subscription.unsubscribe(); // ✅ Cleanup
}, []);
```

### ❌ Avoid

```typescript
// ❌ useEffect with wrong dependencies
useEffect(() => {
  setCount(count + 1);
}, []); // count changes but not in deps!

// ✅ Correct
useEffect(() => {
  setCount(c => c + 1); // Use functional update
}, []);

// ❌ Inline functions in JSX (if component re-renders a lot)
return items.map(item => (
  <Item key={item.id} onClick={() => handleClick(item.id)} /> // Creates new function each render
));

// ✅ Correct - Use useCallback or memo
const handleClick = useCallback((id: string) => {
  // ...
}, []);

// ❌ Mutate state directly
setState([...state, newItem]); // ✅ Spread
setState(prev => [...prev, newItem]); // ✅ Functional update

// ❌ setInterval in useEffect without cleanup
useEffect(() => {
  const interval = setInterval(() => {}, 1000);
  // Missing return () => clearInterval(interval);
}, []);
```

## 4. Performance Gates

### ✅ Check Before Deploy

```typescript
// 1. Bundle size
// ❌ Import entire library when using only 1 function
import _ from 'lodash'; // Import entire library
const x = _.cloneDeep(obj);

// ✅ Correct - Import specifically
import cloneDeep from 'lodash/cloneDeep';
// Or use native
const x = JSON.parse(JSON.stringify(obj));

// 2. Code splitting
// ✅ Dynamic import for heavy components
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false
});

// 3. Image optimization
// ❌ Raw img tag
<img src="/large-image.jpg" />

// ✅ Next.js Image
import Image from 'next/image';
<Image src="/large-image.jpg" width={800} height={600} alt="..." />

// 4. Font optimization
// ❌ Google Fonts inline
<link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" />

// ✅ Next.js Font
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
<body className={inter.className}>
```

### Bundle Analysis

```bash
# Run bundle analyzer
npm run build --analyze
# or
npx @next/bundle-analyzer
```

## 5. Security Gates

### ✅ Required

```typescript
// 1. XSS Prevention
// ❌ Dangerous - Interpolate user input directly
<div>{userInput}</div> // May contain XSS!

// ✅ Correct - Sanitize or use library
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />

// 2. CSRF Protection
// ✅ Server Actions have built-in CSRF protection
// If using API routes:
fetch('/api/action', {
  method: 'POST',
  credentials: 'include' // Send cookies
});

// 3. Input Validation
// ✅ Always validate on both client and server
// Client: React Hook Form + Zod
// Server: Zod schema.parse() again

// 4. Sensitive Data
// ❌ NEVER log sensitive data
console.log('User password:', password); // Forbidden!

// ✅ Correct - Only log non-sensitive info
console.log('Login attempt for:', email);

// 5. Environment Variables
// ❌ NEVER expose sensitive env vars publicly
NEXT_PUBLIC_API_URL=http://localhost:3000  // ✅ Only non-sensitive
API_SECRET=xxx  // ✅ Server-side only
```

## 6. Testing Gates

### ✅ Coverage Requirements

```typescript
// 1. Unit tests for complex logic
describe('calculateDiscount', () => {
  it('applies percentage discount correctly', () => {
    expect(calculateDiscount(100, { type: 'percent', value: 20 })).toBe(80);
  });

  it('applies fixed discount correctly', () => {
    expect(calculateDiscount(100, { type: 'fixed', value: 15 })).toBe(85);
  });

  it('does not allow negative price', () => {
    expect(() => calculateDiscount(-10, discount)).toThrow();
  });
});

// 2. Integration tests for mutations
describe('useCreatePost', () => {
  it('creates post and invalidates queries', async () => {
    const { result } = renderHook(() => useCreatePost());
    
    await act(async () => {
      await result.current.mutateAsync({ title: 'Test', content: 'Content' });
    });
    
    expect(queryClient.getQueryState(['posts'])?.isInvalidated).toBe(true);
  });
});

// 3. Component tests
describe('PostCard', () => {
  it('renders post data correctly', () => {
    render(<PostCard post={mockPost} onLike={jest.fn()} />);
    
    expect(screen.getByText(mockPost.title)).toBeInTheDocument();
    expect(screen.getByText(mockPost.author)).toBeInTheDocument();
  });

  it('calls onLike when button clicked', () => {
    const onLike = jest.fn();
    render(<PostCard post={mockPost} onLike={onLike} />);
    
    fireEvent.click(screen.getByText(/❤️/));
    
    expect(onLike).toHaveBeenCalledWith(mockPost.id);
  });
});
```

### Minimum Coverage

| Type | Minimum | Priority |
|------|---------|----------|
| Utils/Hooks | 80% | High |
| Components | 60% | Medium |
| API functions | 70% | High |
| Forms/Validation | 90% | Critical |

## 7. Code Review Checklist

### Before Merging

```
Quality Checklist:
- [ ] TypeScript build passed
- [ ] ESLint/Prettier passed
- [ ] Tests passed
- [ ] No hard rules violations
- [ ] Bundle size didn't increase > 10%
- [ ] Sensitive data not exposed
- [ ] Error boundaries on necessary components
- [ ] Loading states on async components
- [ ] Accessibility (aria labels, keyboard navigation)
```

### Review Focus Areas

| Area | Check |
|------|-------|
| Logic | Correct business logic? Edge cases handled? |
| Types | Safe? No `any`? Zod validation? |
| Performance | Bundle size? Re-renders? Memoization? |
| Security | XSS? CSRF? Input validation? |
| UX | Loading states? Error handling? Accessibility? |
| Testing | Coverage adequate? Tests meaningful? |

## 8. Git Commit Convention

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| feat | New feature |
| fix | Bug fix |
| docs | Documentation |
| style | Formatting, no code change |
| refactor | Code change, no feature/fix |
| test | Adding tests |
| chore | Maintenance tasks |

### Examples

```
feat(auth): add login with Google OAuth

fix(posts): correct like count race condition

docs(readme): update installation instructions

refactor(components): extract Button variants to separate file

test(use-posts): add tests for optimistic update
```

## Additional Resources

- [Architecture](frontend-arch)
- [Data Fetching](frontend-data-fetching)
- [Components](frontend-components)

## Quick Reference

| Task | Solution | Priority |
|------|----------|----------|
| Check TypeScript | `npm run build` | Critical |
| Check ESLint | `npm run lint` | Critical |
| No `any` type | Use `unknown` + Zod | Critical |
| No empty catch | Log error or rethrow | Critical |
| No setState on server | Use React Query | Critical |
| Write tests | Vitest + Testing Library | High |
| Check coverage | `npm run test:coverage` | High |
| Security check | See `frontend-security` skill | Critical |
| Code review | Follow checklist in Section 7 | High |
