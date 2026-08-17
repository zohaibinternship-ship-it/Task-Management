-- =============================================================================
-- Task Management System — Database Schema (PostgreSQL / Supabase)
-- =============================================================================
-- This is the single, standalone SQL file for this project. It creates the
-- full schema AND seeds the reference data (roles + permissions).
--
-- Run it once against a fresh Supabase Postgres database — paste it into the
-- Supabase SQL editor, or:
--   psql "$DATABASE_URL" -f database/schema.sql
--
-- It is idempotent: enum/table creation uses fresh names (safe on a fresh DB)
-- and the seed INSERTs at the bottom use ON CONFLICT DO NOTHING, so re-running
-- it against a DB that already has this schema/seed data is a no-op rather
-- than an error.
--
-- This file is the source of truth for the schema. `server/prisma/schema.prisma`
-- must be kept in sync with it by hand (there is no migrations folder in this
-- project — the DB is provisioned by running this file directly, not via
-- `prisma migrate`). `server/prisma/schema.prisma` is used only to generate
-- the typed Prisma Client the app talks to at runtime (`npm run prisma:generate`).
--
-- After running this file, create the Super Admin account by running
-- `npm run seed` from /server — that step needs Node so the password can be
-- bcrypt-hashed with the same library the app uses at login time; it cannot
-- be done safely from plain SQL.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE "RoleName" AS ENUM ('super_admin', 'admin', 'employee');
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high', 'critical');
-- Workflow-controlled statuses only. "Overdue" is derived at read time from
-- (deadline < now AND status NOT IN ('completed','cancelled')), never stored,
-- so a task's real workflow state is never overwritten by a deadline passing.
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'in_progress', 'paused', 'completed', 'cancelled');
CREATE TYPE "QaStatus" AS ENUM ('not_required', 'pending', 'in_review', 'passed', 'failed');
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE "CeoAuditStatus" AS ENUM ('pending', 'reviewed', 'flagged', 'approved');

-- ---------------------------------------------------------------------------
-- Roles & permissions
-- ---------------------------------------------------------------------------

CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" "RoleName" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

CREATE TABLE "role_permissions" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- ---------------------------------------------------------------------------
-- Users & sessions
-- ---------------------------------------------------------------------------

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" TEXT,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "users_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_role_id_idx" ON "users"("role_id");

CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- ---------------------------------------------------------------------------
-- Projects & tasks
-- ---------------------------------------------------------------------------

CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "projects_name_key" ON "projects"("name");

CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "project_id" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_by_id" TEXT NOT NULL,
    "current_assignee_id" TEXT,
    "start_date" TIMESTAMP(3),
    "expected_end_date" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "expected_hours" DECIMAL(6,2),
    "priority" "TaskPriority" NOT NULL DEFAULT 'medium',
    "status" "TaskStatus" NOT NULL DEFAULT 'pending',
    "reference_links" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deliverable_links" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "qa_status" "QaStatus" NOT NULL DEFAULT 'not_required',
    "qa_report" TEXT,
    "line_manager_approval" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "ceo_audit_status" "CeoAuditStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tasks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tasks_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tasks_expected_hours_nonnegative" CHECK ("expected_hours" IS NULL OR "expected_hours" >= 0)
);
CREATE UNIQUE INDEX "tasks_code_key" ON "tasks"("code");
CREATE INDEX "tasks_project_id_idx" ON "tasks"("project_id");
CREATE INDEX "tasks_status_idx" ON "tasks"("status");
CREATE INDEX "tasks_deadline_idx" ON "tasks"("deadline");
CREATE INDEX "tasks_current_assignee_id_idx" ON "tasks"("current_assignee_id");

CREATE TABLE "task_assignments" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "assigned_by_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassigned_at" TIMESTAMP(3),
    CONSTRAINT "task_assignments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "task_assignments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "task_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "task_assignments_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "task_assignments_task_id_idx" ON "task_assignments"("task_id");
CREATE INDEX "task_assignments_employee_id_idx" ON "task_assignments"("employee_id");

CREATE TABLE "task_sessions" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "duration_seconds" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "task_sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "task_sessions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "task_sessions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "task_sessions_ended_after_started" CHECK ("ended_at" IS NULL OR "ended_at" >= "started_at")
);
CREATE INDEX "task_sessions_task_id_idx" ON "task_sessions"("task_id");
CREATE INDEX "task_sessions_employee_id_idx" ON "task_sessions"("employee_id");

CREATE TABLE "task_updates" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "task_updates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "task_updates_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "task_updates_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "task_updates_task_id_idx" ON "task_updates"("task_id");

-- Uploaded by an Admin/Super Admin to a task, any file type. Files live on local disk
-- under server/uploads/tasks/<taskId>/ — file_path stores only the generated on-disk
-- filename, never a client-supplied path.
CREATE TABLE "task_attachments" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "task_attachments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "task_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "task_attachments_task_id_idx" ON "task_attachments"("task_id");

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------

CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "old_value" JSONB,
    "new_value" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- ---------------------------------------------------------------------------
-- Seed data: roles & permissions
-- ---------------------------------------------------------------------------
-- Mirrors server/prisma/seed.js's non-secret portion (roles + the one
-- permission key). Safe to run here since neither carries credentials — the
-- Super Admin account still requires `npm run seed` for its bcrypt hash.

INSERT INTO "roles" ("name") VALUES
    ('super_admin'),
    ('admin'),
    ('employee')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "permissions" ("key", "description") VALUES
    ('audit_logs:view_admin_actions', 'View audit log entries about admin accounts being created/activated/deactivated')
ON CONFLICT ("key") DO NOTHING;
