import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  CheckCircle2,
  IndianRupee,
  GraduationCap,
  Award,
  Sparkles,
  Download,
} from 'lucide-react';
import api from '../../api/axios';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { formatINR } from '../../utils/constants';

const PIE_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#0EA5E9', '#F43F5E', '#64748B'];

export const AnalyticsDashboard = () => {
  const { isDark } = useTheme();
  const { addToast } = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/analytics/dashboard');
        setAnalytics(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const exportCsv = () => {
    if (!analytics) return;
    const rows = [
      ['District', 'Total Challenges', 'Active', 'Deployed'],
      ...analytics.byDistrict.map((d) => [d.district, d.total, d.active, d.deployed]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jharkhand-sih26043-analytics.csv';
    a.click();
    URL.revokeObjectURL(url);
    addToast('Analytics CSV report exported!');
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="h-28 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
        Unable to load executive analytics.
      </div>
    );
  }

  const { kpis, funnel, byCategory, byDistrict, universityLeaderboard } = analytics;
  const gridStroke = isDark ? '#1E293B' : '#E2E8F0';
  const tickColor = isDark ? '#94A3B8' : '#475569';
  const tooltipStyle = {
    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
    borderColor: isDark ? '#334155' : '#E2E8F0',
    borderRadius: '12px',
    color: isDark ? '#F8FAFC' : '#0F172A',
    fontSize: '12px',
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8 space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Executive Government Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Pipeline conversion funnel, domain distribution, Jharkhand district breakdown, and
            university R&D leaderboard.
          </p>
        </div>
        <button type="button" onClick={exportCsv} className="btn-secondary">
          <Download className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          Export CSV Report
        </button>
      </div>

      {/* 5 Top Bento KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <div className="glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Total Challenges</span>
            <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {kpis.totalChallenges}
          </p>
        </div>

        <div className="glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Validated Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {kpis.validatedRate}%
          </p>
        </div>

        <div className="glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Active Prototypes</span>
            <GraduationCap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-violet-700 dark:text-violet-400">
            {kpis.activePrototypes}
          </p>
        </div>

        <div className="glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>CSR Pledged</span>
            <IndianRupee className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatINR(kpis.totalCsrFunding)}
          </p>
        </div>

        <div className="glass-card p-4 sm:p-5 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Deployed Solutions</span>
            <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-teal-700 dark:text-teal-400">
            {kpis.deployedSolutions}
          </p>
        </div>
      </div>

      {/* Funnel + Domain Pie */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 glass-card p-5 sm:p-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Challenge Pipeline Funnel
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Progression across lifecycle stages
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: tickColor }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: tickColor }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Challenges" fill="#6366F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 glass-card p-5 sm:p-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Domain Distribution</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Challenges by societal sector
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="45%"
                  innerRadius={52}
                  outerRadius={84}
                  paddingAngle={3}
                >
                  {byCategory.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px', color: tickColor }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* District Breakdown */}
      <div className="glass-card p-5 sm:p-6">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          District-Wise Challenge Breakdown
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Ranchi, Dhanbad, Jamshedpur, Bokaro, Hazaribagh, and Dumka
        </p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDistrict} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="district" tick={{ fontSize: 11, fill: tickColor }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: tickColor }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="total" name="Total Reported" fill="#6366F1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="deployed" name="Deployed" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* University Leaderboard */}
      <div className="glass-card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-5 w-5 text-amber-500" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              University Leaderboard
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assigned challenges, active proposals, and milestones completed
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 pr-4">University</th>
                <th className="py-3 px-3">Assigned Challenges</th>
                <th className="py-3 px-3">Active Proposals</th>
                <th className="py-3 px-3">Milestones Completed</th>
                <th className="py-3 px-3">Piloted / Deployed</th>
                <th className="py-3 pl-3 text-right">Impact Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {universityLeaderboard.map((u, idx) => (
                <tr key={u.universityId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950 font-bold text-indigo-700 dark:text-indigo-300">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {u.organizationName}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{u.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    {u.assignedChallenges}
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    {u.activeProposals}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {u.completedMilestones} / {u.totalMilestones}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-300">
                      {u.pilotedCount} piloted / {u.deployedCount} deployed
                    </span>
                  </td>
                  <td className="py-3.5 pl-3 text-right font-extrabold text-indigo-700 dark:text-indigo-400">
                    {u.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
