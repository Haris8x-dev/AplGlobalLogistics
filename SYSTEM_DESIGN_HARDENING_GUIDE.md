# APL Core: System Design Hardening Guide (Security + Performance)

## 1) Context and Architecture (Current)

You have a good functional architecture already:

- Electron renderer (React) for desktop clients on LAN
- Express API server on a Windows Server machine
- PostgreSQL + Prisma for persistence
- Stock flows with `PENDING -> COMPLETED/CANCELLED` approval lifecycle
- Dashboard click-through to Report for pending workflows

This document focuses on making that architecture production-grade for:

1. Security
2. Throughput and responsiveness
3. Data correctness under concurrency
4. Operational stability on LAN

No code is changed in this guide. This is an implementation blueprint.

---

## 2) Key Findings From Current Code

## 2.1 Security Findings

1. Hardcoded DB credentials are present in `server/src/config/db.js`.
2. JWT fallback secret is present in `server/src/middlewares/authMiddleware.js` and `server/src/utils/generateToken.js`.
3. `POST /api/auth/generate` is currently not protected in `server/src/routes/auth/authRoutes.js`.
4. `GET /api/admin/clients/all` is currently public in `server/src/routes/admin/clientRoutes.js`.
5. `POST /api/admin/inventory/model` is currently missing admin middleware in `server/src/routes/admin/inventoryRoutes.js`.
6. Login controllers log request headers in `server/src/controllers/auth/authLoginAdmin.controller.js` and `server/src/controllers/auth/authLoginEmp.controller.js`.
7. Electron token handling currently stores encrypted token in a process-global variable (not persistent) in `client/electron.js`.

## 2.2 Performance Findings

1. `getClientStockHistory` loads all history rows for a client-model pair (no pagination) in `server/src/controllers/stock/clientStockHistory.controller.js`.
2. `getRecentMovements` is bounded by `limit`, good start, but still includes relation enrichment and can become expensive at scale.
3. `enrichMovementsWithClients` has N+1 style queries (`findUnique` inside map loop) in `server/src/controllers/stock/clientStockHistory.controller.js`.
4. Several list endpoints are unpaginated (`clients`, inventory categories/models, users).
5. Index coverage for the new workflow fields (`status`, `transferGroupId`, timeline reads) is not explicit in schema.

## 2.3 Consistency/Concurrency Findings

1. `proceedTransfer` reads pending rows before transaction and then updates in transaction. This is vulnerable to double-click/race windows.
2. `cancelTransfer` and `editPendingTransfer` have similar status-check-before-write patterns.
3. Dashboard click-to-report currently uses `clientId + modelId`; if multiple pending entries exist for same pair, targeting can be ambiguous.

---

## 3) Security Hardening Plan

## 3.1 Secrets and Configuration (Immediate)

1. Move DB credentials to env vars.
2. Remove JWT fallback secret entirely. If `JWT_SECRET` is missing, fail server startup.
3. Separate env files per environment:
   - `.env.development`
   - `.env.production`
4. Rotate all currently exposed credentials immediately.

Recommended env set:

- `DATABASE_URL` or adapter-specific DB vars
- `JWT_SECRET` (32+ random bytes)
- `JWT_EXPIRES_IN`
- `CORS_ALLOWED_ORIGINS`
- `RATE_LIMIT_STORE_URL` (if Redis is used)

## 3.2 Route Protection and RBAC (Immediate)

Apply strict auth to all sensitive paths:

1. Protect `POST /api/auth/generate` with `verifyToken + isAdmin + isUserActive`.
2. Protect `GET /api/admin/clients/all` at least with `verifyToken` (and likely admin role depending on business policy).
3. Protect `POST /api/admin/inventory/model` with admin middleware.
4. Keep stock write endpoints employee/admin scoped by policy (not only authenticated).

Policy model recommendation:

- `ADMIN`: user management, inventory master writes, approve/cancel/edit pending
- `EMPLOYEE`: create pending transfer/add-stock only, no approval actions

## 3.3 Transport and LAN Security (High Priority)

Even on LAN, enforce transport controls:

1. TLS between clients and API (HTTPS on server, internal CA cert).
2. Firewall allowlist only office subnets.
3. Restrict DB port to API host only.
4. If reverse proxy is introduced (IIS/Nginx), set `app.set('trust proxy', 1)` and enforce forwarded headers safely.

## 3.4 Electron Security (High Priority)

Current baseline is decent (`contextIsolation`, `nodeIntegration: false`). Strengthen with:

