import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch.js';
import { useAuth } from '../../hooks/useAuth.js';
import { getEmployee, updateEmployeeCredentials } from '../../services/employees.service.js';
import { listTasks } from '../../services/tasks.service.js';
import LoadingState from '../../components/common/LoadingState.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Card from '../../components/common/Card.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import Button from '../../components/common/Button.jsx';
import TaskListTable from '../../components/tasks/TaskListTable.jsx';
import ManageCredentialsModal from '../../components/users/ManageCredentialsModal.jsx';
import { ListChecks, Clock, CheckCircle2 } from 'lucide-react';
import { formatDate, formatDuration } from '../../utils/format.js';

export default function EmployeeDetails() {
  const { id } = useParams();
  const { user: viewer } = useAuth();
  const {
    data: employee,
    loading: loadingEmployee,
    error: employeeError,
    refetch: refetchEmployee,
    setData: setEmployee,
  } = useFetch(() => getEmployee(id), [id]);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const { data: taskData, loading: loadingTasks } = useFetch(
    () => listTasks({ assigneeId: id, pageSize: 100 }),
    [id],
  );

  if (loadingEmployee) return <LoadingState />;
  if (employeeError) return <ErrorState message={employeeError} onRetry={refetchEmployee} />;
  if (!employee) return null;

  const tasks = taskData?.tasks ?? [];
  const totalSeconds = tasks.reduce((sum, t) => sum + (t.spentSeconds ?? 0), 0);
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="space-y-4">
      <Card className="p-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-lg font-semibold text-navy-900">{employee.name}</h1>
          <p className="text-sm text-navy-500">{employee.email}</p>
          <p className="text-xs text-navy-500 mt-1">
            {employee.isActive ? 'Active' : 'Deactivated'} · Joined {formatDate(employee.createdAt)}
          </p>
        </div>
        {viewer.role === 'super_admin' && (
          <Button variant="secondary" onClick={() => setCredentialsOpen(true)}>
            Manage Credentials
          </Button>
        )}
      </Card>

      <ManageCredentialsModal
        open={credentialsOpen}
        onClose={() => setCredentialsOpen(false)}
        user={employee}
        onUpdate={updateEmployeeCredentials}
        onUpdated={(updated) => {
          setEmployee(updated);
          setCredentialsOpen(false);
        }}
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Assigned Tasks" value={tasks.length} icon={ListChecks} />
        <StatCard label="Completed" value={completedCount} icon={CheckCircle2} />
        <StatCard label="Total Hours" value={formatDuration(totalSeconds)} icon={Clock} accent />
      </div>

      <Card>
        <div className="px-4 py-3 border-b border-navy-900/10">
          <h2 className="text-sm font-semibold text-navy-900">Assigned Tasks</h2>
        </div>
        {loadingTasks ? <LoadingState /> : <TaskListTable tasks={tasks} basePath="/admin/tasks" />}
      </Card>
    </div>
  );
}
