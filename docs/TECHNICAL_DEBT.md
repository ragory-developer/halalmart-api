# HalalMart API — Technical Debt Register

> **Last Updated:** 2026-06-11 | **AI-Maintained**  
> **Format:** Each item tracks the problem, its business impact, and the remediation path.

---

## Debt Summary

| ID | Title | Category | Business Impact | Effort | Status |
|----|-------|----------|----------------|--------|--------|
| TD-001 | Dynamic `require('bcryptjs')` in controllers | Code Smell | Low — works, but unmaintainable | XS | Resolved (2026-06-11) |
| TD-002 | Debug `console.log` in production code | Code Quality | Low-Medium — noisy logs, data leakage | XS | Resolved (2026-06-11) |
| TD-003 | Hardcoded `"ADMIN"` super admin access key | Security | HIGH — public default bypasses auth | XS | Resolved (2026-06-11) |
| TD-004 | Weak default JWT secrets | Security | CRITICAL — compomises all tokens if env not set | XS | Resolved (2026-06-11) |
| TD-005 | No Docker support | DevOps | Medium — harder to onboard, no consistent env | M | Open |
| TD-006 | Business logic in `OrderController` (calculateOrderTotals) | Architecture | Medium — untestable without HTTP context | M | Open |
| TD-007 | `NavigationController` bypasses global error handler | Architecture | Medium — inconsistent error responses for nav routes | S | Resolved (2026-06-11) |
| TD-008 | `BaseController` class never used | Architecture | Low — misleads developers about patterns | XS | Open |
| TD-009 | `ignore_stock_limits` fetched 5× separately | Duplication | Medium — unnecessary DB load | S | Open |
| TD-010 | Media delete does not remove S3 files | Bug | HIGH — storage costs grow unbounded | S | Resolved (2026-06-11) |
| TD-011 | SSLCommerz payment webhook incomplete | Feature Gap | HIGH — payments can't be confirmed without callback | M | Open |
| TD-012 | WooCommerce import runs in-process (no worker) | Scalability | Medium — blocks event loop during large imports | L | Open |
| TD-013 | N+1 query in order item resolution | Performance | Medium — degrades with cart size | M | Open |
| TD-014 | Product search uses `LIKE '%x%'` without FULLTEXT index | Performance | HIGH — degrades severely with catalog size | M | Open |
| TD-015 | `as any` type cast pervasive across codebase | Type Safety | Medium — bypasses TypeScript guarantees | L | Open |
| TD-016 | `walletBalance` stored in `Setting` table (not dedicated field) | Architecture | Low — works but unusual, `FOR UPDATE` lock needed | M | Open |
| TD-017 | `authLimiter` exported but not applied to auth routes | Security | Medium — auth endpoints under-protected | XS | Resolved (2026-06-11) |
| TD-018 | No input validation on many admin endpoints | Security | Medium — missing Zod schemas for some ADMIN routes | M | Resolved (2026-06-11) |
| TD-019 | Order status validated against hardcoded string array | Type Safety | Low — silently misses new enum values | XS | Resolved (2026-06-11) |
| TD-020 | `getDashboardStats` computes `walletSum` but never returns it | Dead Code | Low — wasted DB query | XS | Resolved (2026-06-11) |

---

## Detailed Debt Items

---

### TD-001 — Dynamic `require('bcryptjs')` in Controllers

**Category:** Code Smell  
**Business Impact:** Low  
**Discovery:** `UserController.ts` lines 70, 73, 119; `OrderController.ts` line 182

Using CommonJS `require()` inside async TypeScript functions bypasses module resolution, prevents tree-shaking, and hides the dependency from the import section. `bcryptjs` is already a declared dependency imported statically in `authService.ts`.

**Remediation:** Add `import bcrypt from 'bcryptjs'` at the top of affected files. Remove inline `require()` calls.  
**Effort:** XS | **Risk:** Low | **See:** IMP-001

---

### TD-002 — Debug `console.log` Scattered Across Production Code

**Category:** Code Quality  
**Business Impact:** Low-Medium

24 `console.log` calls found in production source files. Many prefix with `[DEBUG]` indicating they were added during development and not cleaned up. Issues:
- Sensitive data logged (order IDs, delivery charges, admin payload contents)
- Noisy production logs make real errors harder to find
- Inconsistent with existing `logger` utility pattern

**Affected files:** `OrderController.ts` (×5), `CategoryController.ts` (×2), `BrandController.ts` (×1), `LocationController.ts` (×1), `FacebookAdsController.ts` (×1), `config/index.ts` (×1)

**Remediation:** Remove `[DEBUG]` logs. Convert useful operational logs to `logger.info/debug`.  
**Effort:** XS | **Risk:** Low | **See:** IMP-002

---

### TD-003 — Hardcoded `"ADMIN"` Super Admin Setup Key

**Category:** Security  
**Business Impact:** HIGH

`AuthService.setupSuperAdmin` validates `adminAccessKey === 'ADMIN'`. This is a publicly documented default. If the first-run endpoint is accidentally re-enabled (e.g., by resetting the SUPER_ADMIN user), anyone who knows the codebase (or reads this doc) can create a super admin.

