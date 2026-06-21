# HalalMart API — Codebase Improvement Roadmap

> **Last Updated:** 2026-06-11 | **AI-Maintained**  
> **Scope:** Code quality, maintainability, performance, architecture — NO behavior changes  
> **Rule:** Every improvement preserves existing functionality exactly.

---

## Improvement Priority Index

| ID | Title | Priority | Category | Impact | Risk | Effort |
|----|-------|----------|----------|--------|------|--------|
| IMP-001 | Remove dynamic `require('bcryptjs')` calls | P0 | Code Smell | High | Low | XS |
| IMP-002 | Remove all `[DEBUG]` console.log from production code | P0 | Code Quality | High | Low | XS |
| IMP-003 | Fix weak default JWT secrets in production | P0 | Security | Critical | Low | XS |
| IMP-004 | Centralize `ignore_stock_limits` DB fetch | P1 | Duplication | High | Low | Resolved (2026-06-11) |
| IMP-005 | Add `asyncHandler` to `NavigationController` | P1 | Architecture | High | Low | S |
| IMP-006 | Standardize error throwing in `UserController.createUser` | P1 | Code Smell | Medium | Low | Resolved (2026-06-11) |
| IMP-007 | Extract stock deduction/restock to a shared utility | P1 | Duplication | High | Low | M |
| IMP-008 | Fix `BaseController.handleSuccess` — never used | P1 | Dead Code | Medium | Low | XS |
| IMP-009 | Extract order total calculation to `OrderService` | P1 | Architecture | High | Medium | M |
| IMP-010 | Type-safe `getActivePrice` — remove `any` param | P2 | Type Safety | Medium | Low | S |
| IMP-011 | Add `Prisma.TransactionClient` type to `WalletService.tx` | P2 | Type Safety | Medium | Low | XS |
| IMP-012 | Replace hardcoded wallet history limit (100) with constant | P2 | Maintainability | Low | Low | XS |
| IMP-013 | Fix media delete — S3 URLs not being deleted from S3 | P1 | Bug/Correctness | High | Low | S |
| IMP-014 | Centralize `parsePagination` response shape | P2 | Duplication | Medium | Low | S |
| IMP-015 | Remove duplicate order fetch inside `updateStatus` transaction | P2 | Performance | Medium | Low | Resolved (2026-06-11) |
| IMP-016 | Add `SUPER_ADMIN` check to role validation enum in `updateCustomerAdmin` | P1 | Security | High | Low | XS |
| IMP-017 | Move reward points settings fetch out of per-request DB calls | P2 | Performance | Medium | Low | Resolved (2026-06-11) |
| IMP-018 | Validate `status` against Prisma enum instead of hardcoded string array | P2 | Type Safety | Medium | Low | S |
| IMP-019 | Make `slugify` handle Bangla/Unicode characters | P3 | Robustness | Low | Low | S |
| IMP-020 | Add `cartService` instance cleanup to `CartController` | P3 | Code Smell | Low | Low | XS |
| IMP-021 | Replace `as any` casts in `OrderController` items loop | P2 | Type Safety | Medium | Low | S |
| IMP-022 | Add pagination to `WalletService.getTransactions` | P2 | Performance | Medium | Low | XS |
| IMP-023 | Remove `checkoutLimiter` which is defined but never applied | P2 | Dead Code | Low | Low | Resolved (2026-06-11) |
| IMP-024 | Add `as const` to enums-as-arrays (validStatuses) | P3 | Type Safety | Low | Low | XS |
| IMP-025 | Standardize all `Deleted successfully` vs `X deleted` response messages | P3 | Consistency | Low | Low | Resolved (2026-06-11) |

---

## Phase 1 — Safe Quick Wins (No Logic Changes)

> **Objective:** Remove noise, fix code smells, and close the most obvious gaps.  
> **Risk:** Low — all changes are isolated, easily verifiable.

---

