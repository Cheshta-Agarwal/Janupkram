import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  JHARKHAND_DISTRICTS,
  CHALLENGE_CATEGORIES,
  CATEGORY_LABELS,
  ROLE_DASHBOARD_PATH,
} from '../utils/constants';

export const RegisterPage = () => {
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'citizen',
    organizationName: '',
    district: 'Ranchi',
    specializations: [],
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleSpec = (cat) => {
    setForm((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(cat)
        ? prev.specializations.filter((c) => c !== cat)
        : [...prev.specializations, cat],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await register(form);
      addToast('Account created successfully!');
      navigate(ROLE_DASHBOARD_PATH[user.role] || '/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const orgRequired = form.role === 'university' || form.role === 'industry';

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12 animate-fade-up">
      <div className="glass-card p-6 sm:p-8 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Join Janupkram
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Register as a Citizen, University R&D Cell, or Industry CSR Partner.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 px-3.5 py-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Dr. Sunita Mahato"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@institution.in"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Stakeholder Role *
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="input-field"
              >
                <option value="citizen">Citizen / Community Representative</option>
                <option value="university">University / R&D Institution</option>
                <option value="industry">Industry / CSR Partner</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jharkhand District
              </label>
              <select
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                className="input-field"
              >
                {JHARKHAND_DISTRICTS.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Organization / Institution Name {orgRequired ? '*' : '(optional)'}
              </label>
              <input
                type="text"
                required={orgRequired}
                value={form.organizationName}
                onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                placeholder="e.g., NIT Jamshedpur / Tata Steel CSR"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password (min 6 characters) *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-field"
            />
          </div>

          {form.role !== 'citizen' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Domain Specializations
              </label>
              <div className="flex flex-wrap gap-2">
                {CHALLENGE_CATEGORIES.filter((c) => c !== 'other').map((cat) => {
                  const active = form.specializations.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleSpec(cat)}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
                        active
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {CATEGORY_LABELS[cat]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
          Already registered?{' '}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
