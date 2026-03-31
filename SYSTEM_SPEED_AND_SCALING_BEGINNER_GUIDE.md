# APL Core Beginner Guide: How Your System Works and How to Make It Fast

## Why this document

You asked for a guide that explains everything in simple terms, because you are building by validating behavior and not deep database theory yet. This document is written for that exact use case.

No code changes are made here. This is an architecture and optimization playbook.

---

## 1) First: what is Pagination?

Pagination means:

- Do not load 10,000 rows in one response.
- Load a small chunk like 25 rows at a time.
- User sees page 1 now, page 2 only when needed.

Simple analogy:

- Without pagination: you bring the whole warehouse in one truck.
- With pagination: you bring only one pallet per trip.

Why it matters:

1. Faster response time
2. Lower memory usage (server and client)
3. Better user experience
4. Lower database stress

Where it matters most in your app:

- Report history timeline
- Recent stock movements
- Big admin lists (users, clients, models, categories)

---

## 2) How your current system works (end to end)

## 2.1 Login and Auth flow

1. Admin or employee logs in.
2. Backend validates user and password.
3. JWT token is created.
4. Token is returned and/or cookie is set.
5. Every protected API call checks token in middleware.

Key files involved:

- server/src/controllers/auth/authLoginAdmin.controller.js
- server/src/controllers/auth/authLoginEmp.controller.js
- server/src/middlewares/authMiddleware.js
- server/src/utils/generateToken.js
- client/src/utils/axiosConfig.ts

## 2.2 Master data flow (Category and Model)

1. Admin creates categories.
2. Admin creates models linked to a category.
3. UI loads category and model lists for dropdowns and tables.

Key files:

