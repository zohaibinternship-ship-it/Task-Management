import * as dashboardRepository from '../repositories/dashboard.repository.js';
import { startOfTodayInAppTimezone } from '../utils/timezone.js';

// totalSecondsForEmployee only sums *closed* sessions, so while an employee has a task
// actively in progress its live elapsed time is added in here — otherwise "Total Hours" /
// "Today's Hours" would visibly drop back down to their pre-session value every time the
// employee starts working, then jump back up only once they pause/complete.
export async function employeeDashboard(employeeId) {
  const startOfToday = startOfTodayInAppTimezone();
  const [taskCounts, activeSession, totalSeconds, todaySeconds, recentUpdates] = await Promise.all([
    dashboardRepository.employeeTaskCounts(employeeId),
    dashboardRepository.activeSessionForEmployee(employeeId),
    dashboardRepository.totalSecondsForEmployee(employeeId),
    dashboardRepository.totalSecondsForEmployee(employeeId, startOfToday),
    dashboardRepository.recentUpdatesForEmployee(employeeId),
  ]);

  const now = Date.now();
  const liveSeconds = activeSession
    ? Math.max(0, Math.round((now - activeSession.startedAt.getTime()) / 1000))
    : 0;
  const liveSecondsToday = activeSession
    ? Math.max(0, Math.round((now - Math.max(activeSession.startedAt.getTime(), startOfToday.getTime())) / 1000))
    : 0;

  return {
    taskCounts,
    totalSecondsWorked: totalSeconds + liveSeconds,
    todaySecondsWorked: todaySeconds + liveSecondsToday,
    currentTask: activeSession
      ? { task: activeSession.task, startedAt: activeSession.startedAt }
      : null,
    recentActivity: recentUpdates,
  };
}

export async function reportsSummary() {
  const [priorityBreakdown, topEmployees, taskCounts] = await Promise.all([
    dashboardRepository.tasksByPriority(),
    dashboardRepository.topEmployeesByHours(),
    dashboardRepository.companyTaskCounts(),
  ]);
  return { priorityBreakdown, topEmployeesByHours: topEmployees, taskCounts };
}

export async function adminDashboard() {
  const [taskCounts, employees, totalSeconds, dueSoon, recentActivity] = await Promise.all([
    dashboardRepository.companyTaskCounts(),
    dashboardRepository.employeeCounts(),
    dashboardRepository.totalHoursWorkedSeconds(),
    dashboardRepository.tasksDueSoon(),
    dashboardRepository.recentAuditActivity(),
  ]);

  return {
    taskCounts,
    employees,
    totalSecondsWorked: totalSeconds,
    tasksDueSoon: dueSoon,
    recentActivity,
  };
}
