import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch.js';
import { listAuditLogs } from '../../services/auditLogs.service.js';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Card from '../../components/common/Card.jsx';
import Table from '../../components/common/Table.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import Modal from '../../components/common/Modal.jsx';
import { fieldClass } from '../../components/common/FormField.jsx';
import { formatDateTime } from '../../utils/format.js';

export default function AuditLogs() {
  const [filters, setFilters] = useState({ action: '', entityType: '', page: 1 });
  const { data, loading, error, refetch } = useFetch(
    () => listAuditLogs({ ...filters, action: filters.action || undefined, entityType: filters.entityType || undefined }),
    [filters.action, filters.entityType, filters.page],
  );
  const [selected, setSelected] = useState(null);

  const columns = [
    { key: 'actor', header: 'Actor', render: (l) => l.actor?.name ?? 'System' },
    { key: 'actorRole', header: 'Role', render: (l) => l.actorRole ?? '—' },
    { key: 'action', header: 'Action', render: (l) => l.action.replace(/_/g, ' ') },
    { key: 'entityType', header: 'Entity', render: (l) => l.entityType },
    { key: 'createdAt', header: 'Timestamp', render: (l) => formatDateTime(l.createdAt) },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-navy-900">Audit Logs</h1>
        <p className="text-sm text-navy-500">Who did what, and when.</p>
      </div>

      <Card className="p-4 flex flex-wrap gap-3">
        <input
          className={fieldClass + ' w-56'}
          placeholder="Filter by action (e.g. TASK_CREATED)"
          value={filters.action}
          onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value, page: 1 }))}
        />
        <select
          className={fieldClass + ' w-40'}
          value={filters.entityType}
          onChange={(e) => setFilters((f) => ({ ...f, entityType: e.target.value, page: 1 }))}
        >
          <option value="">All entities</option>
          <option value="task">Task</option>
          <option value="user">User</option>
          <option value="role">Role</option>
        </select>
      </Card>

      <Card>
        {loading && <LoadingState />}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {data && (
          <>
            <Table columns={columns} rows={data.logs} onRowClick={setSelected} emptyLabel="No audit entries found" />
            <Pagination pagination={data.pagination} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />
          </>
        )}
      </Card>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Audit Entry Detail">
        {selected && (
          <div className="space-y-3 text-sm">
            <p>
              <span className="text-navy-500">Actor:</span> {selected.actor?.name ?? 'System'} ({selected.actorRole})
            </p>
            <p>
              <span className="text-navy-500">Action:</span> {selected.action}
            </p>
            <p>
              <span className="text-navy-500">Entity:</span> {selected.entityType} {selected.entityId}
            </p>
            <p>
              <span className="text-navy-500">Timestamp:</span> {formatDateTime(selected.createdAt)}
            </p>
            {selected.oldValue && (
              <div>
                <p className="text-navy-500 mb-1">Old value</p>
                <pre className="bg-surface-muted rounded-lg p-2 text-xs overflow-x-auto">
                  {JSON.stringify(selected.oldValue, null, 2)}
                </pre>
              </div>
            )}
            {selected.newValue && (
              <div>
                <p className="text-navy-500 mb-1">New value</p>
                <pre className="bg-surface-muted rounded-lg p-2 text-xs overflow-x-auto">
                  {JSON.stringify(selected.newValue, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
