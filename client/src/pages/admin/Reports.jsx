import { useFetch } from '../../hooks/useFetch.js';
import { getReports } from '../../services/dashboard.service.js';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { formatDuration } from '../../utils/format.js';

const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low'];
const PRIORITY_COLORS = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-sky-500',
  low: 'bg-gray-400',
};

function Bar({ label, value, max, colorClass }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-xs text-navy-600 capitalize">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-surface-muted overflow-hidden">
        <div className={`h-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-xs text-navy-600 text-right">{value}</span>
    </div>
  );
}

export default function Reports() {
  const { data, loading, error, refetch } = useFetch(getReports);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const { priorityBreakdown, topEmployeesByHours, taskCounts } = data;
  const maxPriority = Math.max(1, ...Object.values(priorityBreakdown));
  const maxHours = Math.max(1, ...topEmployeesByHours.map((e) => e.totalSeconds));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-navy-900">Reports</h1>
        <p className="text-sm text-navy-500">Company-wide breakdowns for {taskCounts.total} tasks.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-navy-900 mb-4">Tasks by Priority</h2>
          <div className="space-y-3">
            {PRIORITY_ORDER.map((p) => (
              <Bar key={p} label={p} value={priorityBreakdown[p] ?? 0} max={maxPriority} colorClass={PRIORITY_COLORS[p]} />
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-navy-900 mb-4">Top Employees by Hours Logged</h2>
          {topEmployeesByHours.length === 0 ? (
            <EmptyState title="No completed work sessions yet" />
          ) : (
            <div className="space-y-3">
              {topEmployeesByHours.map((row) => (
                <div key={row.employee?.id} className="flex items-center gap-3">
                  <span className="w-28 text-xs text-navy-600 truncate">{row.employee?.name ?? 'Unknown'}</span>
                  <div className="flex-1 h-3 rounded-full bg-surface-muted overflow-hidden">
                    <div
                      className="h-full bg-gold-500"
                      style={{ width: `${Math.round((row.totalSeconds / maxHours) * 100)}%` }}
                    />
                  </div>
                  <span className="w-16 text-xs text-navy-600 text-right">{formatDuration(row.totalSeconds)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