### IMP-001 — Remove Dynamic `require('bcryptjs')`
**Priority:** P0 | **Impact:** High | **Risk:** Low | **Effort:** XS

#### Problem
`bcryptjs` is imported dynamically with `require()` inside controller methods — a CommonJS anti-pattern in a TypeScript ESM codebase. This bypasses TypeScript's static analysis, adds runtime overhead on every call, and makes the code harder to read and test.

**Affected Files:**
- `src/controllers/UserController.ts` — lines 70, 73, 119
- `src/controllers/OrderController.ts` — line 182

**Current:**
```typescript
// Inside createUser method
const bcrypt = require('bcryptjs');
hashedPassword = await bcrypt.hash(password, 12);
```

**Recommended:**
```typescript
// At top of file
import bcrypt from 'bcryptjs';

// Inside method
hashedPassword = await bcrypt.hash(password, 12);
```

**Dependency Trace:** `bcryptjs` is already in `package.json` and already imported statically in `authService.ts`. No new dependency needed.

**Testing Checklist:**
- [ ] `POST /api/users` (admin create user) still works
- [ ] `PUT /api/admin-users/:id` (change password) still works
- [ ] `POST /api/orders` anonymous guest checkout still creates guest user

**Rollback:** Revert the import statement change.

---

### IMP-002 — Remove `[DEBUG]` `console.log` from Production Code
**Priority:** P0 | **Impact:** High | **Risk:** Low | **Effort:** XS

#### Problem
Multiple `[DEBUG]` `console.log` calls exist in production controller code. These log sensitive business data (order IDs, delivery area charges, admin update payloads) to stdout and will appear in production logs. A `logger` module already exists and should be used instead for anything worth keeping.

**Affected Lines:**
| File | Line | Content |
|------|------|---------|
| `OrderController.ts` | 98 | `[DEBUG] Found area: ${area?.name}, charge:...` |
| `OrderController.ts` | 103 | `[DEBUG] Area charge 0, checking city:...` |
| `OrderController.ts` | 110 | `[DEBUG] No area, checking city:...` |
| `OrderController.ts` | 116 | `[DEBUG] Final deliveryFee:...` |
| `OrderController.ts` | 425 | `[DEBUG] Fetched ${orders.length} orders...` |
| `CategoryController.ts` | 74 | `[DEBUG] Updating Category...` |
| `CategoryController.ts` | 81 | `[DEBUG] Category updated successfully` |
| `BrandController.ts` | 90 | `[DEBUG] Brand updated successfully` |
| `LocationController.ts` | 161 | `DEBUG: updateArea controller called...` |
| `config/index.ts` | 29 | Config value printout |

**Recommended:** Delete the `[DEBUG]` logs. If area/city fee calculation logging is still desired during debugging, use `logger.debug()` which can be filtered by environment.

**Testing Checklist:**
- [ ] Application starts without errors
- [ ] Order creation still works correctly
- [ ] Category and brand updates still work

**Rollback:** Re-add console.log lines.

---

### IMP-003 — Fix Weak Default JWT Secrets
**Priority:** P0 | **Impact:** Critical | **Risk:** Low | **Effort:** XS

#### Problem
`src/config/index.ts` defaults to `'access-secret'` and `'refresh-secret'` if env vars are missing. If a developer accidentally starts production without setting these vars, all JWTs are signed with publicly known secrets.

**Current:**
```typescript
accessSecret: process.env.JWT_ACCESS_SECRET || 'access-secret',
refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
```

**Recommended:**
```typescript
accessSecret: (() => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_ACCESS_SECRET must be set in production');
  }
  return secret || 'access-secret-dev-only';
})(),
```

**Dependency Trace:** Only `src/config/index.ts` and `src/services/authService.ts` consume these. No other files affected.

**Testing Checklist:**
- [ ] App starts normally in development without env var set
- [ ] App throws a clear error in production if env var missing

---

