# SDD - Login Feature Specification

## Overview

This document provides a complete example of a Software Design Description (SDD)
for the Login feature. Use this as a reference template when creating new SPEC
documents.

---

## Document Metadata

```yaml
spec_id: SDD-2026-001
title: "User Login"
author: "Team"
date: "2026-04-09"
status: Approved
priority: Critical
type: Feature
related_issues: []
related_specs: []
```

---

## 1. Introduction

### 1.1 Purpose

The Login feature allows existing users to authenticate into the application
using their email and password. It provides a secure gateway to protected
resources and establishes a user session that persists across pages.

### 1.2 Scope

**In Scope:**

- Email/password authentication
- Session management (JWT-based)
- Remember me functionality
- Logout functionality
- Password visibility toggle
- Rate limiting on failed attempts

**Out of Scope:**

- Social login (OAuth)
- Two-factor authentication (2FA)
- Password reset (covered in separate SPEC)
- Account registration (covered in separate SPEC)
- Single sign-on (SSO)

### 1.3 Definitions & Abbreviations

| Term        | Definition                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------- |
| JWT         | JSON Web Token — a compact, URL-safe token for securely transmitting claims                        |
| Session     | A period of interaction between a user and the system                                              |
| Rate Limit  | Restriction on the number of requests allowed within a time window                                 |
| CSRF        | Cross-Site Request Forgery — an attack that forces authenticated users to execute unwanted actions |
| Remember Me | A checkbox that extends session duration beyond the standard timeout                               |

### 1.4 References