1. Use persistent secure credential storage (`keytar`) instead of process-global variable.
2. Add `sandbox: true` to `BrowserWindow` where compatible.
3. Block navigation and unexpected origins (`will-navigate`, strict allowlist).
4. Add strict Content Security Policy (CSP) in built HTML.
5. Disable DevTools in production builds.

## 3.5 Session/Token Hardening

1. Prefer short-lived access tokens (15-30 min) + refresh flow.
2. If cookies are used in browser mode, use `httpOnly`, `secure=true` in production, `sameSite=strict` or `lax` based on UX.
3. Add device/session metadata for revocation and audit.

---

## 4) Rate Limiting Strategy (LAN-Friendly)

## 4.1 Why You Need Per-Route Limits

Different endpoints have different abuse/accident profiles:

- Login endpoints need brute-force protection.
- Write endpoints need burst control to protect DB.
- Read endpoints need broader but bounded throughput.

## 4.2 Recommended Baseline Limits

Use fixed windows initially; move to sliding-window/token bucket later if needed.

| Route Group | Suggested Limit | Key |
|---|---:|---|
| `/api/auth/login/admin` | 5 / 15 min | IP + email |
| `/api/auth/login/employee` | 10 / 15 min | IP + email |
| `/api/auth/generate` | 10 / min | admin userId |
| `/api/stock/add-initial` | 30 / min | userId |
| `/api/stock/transfer` | 30 / min | userId |
| `/api/stock/proceed-transfer/*` | 20 / min | admin userId |
| `/api/stock/cancel-transfer/*` | 20 / min | admin userId |
| `/api/stock/edit-transfer/*` | 30 / min | admin userId |
| `/api/stock/recent-activity` | 120 / min | userId/IP |
| `/api/stock/history/*` | 120 / min | userId/IP |
| Other authenticated GETs | 180 / min | userId/IP |

Implementation notes:

1. If single API instance only: memory store is acceptable to start.
2. If you may scale to multiple instances: use Redis-backed rate limit store.
3. Return explicit `429` JSON with retry hints.
4. Add cooldown lockout after repeated auth failures.

---

## 5) Database Indexing Plan (PostgreSQL + Prisma)

## 5.1 High-Impact Indexes for Your Query Patterns

Target `StockMovement` first.

Recommended SQL indexes (safe rollout with `CONCURRENTLY` in production):

```sql
-- Group operations (proceed/cancel/edit)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sm_transfer_group
ON "StockMovement" ("transferGroupId");

-- Pending queues + timeline
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sm_status_created
ON "StockMovement" ("status", "createdAt" DESC);

-- Client-model history timeline endpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sm_client_model_created
ON "StockMovement" ("clientId", "modelId", "createdAt" DESC);

-- Optional for client timeline-only views
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sm_client_created
ON "StockMovement" ("clientId", "createdAt" DESC);

-- Optional if model-centric reports become common
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sm_model_created
ON "StockMovement" ("modelId", "createdAt" DESC);

-- Pending routing / future queue filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sm_to_client_status_created
ON "StockMovement" ("toClientId", "status", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sm_from_client_status_created
ON "StockMovement" ("fromClientId", "status", "createdAt" DESC);
```

For `ClientStock`:

```sql
-- Supports client inventory ordered by balance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cs_client_balance
ON "ClientStock" ("clientId", "currentBalance" DESC);

-- Helps model-centric lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cs_model
ON "ClientStock" ("modelId");
```

