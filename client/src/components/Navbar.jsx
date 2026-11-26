import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Landmark,
  LayoutDashboard,
  PlusCircle,
  BarChart3,
  LogOut,
  Menu,
  X,
  LogIn,
  Sun,
  Moon,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ROLE_DASHBOARD_PATH, ROLE_LABELS } from '../utils/constants';
import NotificationBell from './NotificationBell';

export const Navbar = ({ onOpenSearch }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 ${
      isActive
        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 shadow-sm shadow-indigo-500/5'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
    }`;

  const canViewAnalytics = isAuthenticated && ['admin', 'industry'].includes(user?.role);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl transition-colors duration-300 no-print">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 lg:gap-6 min-w-0">
          <Link
            to="/"
            className="flex items-center gap-2.5 group min-w-0"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 transition-transform duration-200 group-hover:scale-105 group-active:scale-95">
              <Landmark className="h-5 w-5" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
                  Janupkram
                </span>
                <span className="hidden sm:inline-flex rounded-md bg-emerald-50 dark:bg-emerald-950/70 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  By LPU Students
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400">
                Open Societal Innovation Grid
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {isAuthenticated && (
              <NavLink to={ROLE_DASHBOARD_PATH[user.role] || '/'} className={navLinkClass}>
                <LayoutDashboard className="h-4 w-4" />
                Workspace
              </NavLink>
            )}
            {isAuthenticated && user.role === 'citizen' && (
              <NavLink to="/citizen/submit" className={navLinkClass}>
                <PlusCircle className="h-4 w-4" />
                Submit Challenge
              </NavLink>
            )}
            {canViewAnalytics && (
              <NavLink to="/analytics" className={navLinkClass}>
                <BarChart3 className="h-4 w-4" />
                Analytics
              </NavLink>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Command Search */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900 px-2.5 sm:px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:text-slate-800 dark:hover:text-slate-200 transition-all active:scale-95"
            aria-label="Quick Search"
          >
            <Search className="h-3.5 w-3.5 text-indigo-500" />
            <span className="hidden lg:inline">Search Grid...</span>
            <kbd className="hidden lg:inline-flex items-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
              Ctrl K
            </kbd>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-amber-400 transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-105 active:scale-90"
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4 text-indigo-600" />}
          </button>

          {isAuthenticated ? (
            <>
              <NotificationBell />
              <div className="hidden lg:flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 px-3 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-bold text-white">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 max-w-[130px] truncate">
                    {user.name}
                  </p>
                  <p className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                    {ROLE_LABELS[user.role] || user.role}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-700 dark:hover:text-rose-300 hover:border-rose-200 dark:hover:border-rose-800 transition-all active:scale-95"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Sign Out</span>
              </button>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login" className="btn-secondary !py-2 !px-3.5 !text-xs">
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </Link>
              <Link to="/register" className="btn-primary !py-2 !px-3.5 !text-xs">
                Join Portal
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 transition active:scale-90"
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden animate-fade-up border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 space-y-2">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{user.name}</p>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400">
                    {ROLE_LABELS[user.role]}
                  </p>
                </div>
              </div>
              <NavLink
                to={ROLE_DASHBOARD_PATH[user.role] || '/'}
                className={navLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4" />
                My Workspace
              </NavLink>
              {user.role === 'citizen' && (
                <NavLink
                  to="/citizen/submit"
                  className={navLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  <PlusCircle className="h-4 w-4" />
                  Submit Challenge
                </NavLink>
              )}
              {canViewAnalytics && (
                <NavLink
                  to="/analytics"
                  className={navLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  <BarChart3 className="h-4 w-4" />
                  Executive Analytics
                </NavLink>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="btn-secondary flex-1"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="btn-primary flex-1"
              >
                Join Portal
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
