import { useNavigate } from 'react-router-dom';
import Table from '../common/Table.jsx';
import Button from '../common/Button.jsx';
import { formatDate } from '../../utils/format.js';

export default function UserTable({ users, onToggleStatus, onDelete, onManageCredentials, detailsBasePath, currentUserId }) {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (u) => (
        <div>
          <p className="font-medium text-navy-900">{u.name}</p>
          <p className="text-xs text-navy-500">{u.email}</p>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (u) => (
        <span
          className={
            u.isActive
              ? 'inline-flex rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium'
              : 'inline-flex rounded-full bg-gray-100 text-gray-600 px-2.5 py-0.5 text-xs font-medium'
          }
        >
          {u.isActive ? 'Active' : 'Deactivated'}
        </span>
      ),
    },
    { key: 'lastLoginAt', header: 'Last Login', render: (u) => formatDate(u.lastLoginAt) },
    { key: 'createdAt', header: 'Created', render: (u) => formatDate(u.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (u) => (
        <div className="flex justify-end gap-2">
          {detailsBasePath && (
            <Button size="sm" variant="ghost" onClick={() => navigate(`${detailsBasePath}/${u.id}`)}>
              View
            </Button>
          )}
          {onManageCredentials && (
            <Button size="sm" variant="ghost" onClick={() => onManageCredentials(u)}>
              Credentials
            </Button>
          )}
          <Button
            size="sm"
            variant={u.isActive ? 'danger' : 'secondary'}
            disabled={u.id === currentUserId}
            onClick={() => onToggleStatus(u)}
          >
            {u.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          {onDelete && (
            <Button size="sm" variant="danger" disabled={u.id === currentUserId} onClick={() => onDelete(u)}>
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return <Table columns={columns} rows={users} emptyLabel="No users found" />;
}
