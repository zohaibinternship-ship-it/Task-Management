import { LayoutDashboard, ListChecks, PlusCircle, Users, BarChart3, ScrollText, ShieldCheck, UserCircle } from 'lucide-react';
import AppShell from './AppShell.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function AdminLayout() {
  const { user } = useAuth();

  const items = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/tasks', label: 'All Tasks', icon: ListChecks },
    { to: '/admin/tasks/new', label: 'Create Task', icon: PlusCircle },
    { to: '/admin/employees', label: 'Employees', icon: Users },
    { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
    ...(user?.role === 'super_admin' ? [{ to: '/admin/admins', label: 'Admins', icon: ShieldCheck }] : []),
    { to: '/admin/profile', label: 'Profile', icon: UserCircle },
  ];

  return <AppShell items={items} title="TMS Admin" />;
}
