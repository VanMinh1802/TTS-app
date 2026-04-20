---
name: frontend-security
description: Critical security patterns for frontend development. Use when handling authentication, authorization, sensitive data, or any security-related concerns. This is a HIGH PRIORITY skill — security rules must NEVER be violated.
priority: high
tags: [security, authentication, authorization, xss, csrf, tokens, hard-rules]
---

# Frontend Security - Critical Patterns

## Purpose

This skill defines **critical security patterns** that MUST be followed in every task. Unlike other skills where violations are suggestions, **security violations are hard stops** — code must not be committed if any security pattern is broken.

## Why This Matters

Security bugs can cause:
- **Data breaches** — exposing user data to attackers
- **Account takeover** — stolen sessions, hijacked accounts
- **XSS attacks** — executing malicious scripts
- **CSRF attacks** — unauthorized actions on behalf of users

---

## 1. Authentication Patterns

### 1.1 Token Storage

```typescript
// ✅ SECURE: httpOnly cookie (recommended)
Set-Cookie: token=xxx; HttpOnly; Secure; SameSite=Strict

// ❌ INSECURE: localStorage is accessible via XSS
localStorage.setItem('token', 'xxx')
```

**Rule**: Always store authentication tokens in **httpOnly cookies**. Never use localStorage for tokens or sensitive data.

### 1.2 Token Transmission

```typescript
// ✅ SECURE: Credentials included, CSRF token sent
fetch('/api/data', {
  credentials: 'include',     // Send cookies
  headers: {
    'X-CSRF-Token': getCsrfToken(), // CSRF protection
  },
})

// ❌ INSECURE: Token in URL or Authorization header without CSRF
fetch('/api/data', {
  headers: {
    'Authorization': `Bearer ${token}`, // Vulnerable to CSRF
  },
})
```

### 1.3 Sensitive Data Handling

```typescript
// ✅ SECURE: Mask sensitive data in UI
const MaskedEmail = ({ email }: { email: string }) => {
  const [revealed, setRevealed] = useState(false)
  return revealed ? email : email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
}

// ❌ INSECURE: Log or expose sensitive data
console.log('User password:', password) // Never log passwords
localStorage.setItem('password', password) // Never store passwords
```

---

## 2. Authorization Patterns

### 2.1 Role-Based Access Control (RBAC)

Define roles in your auth types and enforce at multiple levels:

```typescript
// types/auth.ts
export type UserRole = 'admin' | 'editor' | 'user' | 'guest'

export interface AuthUser {
  id: string
  email: string
  roles: UserRole[]
}

// ✅ SECURE: Check role before rendering
const AdminPanel = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth()
  if (!user?.roles.includes('admin')) {
    return <AccessDenied />
  }
  return <>{children}</>
}

// ❌ INSECURE: Rely only on UI hiding (attacker can modify DOM)
<div style={{ display: user.role !== 'admin' ? 'none' : 'block' }}>
  <AdminContent />
</div>
```

### 2.2 Ownership Verification

```typescript
// ✅ SECURE: Verify ownership before allowing action
const deletePost = async (postId: string) => {
  const { user } = useAuth()
  const post = await query.getPost(postId)
  
  if (post.authorId !== user?.id && !user?.roles.includes('admin')) {
    throw new Error('Access denied: You do not own this resource')
  }
  
  await mutation.deletePost(postId)
}

// ❌ INSECURE: Only check UI state
const deletePost = async (postId: string) => {
  if (!isAdmin) return // Attacker can modify isAdmin state
  await mutation.deletePost(postId)
}
```

### 2.3 Reusable Authorization Helpers