### IMP-006 — Use `ApiError` Subclasses in `UserController.createUser`
**Priority:** P1 | **Impact:** Medium | **Risk:** Low | **Effort:** XS

#### Problem
`UserController.createUser` throws raw `new Error('...')` for validation failures. These are caught by the global `errorHandler` but produce a 500 response — not a 400/409 as intended.

**Current (line 81-87):**
```typescript
if (existingEmail) throw new Error('Email already registered');
if (existingPhone) throw new Error('Phone number already registered');
if (!name) throw new Error('Name is required');
```

**Recommended:**
```typescript
if (existingEmail) throw new ConflictError('Email already registered');
if (existingPhone) throw new ConflictError('Phone number already registered');
if (!name) throw new BadRequestError('Name is required');
```

**Testing Checklist:**
- [ ] Creating user with duplicate email returns 409 (not 500)
- [ ] Creating user without name returns 400 (not 500)

---

### IMP-008 — `BaseController` helper methods are defined but never used
**Priority:** P1 | **Impact:** Medium | **Risk:** Low | **Effort:** XS

#### Problem
`BaseController.handleSuccess()`, `handleCreated()`, and `handleError()` are defined but no controller that extends `BaseController` calls them — they all write `res.json({ success: true, data: ... })` inline. This means the class provides zero benefit in practice.

**Options:**
1. **Migrate all controllers** to use the base class helpers (best long-term — see IMP-009)
2. **Remove the abstract class** and keep `asyncHandler`-based patterns

**Recommendation:** Option 1 — adopt `handleSuccess()` progressively starting with new methods. This makes response shapes consistent.

---

### IMP-023 — Remove Unused `checkoutLimiter`
**Priority:** P2 | **Impact:** Low | **Risk:** Low | **Effort:** XS

#### Problem
`checkoutLimiter` is defined in `src/middleware/rateLimiters.ts` but is never imported or applied to any route. Its defined comment conflicts with its actual `max: 10` value (comment says "5 per hour").

**Recommended:** Either apply it to `POST /api/orders` or remove it. The `POST /api/orders` route currently has no specific rate limiting (only the global 500 req/15min applies).

---

### IMP-025 — Standardize Delete Response Messages
**Priority:** P3 | **Impact:** Low | **Risk:** Low | **Effort:** XS

#### Problem
Delete endpoints return inconsistent messages:
- `NavigationController`: `'Deleted successfully'` (generic)
- `CartController`: `'Item removed from cart'`
- `MediaController`: `'Media deleted'`
- `UserController`: `'Address deleted'`

**Recommended:** Adopt a consistent pattern: `'<Resource> deleted successfully'` — e.g., `'Navbar item deleted successfully'`.

---

## Phase 2 — Code Cleanup (Duplication & Architecture)

> **Objective:** Eliminate repeated logic, improve service layer separation, enforce architecture consistency.

---

### IMP-004 — Centralize `ignore_stock_limits` DB Fetch
**Priority:** P1 | **Impact:** High | **Risk:** Low | **Effort:** S

#### Problem
The `ignore_stock_limits` setting is fetched from the database **5 separate times** across 3 files:
- `OrderController.ts` lines 23, 276, 509
- `CartController.ts` lines 49, 100

Each of these is an independent `findUnique` round-trip to the database every time a cart item is added/updated or an order is placed. This means adding one item to a cart triggers 2 separate DB reads just for this flag.

**Current (repeated pattern):**
```typescript
const ignoreStockSetting = await prisma.setting.findUnique({ where: { key: 'ignore_stock_limits' } });
const ignoreStock = ignoreStockSetting?.value === 'true';
```

**Recommended:** Add a `getSetting(key)` utility function in `src/utils/settings.ts`:
```typescript
export async function getSetting(key: string, defaultValue = ''): Promise<string> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  return setting?.value ?? defaultValue;
}

export async function getSettingBool(key: string, defaultValue = false): Promise<boolean> {
  const value = await getSetting(key);
  if (!value) return defaultValue;
  return value === 'true';
}
```

