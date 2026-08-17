-- =============================================================================
-- Migration 002: task_attachments
-- =============================================================================
-- Adds file-attachment support to tasks (Admin/Super Admin can attach documents
-- of any format when creating or editing a task). Run this once against the
-- live database — it's additive only (new table, no changes to existing ones)
-- and safe to run alongside existing data.
--
--   psql "$DATABASE_URL" -f database/migrations/002_task_attachments.sql
--
-- This block is also folded into database/schema.sql (the source of truth for
-- a fresh database), so a brand-new DB gets this table from schema.sql alone
-- and never needs to run this file.
-- =============================================================================

CREATE TABLE IF NOT EXISTS "task_attachments" (
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

CREATE INDEX IF NOT EXISTS "task_attachments_task_id_idx" ON "task_attachments"("task_id");
