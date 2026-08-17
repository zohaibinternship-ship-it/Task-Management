import { LayoutDashboard, ListChecks, Activity, UserCircle } from 'lucide-react';
import AppShell from './AppShell.jsx';

const items = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/my-tasks', label: 'My Tasks', icon: ListChecks },
  { to: '/my-activity', label: 'My Activity', icon: Activity },
  { to: '/profile', label: 'Profile', icon: UserCircle },
];

export default function EmployeeLayout() {
  return <AppShell items={items} title="TMS" />;
}
