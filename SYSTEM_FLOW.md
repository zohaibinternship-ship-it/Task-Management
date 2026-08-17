# System Flow — Task Management System

How the whole system works end to end: from a fresh database to a task being
created, worked on, and audited. This is a narrative walkthrough, not an API
reference — see the route files under `server/src/routes/` for exact
endpoints.

---

## 1. Architecture at a glance

```
 Browser (React SPA)  ──HTTPS + cookies──▶  Express API  ──Prisma──▶  PostgreSQL (Supabase)
   client/                                    server/
```

- **Client** (`client/`): a Vite/React single-page app. It never talks to the
  database directly — every action goes through the API via `axios`
  (`client/src/services/*.js`).
- **Server** (`server/`): an Express API. All business rules (who can do what,
  what state transitions are legal, what gets audited) live here — the
  frontend has no independent authority, it just reflects what the API
  allows.
- **Database**: a single PostgreSQL database (hosted on Supabase), defined by
  the one file `database/schema.sql`. Prisma (`server/prisma/schema.prisma`)
  is the typed query layer the API uses to talk to it.

---

## 2. Standing the system up (one-time setup)

1. **Create the schema**: run `database/schema.sql` once against the Supabase
   database (SQL editor or `psql`). This creates every table, enum, index,
   and constraint, and seeds the 3 roles (`super_admin`, `admin`, `employee`)
   and 1 permission key.
2. **Configure the server**: fill real values into `server/.env` (database
   connection strings, session secret, Super Admin credentials — see
   `server/.env.example` for the full list).
3. **Create the Super Admin**: run `npm run seed` from `/server`. This is the
   only account creation step that happens outside the app itself — every
   other user (Admins, Employees) is created *through* the app by someone who
   already has a session.
4. **Run it**: `npm run dev` in both `server/` and `client/`. The client
   talks to the server at `VITE_API_BASE_URL` (default
   `http://localhost:4000/api`).

From this point on, everything below happens through normal use of the app.

---

## 3. Authentication flow

1. A user submits email + password on the login screen
   (`POST /api/auth/login`).
2. The server looks up the user, verifies the password with bcrypt, and — if
   the account is active — creates a `Session` row (a hashed, opaque random
   token; only the SHA-256 hash is stored in the database) and sets it as a
   signed, `httpOnly`, `sameSite=lax` cookie. The raw token never touches
   `localStorage` or JavaScript on the client.
3. Every subsequent request automatically carries that cookie
   (`withCredentials: true` on the frontend's axios client). The
   `authenticate` middleware (`server/src/middleware/auth.js`) verifies the
   session on every request, confirms it hasn't expired or been revoked, and
   confirms the user is still active — so deactivating someone mid-session
   locks them out immediately, not just on their next login.
4. `requireRole(...)` middleware then gates specific routes by role
   (`super_admin` / `admin` / `employee`).
5. **Logout** revokes the session server-side and clears the cookie.
   **Change password** revokes every *other* session for that user, so a
   stolen cookie stops working the moment the real owner changes their
   password.
6. A wrong password and an unknown email return the exact same generic error
   — the API never reveals whether an email exists.

---

## 4. People management flow

- **Super Admin creates Admins** (`POST /api/admins`, Super Admin only — an
  Admin can never create or deactivate another Admin, by route-level
  restriction, not just a UI hint).
- **Admin or Super Admin creates Employees** (`POST /api/employees`).
- Every account starts active; either role can deactivate/reactivate accounts
  they're allowed to manage. A user can never deactivate themselves (blocked
  server-side, to prevent accidental lockout).
- Passwords are never returned by any API response, ever — `sanitizeUser`
  strips the hash from every payload.
- Every create/activate/deactivate action writes an audit log entry with the
  actor's id/role and the old/new value.

---

## 5. Task lifecycle — the core flow

This is the main loop of the system:

```
 (Admin/Super Admin)                              (Employee, once assigned)
        │                                                   │
   1. Create task ──▶ 2. Assign to employee ──▶ 3. pending ─┼─▶ start
        │                     (optional at                  │      │
        │                      creation, or                 │      ▼
        │                      later via /assign)            │  in_progress
        │                                                    │   │    │
        │                                                    │ pause │ complete
        │                                                    │   ▼    ▼
        │                                                    │ paused  completed
        │                                                    │   │
        │                                                    │ resume
        │                                                    │   ▼
        │                                                    │ in_progress
        │                                                    │
   4. (any time, non-terminal) cancel ──────────────────────▶  cancelled
```

**1. Creation** (`POST /api/tasks`, Admin/Super Admin) — title, description,
project, dates, expected hours, priority, reference links; a human-readable
code like `TSK-014` is generated automatically. An assignee can be set at
creation time, or left unassigned.

**2. Assignment** (`POST /api/tasks/:id/assign`) — closes any existing open
assignment, opens a new one, and updates the task's current assignee. Every
assignment is kept as a permanent history row (`task_assignments`), not just
overwritten — so "who worked on this and when" is always answerable. Refuses
to assign a deactivated or non-employee account, and refuses to reassign a
completed/cancelled task.

**3. The employee's workflow** — only the currently assigned employee can
drive their own task (re-checked server-side on every action, not just
hidden in the UI, so a direct API call from a different employee is
rejected):
- **Start** (`pending → in_progress`) opens a `task_session` row (records
  `startedAt`).
- **Pause** (`in_progress → paused`) closes that session and stores its
  duration.
- **Resume** (`paused → in_progress`) opens a new session.
- **Complete** (`in_progress → completed`) closes the open session; this is
  a terminal state.

Every transition is guarded by an atomic status check — a status can only
move along the exact arrows in the diagram above; e.g. a completed task can
never be pushed back to `in_progress`. Time spent on a task is *never*
something a client can write directly — it's always the sum of closed
session durations plus (if a session is currently open) the live elapsed
time, computed fresh on every read.

**4. Cancel** (`POST /api/tasks/:id/cancel`, Admin/Super Admin) is available
from any non-terminal status.

**Progress updates** — while working, an employee can post short text
updates to their own assigned task (`POST /api/tasks/:id/updates`).
Append-only: there's no edit or delete endpoint, so the record of what was
reported and when can't be altered after the fact.

**QA / approval fields** (`qaStatus`, `lineManagerApproval`,
`ceoAuditStatus`) are admin-editable fields on the task, tracked alongside
the workflow status but not part of the status state machine itself.

---

## 6. Audit trail

Every sensitive action across the system — login/logout, password changes,
account creation/activation, task creation/assignment/status changes/field
edits/cancellation — writes a row to `audit_logs` with who did it, their
role at the time, what changed (old value → new value), and when.

- `GET /api/tasks/:id/history` merges a task's audit trail with its progress
  updates into one time-sorted timeline — the full story of one task in one
  call.
- `GET /api/audit-logs` (Admin/Super Admin) is the global, filterable log.
- `GET /api/audit-logs/me` lets any authenticated user see their own
  activity.
- By default, an Admin's view of the global log has Super-Admin-on-Admin
  actions (creating/activating/deactivating other Admins) filtered out — see
  `ROLES_AND_PERMISSIONS.md` for how a Super Admin can lift that.

---

## 7. Dashboards

- **Employee dashboard**: task counts by status, total/today's hours worked
  (including live elapsed time from whatever task is currently in
  progress), current active task, recent activity.
- **Admin dashboard**: employee counts, company-wide task counts, total
  hours logged, tasks due in the next 3 days, recent audit activity.
- **Reports** (Admin/Super Admin): task breakdown by priority, top employees
  by hours logged.

All figures are computed at read time from the underlying tables — nothing
is a stored/cached total that could drift out of sync.

---

## 8. Session end

A session ends when the user logs out, changes their password (revokes
other sessions), is deactivated by an admin (locks out immediately on their
next request), or the session simply expires (`SESSION_TTL_HOURS`).