- server/src/controllers/admin/inventory/categories/*.js
- server/src/controllers/admin/inventory/mobiles/*.js
- client/src/pages/admin-dashboard/options/manageCat.tsx
- client/src/pages/admin-dashboard/options/manageModels.tsx

## 2.3 Stock business flow

Add stock:

1. Employee creates add entry.
2. A StockMovement row is created as PENDING.
3. ClientStock placeholder is ensured for model visibility.
4. Admin later approves or cancels from Report.

Transfer stock:

1. Employee creates transfer request.
2. Two StockMovement rows are created as PENDING:
   - source negative quantity
   - destination positive quantity
3. Admin later approves or cancels from Report.
4. Only on approve, ClientStock balances are updated.

Key files:

- server/src/controllers/stock/addStock.controller.js
- server/src/controllers/stock/transferStock.controller.js
- server/src/controllers/stock/pendingTransfer.controller.js
- server/src/controllers/stock/clientStockHistory.controller.js
- client/src/pages/admin-dashboard/options/Report.tsx
- client/src/pages/admin-dashboard/options/dashboard.tsx

## 2.4 Dashboard to Report pending click flow

1. Dashboard recent movements includes PENDING rows.
2. User clicks pending row.
3. UI stores identifiers and navigates to Report.
4. Report opens that client and model history so admin can proceed/cancel/edit.

---

## 3) What is missing now that can cause slowdowns or failures

This section is the important part.

## A) Security and reliability risks (high priority)

1. Hardcoded database credentials exist.
2. JWT fallback secret exists (dangerous for production).
3. Some sensitive routes are weakly protected or inconsistent.
4. Login handlers print detailed headers in logs.
5. Token and middleware patterns are inconsistent across handlers.
6. LAN deployment values are hardcoded for localhost in places (can break real LAN topology).

Why this matters:

- Security incidents
- Unexpected auth bugs
- Incorrect behavior when traffic grows

## B) Performance risks (high priority)

1. Some endpoints return full lists with no pagination.
2. History enrichment does repeated per-row lookups (N+1 pattern).
3. Indexing for pending workflow reads is not explicitly tuned in schema/migrations.
4. UI does client-side search after loading everything first.

Why this matters:

- Slow screens
- Higher DB CPU and I/O
- Delays on dashboard/report when data grows

## C) Concurrency/data correctness risks (high priority)

1. Proceed/cancel/edit paths can race under multi-click or multi-admin actions.
2. Pending navigation currently uses clientId + modelId, which can be ambiguous when many pending rows exist for same pair.
3. Cancel for add-stock currently deletes records, which can weaken audit trail depending on policy.

---

## 4) Database indexing in simple words

Think of an index as a fast address book.

Without index:

- DB scans many rows to find one target.

With index:

- DB jumps quickly to matching rows.

## 4.1 What to index first in your app

Most important table: StockMovement.

Priority order:

1. transferGroupId
2. status + createdAt
3. clientId + modelId + createdAt
4. toClientId + status + createdAt
5. fromClientId + status + createdAt

Also useful:

- ClientStock: clientId + currentBalance
- MobileModel: categoryId + isActive
- User: role + isActive + createdAt
- Client: isActive + createdAt

Rule of thumb:

- Start with 3-6 high-value indexes.
- Measure.
- Add only what real queries need.

---

## 5) Query design basics for your project

## 5.1 Always request only needed fields

Bad pattern:

- load big nested objects by default for every list

Better pattern:

- return only columns needed for that screen

## 5.2 Paginate every timeline and long table

For endpoints like history and recent activity:

- default limit: 25
- max limit: 100
- return next cursor

## 5.3 Remove N+1 pattern in movement enrichment

Current pattern does per-row client lookup in a loop.

Better pattern:

1. collect unique client ids
2. fetch all clients once
3. map in memory

This is one of the biggest wins in your Report and Dashboard pipelines.

## 5.4 Use stable ordering

For paginated tables:

- order by createdAt desc, id desc

This avoids duplicates/missing rows between pages.

---

## 6) Search optimization and category listing optimization

Your current UI search is mostly client-side filtering after loading full datasets.

This is okay for small data, not okay for large data.

## 6.1 Upgrade path for search

Step 1:

- add backend query params like q, page, pageSize, sort

Step 2:

- debounce user typing in frontend (about 250-400 ms)

Step 3:

- server-side filtering + pagination

Step 4:

- add indexes that match filter columns

Examples for your app:

- clients search by companyName/contactName/email
- models search by name and category
- users search by fullName/email/role
- report filter by status/date/model/client

## 6.2 Category listing optimization

If category and model data is mostly stable:

1. cache active category listing in memory for short TTL (30-120 seconds)
2. invalidate cache after add/update/status change

This reduces repeat DB load for dropdown-heavy screens.

---

## 7) Rate limiting for smooth behavior

Rate limiting protects your backend from accidental storms and repeated retries.

Practical setup:

1. strict limit on login routes
2. medium limit on write routes (add/transfer/proceed/cancel/edit)
3. higher limit on read routes (history/recent/list)

Behavior:

- if limit reached, return 429 with retry information
- log burst events for investigation

This improves stability even in LAN-only environments.

---

## 8) LAN deployment realities you should fix early

1. API base URL should be environment-driven, not hardcoded localhost for all clients.
2. CORS allowed origins should include deployed LAN app origins.
3. Windows firewall should allow only office subnet.
4. Database port should not be open to all LAN clients, only API server.
5. Use HTTPS internally if possible, especially for credentials and tokens.

---

## 9) Fast, safe roadmap for a beginner team

## Phase 1 (immediate safety)

1. move secrets to env
2. remove JWT fallback
3. enforce route middleware consistency
4. stop verbose auth header logging

## Phase 2 (big speed wins)

1. add top indexes for StockMovement
2. add pagination for history and recent
3. fix N+1 enrichment pattern

## Phase 3 (large-data readiness)

1. server-side search with query params
2. cache category/model read endpoints
3. add endpoint-level rate limiting

## Phase 4 (correctness hardening)

1. make proceed/cancel/edit status transitions atomic
2. add idempotency keys for writes
3. pass transferGroupId for exact pending navigation target

---

## 10) Quick checklist: how to know if system is becoming smooth

Track these metrics:

1. history endpoint p95 response time
2. recent activity p95 response time
3. transfer/add/proceed p95 write latency
4. db CPU usage at peak hour
5. count of 429 responses
6. count of race/conflict events

Target values for LAN start:

- history p95 under 200 ms (first page)
- recent activity p95 under 150 ms
- write endpoints p95 under 250 ms

---

## 11) One important mindset for your current build style

Your approach is valid: build behavior first, then harden.

Now you are in the hardening stage.

So from now on, every new feature should include:

1. Security check
2. Pagination check
3. Index check
4. Concurrency check
5. Logging/monitoring check

If you apply this on each feature, your app will stay fast even as data grows.

---

## 12) If you want next

Next document I can create for you:

- SYSTEM_SPEED_IMPLEMENTATION_SPRINT.md

It will include exact task cards with:

- what to change
- why
- effort estimate
- risk level
- testing steps

That will let you execute this as a practical sprint with your team.