Then everywhere:
```typescript
const ignoreStock = await getSettingBool('ignore_stock_limits');
```

**Impact:** Reduces DB calls per order by 2-3 round-trips. Centralizes the truthiness evaluation. Easy to add caching later (e.g., 30-second in-memory cache).

**Affected Files:**
- `src/utils/settings.ts` (new)
- `src/controllers/OrderController.ts`
- `src/controllers/CartController.ts`

**Testing Checklist:**
- [ ] Cart item add still enforces stock
- [ ] Order placement still enforces stock
- [ ] `ignore_stock_limits=true` setting bypasses all stock checks

**Rollback:** Revert all uses to inline `prisma.setting.findUnique`.

---

### IMP-005 — Apply `asyncHandler` to `NavigationController`
**Priority:** P1 | **Impact:** High | **Risk:** Low | **Effort:** S

#### Problem
`NavigationController` is the only controller that uses manual `try/catch` instead of `asyncHandler`. It also duplicates the error handling pattern (14 identical `try/catch/res.status(500)` blocks), bypasses the global `errorHandler`, and doesn't distinguish between `ApiError` and unknown errors.

**Current (repeated 14 times):**
```typescript
getNavbar = async (req: Request, res: Response) => {
  try {
    const items = await service.getNavbar();
    res.json({ success: true, data: items });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
```

**Recommended:**
```typescript
getNavbar = asyncHandler(async (req: Request, res: Response) => {
  const items = await service.getNavbar();
  res.json({ success: true, data: items });
});
```

**Affected Files:** `src/controllers/NavigationController.ts` (all 14 methods)

**Testing Checklist:**
- [ ] `GET /api/navigation/navbar` returns data
- [ ] `POST /api/navigation/navbar` with invalid data returns proper error

**Rollback:** Revert to manual try/catch.

---

### IMP-007 — Extract Stock Deduction/Restock to a Shared Utility
**Priority:** P1 | **Impact:** High | **Risk:** Low | **Effort:** M

#### Problem
The logic to deduct stock from a product or variant (and to restock on cancel) is duplicated in two places:
- `OrderController.create` (lines 279-301) — deduct on create
- `OrderController.updateStatus` (lines 492-533) — restock on cancel, deduct on un-cancel

Both blocks repeat the same pattern:
```typescript
if (item.variantId) {
  const variant = await tx.productVariant.findUnique(...)
  if (!ignoreStock && variant.stock < item.quantity) throw ...
  await tx.productVariant.update({ data: { stock: { decrement: item.quantity } } })
} else if (item.productId) {
  const product = await tx.product.findUnique(...)
  if (!ignoreStock && product.stock < item.quantity) throw ...
  await tx.product.update({ data: { stock: { decrement: item.quantity } } })
}
```

**Recommended:** Extract to `src/utils/stockUtils.ts`:

```typescript
export async function deductStock(
  tx: Prisma.TransactionClient,
  items: Array<{ productId: string; variantId?: string | null; quantity: number }>,
  ignoreStock: boolean
): Promise<void> { ... }

export async function restockItems(
  tx: Prisma.TransactionClient,
  items: Array<{ productId: string; variantId?: string | null; quantity: number }>
): Promise<void> { ... }
```

**Affected Files:**
- `src/utils/stockUtils.ts` (new)
- `src/controllers/OrderController.ts`

**Testing Checklist:**
- [ ] Order creation deducts stock
- [ ] Order cancellation restores stock
- [ ] Un-cancelling an order re-deducts stock with validation

---

### IMP-009 — Extract `calculateOrderTotals` to `OrderService`
**Priority:** P1 | **Impact:** High | **Risk:** Medium | **Effort:** M

#### Problem
`OrderController.calculateOrderTotals` is a 140-line private method on the controller that contains pure business logic (price calculation, delivery fee resolution, coupon validation). Business logic belongs in the service layer.

