import { Routes, Route, Navigate } from 'react-router-dom';
import RequireAuth from './routes/RequireAuth.jsx';

import Login from './pages/auth/Login.jsx';

import EmployeeLayout from './layouts/EmployeeLayout.jsx';
import EmployeeDashboard from './pages/employee/Dashboard.jsx';
import MyTasks from './pages/employee/MyTasks.jsx';
import EmployeeTaskDetails from './pages/employee/TaskDetails.jsx';
import MyActivity from './pages/employee/MyActivity.jsx';

import AdminLayout from './layouts/AdminLayout.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminTasks from './pages/admin/Tasks.jsx';
import TaskCreate from './pages/admin/TaskCreate.jsx';
import AdminTaskDetails from './pages/admin/TaskDetails.jsx';
import Employees from './pages/admin/Employees.jsx';
import EmployeeDetails from './pages/admin/EmployeeDetails.jsx';
import Admins from './pages/admin/Admins.jsx';
import AuditLogs from './pages/admin/AuditLogs.jsx';
import Reports from './pages/admin/Reports.jsx';

import Profile from './pages/shared/Profile.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth roles={['employee']} />}>
        <Route element={<EmployeeLayout />}>
          <Route index element={<EmployeeDashboard />} />
          <Route path="my-tasks" element={<MyTasks />} />
          <Route path="my-tasks/:id" element={<EmployeeTaskDetails />} />
          <Route path="my-activity" element={<MyActivity />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="/admin" element={<RequireAuth roles={['admin', 'super_admin']} />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="tasks/new" element={<TaskCreate />} />
          <Route path="tasks/:id" element={<AdminTaskDetails />} />
          <Route path="employees" element={<Employees />} />
          <Route path="employees/:id" element={<EmployeeDetails />} />
          <Route path="reports" element={<Reports />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="admins" element={<Admins />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