```typescript
// lib/auth/access.ts
import type { AuthUser, UserRole } from '@/types/auth'

export const isAuthenticated = (user: AuthUser | null): user is AuthUser => {
  return Boolean(user)
}

export const isAdmin = (user: AuthUser | null): boolean => {
  return user?.roles.includes('admin') ?? false
}

export const hasRole = (user: AuthUser | null, role: UserRole): boolean => {
  return user?.roles.includes(role) ?? false
}

export const hasAnyRole = (user: AuthUser | null, roles: UserRole[]): boolean => {
  return roles.some(role => user?.roles.includes(role))
}

export const ownsResource = <T extends { authorId?: string }>(
  resource: T,
  userId: string
): boolean => {
  return resource.authorId === userId
}

export const canAccess = (
  user: AuthUser | null,
  resource: { authorId?: string },
  requiredRoles: UserRole[] = []
): boolean => {
  if (!user) return false
  if (hasAnyRole(user, requiredRoles)) return true
  if (ownsResource(resource, user.id)) return true
  return false
}
```

---

## 3. Input Validation & Sanitization

### 3.1 Client-Side Validation (Defense in Depth)

Client-side validation is for UX only. Server is the source of truth.

```typescript
// ✅ SECURE: Validate with Zod, then send to server
import { z } from 'zod'

const UserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100).regex(/^[a-zA-Z\s]+$/),
})

// ✅ SECURE: Server also validates (never trust client)
const serverSchema = UserSchema.extend({
  email: z.string().email().max(255),
})
```

### 3.2 Prevent XSS

```typescript
// ✅ SECURE: Use React's built-in escaping (default)
return <div>{userInput}</div>

// ❌ INSECURE: Dangerously set HTML (avoids escaping)
return <div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ SECURE: If you must use dangerouslySetInnerHTML, sanitize first
import DOMPurify from 'dompurify'
return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />

// ❌ INSECURE: Inline user input in scripts
return <script>const user = "{userInput}";</script>
```

### 3.3 URL Validation

```typescript
// ✅ SECURE: Validate redirect URLs
import { isSafeRedirectUrl } from '@/lib/security'

const safeUrl = isSafeRedirectUrl(redirectParam, allowedDomains)

// ❌ INSECURE: Open redirect vulnerability
router.push(redirectParam) // Attacker can redirect to phishing site
```

---

## 4. Error Handling (Don't Leak Information)

```typescript
// ✅ SECURE: Generic error message to user, detailed log to server
try {
  await login(email, password)
} catch (error) {
  logger.error('Login failed', { email, error: error.message })
  throw new Error('Invalid email or password') // Generic message
}

// ❌ INSECURE: Expose internal details
catch (error) {
  throw new Error(`Database error: ${error.message}\nStack: ${error.stack}`) // Leaks info
}
```

---

## 5. Secure Headers

Always configure security headers in `next.config.js`:

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  }
]

module.exports = {
  async headers() {
    return [{
      source: '/(.*)',
      headers: securityHeaders,
    }]
  },
}
```

---

## 6. Common Vulnerabilities Checklist

Before completing any task involving user input or authentication, verify:

- [ ] Tokens stored in httpOnly cookies, not localStorage
- [ ] CSRF protection implemented for state-changing operations
- [ ] User input is validated with Zod (both client and server)
- [ ] User input is sanitized before rendering (XSS prevention)
- [ ] Authorization checks happen on server, not just client
- [ ] Error messages are generic (no internal details exposed)
- [ ] Sensitive data is never logged
- [ ] Redirect URLs are validated against allowlist
- [ ] Security headers configured in `next.config.js`

---

## Quick Reference

| Security Concern | Correct Pattern | Avoid |
|-----------------|-----------------|-------|
| Token storage | httpOnly cookie | localStorage |
| Token transmission | credentials: 'include' | Authorization header without CSRF |
| Role check | Server + Client | Client only |
| User input | Zod validation | Raw values |
| HTML rendering | React escaping | dangerouslySetInnerHTML |
| Error messages | Generic to user | Stack traces to user |
| Redirect URLs | Allowlist validation | Direct redirect |
| Passwords | Never log/store client-side | console.log, localStorage |

---

## Related Resources

- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/security)