**Recommended:**
1. Create `src/services/orderService.ts`
2. Move `calculateOrderTotals` into `OrderService.calculateOrderTotals()`
3. `OrderController.calculate` and `OrderController.create` call `orderService.calculateOrderTotals()`

**Benefits:** Easier to unit test, decoupled from HTTP layer, usable from other contexts.

**Affected Files:**
- `src/services/orderService.ts` (new)
- `src/controllers/OrderController.ts`

**Risk:** The method receives a `userId` that may be `'guest'` for unauthenticated requests. This sentinel value pattern should be typed cleanly in the extracted service.

**Testing Checklist:**
- [ ] `POST /api/orders/calculate` returns same totals
- [ ] `POST /api/orders` creates order with same calculated amounts
- [ ] Coupon validation still works inside transaction

---

### IMP-013 — Fix Media Delete — S3 Files Not Being Deleted
**Priority:** P1 | **Impact:** High | **Risk:** Low | **Effort:** S

#### Problem
`MediaController.delete` constructs a local file path from the URL and tries to `fs.unlink()` it. But when files are stored on S3, the URL is `https://bucket.s3.amazonaws.com/media/...` — `path.join(process.cwd(), url)` produces a completely invalid local path. S3 objects are silently left orphaned.

**Current (lines 193-201):**
```typescript
const urls = [media.urlThumbnail, media.urlMedium, media.urlFull];
for (const url of urls) {
  const filePath = path.join(process.cwd(), url);
  try { await fs.unlink(filePath); } catch { /* ignore */ }
}
```

**Recommended:**
```typescript
for (const url of urls) {
  if (!url) continue;
  if (url.startsWith('http')) {
    // S3 URL — extract key and delete from S3
    const key = new URL(url).pathname.slice(1); // removes leading /
    try {
      await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET_NAME, Key: key }));
    } catch (err) { /* log, don't throw */ }
  } else {
    // Local path
    try { await fs.unlink(path.join(process.cwd(), url)); } catch { /* ignore */ }
  }
}
```

**Affected Files:** `src/controllers/MediaController.ts`

**Testing Checklist:**
- [ ] Deleting a locally-stored media removes the file
- [ ] Deleting an S3-stored media deletes from S3
- [ ] DB record always deleted regardless of file deletion outcome

---

### IMP-015 — Remove Duplicate Order Fetch in `updateStatus` Transaction
**Priority:** P2 | **Impact:** Medium | **Risk:** Low | **Effort:** S

#### Problem
`updateStatus` fetches the order **twice** — once before the transaction (line 438) and once inside the transaction (line 447) to "prevent race conditions." The first fetch is then used for the post-transaction SMS (line 539). This is correct but the code can be simplified:

The `currentOrder` variable fetched before the transaction is actually only needed for:
1. The 404 check (before wasting a transaction slot)
2. The phone number for SMS notification

The in-transaction fetch is needed for consistency. The logic is correct but should be documented clearly with a comment explaining why both fetches exist.

**Recommended:** Add an explanatory comment and remove the redundant `include: { user: true, items: true }` from the pre-transaction fetch (only `id`, `status`, `customerPhone` are needed):

```typescript
// Pre-flight check and SMS data capture — done outside transaction for speed
const currentOrder = await prisma.order.findUnique({ 
  where: { id: orderId },
  select: { id: true, status: true, customerPhone: true }  // minimal select
});
```

---

### IMP-017 — Reward Points Settings are Fetched on Every Order
**Priority:** P2 | **Impact:** Medium | **Risk:** Low | **Effort:** S

