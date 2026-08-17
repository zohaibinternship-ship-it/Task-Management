import { ListChecks, Clock, PlayCircle, AlertTriangle, CheckCircle2, Hourglass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch.js';
import { getEmployeeDashboard } from '../../services/dashboard.service.js';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { formatDateTime, formatDuration, formatRelativeToNow } from '../../utils/format.js';

export default function EmployeeDashboard() {
  const { data, loading, error, refetch } = useFetch(getEmployeeDashboard);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const { taskCounts, totalSecondsWorked, todaySecondsWorked, currentTask, recentActivity } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-navy-900">My Dashboard</h1>
        <p className="text-sm text-navy-500">Your tasks and work activity at a glance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={taskCounts.total} icon={ListChecks} />
        <StatCard label="Pending" value={taskCounts.pending} icon={Hourglass} />
        <StatCard label="In Progress" value={taskCounts.inProgress} icon={PlayCircle} accent />
        <StatCard label="Completed" value={taskCounts.completed} icon={CheckCircle2} />
        <StatCard label="Overdue" value={taskCounts.overdue} icon={AlertTriangle} />
        <StatCard label="Total Hours" value={formatDuration(totalSecondsWorked)} icon={Clock} />
        <StatCard label="Today's Hours" value={formatDuration(todaySecondsWorked)} icon={Clock} accent />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-navy-900 mb-3">Current Active Task</h2>
          {currentTask ? (
            <Link to={`/my-tasks/${currentTask.task.id}`} className="block hover:opacity-80">
              <p className="font-medium text-navy-900">{currentTask.task.title}</p>
              <p className="text-xs text-navy-500 font-mono">{currentTask.task.code}</p>
              <p className="text-xs text-navy-500 mt-1">Started {formatRelativeToNow(currentTask.startedAt)}</p>
            </Link>
          ) : (
            <EmptyState title="No active task" description="Start a task from My Tasks to begin tracking time." />
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-navy-900 mb-3">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <EmptyState title="No recent activity" />
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((update) => (
                <li key={update.id} className="text-sm">
                  <p className="text-navy-800">{update.message}</p>
                  <p className="text-xs text-navy-500">
                    {update.task?.title} · {formatDateTime(update.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
