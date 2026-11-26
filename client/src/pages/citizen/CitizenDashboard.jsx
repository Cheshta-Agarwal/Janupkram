import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  ThumbsUp,
  Search,
  FileText,
  Activity,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CHALLENGE_CATEGORIES, CATEGORY_LABELS } from '../../utils/constants';
import ChallengeCard from '../../components/ChallengeCard';
import LifecycleStepper from '../../components/LifecycleStepper';

export const CitizenDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [tab, setTab] = useState('mine');
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tab === 'mine') {
        params.set('mine', 'true');
      } else {
        params.set('status', 'validated,routed,team_formed,in_progress,piloted,deployed');
      }
      if (category !== 'ALL') params.set('category', category);
      if (search.trim()) params.set('search', search.trim());

      const { data } = await api.get(`/challenges?${params.toString()}`);
      setChallenges(data.challenges || []);
    } finally {
      setLoading(false);
    }
  }, [tab, category, search]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const handleUpvote = async (id) => {
    try {
      const { data } = await api.post(`/challenges/${id}/upvote`);
      setChallenges((prev) =>
        prev.map((c) =>
          c._id === id
            ? { ...c, upvotes: data.upvotes, upvotesCount: data.upvotesCount }
            : c
        )
      );
      addToast(data.upvoted ? 'Upvoted civic challenge!' : 'Upvote removed.', 'info');
    } catch {
      // ignore
    }
  };

  const stats = {
    total: challenges.length,
    active: challenges.filter((c) =>
      ['routed', 'team_formed', 'in_progress', 'piloted'].includes(c.status)
    ).length,
    deployed: challenges.filter((c) => c.status === 'deployed').length,
    upvotes: challenges.reduce((s, c) => s + (c.upvotesCount || 0), 0),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8 space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Citizen Civic Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Track your submitted Jharkhand challenges with live lifecycle progress and upvote
            community priorities.
          </p>
        </div>
        <Link to="/citizen/submit" className="btn-primary">
          <PlusCircle className="h-4 w-4" />
          Submit Challenge
        </Link>
      </div>

      {/* Bento KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>{tab === 'mine' ? 'My Submissions' : 'Community Feed'}</span>
            <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats.total}
          </p>
        </div>

        <div className="glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>In R&D / Piloted</span>
            <Activity className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-violet-700 dark:text-violet-400">
            {stats.active}
          </p>
        </div>

        <div className="glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Deployed Solutions</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
            {stats.deployed}
          </p>
        </div>

        <div className="glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Community Upvotes</span>
            <ThumbsUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats.upvotes}
          </p>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="glass-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('mine')}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition active:scale-95 ${
              tab === 'mine'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            My Submissions
          </button>
          <button
            type="button"
            onClick={() => setTab('community')}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition active:scale-95 ${
              tab === 'community'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Community Civic Feed
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search challenges..."
              className="input-field !py-2 !pl-9 !text-xs"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field !w-auto !py-2 !text-xs"
          >
            <option value="ALL">All Categories</option>
            {CHALLENGE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-60 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            />
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <div className="glass-card border-dashed p-12 text-center">
          <MapPin className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
            No challenges found
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Submit a local civic challenge on the map to get started.
          </p>
        </div>
      ) : tab === 'mine' ? (
        <div className="space-y-4">
          {challenges.map((ch) => (
            <ChallengeCard
              key={ch._id}
              challenge={ch}
              onUpvote={handleUpvote}
              currentUserId={user?.id}
              showStepper={true}
              stepperNode={<LifecycleStepper currentStatus={ch.status} />}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map((ch) => (
            <ChallengeCard
              key={ch._id}
              challenge={ch}
              onUpvote={handleUpvote}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;
