# HalalMart API — AI Changelog

> **Format:** AI-tracked changes and documentation updates.  
> **Maintained by:** AI documentation agent (Antigravity / Gemini)

---

## 2026-06-11 — Initial Documentation Generation

**Action:** Full repository analysis and initial knowledge base creation

### Files Analyzed

| File | Type |
|------|------|
| `package.json` | Dependencies and npm scripts |
| `.env.example` | Environment variable definitions |
| `prisma/schema.prisma` | Full database schema (834 lines, 30+ models) |
| `prisma/seed.ts` | Database seeder |
| `src/app.ts` | Express app setup |
| `src/server.ts` | Server bootstrap |
| `src/config/index.ts` | Configuration |
| `src/routes/index.ts` | Route aggregator (30 routes) |
| `src/routes/authRoutes.ts` | Auth endpoints |
| `src/routes/builderRoutes.ts` | Builder endpoints |
| `src/controllers/BuilderController.ts` | Builder logic (446 lines) |
| `src/controllers/OrderController.ts` | Order lifecycle (673 lines) |
| `src/controllers/ProductController.ts` | Product CRUD (548 lines) |
| `src/controllers/AuthController.ts` | Auth controller |
| `src/services/authService.ts` | Auth business logic (417 lines) |
| `src/services/importQueue.ts` | WooCommerce import queue |
| `src/middleware/auth.ts` | JWT + role middleware |
| `src/validators/builder.schema.ts` | Builder Zod schemas |
| `src/utils/sms.ts` | SMS gateway utility |
| `src/utils/facebook-capi.ts` | Facebook CAPI utility |
| `src/utils/errors.ts` | Custom error classes |
| `src/jobs/cartCleanup.ts` | Cart cleanup cron job |
| `docs/builder-api.md` | Existing builder API docs |
| `docs/builder-authoring.md` | Existing authoring docs |
| All 30 route files | Directory listing |
| All 29 controller files | Directory listing |
| All 10 service files | Directory listing |
| All 8 script files | Directory listing |

### Documentation Created

| File | Content |
|------|---------|
| `docs/PROJECT_OVERVIEW.md` | Business context, feature table, tech stack, repo structure |
| `docs/ARCHITECTURE.md` | System diagram, bootstrap sequence, request flow, middleware details |
| `docs/DATABASE.md` | All 30+ models documented with fields, relationships, indexes |
| `docs/API_REFERENCE.md` | All 100+ endpoints with method, auth, request/response |
| `docs/BUILDER_SYSTEM.md` | Deep-dive: concepts, document schema, all section types, workflow, security |
| `docs/AUTHENTICATION.md` | All auth flows, token system, OTP details, security notes |
| `docs/DATA_FLOW.md` | Step-by-step flows: order placement, status change, OTP, builder publish, media upload, import, SMS |
| `docs/COMMANDS_AND_OPERATIONS.md` | All npm scripts, Prisma commands, env var reference |
| `docs/ENVIRONMENT_SETUP.md` | Local, Docker, production setup with step-by-step commands |
| `docs/DEPLOYMENT_PLAYBOOK.md` | Fresh deploy, update, rollback, migration procedures |
| `docs/TROUBLESHOOTING.md` | Error table with symptoms, causes, and fixes |
| `docs/CHANGELOG_AI.md` | This file |
| `docs/AI_ONBOARDING.md` | Condensed entry point for new AI agents and developers |

### Architecture Discoveries

- **Builder System** is a full page-composition engine with version control, campaign scheduling, and XSS prevention
- **OTP authentication** creates guest accounts that can be upgraded to full accounts
- **Global Wallet** is used for SMS cost tracking — non-OTP SMS deducts from global balance
- **WooCommerce import** runs in-process with a manual task queue (max 1 concurrent task)
- **Delivery fee** is calculated hierarchically: Area charge → City charge (fallback)
- **Reward points** only credited on COMPLETED status, revoked if status reverts

### Issues / Technical Debt Identified

1. Hardcoded `adminAccessKey: "ADMIN"` in `setupSuperAdmin` — security risk in production
2. Debug string in `authorize()` error message: `"DEBUG: Insufficient permissions (AUTH MOD)"`
3. Multiple `console.log('[DEBUG]...')` in `OrderController.ts` production code
4. No Docker support (no Dockerfile or docker-compose.yml)
5. WooCommerce import runs in-process — potential event loop blocking for large catalogs
6. SSLCommerz payment gateway partially implemented — webhook/callback not complete

### Existing Docs Reviewed

- `docs/builder-api.md` — **Accurate** — content matches `BuilderController.ts` implementation
- `docs/builder-authoring.md` — **Partially accurate** — references "block" scope which exists in schema but implementation is incomplete

---

*To update this changelog, document the date, files modified, features impacted, and any architectural changes discovered.*
