# SPEC013 - License Key Activation System

## 1. Description
A system to generate, manage, and redeem license keys to grant users PRO access (e.g. 1 month, 1 year). The system includes an admin endpoint to generate keys quickly, and a frontend flow allowing users to activate keys via a "Magic Link" (`/activate?code=XYZ`).

## 2. Architecture & Data Flow

### 2.1 Database Models

**`LicenseKey` Model (New)**
- `id`: UUID (Primary Key)
- `code`: String (e.g., "PRO-1M-ABCD1234", unique, indexed)
- `duration_days`: Integer (e.g., 30 for 1 month, 365 for 1 year)
- `tier`: String (default "pro", can be "enterprise")
- `is_used`: Boolean (default False)
- `used_by_id`: String (Nullable, Foreign Key to `users.id`)
- `used_at`: DateTime (Nullable)
- `created_at`: DateTime (default utcnow)
- `created_by_id`: String (Foreign Key to `users.id`, must be an admin)

**`User` Model (Updates)**
- `subscription_expires_at`: DateTime (Nullable).
  - *Logic change:* A user is considered "PRO" only if `subscription_tier == "pro"` AND `(subscription_expires_at is NULL or subscription_expires_at > now())`. If expired, they should fall back to "free" limits.

### 2.2 Backend APIs
- **POST `/api/admin/licenses/generate`** (Admin only)
  - *Body:* `duration_days` (int), `tier` (str, default "pro"), `count` (int, default 1)
  - *Returns:* List of newly created `code` strings.
- **GET `/api/admin/licenses`** (Admin only)
  - *Returns:* List of all generated licenses (used and unused).
- **POST `/api/subscriptions/activate`** (Authenticated user)
  - *Body:* `code` (string)
  - *Logic:*
    1. Look up `code` in `LicenseKey`. Return 400 if not found or `is_used == True`.
    2. Check if user is currently PRO and not expired. If yes, add `duration_days` to existing `subscription_expires_at`. If no/expired, set `subscription_expires_at = now() + duration_days`.
    3. Update user's `subscription_tier` to the key's `tier`.
    4. Mark key `is_used = True`, `used_by_id = user.id`, `used_at = now()`.
    5. Update `QuotaService` if necessary (e.g. bump quotas to PRO level).
    6. Return success.

### 2.3 Frontend Components
- **/activate Page:**
  - Reads `?code=` from the URL query params.
  - If user is NOT logged in: Saves the code to `sessionStorage` and redirects to `/login`. Upon successful login, the `Navbar` or `LoginPage` redirects them back to `/activate`.
  - If user IS logged in: Shows a "Đang kích hoạt..." loader, calls `POST /api/subscriptions/activate`.
  - On success: Shows a full-screen success message/animation and a button "Vào Dashboard".
- **/admin/licenses Page (Admin Dashboard):**
  - Protected route for Admins only.
  - A simple UI to generate X keys of Y duration.
  - A table showing all keys, their status (Used/Unused), and who used them.
- **/pricing Page:**
  - Update the "Upgrade" CTA buttons to open a modal with manual bank transfer instructions (VietQR) and Admin contact info (Zalo/Fanpage).

## 3. Error Handling
- **Invalid code:** "Mã kích hoạt không hợp lệ hoặc không tồn tại." (404)
- **Used code:** "Mã kích hoạt này đã được sử dụng." (400)
- **Unauthorized generation:** "Admin only access." (403)

## 4. Testing Plan
- Create test admin user and generate a code.
- Attempt to activate code as a normal user. Verify `subscription_expires_at` is updated correctly.
- Attempt to use the same code again (should fail).
- Verify unauthenticated user clicking Magic Link is redirected to login, then redirected back to activate.
