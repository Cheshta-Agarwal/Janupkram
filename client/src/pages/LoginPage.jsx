import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck, Users, GraduationCap, Building2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLE_DASHBOARD_PATH } from '../utils/constants';

const DEMO_ACCOUNTS = [
  {
    label: 'Citizen',
    sub: 'Aarav Sharma (Phagwara / Open Community)',
    email: 'citizen@janupkram.org',
    password: 'Password@123',
    icon: Users,
    badge:
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-800',
  },
  {
    label: 'Nodal Moderator',
    sub: 'Dr. Meenakshi Nair (Central Moderation)',
    email: 'admin@janupkram.org',
    password: 'Password@123',
    icon: ShieldCheck,
    badge:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
  },
  {
    label: 'University (LPU)',
    sub: 'Lovely Professional University Innovation Studio',
    email: 'innovation@lpu.co.in',
    password: 'Password@123',
    icon: GraduationCap,
    badge:
      'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/70 dark:text-violet-300 dark:border-violet-800',
  },
  {
    label: 'Partner University',
    sub: 'National University R&D Alliance',
    email: 'research@campus-hub.edu.in',
    password: 'Password@123',
    icon: GraduationCap,
    badge:
      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800',
  },
  {
    label: 'Industry Partner',
    sub: 'Bharat Tech & CSR Foundation',
    email: 'csr@industry-collab.org',
    password: 'Password@123',
    icon: Building2,
    badge:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
  },
];

export const LoginPage = () => {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const performLogin = async (targetEmail, targetPassword) => {
    setError('');
    setSubmitting(true);
    try {
      const user = await login(targetEmail, targetPassword);
      addToast(`Welcome back, ${user.name}!`);
      navigate(ROLE_DASHBOARD_PATH[user.role] || '/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Sign in failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    performLogin(email, password);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center px-4 py-8 sm:py-12">
      <div className="animate-fade-up grid w-full gap-6 md:grid-cols-12 glass-card p-6 sm:p-8 shadow-lg">
        <div className="md:col-span-6 md:border-r md:border-slate-100 dark:md:border-slate-800 md:pr-6 flex flex-col justify-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <LogIn className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Sign in to Janupkram</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Access your role-specific Janupkram collaboration workspace.
          </p>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@janupkram.org"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
            New stakeholder?{' '}
            <Link
              to="/register"
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>

        <div className="md:col-span-6 flex flex-col justify-center">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            1-Click Stakeholder Demo Login
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Seeded accounts for immediate evaluation (password:{' '}
            <code className="font-mono text-slate-700 dark:text-slate-300">Password@123</code>).
          </p>

          <div className="mt-4 space-y-2">
            {DEMO_ACCOUNTS.map((acc) => {
              const Icon = acc.icon;
              return (
                <button
                  key={acc.email}
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.password);
                    performLogin(acc.email, acc.password);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md active:scale-[0.98] disabled:opacity-60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border ${acc.badge}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {acc.label}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {acc.sub}
                      </p>
                    </div>
                  </div>
                  <span className="ml-2 flex-shrink-0 rounded-lg bg-white dark:bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                    Sign In →
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
