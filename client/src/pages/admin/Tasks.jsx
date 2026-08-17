import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch.js';
import { listTasks } from '../../services/tasks.service.js';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import TaskListTable from '../../components/tasks/TaskListTable.jsx';
import { fieldClass } from '../../components/common/FormField.jsx';

export default function AdminTasks() {
  const [filters, setFilters] = useState({ status: '', priority: '', overdue: '', search: '', page: 1 });

  const { data, loading, error, refetch } = useFetch(
    () =>
      listTasks({
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        overdue: filters.overdue || undefined,
        search: filters.search || undefined,
        page: filters.page,
      }),
    [filters.status, filters.priority, filters.overdue, filters.search, filters.page],
  );

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-navy-900">All Tasks</h1>
          <p className="text-sm text-navy-500">Every task across the company.</p>
        </div>
        <Link to="/admin/tasks/new">
          <Button variant="gold">
            <PlusCircle size={16} />
            Create Task
          </Button>
        </Link>
      </div>

      <Card className="p-4 flex flex-wrap gap-3">
        <input
          className={fieldClass + ' w-56'}
          placeholder="Search title or code..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
        />
        <select className={fieldClass + ' w-40'} value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select className={fieldClass + ' w-36'} value={filters.priority} onChange={(e) => updateFilter('priority', e.target.value)}>
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <select className={fieldClass + ' w-36'} value={filters.overdue} onChange={(e) => updateFilter('overdue', e.target.value)}>
          <option value="">All tasks</option>
          <option value="true">Overdue only</option>
          <option value="false">Not overdue</option>
        </select>
      </Card>

      <Card>
        {loading && <LoadingState />}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {data && (
          <>
            <TaskListTable tasks={data.tasks} basePath="/admin/tasks" showAssignee />
            <Pagination pagination={data.pagination} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />
          </>
        )}
      </Card>
    </div>
  );
}
