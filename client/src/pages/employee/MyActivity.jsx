import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { listMyAuditLogs } from '../../services/auditLogs.service.js';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Card from '../../components/common/Card.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { formatDateTime } from '../../utils/format.js';

const ACTION_LABELS = {
  LOGIN: 'Logged in',
  LOGOUT: 'Logged out',
  PASSWORD_CHANGED: 'Changed password',
  TASK_STARTED: 'Started a task',
  TASK_PAUSED: 'Paused a task',
  TASK_RESUMED: 'Resumed a task',
  TASK_COMPLETED: 'Completed a task',
};

export default function MyActivity() {
  const [page, setPage] = useState(1);
  const { data, loading, error, refetch } = useFetch(() => listMyAuditLogs({ page }), [page]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-navy-900">My Activity</h1>
        <p className="text-sm text-navy-500">A record of your logins and task actions.</p>
      </div>

      <Card>
        {loading && <LoadingState />}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {data && data.logs.length === 0 && <EmptyState title="No activity recorded yet" />}
        {data && data.logs.length > 0 && (
          <>
            <ul className="divide-y divide-navy-900/5">
              {data.logs.map((log) => (
                <li key={log.id} className="px-4 py-3 text-sm flex justify-between">
                  <span className="text-navy-800">{ACTION_LABELS[log.action] ?? log.action}</span>
                  <span className="text-navy-500">{formatDateTime(log.createdAt)}</span>
                </li>
              ))}
            </ul>
            <Pagination pagination={data.pagination} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