- [RFC 7519: JWT Standard](https://tools.ietf.org/html/rfc7519)
- Auth API contract: `POST /api/auth/login`
- Project frontend-principles skill:
  `.cursor/skills/frontend-principles/SKILL.md`
- Project frontend-data-fetching skill:
  `.cursor/skills/frontend-data-fetching/SKILL.md`

---

## 2. Proposed Folder Structure

### 2.1 New Files & Directories

```
src/
├── app/
│   └── (auth)/
│       └── login/
│           └── page.tsx         # Login page (Server Component)
├── features/
│   └── auth/
│       ├── api/                 # API definitions
│       │   ├── login.ts         # Login API
│       │   ├── logout.ts        # Logout API
│       │   └── types.ts         # Auth API types
│       ├── components/           # Feature-specific components
│       │   ├── LoginForm.tsx    # Login form (Client Component)
│       │   ├── UserMenu.tsx     # User dropdown menu
│       │   └── index.ts         # Public exports
│       ├── hooks/               # Feature hooks
│       │   ├── useAuth.ts       # Auth state hook
│       │   ├── useLogin.ts      # Login mutation hook
│       │   └── useLogout.ts      # Logout mutation hook
│       ├── types/               # Feature types
│       │   └── auth-types.ts
│       ├── lib/                 # Auth utilities
│       │   ├── auth-client.ts   # Auth API client (pure function)
│       │   └── auth-constants.ts
│       └── index.ts             # Public exports
└── lib/
    └── providers/
        └── AuthProvider.tsx      # Auth context provider
```

### 2.2 Modified Files

| File | Modification Type | Description |
|------|------------------|-------------|
| `src/app/layout.tsx` | Modify | Wrap with AuthProvider |
| `src/lib/api-client.ts` | Modify | Add Authorization header interceptor |
| `src/app/(auth)/layout.tsx` | Modify | Add auth redirect logic |
| | | |

### 2.3 Deleted Files

| File | Reason |
|------|--------|
| (none) | No files deleted in this iteration |

### 2.4 Folder Structure Checklist

Before approving this section, verify:

- [x] Folder structure follows **feature-based architecture** (see `frontend-arch` skill)
- [x] No shared components will contain business logic
- [x] Tests are colocated with their components
- [x] API definitions are in `features/auth/api/`
- [x] React Query follows 3-layer pattern: pure function → query options → hook
- [x] Types are defined in `features/auth/types/`
- [x] No cross-feature imports (features should be self-contained)
- [x] Login form is a Client Component (has interactivity)
- [x] Login page is a Server Component (SEO, metadata)

### 2.5 Architecture Decisions

| Decision | Options Considered | Chosen Approach | Rationale |
|----------|-------------------|-----------------|-----------|
| Auth state location | React Context / Zustand / React Query | React Query | Auth state is server state (user data), React Query handles caching/invalidation naturally |
| Token storage | localStorage / httpOnly cookie | httpOnly cookie | Prevents XSS attacks, token not accessible via JavaScript |
| Login form location | Shared component / Feature component | `features/auth/components/` | Login is a feature-specific concern, not a generic UI component |

### 2.6 Folder Structure Review

> **Important:** This section MUST be reviewed and approved BEFORE any code is written.

| Reviewer | Status | Comments |
|----------|--------|----------|
| | Approved | Structure follows feature-based architecture |
| | | |

**Approval Gate:** All items in the Folder Structure Checklist (Section 2.4) must be checked before proceeding to implementation.

---

## 4. User Interactions & Flows

### 2.1 User Stories

| ID    | As a...                   | I want to...                    | So that...                                | Priority    |
| ----- | ------------------------- | ------------------------------- | ----------------------------------------- | ----------- |
| US-01 | Unregistered user         | login with email and password   | I can access my account and personal data | Must Have   |
| US-02 | Returning user            | have my session remembered      | I do not need to login every time I visit | Should Have |
| US-03 | User who mistypes         | see clear error messages        | I can correct my mistake and try again    | Must Have   |
| US-04 | User on shared device     | logout completely               | the next user cannot access my account    | Must Have   |
| US-05 | User who forgets password | navigate to reset password page | I can regain access to my account         | Should Have |

### 2.2 User Flows

```
Flow: Successful Login
Actor: Registered User

Step 1: User navigates to the login page
Step 2: System displays login form with email and password fields
Step 3: User enters valid email address
Step 4: User enters valid password
Step 5: User optionally checks "Remember me" checkbox
Step 6: User clicks "Login" button
Step 7: System validates credentials with backend
Step 8: System stores JWT token in httpOnly cookie
Step 9: System redirects user to dashboard
Step 10: System displays personalized greeting
End: User is authenticated and can access protected resources
```

```
Flow: Failed Login (Invalid Credentials)
Actor: Registered User with wrong password

Step 1: User navigates to the login page
Step 2: User enters email and incorrect password
Step 3: User clicks "Login" button
Step 4: System validates credentials with backend
Step 5: Backend returns 401 Unauthorized
Step 6: System displays inline error: "Invalid email or password"
Step 7: Password field is cleared
Step 8: Email field retains value
Step 9: Login attempts counter increments
End: User remains on login page and can retry
```

```
Flow: Logout
Actor: Authenticated User

Step 1: User clicks user avatar/menu in header
Step 2: System displays dropdown menu with "Logout" option
Step 3: User clicks "Logout"
Step 4: System clears JWT token from cookie
Step 5: System clears any cached user data
Step 6: System redirects user to login page
Step 7: System displays success toast: "You have been logged out"
End: User session is terminated, user is on login page
```

### 2.3 Error Flows

```
Flow: Account Locked After Multiple Failed Attempts
Trigger: User fails 5 consecutive login attempts

Step 1: User fails 5th login attempt
Step 2: Backend returns 423 Locked
Step 3: System displays error: "Account temporarily locked due to too many failed attempts. Please try again in 15 minutes."
Step 4: Login form is disabled for 15 minutes
Step 5: Countdown timer is displayed
End: User cannot attempt login until lockout expires
```

```
Flow: Network Error During Login
Trigger: Network connectivity issue

Step 1: User submits login form
Step 2: System detects network failure
Step 3: System displays error: "Unable to connect. Please check your internet connection and try again."
Step 4: Retry button is displayed
End: User can retry when connection is restored
```

---

## 5. Functional Requirements

### 3.1 Core Features

#### Feature F-01: Login Form

**Description:** A form component that captures user credentials (email and
password) and submits them for authentication.

**Business Rules:**

- Email field must contain a valid email format
- Password field must be at least 8 characters
- Password field has a visibility toggle (show/hide)
- "Remember me" checkbox extends session duration to 30 days (vs 24 hours
  default)
- Login button is disabled until both email and password are filled
- Form submission is prevented if validation fails

**Inputs:**

| Field      | Type    | Required | Validation                    |
| ---------- | ------- | -------- | ----------------------------- |
| email      | string  | Yes      | Valid email format (RFC 5322) |
| password   | string  | Yes      | Min 8 characters              |
| rememberMe | boolean | No       | Defaults to false             |

**Outputs:**

| Field        | Type        | Description                     |
| ------------ | ----------- | ------------------------------- |
| success      | boolean     | Whether login succeeded         |
| redirectUrl  | string      | Where to navigate on success    |
| errorMessage | string      | Human-readable error on failure |
| user         | User object | Current user data on success    |

**Side Effects:**

- Stores JWT token in httpOnly cookie
- Updates global auth state
- Invalidates any stale user queries
- Triggers analytics event `user_login`

---

#### Feature F-02: Session Management

**Description:** Manages user authentication state across the application using
JWT tokens.

**Business Rules:**

- JWT token is stored in httpOnly cookie (not localStorage) for security
- Access token expires in 24 hours (or 30 days if "Remember me" is checked)
- Token is automatically refreshed 5 minutes before expiry
- Logout clears the token and all cached user data
- Protected routes redirect to login if no valid token exists

**Inputs:**

| Field | Type   | Required | Description             |
| ----- | ------ | -------- | ----------------------- |
| token | string | Yes      | JWT from login response |

**Outputs:**

| Field           | Type        | Description         |
| --------------- | ----------- | ------------------- |
| isAuthenticated | boolean     | Current auth status |
| user            | User object | Logged-in user data |

**Side Effects:**

- All API requests include Authorization header with Bearer token
- React Query cache is cleared on logout
- Page navigation to login on 401 response

---

#### Feature F-03: Remember Me

**Description:** Extends the session duration for users who choose this option.

**Business Rules:**

- When checked: session cookie maxAge = 30 days
- When unchecked: session cookie maxAge = 24 hours
- Cookie is set with secure and sameSite flags
- Preference is NOT remembered across devices

---

#### Feature F-04: Password Visibility Toggle

**Description:** Allows users to show or hide their password while typing.

**Business Rules:**

- Default state: password is hidden (masked with dots)
- Toggle icon indicates current state (eye / eye-off)
- State persists only within the current form session
- Accessible via keyboard (Enter key on icon toggles)

---

## 6. Data Model

### 4.1 Domain Entities

```
User
├── id: string (UUID) — unique identifier
├── email: string — user's email address
├── name: string — user's display name
├── role: UserRole — user's role (admin | user | guest)
├── avatarUrl: string | null — URL to profile image
├── createdAt: Date — account creation timestamp
└── relationships
    ├── belongs to: Organization (optional)
    └── has many: Session

Session
├── id: string (UUID) — unique session identifier
├── userId: string — reference to User
├── token: string — JWT access token
├── expiresAt: Date — token expiration timestamp
├── userAgent: string — browser/client info
├── ipAddress: string — client IP address
└── relationships
    └── belongs to: User
```

### 4.2 State Machine (if applicable)

```
AuthState
├── unauthenticated — (initial)
│   └── trigger: user submits valid credentials → authenticated
├── authenticated
│   └── trigger: token expires or logout() called → unauthenticated
├── loading
│   └── trigger: login request sent → authenticated | error
└── error
    └── trigger: user retries login → loading | authenticated
```

---

## 7. Edge Cases & Error Handling

### 5.1 Edge Cases

| ID    | Scenario                                           | Expected Behavior                        | Severity |
| ----- | -------------------------------------------------- | ---------------------------------------- | -------- |
| EC-01 | User pastes email with leading/trailing whitespace | Trim whitespace before submission        | Medium   |
| EC-02 | User enters email in uppercase                     | Normalize to lowercase before submission | Medium   |
| EC-03 | Session expires during active use                  | Auto-refresh token, seamless experience  | High     |
| EC-04 | User opens login page while already authenticated  | Redirect to dashboard                    | Low      |
| EC-05 | Multiple browser tabs with same user               | Sync auth state across tabs              | Medium   |
| EC-06 | User clicks submit twice rapidly                   | Prevent double submission (debounce)     | High     |
| EC-07 | Login form submitted via Enter key                 | Should trigger submission                | Medium   |

### 5.2 Error Handling Matrix

| Error Condition      | User Message                                         | System Action                | Logging |
| -------------------- | ---------------------------------------------------- | ---------------------------- | ------- |
| Invalid email format | "Please enter a valid email address"                 | Inline validation error      | warn    |
| Invalid credentials  | "Invalid email or password"                          | Increment attempt counter    | warn    |
| Account locked       | "Account temporarily locked. Try again in X minutes" | Disable form, show countdown | error   |
| Network error        | "Unable to connect. Check your internet."            | Show retry button            | error   |
| Server error (5xx)   | "Something went wrong. Please try again."            | Allow retry after delay      | error   |
| CSRF token mismatch  | (handled silently)                                   | Redirect to login            | error   |

---

## 8. Non-Functional Requirements

| ID     | Requirement   | Acceptance Criteria                                          |
| ------ | ------------- | ------------------------------------------------------------ |
| NFR-01 | Performance   | Login page loads in < 500ms on 3G connection                 |
| NFR-02 | Performance   | Login request completes in < 2s under normal conditions      |
| NFR-03 | Security      | JWT stored in httpOnly cookie, not accessible via JavaScript |
| NFR-04 | Security      | Password never logged or stored in plain text                |
| NFR-05 | Security      | Rate limiting blocks after 5 failed attempts per IP          |
| NFR-06 | Accessibility | All form fields have proper labels and ARIA attributes       |
| NFR-07 | Accessibility | Password visibility toggle is keyboard accessible            |
| NFR-08 | Compatibility | Works on Chrome 90+, Firefox 88+, Safari 14+, Edge 90+       |

---

## 9. Test Scenarios (Browser Testing)

### 7.1 Pre-Conditions

- Application is running on `http://localhost:3000`
- No user is currently logged in
- Test user credentials: email `test@example.com`, password `TestPassword123!`
- Database is seeded with test user

### 7.2 Test Cases

**Test Suite: Login Feature**

| ID    | Test Case                                 | Precondition            | Steps | Expected Result                | Status |
| ----- | ----------------------------------------- | ----------------------- | ----- | ------------------------------ | ------ |
| TC-01 | Successful login with valid credentials   | No user logged in       | 6     | User redirected to dashboard   | Pass   |
| TC-02 | Login failure with wrong password         | No user logged in       | 4     | Error message displayed        | Pass   |
| TC-03 | Login failure with non-existent email     | No user logged in       | 4     | Error message displayed        | Pass   |
| TC-04 | Remember me extends session               | No user logged in       | 5     | Cookie max-age = 30 days       | Pass   |
| TC-05 | Password visibility toggle works          | Login page open         | 3     | Password shown/hidden          | Pass   |
| TC-06 | Logout clears session                     | User logged in          | 3     | Redirected to login            | Pass   |
| TC-07 | Rate limit after 5 failures               | No user logged in       | 11    | Form disabled, countdown shown | Pass   |
| TC-08 | Network error shows retry                 | Network error simulated | 3     | Retry button displayed         | Pass   |
| TC-09 | Logged-in user redirected from login page | User logged in          | 1     | Redirect to dashboard          | Pass   |

#### Happy Path Tests

```
TC-01: Successful Login
Precondition: No user logged in, test user exists in database
Steps:
  1. Navigate to /login
  2. Enter "test@example.com" in email field
  3. Enter "TestPassword123!" in password field
  4. Click "Login" button
  5. Wait for redirect
  6. Verify dashboard URL is shown
Expected: User sees dashboard with personalized greeting
```

```
TC-04: Remember Me Checkbox
Precondition: No user logged in
Steps:
  1. Navigate to /login
  2. Enter valid credentials
  3. Check "Remember me" checkbox
  4. Click "Login"
  5. Open browser developer tools → Application → Cookies
  6. Check session cookie max-age value
Expected: Cookie max-age = 2592000 (30 days in seconds)
```

#### Negative Tests

```
TC-02: Login with Wrong Password
Precondition: No user logged in
Steps:
  1. Navigate to /login
  2. Enter "test@example.com" in email field
  3. Enter "WrongPassword123!" in password field
  4. Click "Login"
Expected: Error message "Invalid email or password" is displayed, email field retains value, password field is cleared
```

```
TC-07: Rate Limit After Failed Attempts
Precondition: No user logged in, test user exists
Steps:
  1. Navigate to /login
  2. Enter "test@example.com"
  3. Enter "wrongpassword1" (attempt 1)
  4. Wait for error
  5. Repeat steps 2-4 with "wrongpassword2" through "wrongpassword5"
  6. Enter "TestPassword123!" (attempt 6)
  7. Observe form state
Expected: Form is disabled, message "Account temporarily locked for X minutes" is shown, countdown timer visible
```

#### Edge Case Tests

```
TC-06: Double Click Prevention
Precondition: No user logged in
Steps:
  1. Navigate to /login
  2. Enter valid credentials
  3. Rapidly click "Login" button 3 times within 200ms
  4. Wait for response
Expected: Login request is sent only once, only one session is created
```

```
TC-09: Authenticated User Visiting Login Page
Precondition: User is logged in with valid session
Steps:
  1. Navigate to /login directly (bypassing any redirect)
Expected: User is immediately redirected to /dashboard, login page is not shown
```

### 7.3 Browser Testing Agent Instructions

When executing browser tests, the agent MUST:

1. **Setup**: Launch browser (Browser tool recommended), navigate to
   `http://localhost:3000`, clear any existing session cookies
2. **Precondition Check**: Verify the application state matches the test
   preconditions before proceeding
3. **Execute**: Perform each step in sequence exactly as specified in the test
   case
4. **Assert**: Verify the expected result matches the actual browser state
5. **Document**: Record pass/fail with screenshot evidence for failures
6. **Cleanup**: Clear session, close dialogs, restore to clean state for next
   test
7. **Report**: Summarize results in a test report with pass/fail counts

---

## 10. Dependencies

### 8.1 External Dependencies

| Dependency       | Version | Purpose               | Owner        |
| ---------------- | ------- | --------------------- | ------------ |
| Next.js          | 16+     | Framework             | Framework    |
| React Query      | v5      | Auth state management | Team         |
| Zod              | latest  | Runtime validation    | Team         |
| React Hook Form  | latest  | Form handling         | Team         |
| Backend Auth API | v1      | Credential validation | Backend Team |

### 8.2 Internal Dependencies

| Component      | Relationship        | Notes                          |
| -------------- | ------------------- | ------------------------------ |
| AuthProvider   | Wraps application   | Provides auth context          |
| ProtectedRoute | Uses auth state     | Redirects if not authenticated |
| useAuth hook   | Consumes auth state | Access auth methods            |
| apiClient      | Includes token      | Attaches Authorization header  |

---

## 11. Acceptance Criteria

### 9.1 Success Conditions

- [ ] User can login with valid email and password
- [ ] User receives clear error message for invalid credentials
- [ ] JWT token is stored securely in httpOnly cookie
- [ ] "Remember me" extends session to 30 days
- [ ] Password visibility can be toggled
- [ ] User can logout and session is cleared
- [ ] Rate limiting activates after 5 failed attempts
- [ ] Authenticated users are redirected from login page
- [ ] All 9 browser test cases pass
- [ ] No hard rules violations in implementation

### 9.2 Definition of Done Checklist

- [x] SPEC reviewed and approved by at least one reviewer
- [x] All test cases defined and executable
- [x] No code written before SPEC approval (this SPEC was created first)
- [ ] Implementation matches SPEC exactly
- [ ] All browser test cases pass
- [ ] No hard rules violations (see AGENTS.md)
- [ ] TypeScript build passes
- [ ] ESLint passes

---

## 12. Review & Approval

### 12.1 Folder Structure Review

> **Important:** This section MUST be reviewed and approved BEFORE any code is written.

| Reviewer | Status | Comments |
|----------|--------|----------|
| | Approved | Structure follows feature-based architecture |

### 12.2 Full Document Review

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Author | Team | 2026-04-09 | |
| Reviewer 1 | | | |
| Reviewer 2 | | | |
| Approver | | | |

### 12.3 Review Notes

This SPEC covers the core login functionality. Future enhancements (social login, 2FA) will be documented in separate SPECs.

---

## 13. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-04-09 | Team | Initial draft |
| 0.9 | 2026-04-09 | Team | Final review, approved for implementation |

| Role       | Name | Date       | Signature |
| ---------- | ---- | ---------- | --------- |
| Author     |      | 2026-04-09 |           |
| Reviewer 1 |      |            |           |
| Reviewer 2 |      |            |           |
| Approver   |      |            |           |

### Review Notes

This SPEC covers the core login functionality. Future enhancements (social
login, 2FA) will be documented in separate SPECs.

---

## Revision History

| Version | Date       | Author | Changes                                   |
| ------- | ---------- | ------ | ----------------------------------------- |
| 0.1     | 2026-04-09 | Team   | Initial draft                             |
| 0.9     | 2026-04-09 | Team   | Final review, approved for implementation |
