# Roles & Permissions — Who Can Do What

The system has exactly three roles: **Super Admin**, **Admin**, and
**Employee**. Every account has exactly one role, set when it's created and
not changeable afterward through the app. Access is enforced on the server
for every single action below — the frontend UI just reflects what the API
allows, so nothing here is "just a UI restriction."

---

## Super Admin

The top of the hierarchy. Everything an Admin can do, plus:

- **Manage Admin accounts** — create Admins, view the Admin list/details,
  activate/deactivate Admin accounts. This is exclusively a Super Admin
  power: an Admin can never create, view the management page for, or
  deactivate another Admin.
- **Manage the permission system** — grant or revoke fine-grained
  permissions to the Admin role. Today there is one such permission:
  `audit_logs:view_admin_actions`, which controls whether Admins can see
  Super-Admin-on-Admin actions (e.g. "Super Admin created/deactivated
  Admin X") in the shared audit log. Off by default; a Super Admin can turn
  it on for all Admins without a code change.
- **Full audit log visibility** — sees every action in the system, including
  the Admin-management actions that are hidden from Admins by default.
- Cannot deactivate their own account (prevents accidental lockout — true
  for every role, not just Super Admin).

Everything below ("what an Admin can do") also applies to a Super Admin,
since role checks that allow `admin` also allow `super_admin`.

---

## Admin

Runs day-to-day operations: people and task management, but not other
Admins.

**People:**
- Create Employee accounts, view the Employee list and individual details,
  activate/deactivate Employees.
- Cannot create, view the management list for, or deactivate other Admins —
  that's Super Admin only.
- Cannot deactivate their own account.

**Tasks:**
- Create tasks (title, description, project, dates, expected hours,
  priority, reference links), optionally assigning an employee at creation
  time.
- Edit a task's admin-controlled fields (title, description, project, dates,
  expected hours, priority, links, QA status/report, line-manager approval).
- **Cannot** directly set a task's workflow status (pending / in_progress /
  paused / completed) — that only moves through the employee-driven
  start/pause/resume/complete actions, so the true work state can't be
  faked from the admin side.
- Assign or reassign a task to any active Employee (refused for a
  deactivated employee, a non-employee account, or a completed/cancelled
  task).
- Cancel a task from any non-terminal status.
- View every task in the system (not just ones they created), with filters
  for status, priority, assignee, project, overdue, and text search.
- View any task's full history (audit trail + progress updates, merged and
  time-sorted).

**Visibility:**
- Admin dashboard: employee counts, company task counts, total hours
  logged, tasks due soon, recent audit activity.
- Reports: task breakdown by priority, top employees by hours logged.
- Global audit log — filtered by default to hide Super-Admin-on-Admin
  actions, unless a Super Admin has granted the
  `audit_logs:view_admin_actions` permission.
- Their own activity log (`/audit-logs/me`), like every role.

**Account:**
- Change their own password (which revokes all their other active
  sessions).

---

## Employee

Works the tasks assigned to them. No visibility into or authority over
anyone else's account or tasks.

**Tasks — strictly scoped to "assigned to me":**
- View only tasks currently assigned to them (`GET /api/tasks/my`). A direct
  request for a task *not* assigned to them is rejected with 403, even if
  they know or guess the task's id — ownership is checked server-side on
  every read and every action, not just hidden in the UI.
- Drive their own task through its workflow:
  - **Start** a pending task → begins time tracking.
  - **Pause** an in-progress task → stops the clock, can resume later.
  - **Resume** a paused task → starts the clock again.
  - **Complete** an in-progress task → final state, stops the clock.
  - Illegal transitions are rejected (e.g. can't "start" a task that's
    already completed).
- Post progress-update notes on their own assigned task. Cannot edit or
  delete a note once posted, and cannot post to, or otherwise touch, a task
  assigned to someone else.
- View their own task's full history.

**Cannot:**
- Create, edit core fields of, assign, reassign, or cancel any task —
  that's Admin/Super Admin only.
- See the global task list, other employees' tasks, employee/admin
  management, or the global audit log.

**Dashboard & activity:**
- Personal dashboard: their task counts by status, total/today's hours
  worked (including live time from whatever task is currently in
  progress), their current active task, and their own recent activity.
- Their own activity log (`/audit-logs/me`).

**Account:**
- Change their own password (revokes their other active sessions).
- Cannot deactivate their own account.

---

## Quick reference table

| Capability | Super Admin | Admin | Employee |
|---|:---:|:---:|:---:|
| Create/manage Admin accounts | ✅ | ❌ | ❌ |
| Create/manage Employee accounts | ✅ | ✅ | ❌ |
| Grant/revoke permissions | ✅ | ❌ | ❌ |
| Create / edit / assign / cancel tasks | ✅ | ✅ | ❌ |
| View all tasks in the system | ✅ | ✅ | ❌ (own only) |
| Start / pause / resume / complete a task | ❌* | ❌* | ✅ (own only) |
| Post progress updates on a task | ❌ | ❌ | ✅ (own only) |
| View global audit log | ✅ (full) | ✅ (filtered by default) | ❌ (own only) |
| Admin/company dashboards & reports | ✅ | ✅ | ❌ (personal only) |
| Deactivate own account | ❌ | ❌ | ❌ |

\* By design — task workflow status is deliberately only movable by the
employee actually doing the work, so it always reflects real progress.
