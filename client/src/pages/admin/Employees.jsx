import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch.js';
import {
  listEmployees,
  createEmployee,
  setEmployeeStatus,
  deleteEmployee,
  updateEmployeeCredentials,
} from '../../services/employees.service.js';
import ManageCredentialsModal from '../../components/users/ManageCredentialsModal.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { fieldClass } from '../../components/common/FormField.jsx';
import UserTable from '../../components/users/UserTable.jsx';
import CreateUserModal from '../../components/users/CreateUserModal.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { extractErrorMessage } from '../../services/api.js';

export default function Employees() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ search: '', status: '', page: 1 });
  const { data, loading, error, refetch, setData } = useFetch(
    () => listEmployees({ ...filters, status: filters.status || undefined, search: filters.search || undefined }),
    [filters.search, filters.status, filters.page],
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [target, setTarget] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [credentialsTarget, setCredentialsTarget] = useState(null);

  function handleCreated() {
    setCreateOpen(false);
    refetch();
  }

  async function handleToggleConfirm() {
    setToggling(true);
    setToggleError('');
    try {
      const updated = await setEmployeeStatus(target.id, !target.isActive);
      setData((prev) => ({ ...prev, users: prev.users.map((u) => (u.id === updated.id ? updated : u)) }));
      setTarget(null);
    } catch (err) {
      setToggleError(extractErrorMessage(err));
    } finally {
      setToggling(false);
    }
  }

  async function handleDeleteConfirm() {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteEmployee(deleteTarget.id);
      setData((prev) => ({ ...prev, users: prev.users.filter((u) => u.id !== deleteTarget.id) }));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(extractErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-navy-900">Employees</h1>
          <p className="text-sm text-navy-500">Everyone with employee-level access.</p>
        </div>
        <Button variant="gold" onClick={() => setCreateOpen(true)}>
          <PlusCircle size={16} />
          Add Employee
        </Button>
      </div>

      <Card className="p-4 flex flex-wrap gap-3">
        <input
          className={fieldClass + ' w-56'}
          placeholder="Search name or email..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
        />
        <select
          className={fieldClass + ' w-40'}
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Deactivated</option>
        </select>
      </Card>

      <Card>
        {loading && <LoadingState />}
        {error && <ErrorState message={error} onRetry={refetch} />}
        {data && (
          <>
            <UserTable
              users={data.users}
              onToggleStatus={setTarget}
              onDelete={user.role === 'super_admin' ? setDeleteTarget : undefined}
              onManageCredentials={user.role === 'super_admin' ? setCredentialsTarget : undefined}
              detailsBasePath="/admin/employees"
              currentUserId={user.id}
            />
            <Pagination pagination={data.pagination} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />
          </>
        )}
      </Card>

      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Employee"
        onCreate={createEmployee}
        onCreated={handleCreated}
      />

      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={handleToggleConfirm}
        title={target?.isActive ? 'Deactivate employee?' : 'Activate employee?'}
        message={
          target?.isActive
            ? `${target?.name} will no longer be able to log in.`
            : `${target?.name} will regain access to log in.`
        }
        confirmLabel={target?.isActive ? 'Deactivate' : 'Activate'}
        variant={target?.isActive ? 'danger' : 'primary'}
        loading={toggling}
      />
      {toggleError && <p className="text-sm text-red-600">{toggleError}</p>}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete employee?"
        message={`${deleteTarget?.name} will be permanently deleted. This only works if they have no task history — otherwise, deactivate them instead.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
      {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}

      <ManageCredentialsModal
        open={Boolean(credentialsTarget)}
        onClose={() => setCredentialsTarget(null)}
        user={credentialsTarget}
        onUpdate={updateEmployeeCredentials}
        onUpdated={(updated) => {
          setData((prev) => ({ ...prev, users: prev.users.map((u) => (u.id === updated.id ? updated : u)) }));
          setCredentialsTarget(null);
        }}
      />
    </div>
  );
}
