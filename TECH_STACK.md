# Tech Stack, Tools & Roadmap

## Frontend (`client/`)

| Purpose | Tool | Version |
|---|---|---|
| UI library | React | 19 |
| Build tool / dev server | Vite | 8 |
| Routing | React Router | 7 |
| Styling | Tailwind CSS | 4 (via `@tailwindcss/vite`) |
| HTTP client | Axios | 1.x |
| Icons | Lucide React | — |
| Animation | Framer Motion | 13 (used sparingly — modal open/close only) |
| Class name utility | clsx | — |
| Linter | oxlint | — |

A single-page app with no server-side rendering. State is plain React
`useState`/`useEffect`/Context — no Redux/Zustand/React Query; a small
custom `useFetch` hook covers the shared loading/error/data pattern instead.

## Backend (`server/`)

| Purpose | Tool | Version |
|---|---|---|
| Runtime | Node.js | 22 (ES modules, `"type": "module"`) |
| Web framework | Express | 4 |
| ORM / query builder | Prisma | 5 (`@prisma/client`) |
| Schema validation | Zod | 4 |
| Password hashing | bcryptjs | — |
| Security headers | Helmet | 8 |
| CORS | cors | — |
| Cookies | cookie-parser (signed cookies) | — |
| Rate limiting | express-rate-limit | 8 |
| Date/timezone math | Luxon | 3 |
| Request logging | Morgan | — |
| Env loading | dotenv | 17 |
| Dev auto-restart | nodemon | 3 |

A plain layered Express API — no NestJS/tRPC/GraphQL. Layers are explicit
folders: `routes/ → controllers/ → services/ → repositories/`, plus
`validators/`, `middleware/`, `utils/`, and `constants/`. Sessions are
opaque random tokens in a signed `httpOnly` cookie (not JWT) — the token
hash, not the token itself, is stored server-side, so a stolen database
can't be used to forge a session.

## Database

| Purpose | Tool |
|---|---|
| Database engine | PostgreSQL |
| Hosting | Supabase (managed Postgres + connection pooler) |
| Schema definition | One file: `database/schema.sql` (see `SYSTEM_FLOW.md` §2) |
| Runtime query layer | Prisma Client, generated from `server/prisma/schema.prisma` |

No ORM-managed migrations in this project (`prisma migrate` is
intentionally not used) — the schema is provisioned by running
`database/schema.sql` directly, and `schema.prisma` is kept in sync with it
by hand. This was a deliberate choice made when consolidating the schema
into a single file the project owner could run directly in Supabase's SQL
editor.

## Tooling / workflow

- **Package manager**: npm, two independent workspaces (`client/`,
  `server/` each with their own `package.json`/lockfile — not a monorepo
  tool like Turborepo/Nx).
- **Linting**: oxlint (client only, zero-config, fast Rust-based linter).
- **No test framework installed yet** — see Roadmap below.
- **No CI/CD pipeline configured** — builds/lints/tests are run locally.

## Design decisions worth knowing

- **Time tracking is fully derived, never stored as a total.** "Hours
  worked" is always computed from summing `task_sessions` rows at read
  time (plus live elapsed time for whatever's currently running) — there is
  no writable "spent hours" field anywhere, so it can't drift out of sync
  with reality.
- **"Overdue" is derived, not a stored status.** A task's real workflow
  status (in_progress, paused, etc.) is preserved even after its deadline
  passes; overdue is computed at read time from `deadline < now`.
- **Task assignment history is a real table** (`task_assignments`),
  separate from the generic audit log, so "who worked on this and when"
  can be queried directly.
- **RBAC is primarily role-based**, with one narrow permission-table
  exception (`audit_logs:view_admin_actions`) for the one case in the spec
  that needed finer granularity than three fixed roles.

---

## Future updates / upgrades (roadmap)

Roughly in priority order, based on what's explicitly deferred or flagged
as missing in `PROGRESS.md`:

1. **Automated test suite.** Nothing exists yet beyond manual/curl smoke
   testing. Adding `vitest` + `supertest` for the API (auth, RBAC, the task
   state machine, time-tracking math) would be the highest-value addition —
   it's also the best safety net against regressions in the workflow
   race-condition fix already made.
2. **CI pipeline.** Run lint + build + tests automatically on push (GitHub
   Actions is the natural fit given no CI exists today).
3. **Projects admin page.** The `Project` model and task→project link
   already exist in the schema, but there's no admin UI to create/manage
   projects yet — tasks can only reference one if it's created some other
   way. Left out of v1 as out-of-scope, not because it's hard.
4. **Notifications.** No email/in-app notification system exists — e.g. an
   employee isn't proactively told when a task is assigned to them, an
   admin isn't told when a task becomes overdue. Currently everything is
   pull-based (you see it when you load the dashboard/task list).
5. **File uploads for deliverables.** `deliverableLinks`/`referenceLinks`
   are plain URL arrays today (employee pastes a link to wherever the file
   lives) — there's no direct file upload/storage integration (e.g.
   Supabase Storage).
6. **Region migration for the database**, if the current Tokyo
   (`ap-northeast-1`) Supabase project keeps showing the network-latency
   symptoms documented during setup — moving to a region closer to where
   the app is actually used (e.g. `ap-south-1`) would fix that at the
   infrastructure level rather than needing timeout tuning.
7. **Real-time updates.** Everything is request/response today (no
   WebSockets/SSE) — e.g. an admin watching a task list won't see an
   employee's status change until they refresh.
8. **Mobile-first responsive pass.** The UI is responsive (mobile sidebar
   collapses, grids reflow) but desktop was the explicit primary target;
   a dedicated mobile-UX pass wasn't done.
9. **Fix `DIRECT_URL`** in `server/.env` to point at a true direct
   (non-pooled) Postgres connection instead of duplicating the pooler URL —
   currently harmless (nothing reads it since `prisma migrate` isn't used),
   but worth correcting for completeness if a real direct connection string
   becomes available for this project.
