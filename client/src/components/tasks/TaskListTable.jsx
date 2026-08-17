import { useNavigate } from 'react-router-dom';
import Table from '../common/Table.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import PriorityBadge from '../common/PriorityBadge.jsx';
import { formatDate, formatDuration } from '../../utils/format.js';

export default function TaskListTable({ tasks, basePath, showAssignee = false }) {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'title',
      header: 'Task',
      render: (t) => (
        <div>
          <p className="font-medium text-navy-900">{t.title}</p>
          <p className="text-xs text-navy-500 font-mono">{t.code}</p>
        </div>
      ),
    },
    ...(showAssignee
      ? [{ key: 'assignee', header: 'Assignee', render: (t) => t.currentAssignee?.name ?? 'Unassigned' }]
      : []),
    { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} overdue={t.isOverdue} /> },
    { key: 'priority', header: 'Priority', render: (t) => <PriorityBadge priority={t.priority} /> },
    { key: 'startDate', header: 'Start Date', render: (t) => formatDate(t.startDate) },
    { key: 'deadline', header: 'Deadline', render: (t) => formatDate(t.deadline) },
    { key: 'expectedHours', header: 'Expected', render: (t) => (t.expectedHours ? `${t.expectedHours}h` : '—') },
    { key: 'spentSeconds', header: 'Spent', render: (t) => formatDuration(t.spentSeconds) },
  ];

  return (
    <Table
      columns={columns}
      rows={tasks}
      onRowClick={(t) => navigate(`${basePath}/${t.id}`)}
      emptyLabel="No tasks found"
    />
  );
}