**Remediation:** Replace with `process.env.ADMIN_SETUP_KEY` with no default. Document in `.env.example`.  
**Effort:** XS | **Risk:** Low

---

### TD-004 — Weak Default JWT Secrets

**Category:** Security  
**Business Impact:** CRITICAL

`config/index.ts` falls back to `'access-secret'`/`'refresh-secret'` if env vars are missing. A misconfigured production server would sign all tokens with publicly known values, allowing anyone to forge tokens.

**Remediation:** Throw startup error in `NODE_ENV=production` if secrets are not set. Use strong, random defaults for development only.  
**Effort:** XS | **Risk:** Low | **See:** IMP-003

---

### TD-005 — No Docker Support

**Category:** DevOps  
**Business Impact:** Medium

The repository has no `Dockerfile` or `docker-compose.yml`. Every developer must manually set up MySQL, configure environment variables, and run migrations. This causes environment drift and slows onboarding.

**Remediation:** Add `Dockerfile` (multi-stage: build → production) and `docker-compose.yml` with MySQL and the API.  
**Effort:** M | **Risk:** Low

---

### TD-006 — Business Logic Inside `OrderController`

**Category:** Architecture  
**Business Impact:** Medium

`calculateOrderTotals()` is a 140-line private method on the controller class. It contains:
- Stock checking
- Delivery fee resolution (DB queries)
- Coupon validation (DB queries)
- Price calculation

This logic cannot be unit tested without an HTTP context, cannot be reused from other parts of the system, and violates the controller's responsibility of handling HTTP concerns only.

**Remediation:** Extract to `src/services/orderService.ts`.  
**Effort:** M | **Risk:** Medium | **See:** IMP-009

---

### TD-007 — `NavigationController` Bypasses Global Error Handler

**Category:** Architecture  
**Business Impact:** Medium

All 14 methods in `NavigationController` use manual `try/catch` blocks that:
1. Return `500` for all errors (even `NotFoundError` would return 500)
2. Expose the raw `err.message` directly in responses
3. Don't go through `errorHandler` middleware, which means no centralized logging

**Remediation:** Wrap all methods in `asyncHandler()` and remove manual try/catch.  
**Effort:** S | **Risk:** Low | **See:** IMP-005

---

### TD-008 — `BaseController` Class Never Used

**Category:** Architecture  
**Business Impact:** Low

`BaseController` defines `handleSuccess()`, `handleCreated()`, `handleError()`. The 10 controllers that extend it (`CartController`, `MediaController`, `ProductController`, etc.) all write `res.json({ success: true, ... })` inline and never call these helper methods. The class provides no actual value currently.

Either the helpers should be adopted by all controllers (making responses consistent), or the abstract class should be removed to reduce confusion.

**Remediation:** Progressively adopt `handleSuccess/handleCreated` in controllers, replacing inline `res.json` calls.  
**Effort:** M | **Risk:** Low | **See:** IMP-008

---

### TD-010 — Media Delete Does Not Remove S3 Files

**Category:** Bug  
**Business Impact:** HIGH

When a media record is deleted via `DELETE /api/media/:id`, the code tries to delete files by constructing a local filesystem path from the URL. For S3-stored files (URL starts with `https://`), `path.join(process.cwd(), 'https://...')` produces an invalid path. The `fs.unlink` fails silently. S3 objects accumulate indefinitely, incurring storage costs and leaving orphaned files.

**Remediation:** Detect URL scheme. S3 URLs → send `DeleteObjectCommand`. Local paths → `fs.unlink`.  
**Effort:** S | **Risk:** Low | **See:** IMP-013

---

### TD-011 — SSLCommerz Payment Webhook Not Implemented

**Category:** Feature Gap  
**Business Impact:** HIGH

`PaymentController.initiate` creates a payment session and redirects to SSLCommerz. However:
- There is no `success_url` handler registered
- There is no `fail_url` or `cancel_url` handler registered
- There is no IPN (Instant Payment Notification) webhook handler

This means after a customer completes payment on SSLCommerz, the system has no way to:
1. Confirm the payment
2. Update `order.paymentStatus` to `PAID`
3. Auto-confirm the order

**Remediation:** Implement SSLCommerz callback routes at `/api/payments/success`, `/api/payments/fail`, `/api/payments/cancel`, and `/api/payments/ipn`.  
**Effort:** M | **Risk:** Low

---

### TD-012 — WooCommerce Import Runs In-Process

**Category:** Scalability  
**Business Impact:** Medium

The WooCommerce import system runs inside the Express Node.js process, sharing the event loop. A large import (10,000+ products with image downloads) can:
- Delay API responses for other users during import
- Be lost if the server restarts mid-import (tasks show as `running` in DB but nothing is executing)
- Not scale to multiple import sessions

**Current Architecture:** `importQueue.ts` uses in-memory `Set` and `Array` as a task queue.

