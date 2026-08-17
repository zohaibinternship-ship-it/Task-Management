import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../hooks/useAuth.js';
import Logo from '../components/common/Logo.jsx';

export default function AppShell({ items, title }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
  }

  return (
    <div className="min-h-screen bg-surface flex">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-navy-950/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={clsx(
          'fixed z-40 inset-y-0 left-0 w-64 bg-navy-950 text-white flex flex-col transition-transform lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="h-16 flex items-center justify-between gap-2 px-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Logo size={26} />
            <span className="font-semibold tracking-wide">{title}</span>
          </div>
          <button
            type="button"
            className="lg:hidden text-white/70 hover:text-white"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-gold-500 text-navy-950' : 'text-white/80 hover:bg-white/10 hover:text-white',
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-navy-900/10 flex items-center justify-between px-4 lg:px-6">
          <button
            type="button"
            className="lg:hidden text-navy-700"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-navy-900">{user?.name}</p>
              <p className="text-xs text-navy-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-navy-900 text-white flex items-center justify-center text-sm font-semibold">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
