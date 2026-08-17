// Single source of truth for which statuses are terminal (task workflow is done) — used by
// both task.service.js (overdue derivation, reassignment/cancel guards) and
// taskWorkflow.service.js (start/pause/resume/complete guards) so they can never disagree.
export const TERMINAL_STATUSES = ['completed', 'cancelled'];
