import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Sun,
  Moon,
  LayoutDashboard,
  PlusCircle,
  BarChart3,
  MapPin,
  ArrowRight,
  Command,
  X,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ROLE_DASHBOARD_PATH, CATEGORY_LABELS } from '../utils/constants';
import StatusBadge from './StatusBadge';

export const CommandPalette = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) onClose();
        else window.dispatchEvent(new CustomEvent('open-command-palette'));
      }
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 40);
    const load = async () => {
      setLoading(true);
      try {
        const params = query.trim() ? `?search=${encodeURIComponent(query.trim())}&limit=6` : '?limit=6';
        const { data } = await api.get(`/challenges${params}`);
        setResults(data.challenges || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    const t = setTimeout(load, 180);
    return () => clearTimeout(t);
  }, [open, query]);

  if (!open) return null;

  const go = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-950/60 backdrop-blur-sm p-4 pt-16 sm:pt-24 no-print"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl animate-scale-in overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <Search className="h-4 w-4 text-indigo-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search challenges, districts, or jump to actions..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-3 space-y-4">
          {/* Quick Actions */}
          <div>
            <p className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Quick Navigation & Controls
            </p>
            <div className="grid gap-1 sm:grid-cols-2">
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => go(ROLE_DASHBOARD_PATH[user.role] || '/')}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
                >
                  <LayoutDashboard className="h-4 w-4 text-indigo-500" />
                  Open My Workspace
                </button>
              )}
              {isAuthenticated && user?.role === 'citizen' && (
                <button
                  type="button"
                  onClick={() => go('/citizen/submit')}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition"
                >
                  <PlusCircle className="h-4 w-4 text-emerald-500" />
                  Submit New Challenge
                </button>
              )}
              {isAuthenticated && ['admin', 'industry'].includes(user?.role) && (
                <button
                  type="button"
                  onClick={() => go('/analytics')}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition"
                >
                  <BarChart3 className="h-4 w-4 text-violet-500" />
                  Executive Analytics
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {isDark ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 text-indigo-500" />
                )}
                Switch to {isDark ? 'Light' : 'Dark'} Mode
              </button>
            </div>
          </div>

          {/* Live Challenge Search */}
          <div>
            <p className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {loading ? 'Searching Jharkhand Grid...' : `Civic Challenges (${results.length})`}
            </p>
            <div className="space-y-1">
              {results.map((ch) => (
                <button
                  key={ch._id}
                  type="button"
                  onClick={() => go(`/challenges/${ch._id}`)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/80"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                      {ch.title}
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-indigo-500" />
                        {ch.district}
                      </span>
                      <span>• {CATEGORY_LABELS[ch.category] || ch.category}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={ch.status} size="xs" />
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                </button>
              ))}
              {!loading && results.length === 0 && (
                <p className="px-3 py-4 text-center text-xs text-slate-400">
                  No matching challenges found.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 px-4 py-2 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Command className="h-3 w-3" /> Quick Jump Palette
          </span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