For admin list/filter pages:

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_client_active_created
ON "Client" ("isActive", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_role_active_created
ON "User" ("role", "isActive", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mobile_category_active
ON "MobileModel" ("categoryId", "isActive");
```

## 5.2 Index Verification Checklist

After each index rollout:

1. Capture `EXPLAIN (ANALYZE, BUFFERS)` for top 5 endpoints.
2. Ensure index scan/bitmap index scan is used where expected.
3. Track p95 latency before/after.
4. Remove unused indexes after observation window.

---

## 6) Query and Endpoint Optimization Plan

## 6.1 Add Pagination Everywhere It Matters

Apply cursor pagination (preferred) for timeline endpoints:

- `GET /api/stock/history/:clientId/:modelId`
- `GET /api/stock/recent-activity`
- admin list endpoints if record count grows

Recommended query params:

- `limit` (default 25, max 100)
- `cursor` (opaque createdAt+id pair)

Return shape:

- `data`
- `nextCursor`
- `hasMore`

## 6.2 Remove N+1 in Movement Enrichment

Current `enrichMovementsWithClients` does per-row `findUnique` for clients.

Optimize by:

1. Collect unique `fromClientId` and `toClientId` sets.
2. Batch-load clients in one query.
3. Map IDs to names in memory.

This single change gives major wins on report-heavy days.

## 6.3 Select Only Needed Fields

For high-frequency endpoints, use minimal `select` instead of broad `include` trees where possible.

Most useful on:

- recent activity feed
- client inventory lists
- dashboard summaries

## 6.4 Dashboard Pending Click Precision

Current click-through stores `clientId + modelId`. If multiple pending entries exist for same pair, navigation target may be ambiguous.

Improve by also passing `transferGroupId` and, in Report, auto-scroll/filter/highlight that exact group.

---

## 7) Concurrency and Data Correctness Hardening

## 7.1 Make Proceed/Cancel/Edit Status Transitions Atomic

Current pattern checks `PENDING` before the transaction and writes afterward.

Safer pattern:

1. In transaction, transition with conditional update (`WHERE transferGroupId=? AND status='PENDING'`).
2. Verify affected row count.
3. If 0 rows updated, return conflict/already-processed response.

This prevents double approvals from multi-clicks or simultaneous admins.

## 7.2 Idempotency for Write Endpoints

For `add-initial`, `transfer`, `proceed`, `cancel`, support an idempotency key header:

- same key + same payload => same result
- prevents duplicate submissions from retries/network glitches

## 7.3 Consider DB-Level Safeguards

1. Optional check constraint to prevent negative `ClientStock.currentBalance`.
2. Add explicit `NOT NULL` where business rules are strict (e.g., `transferGroupId` for all new grouped writes).

---

## 8) Observability and Operations

## 8.1 Logging

1. Replace ad-hoc logs with structured logger (pino/winston).
2. Add request ID per request.
3. Log:
   - route
   - method
   - userId/role
   - latency
   - DB query timing (aggregate)
4. Do not log auth secrets, tokens, or full headers in production.

## 8.2 Metrics (Minimum)

Track:

- p50/p95/p99 latency by route
- DB query latency percentile
- error rate by route + status code
- 429 count (rate-limited requests)
- pending queue size
- proceed/cancel success and conflict counts

## 8.3 Windows Server Runtime

1. Run API as a managed service (NSSM/PM2 service wrapper/IIS node host).
2. Auto-restart policy on crash.
3. Daily DB backup + weekly restore drill.
4. Centralized log rotation.

---

## 9) Phased Implementation Roadmap

## Phase 0 (Day 1-2): Critical Security

1. Remove hardcoded secrets and fallback JWT secret.
2. Protect public-sensitive routes.
3. Stop verbose auth header logging in login controllers.
4. Add baseline login rate limiting.

## Phase 1 (Week 1): Data and API Performance

1. Add top indexes (`transferGroupId`, `status+createdAt`, `clientId+modelId+createdAt`).
2. Add pagination to history and recent endpoints.
3. Remove N+1 client lookups in movement enrichment.
4. Add per-route rate limits for stock writes.

## Phase 2 (Week 2): Correctness + UX Precision

1. Atomic status transitions with conflict-safe updates.
2. Add idempotency keys for write actions.
3. Use `transferGroupId` in dashboard-to-report targeting.

## Phase 3 (Week 3+): Production Excellence

1. TLS + firewall subnet policies.
2. Structured logging and metrics dashboards.
3. Electron secure token persistence and CSP hardening.
4. Load testing and capacity baselines.

---

## 10) Capacity and Performance Targets

Use these initial goals:

- `GET /api/stock/recent-activity` p95 < 150ms (LAN)
- `GET /api/stock/history/:clientId/:modelId` p95 < 200ms for first page
- `POST /api/stock/transfer` p95 < 250ms
- Approval actions (`proceed/cancel`) p95 < 250ms
- 0 duplicate-commit incidents in pending flow

---

## 11) Validation Checklist Before Go-Live

1. Security checklist complete (secrets, route protection, TLS, logging hygiene).
2. Indexes created and verified via query plans.
3. Rate limit policies tested under burst traffic.
4. Pending action race-condition tests pass.
5. Backup/restore test completed.
6. Dashboard/report behavior tested with many simultaneous pending entries.

---

## 12) Recommended Next Deliverables

1. `ARCHITECTURE_DECISIONS.md` for approved technical decisions (auth, limits, indexing).
2. `RUNBOOK.md` for operations (restart, rotate secrets, backup restore, incident handling).
3. `PERF_BASELINE.md` with measured p95 metrics and load-test notes.

---

If you want, next I can generate a second document that is implementation-ready and sprint-formatted (`Task`, `Owner`, `ETA`, `Risk`, `Validation`) so your team can execute this plan directly.