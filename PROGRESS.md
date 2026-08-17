# Build Progress — Task Management System

Tracks phase-by-phase progress against the full spec the user provided on 2026-08-12.
Update this file as phases complete so work can resume cleanly if interrupted.

## Phase 1 — Project Foundation
**Status: DONE** (committed as `5102612 Phase 1: project foundation`)
- Express backend skeleton (`server/`) + Vite/React/Tailwind frontend skeleton (`client/`)
- Health check route, env config, folder structure scaffolded

## Phase 2 — Database
**Status: IN PROGRESS**
- [x] Prisma schema designed (`server/prisma/schema.prisma`) — roles, permissions, users,
      sessions, projects, tasks, task_assignments, task_sessions, task_updates, audit_logs
- [x] `database/schema.sql` is the single source of truth for the DB schema — creates every
      table/enum/index/constraint and seeds roles + permissions, idempotently. There is no
      `prisma/migrations` folder in this project; the DB is provisioned by running this one
      file directly (SQL editor or `psql "$DATABASE_URL" -f database/schema.sql`), and
      `schema.prisma` is kept in sync with it by hand and used only to generate the Prisma
      Client (`npm run prisma:generate`) the app talks to at runtime.
- [ ] Real Supabase project connected (fill real DATABASE_URL/DIRECT_URL into `server/.env`,
      see `server/.env.example`)
- [ ] `database/schema.sql` actually run against the live DB, connectivity verified
- [ ] Commit schema work to git (currently untracked)

## Phase 3 — Authentication
**Status: CODE COMPLETE — pending live DB verification**
- [x] Login / logout (`POST /api/auth/login`, `POST /api/auth/logout`)
- [x] bcrypt password hashing (`server/src/utils/password.js`)
- [x] Session mechanism — opaque random token in a signed, httpOnly, sameSite=lax cookie;
      only the SHA-256 hash of the token is stored in `sessions.token_hash`
      (`server/src/utils/token.js`, `server/src/repositories/session.repository.js`)
- [x] Protected route middleware (`server/src/middleware/auth.js` → `authenticate`)
- [x] Role-based authorization middleware (`server/src/middleware/authorize.js` → `requireRole(...)`)
- [x] Super Admin seed script (`server/prisma/seed.js` — upserts the 3 roles, creates Super
      Admin from `SUPER_ADMIN_EMAIL/PASSWORD/NAME` env vars if not already present)
