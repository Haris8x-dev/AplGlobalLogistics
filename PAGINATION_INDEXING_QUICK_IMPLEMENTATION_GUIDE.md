# Pagination, Querying, and Indexing: Exact Implementation Map (APL Core)

This version is rewritten to remove confusion.

Core rule:
1. Indexing is database/schema work.
2. Querying and pagination are backend controller work.
3. Page controls and filter inputs are frontend work.

No application logic is changed in this guide.

---

## 1) Layer split: who does what

## 1.1 Schema and DB layer

File:
- server/prisma/schema.prisma

Do here:
- Define indexes only.
- Do not put pagination logic here.
- Do not put UI logic here.

## 1.2 Backend API layer

Primary file:
- server/src/controllers/stock/clientStockHistory.controller.js

Do here:
- Read page/pageSize/fromDate/toDate/status query params.
- Build where filter.
- Run paginated Prisma queries (count + findMany).
- Return response metadata (page, totalCount, totalPages).

Secondary file (already uses transferGroupId heavily):
- server/src/controllers/stock/pendingTransfer.controller.js

Do here:
- No immediate feature change required.
- This file automatically gets faster once transferGroupId index exists.

## 1.3 Frontend layer

File:
- client/src/pages/admin-dashboard/options/Report.tsx

Do here:
- Send query params to backend.
- Add page controls and date filters.
- Render pagination metadata.

---

## 2) What to implement right now (in exact order)

## Step A: Add indexes first (schema)

File:
- server/prisma/schema.prisma

Model to update first:
- StockMovement

Add these indexes first:
1. transferGroupId
2. clientId + modelId + createdAt(desc)
3. status + createdAt(desc)

Why these three first:
1. transferGroupId speeds proceed/cancel/edit group actions.
2. clientId+modelId+createdAt speeds report history timeline.
3. status+createdAt speeds pending/status list reads.

Example shape (conceptual):

```prisma
model StockMovement {
  // existing fields...

  @@index([transferGroupId], map: "idx_sm_transfer_group")
  @@index([clientId, modelId, createdAt(sort: Desc)], map: "idx_sm_client_model_created_desc")
  @@index([status, createdAt(sort: Desc)], map: "idx_sm_status_created_desc")
}
```

Then run migration flow:
1. create migration
2. apply migration
3. regenerate Prisma client

## Step B: Add pagination and filtering in backend

File:
- server/src/controllers/stock/clientStockHistory.controller.js

Function:
- getClientStockHistory

Add query params:
1. page (default 1)
2. pageSize (default 25, max 100)
3. fromDate (optional)
4. toDate (optional)
5. status (optional)

Backend query logic:
1. Start where with clientId + modelId.
2. If fromDate/toDate present, add createdAt range.
3. If status present, add status filter.
4. Run count query.
5. Run findMany with skip/take + orderBy createdAt desc, id desc.
6. Return data + pagination metadata.

Important for your date requirement (entry date not time):
- Use date range, not DATE(createdAt) in WHERE.

Correct pattern:
1. fromDate=2026-03-30 means createdAt >= 2026-03-30 00:00:00
2. toDate=2026-03-30 means createdAt < 2026-03-31 00:00:00

Why:
- This keeps index usage efficient.

## Step C: Update Report frontend to consume paginated API

File:
- client/src/pages/admin-dashboard/options/Report.tsx

In state add:
1. page
2. pageSize
3. totalCount
4. totalPages
5. fromDate
6. toDate

In fetchHistory:
1. include page/pageSize/fromDate/toDate/status in query string.
2. read metadata from backend response.

In UI add:
1. Previous button
2. Next button
3. current page indicator
4. date from / date to filters

Flow requirement:
1. When filter changes, reset page = 1.
2. When model or client changes, reset page = 1.

---

## 3) End-to-end flow (exact)

1. User opens Report and picks a client/model.
2. User sets date range (optional) and page.
3. Frontend calls:
   - /api/stock/history/:clientId/:modelId?page=1&pageSize=25&fromDate=...&toDate=...
4. Backend controller parses query params.
5. Backend builds where clause and runs count + paginated findMany.
6. PostgreSQL uses indexes to fetch rows quickly.
7. Backend returns data + totalCount + totalPages.
8. Frontend renders table and page buttons smoothly.

---

## 4) Why this fixes slowness

Without pagination:
- one request can fetch thousands of rows.

With pagination:
- one request fetches only 25 or 50 rows.

Without index:
- DB scans large parts of table repeatedly.

With index:
- DB jumps directly to relevant rows.

Combined effect:
1. lower DB CPU
2. lower network payload
3. faster UI rendering
4. stable response as data grows

---

## 5) Exactly where index is needed vs where query is needed

Indexing needed:
1. server/prisma/schema.prisma only (then migration applies in DB)

Query and pagination needed:
1. server/src/controllers/stock/clientStockHistory.controller.js

UI consumption needed:
1. client/src/pages/admin-dashboard/options/Report.tsx

So yes, you are correct:
- indexing is backend/database side, not frontend side
- frontend only requests and displays paginated data

---

## 6) Optional second wave after this is stable

1. Add pagination to recent activity in server/src/controllers/stock/clientStockHistory.controller.js
2. Add server-side pagination/search for clients list
3. Add server-side pagination/search for models list
4. Add server-side pagination/search for users list

Files for second wave:
1. server/src/controllers/admin/clients/clientsGet.controller.js
2. server/src/controllers/admin/inventory/categories/invGetAdminInventory.controller.js
3. server/src/controllers/admin/inventory/mobiles/invGetAllMobiles.controller.js
4. server/src/controllers/auth/authGetAuth.controller.js

---

## 7) Quick checklist before coding

1. Add indexes first and run migration.
2. Update getClientStockHistory for page/filter metadata.
3. Update Report.tsx to use metadata and page controls.
4. Test with 1k to 50k stock movement rows.
5. Measure response times before and after.

If this order is followed, behavior will be smooth and predictable as data grows.