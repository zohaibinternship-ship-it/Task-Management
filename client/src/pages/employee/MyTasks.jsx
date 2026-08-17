import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { listMyTasks } from '../../services/tasks.service.js';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Card from '../../components/common/Card.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import TaskListTable from '../../components/tasks/TaskListTable.jsx';
import { fieldClass } from '../../components/common/FormField.jsx';

export default function MyTasks() {
  const [filters, setFilters] = useState({ status: '', page: 1 });
  const { data, loading, error, refetch } = useFetch(
    () => listMyTasks({ ...filters, status: filters.status || undefined }),
    [filters.status, filters.page],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-navy-900">My Tasks</h1>
          <p className="text-sm text-navy-500">Tasks currently assigned to you.</p>
        </div>
        <select
          className={fieldClass + ' w-44'}
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value, page: 1 })}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <Card>
        {loading && <LoadingState />}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {data && (
          <>
            <TaskListTable tasks={data.tasks} basePath="/my-tasks" />
            <Pagination pagination={data.pagination} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />
          </>
        )}
      </Card>
    </div>
  );
}