- [x] Password change (`POST /api/auth/change-password`) — revokes all other sessions on change
- [x] Account activation/deactivation enforcement at login AND on every authenticated request
      (a deactivated user's existing session cookie stops working immediately)
- [x] Generic "Invalid email or password" error for both wrong-password and unknown-email cases
- [x] Rate limiting on `/api/auth/login` (10 attempts / 15 min, `server/src/middleware/rateLimiter.js`)
- [x] Audit log entries written for LOGIN, LOGOUT, PASSWORD_CHANGED
- [x] Verified without a live DB: server boots, `/api/health` OK, zod validation returns proper
      400s, unauthenticated `/api/auth/me` returns 401, login attempt fails gracefully (500,
      no crash) when DB is unreachable — confirms the whole request pipeline is wired correctly
- [ ] **Blocked on user**: run `npm run seed` and do a real successful login round-trip once
      `server/.env` has real Supabase credentials (user is filling this in themselves)

## Phase 4 — Employee & Admin Management
**Status: CODE COMPLETE — pending live DB verification**
- [x] `POST /api/employees` — Admin or Super Admin creates an employee
- [x] `POST /api/admins` — Super Admin only creates an admin (`server/src/routes/admins.routes.js`
      guards the whole router with `requireRole('super_admin')`)
- [x] `GET /api/employees` / `GET /api/admins` — list with `search`, `status` (active/inactive),
      pagination (`page`, `pageSize`)
- [x] `GET /api/employees/:id` / `GET /api/admins/:id` — details (404s if id belongs to a
      different role, so an employee id can't be probed via the admin endpoint or vice versa)
- [x] `PATCH /api/employees/:id/status` / `PATCH /api/admins/:id/status` — activate/deactivate;
      blocks self-deactivation to prevent lockout; no-ops (no audit spam) if status is already
      what was requested
- [x] Passwords never returned (`sanitizeUser` strips `passwordHash` everywhere)
- [x] Audit entries: EMPLOYEE_CREATED, ADMIN_CREATED, EMPLOYEE_ACTIVATED/DEACTIVATED,
      ADMIN_ACTIVATED/DEACTIVATED, each with actor id/role and old/new value
- [x] Duplicate email → 409 conflict, not a raw DB error
- [x] Verified without live DB: unauthenticated requests to all 4 routers correctly 401 before
      validation/business logic runs
- [ ] Employee detail view does not yet include assigned tasks / working hours / task history —
      deferred to Phase 5/6 since those tables have no data-access layer yet; will extend
      `getUserByIdForRole` or add a dedicated endpoint then, not now
- [ ] **Blocked on user for live testing**: same DB dependency as Phase 3

## Phase 5 — Task Management
**Status: CODE COMPLETE (creation/edit/assignment) — pending live DB verification**
- [x] `POST /api/tasks` (admin/super_admin) — creates task, auto-generates `TSK-###` code
      (retries on collision), optional `assigneeId` at creation time creates the first
      `TaskAssignment` row too
- [x] `PATCH /api/tasks/:id` (admin/super_admin) — edits admin-controlled fields only
      (title/description/project/dates/expectedHours/priority/links/QA/line-manager approval).
      Status is deliberately NOT editable here — only via the Phase 6 workflow endpoints — and
      `createdById`/`currentAssigneeId` are not editable here either (assignment has its own
      endpoint so history is always recorded)
- [x] `POST /api/tasks/:id/assign` — reassignment: closes the open `TaskAssignment`, opens a
      new one, updates the denormalized `currentAssigneeId`, audits old→new employee
      (TASK_ASSIGNED first time, TASK_REASSIGNED after). Refuses on completed/cancelled tasks.
      Refuses assigning to a non-employee or deactivated employee.
- [x] `POST /api/tasks/:id/cancel` (admin/super_admin) — cancels from any non-terminal status
- [x] `GET /api/tasks`, `GET /api/tasks/my`, `GET /api/tasks/:id` — filters: status, priority,
      assigneeId, projectId, `overdue`, text search; pagination. `GET /:id` is shared but an
      employee gets 403 if the task isn't currently assigned to them (ownership enforced
      server-side, not just hidden in the UI)
- [x] Overdue is computed at read time (`deadline < now && status not in [completed,cancelled]`),
      never stored, matching the schema design notes
- [x] Backend validation: title required, dates ordered sensibly (end/deadline not before
      start), expectedHours non-negative, links must be valid URLs, priority/status are enums
      — all rejected server-side regardless of what the frontend sends
- [x] Audit entries: TASK_CREATED, TASK_ASSIGNED/TASK_REASSIGNED, TASK_UPDATED,
      TASK_DEADLINE_CHANGED, TASK_EXPECTED_HOURS_CHANGED (split out per the spec's own example),
      TASK_CANCELLED
- [x] Verified without live DB: all task routes correctly 401 when unauthenticated, including
      `/my` and `/:id` (route ordering checked so `/my` doesn't get swallowed by `/:id`)
- [ ] Start/pause/resume/complete workflow, task_sessions, spent-hours calculation, and
      progress updates are Phase 6, not built yet
- [ ] **Blocked on user for live testing**: same DB dependency as Phases 3-4**

## Phase 6 — Employee Workflow (start/pause/resume/complete, sessions, spent hours)
**Status: CODE COMPLETE — pending live DB verification**
- [x] `POST /api/tasks/:id/{start,pause,resume,complete}` — employee-only, ownership re-checked
      server-side (`taskWorkflow.service.js`); strict status-machine guard per action
      (start only from pending, pause/complete only from in_progress, resume only from paused)
      — a completed task can never be pushed back to in_progress, status never trusted from body
- [x] `task_sessions` rows created/closed automatically by start/pause/resume/complete —
      no endpoint lets a client write `duration_seconds` or "spent hours" directly
- [x] Spent time is always derived (`taskTimeTracking.service.js`): sums closed sessions +
      live elapsed of the one open session, computed at read time, attached to every task DTO
      as `spentSeconds` (+ `activeSessionStartedAt` so the frontend can tick a live timer)
- [x] Progress updates: `POST/GET /api/tasks/:id/updates` — employee can only post to their own
      assigned task; no edit/delete endpoints at all (append-only, so "employees cannot modify
      another employee's updates" is true by construction, not by an ownership check that could
      have a bug)
- [x] `GET /api/tasks/:id/history` — merged, time-sorted timeline of audit entries + progress
      updates for one task
- [x] Audit entries: TASK_STARTED, TASK_PAUSED, TASK_RESUMED, TASK_COMPLETED
- [x] Verified without live DB: all workflow + update routes 401 when unauthenticated
- [ ] **Blocked on user for live testing**: same DB dependency as earlier phases — in particular
      want to verify the pause→resume→pause session math produces correct summed duration

## Phase 7 — Audit System
**Status: CODE COMPLETE — pending live DB verification**
- [x] Every sensitive action across Phases 3-6 writes an `AuditLog` row with actor id, actor
      role, action, entity type/id, old/new value (see list above per phase)
- [x] `GET /api/tasks/:id/history` — per-task timeline (see Phase 6)
- [x] `GET /api/audit-logs` (admin/super_admin) — global log, filterable by action/entityType/
      actorId, paginated
- [x] The `Permission`/`RolePermission` tables (which existed in the schema but were unused
      before this phase) now do real work: by default an Admin's `/api/audit-logs` view has
      `ADMIN_*` actions (Super Admin creating/activating/deactivating other Admins) filtered
      out; a Super Admin can lift that via `POST /api/permissions/roles/admin` with
      `{"key":"audit_logs:view_admin_actions"}`. This matches the spec's "Admin ... View audit
      logs according to their permissions" and the schema's own design note about this being
      the one place permissions were meant to matter.
- [x] `server/prisma/seed.js` now also seeds that one permission key (ungranted by default)
- [x] Verified without live DB: `/api/audit-logs` and `/api/permissions/*` 401 when
      unauthenticated
- [ ] **Blocked on user for live testing**: same DB dependency as earlier phases

## Phase 8 — Dashboards
**Status: CODE COMPLETE (backend + frontend) — pending live DB verification**
- [x] `GET /api/dashboard/employee` — task counts by status, total/today's hours (today's boundary
      computed correctly in `APP_TIMEZONE` via `luxon`, not fragile string math), current active
      task, recent progress-update activity
- [x] `GET /api/dashboard/admin` — employee counts, company task counts, total hours worked,
      tasks due in the next 3 days, recent audit activity
- [x] `GET /api/dashboard/reports` — priority breakdown, top employees by hours logged (used by
      the new Reports page the spec's own admin sidebar (§23) calls for)
- [x] Frontend: `pages/employee/Dashboard.jsx`, `pages/admin/Dashboard.jsx`,
      `pages/admin/Reports.jsx` — stat cards + simple dependency-free bar visualizations
      (no charting library added; spec says charts only where useful, and these are simple
      enough that plain divs are more appropriate than a new dependency)
- [ ] **Blocked on user for live testing**: can't see real numbers until DB has data

## Phase 9 — UI Polish
**Status: MOSTLY DONE as a byproduct of building every page — a dedicated pass may still be useful**
- [x] Navy/gold theme (already defined in `client/src/index.css` from earlier session; reused
      consistently — gold is accent-only, never dominant, per spec)
- [x] Responsive layout: mobile sidebar collapses behind a hamburger/close toggle, grids reflow
      (`grid-cols-2 lg:grid-cols-4` etc.); desktop is the primary target as instructed
- [x] Reusable components used everywhere, not duplicated per page: `Button`, `Card`, `Table`,
      `Modal`, `ConfirmDialog`, `StatusBadge`, `PriorityBadge`, `FormField`, `Pagination`,
      `StatCard`, `LoadingState`, `EmptyState`, `ErrorState`
      (`client/src/components/common/*`, `components/tasks/*`, `components/users/*`)
  - Loading/empty/error states are present on every data-fetching page, not just the happy path
- [x] Subtle animation via `framer-motion` on the one place it earns its keep (modal open/close);
      deliberately not sprinkled everywhere else, per spec's "not a gaming website" instruction
- [x] Verified with a real (headless Firefox) browser: login page renders correctly with the
      navy/gold theme, zero console/page errors, route guards correctly redirect unauthenticated
      users away from both `/` and `/admin/employees` to `/login`
      (Chromium wouldn't launch in this sandbox — missing system shared libraries, no root/sudo
      available to install them — so Firefox was used instead; screenshots taken)
- [ ] Not built: a Projects admin page (Project model/field exists and tasks can optionally
      reference one, but full CRUD for it isn't in the spec's 33 numbered requirements, so it
      was left out for v1 rather than adding an unrequested feature)
- [ ] Full authenticated-flow visual QA (dashboards with real data, task workflow buttons,
      modals with real records) still needs a live DB — only the unauthenticated path could be
      verified so far

## Phase 10 — Testing & Security Review
**Status: PARTIAL — everything possible without a live DB has been checked**
- [x] Every route in every router verified live (via curl against a running server) to reject
      unauthenticated requests with 401 before any validation or business logic runs
- [x] `npm run build` (client) succeeds; `npm run lint` (oxlint) is clean, zero warnings
- [x] Backend: every new file passes `node --check`; the full Express app boots successfully
      and `/api/health` responds correctly on every phase's checkpoint
- [x] Real browser check (Firefox, headless): login page renders correctly, no console/page
      errors, unauthenticated redirects work for both employee and admin protected routes
- [ ] **Not yet possible — needs the live Supabase DB the user is wiring up**:
  - `npm run seed` actually creating roles + Super Admin
  - A real login round-trip and session cookie working end-to-end
  - RBAC enforcement with real employee/admin/super_admin accounts (not just "no session at
    all" which is all that could be tested so far)
  - Task workflow state machine against real data (start→pause→resume→complete, and confirming
    illegal transitions like completed→in_progress are rejected)
  - Time-tracking math (pause/resume session summing) against real sessions
  - Audit log content spot-checks (old/new values actually correct)
  - Deactivated-account login rejection
  - Direct-URL access to another employee's task (should 403)
- [ ] No automated test suite (unit/integration) was written — testing so far is manual/curl-based
      smoke testing per phase, consistent with how this build has proceeded; worth discussing
      whether to add one (e.g. vitest + supertest) once the live DB is connected and the golden
      paths are confirmed working

---

## Current blocker
Waiting on real Supabase connection strings from user (Project Settings → Database →
Connection Pooling URI for `DATABASE_URL`, direct connection URI for `DIRECT_URL`) to
fill into `server/.env`, then run `database/schema.sql` against it (SQL editor or
`psql "$DATABASE_URL" -f database/schema.sql`) and `npm run seed` from `/server`.

## Notes / decisions log
- 2026-08-12: User provided the full product spec. Confirmed existing Phase 1 + partial
  Phase 2 work matches spec closely (RBAC via role FK, derived overdue status, session-based
  time tracking, append-only task_assignments, audit_logs table). Continuing from there
  rather than restarting.