#### Problem
`OrderController.create` (lines 219-222) fetches `reward_points_amount` and `reward_points_earned` settings from the DB on every single order placement, even for guest orders (where it's skipped anyway — the check is after the fetch).

**Current:**
```typescript
const rewardAmountSetting = await prisma.setting.findUnique({ where: { key: 'reward_points_amount' } });
const rewardEarnedSetting = await prisma.setting.findUnique({ where: { key: 'reward_points_earned' } });
```

**Recommended:** Move these fetches inside the `if (user && !user.isGuest)` guard:
```typescript
let rewardPoints = 0;
if (user && !user.isGuest) {
  const [rewardAmountSetting, rewardEarnedSetting] = await Promise.all([
    prisma.setting.findUnique({ where: { key: 'reward_points_amount' } }),
    prisma.setting.findUnique({ where: { key: 'reward_points_earned' } }),
  ]);
  // ... rest of logic
}
```

This also runs them in parallel with `Promise.all` instead of sequentially, cutting the time from 2 sequential DB calls to 1 parallel round-trip when needed.

---

## Phase 3 — Performance Improvements

> **Objective:** Reduce unnecessary DB queries, improve response times for high-traffic endpoints.

---

### IMP-014 — Centralize Pagination Response Builder
**Priority:** P2 | **Impact:** Medium | **Risk:** Low | **Effort:** S

#### Problem
The pagination response object is constructed identically in 15+ places:
```typescript
res.json({ success: true, data: orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
```

**Recommended:** Add to `src/utils/helpers.ts`:
```typescript
export function buildPaginatedResponse<T>(data: T[], page: number, limit: number, total: number) {
  return {
    success: true,
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
```

---

### IMP-022 — Add Pagination to `WalletService.getTransactions`
**Priority:** P2 | **Impact:** Medium | **Risk:** Low | **Effort:** XS

#### Problem
`WalletService.getTransactions()` has a hardcoded `take: 100` and simultaneously enforces a rolling-delete of records > 100. The rolling delete runs on **every** `adjustGlobalBalance` call, which includes every SMS and every order — causing 2-3 extra DB queries each time.

**Recommended:**
1. Remove the rolling-delete cleanup from `adjustGlobalBalance` (it's not atomic anyway since it runs after the balance update inside the transaction block)
2. Add proper pagination to `getTransactions(page, limit)` 
3. Let the admin decide when to purge old records

---

## Phase 4 — Architecture Improvements

> **Objective:** Improve type safety, eliminate `any` types, enforce consistent patterns.

---

### IMP-010 — Type `getActivePrice` Parameters
**Priority:** P2 | **Impact:** Medium | **Risk:** Low | **Effort:** S

#### Problem
`getActivePrice(item: any)` accepts `any`, losing all type safety. It's called with both `product` and `variant` objects interchangeably.

**Recommended:**
```typescript
interface PriceableItem {
  price: number;
  specialPrice?: number | null;
  specialPriceStart?: Date | null;
  specialPriceEnd?: Date | null;
}

export const getActivePrice = (item: PriceableItem): number => { ... }
```

This interface matches both `Product` and `ProductVariant` schemas exactly.

---

### IMP-011 — Type `WalletService.tx` Parameter
**Priority:** P2 | **Impact:** Medium | **Risk:** Low | **Effort:** XS

#### Problem
`WalletService.adjustGlobalBalance` accepts `tx?: any` instead of the proper Prisma transaction type.

**Recommended:**
```typescript
import { Prisma } from '@prisma/client';
static async adjustGlobalBalance(
  amount: number,
  type: 'TOPUP' | 'DEDUCTION' | 'REFUND',
  note: string,
  userId?: string,
  tx?: Prisma.TransactionClient
)
```

---

### IMP-018 — Validate `status` Against Prisma Enum
**Priority:** P2 | **Impact:** Medium | **Risk:** Low | **Effort:** S

#### Problem
`OrderController.updateStatus` validates the incoming status against a hardcoded string array:
```typescript
const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
```

If `OrderStatus` enum in `schema.prisma` is updated (e.g., adding `RETURNED`), this validation won't automatically update, creating a silent inconsistency.

**Recommended:**
```typescript
import { OrderStatus } from '@prisma/client';
const validStatuses = Object.values(OrderStatus);
```

---

### IMP-021 — Replace `as any` in `OrderController`
**Priority:** P2 | **Impact:** Medium | **Risk:** Low | **Effort:** S

#### Problem
Line 340: `order.items.map((i: any) => i.productId)` — `order.items` has a known type from the Prisma include. The `any` cast hides potential type errors.

**Recommended:** Use the proper Prisma return type or define an `OrderItem` interface.

---

## Phase 5 — Long-Term Optimization

> **Objective:** Larger structural improvements for scalability and developer experience.

---

### IMP-019 — Handle Non-ASCII Characters in `slugify`
**Priority:** P3 | **Impact:** Low | **Risk:** Low | **Effort:** S

**Problem:** `slugify` strips all non-ASCII characters via `[^\w\s-]` — Bangla product names produce empty slugs, requiring a fallback counter.

**Recommended:** Transliterate Bangla to Latin before slugifying, or use a library like `slugify` npm package with Unicode support.

---

### IMP-024 — Use `as const` for Status Arrays
**Priority:** P3 | **Impact:** Low | **Risk:** Low | **Effort:** XS

**Problem:** `const validStatuses = [...]` creates a `string[]`, losing the literal type information.

**Recommended:**
```typescript
const validStatuses = ['PENDING', 'CONFIRMED', ...] as const;
type ValidStatus = typeof validStatuses[number];
```

---

## Security Findings

| ID | Severity | Location | Issue | Fix |
|----|----------|----------|-------|-----|
| SEC-001 | HIGH | `config/index.ts:12-13` | Weak default JWT secrets | IMP-003 |
| SEC-002 | HIGH | `middleware/auth.ts` (authorize) | Debug string in error message | Resolved |
| SEC-003 | MEDIUM | `authRoutes.ts:87` | `setupSuperAdmin` key is hardcoded `"ADMIN"` | Resolved |
| SEC-004 | MEDIUM | `UserController.ts:111-113` | Role update allows `SUPER_ADMIN` assignment by any ADMIN | Resolved |
| SEC-005 | LOW | `facebook-capi.ts:98` | FB CAPI full response logged to console in production | Resolved |
| SEC-006 | LOW | `OrderController.ts` | Guest user password uses `bcrypt(random, 10)` | Resolved |
| SEC-007 | LOW | `walletService.ts:16` | Raw SQL query `FOR UPDATE` lock — safe but bypasses Prisma type safety | Document clearly |

---

## Dead Code Inventory

| File | Dead Symbol | Evidence | Action |
|------|------------|---------|--------|
| `src/middleware/rateLimiters.ts` | `checkoutLimiter` | Exported but never imported anywhere | Remove or apply to order route |
| `src/controllers/BaseController.ts` | `handleSuccess`, `handleCreated`, `handleError` | None of the 29 controllers that extend it call these methods | Adopt (see IMP-008) or remove class |
| `src/services/userService.ts` | `getCustomers()` | Used only in `UserController.getAllUsers` — verify if actually called | Keep, it's legitimate |
| `src/controllers/UserController.ts` | `walletSum` aggregation in `getDashboardStats` (line 226-229) | Computed but never included in the response | Remove the wallet aggregate or include in response |

---

## Dependency Review

| Package | Current Use | Issue | Recommendation |
|---------|------------|-------|----------------|
| `dotenv-expand` | `config/index.ts` | Used for env expansion — acceptable | Keep |
| `morgan` | `app.ts` | HTTP logger — fine | Keep |
| `cookie-parser` | `app.ts` | Installed but cookies are not used for auth (Bearer tokens are used) | Investigate if needed; remove if not |
| `multer` | Media upload | Used | Keep |
| `sharp` | Image processing | Used | Keep |
| `@aws-sdk/client-s3` | S3 upload | Used | Keep |
| `node-cron` | Cart cleanup | Used | Keep |
| `swagger-jsdoc` + `swagger-ui-express` | API docs | Used | Keep |
