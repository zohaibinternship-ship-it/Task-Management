import * as taskSessionRepository from '../repositories/taskSession.repository.js';

// Spent time is always derived from task_sessions — never a field an employee can write
// directly. Closed sessions contribute their stored duration; at most one open session per
// task contributes its live elapsed time, computed at read time (not stored).
export async function attachTimeTracking(tasks) {
  const taskIds = tasks.map((t) => t.id);
  const [sums, openSessions] = await Promise.all([
    taskSessionRepository.sumClosedDurationForTasks(taskIds),
    taskSessionRepository.findOpenForTasks(taskIds),
  ]);
  const openByTaskId = new Map(openSessions.map((s) => [s.taskId, s]));
  const now = Date.now();

  return tasks.map((task) => {
    const open = openByTaskId.get(task.id);
    const closedSeconds = sums.get(task.id) ?? 0;
    const liveSeconds = open ? Math.max(0, Math.round((now - open.startedAt.getTime()) / 1000)) : 0;
    return {
      ...task,
      spentSeconds: closedSeconds + liveSeconds,
      activeSessionStartedAt: open ? open.startedAt : null,
    };
  });
}