**Remediation (Short-term):** Add startup recovery to reset `running` → `paused` on server start. Limit import log to 200 lines.  
**Remediation (Long-term):** Move import to a worker thread using `node:worker_threads`, or a job queue (BullMQ + Redis).  
**Effort:** L (for proper fix) | **Risk:** Medium

---

### TD-015 — `as any` Type Cast Pervasive Across Codebase

**Category:** Type Safety  
**Business Impact:** Medium

`grep -r ": any"` in `src/` returns 85+ matches. Significant areas:
- All Prisma `where` clause objects: `const where: any = {}`
- All controller `updateData` objects: `const updateData: any = {}`
- Navigation service method params: `data: any`
- `walletService.tx?: any`
- `getActivePrice(item: any)`

These casts remove TypeScript's ability to catch type errors at compile time, effectively making those sections of code untyped JavaScript.

**Remediation:** Progressive replacement starting with highest-impact areas:
1. Type `getActivePrice` first (5-minute fix, high value)
2. Replace `const where: any = {}` with `Prisma.XxxWhereInput` types
3. Define DTOs for service method parameters

**Effort:** L (exhaustive) | **Risk:** Low per individual fix

---

### TD-016 — Wallet Balance Stored in `Setting` Table

**Category:** Architecture  
**Business Impact:** Low

The global wallet balance is stored as a `Setting` record (`key='wallet_balance'`). This is unusual and requires:
- A raw SQL `SELECT ... FOR UPDATE` lock to prevent race conditions
- Manual serialization/deserialization (`value` is a string)
- The `Setting` table was not designed for this use case

**Remediation:** A proper `GlobalWallet` model with a `balance Decimal` field and Prisma-managed row locking would be cleaner.  
**Effort:** M | **Risk:** Medium (data migration required)

---

### TD-017 — `authLimiter` Defined but Not Applied

**Category:** Security  
**Business Impact:** Medium

`rateLimiters.ts` exports `authLimiter` (10 req/15min per IP for login endpoints) and `apiLimiter` (500 req/15min for all routes). 

In `authRoutes.ts`, only `apiLimiter` is applied to `/login`, `/send-otp`, `/verify-otp` (through the global middleware) — **not** `authLimiter`. So the strict 10 req/15min limit is exported but never enforced.

**Remediation:** Apply `authLimiter` to `/login`, `/login-with-phone`, `/send-otp`, `/verify-otp` routes explicitly.  
**Effort:** XS | **Risk:** Low

---

### TD-018 — Missing Zod Validation on Many Admin Endpoints

**Category:** Security  
**Business Impact:** Medium

The `validate(schema)` middleware pattern is used consistently for auth endpoints but inconsistently for other admin endpoints. Examples of endpoints with no body validation:
- `POST /api/categories` — no schema
- `PUT /api/categories/:id` — no schema
- `POST /api/brands` — no schema
- `POST /api/navigation/navbar` — no schema
- Most CRUD endpoints in the admin area

This means malformed data can reach the database layer, causing Prisma validation errors (which return generic 500 errors instead of helpful 400 messages).

**Remediation:** Create Zod schemas for all admin endpoint request bodies and apply `validate()` middleware.  
**Effort:** M | **Risk:** Low

---

### TD-019 — Order Status Validated Against Hardcoded String Array

**Category:** Type Safety  
**Business Impact:** Low

```typescript
const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
```

`RETURNED` and `PARTIALLY_RETURNED` exist in the `OrderStatus` enum in `schema.prisma` but are missing from this array, so they cannot be set via the admin API (must be set via the `processReturn` endpoint). This may be intentional, but is undocumented.

**Remediation:** Either add a code comment explaining the exclusion, or import from `@prisma/client`.  
**Effort:** XS | **Risk:** Low | **See:** IMP-018

---

### TD-020 — `walletSum` Aggregated But Never Returned

**Category:** Dead Code  
**Business Impact:** Low

`UserController.getDashboardStats` (lines 226-230):
```typescript
prisma.walletTransaction.aggregate({
  where: { userId, status: 'COMPLETED' },
  _sum: { amount: true }
})
```

The result `walletSum` is fetched but never included in the API response. This is a DB query that has zero effect.

**Remediation:** Either include `walletSum.data._sum.amount` in the response (as `walletBalance`) or remove the aggregate call.  
**Effort:** XS | **Risk:** Low | **See:** IMP-020

---

## Debt Aging Report

| ID | Estimated Introduction Date | Days Open | Priority to Fix |
|----|---------------------------|-----------|----------------|
| TD-003, TD-004 | Project start | Unknown | Immediate |
| TD-010 | When S3 support was added | Unknown | High |
| TD-011 | When SSLCommerz was integrated | Unknown | High |
| TD-001, TD-002 | Development phase | Unknown | High |
| TD-017 | When rateLimiters were created | Unknown | High |
| All others | Various development phases | Unknown | Medium/Low |

---

## Definition of "Done" for Debt Items

A debt item is resolved when:
1. The fix is implemented and committed
2. Related tests pass (or new tests cover the fix)
3. The item is marked `Resolved` with a date and commit hash in this table
4. The `CHANGELOG_AI.md` is updated with the change
