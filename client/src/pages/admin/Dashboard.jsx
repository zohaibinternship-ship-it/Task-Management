import { Link } from 'react-router-dom';
import { Users, ListChecks, Hourglass, PlayCircle, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch.js';
import { getAdminDashboard } from '../../services/dashboard.service.js';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import PriorityBadge from '../../components/common/PriorityBadge.jsx';
import { formatDate, formatDateTime, formatDuration } from '../../utils/format.js';

export default function AdminDashboard() {
  const { data, loading, error, refetch } = useFetch(getAdminDashboard);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const { taskCounts, employees, totalSecondsWorked, tasksDueSoon, recentActivity } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-navy-900">Company Dashboard</h1>
        <p className="text-sm text-navy-500">Overview of employees, tasks, and activity.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={employees.total} icon={Users} />
        <StatCard label="Active Employees" value={employees.active} icon={Users} accent />
        <StatCard label="Total Tasks" value={taskCounts.total} icon={ListChecks} />
        <StatCard label="Pending" value={taskCounts.pending} icon={Hourglass} />
        <StatCard label="In Progress" value={taskCounts.inProgress} icon={PlayCircle} />
        <StatCard label="Completed" value={taskCounts.completed} icon={CheckCircle2} />
        <StatCard label="Overdue" value={taskCounts.overdue} icon={AlertTriangle} />
        <StatCard label="Total Hours Worked" value={formatDuration(totalSecondsWorked)} icon={Clock} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-navy-900 mb-3">Tasks Due Soon</h2>
          {tasksDueSoon.length === 0 ? (
            <EmptyState title="Nothing due in the next 3 days" />
          ) : (
            <ul className="space-y-3">
              {tasksDueSoon.map((t) => (
                <li key={t.id}>
                  <Link to={`/admin/tasks/${t.id}`} className="flex items-center justify-between hover:opacity-80">
                    <div>
                      <p className="text-sm font-medium text-navy-900">{t.title}</p>
                      <p className="text-xs text-navy-500 font-mono">{t.code}</p>
                    </div>
                    <div className="text-right">
                      <PriorityBadge priority={t.priority} />
                      <p className="text-xs text-navy-500 mt-1">{formatDate(t.deadline)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-navy-900 mb-3">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <EmptyState title="No recent activity" />
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((log) => (
                <li key={log.id} className="text-sm flex justify-between gap-2">
                  <span className="text-navy-800">
                    {log.actor?.name ?? 'System'} · {log.action.replace(/_/g, ' ').toLowerCase()}
                  </span>
                  <span className="text-navy-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
