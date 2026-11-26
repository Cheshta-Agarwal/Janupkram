import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  IndianRupee,
  Handshake,
  Search,
  Sparkles,
  BarChart3,
  GraduationCap,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CHALLENGE_CATEGORIES, CATEGORY_LABELS, formatINR } from '../../utils/constants';
import ChallengeCard from '../../components/ChallengeCard';
import StatusBadge from '../../components/StatusBadge';

export const IndustryDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [tab, setTab] = useState('marketplace');
  const [challenges, setChallenges] = useState([]);
  const [myPartnerships, setMyPartnerships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('ALL');
  const [search, setSearch] = useState('');

  const [offerTarget, setOfferTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [offerForm, setOfferForm] = useState({
    collaborationType: 'funding',
    title: '',
    commitmentDetails: '',
    fundingAmount: 250000,
  });

  const loadMarketplace = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ openForIndustry: 'true' });
      if (category !== 'ALL') params.set('category', category);
      if (search.trim()) params.set('search', search.trim());

      const [chRes, partRes] = await Promise.all([
        api.get(`/challenges?${params.toString()}`),
        api.get('/partnerships?mine=true'),
      ]);
      setChallenges(chRes.data.challenges || []);
      setMyPartnerships(partRes.data.partnerships || []);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    loadMarketplace();
  }, [loadMarketplace]);

  const openOfferModal = (ch) => {
    setOfferTarget(ch);
    setOfferForm({
      collaborationType: 'funding',
      title: `CSR Collaboration for ${ch.title.slice(0, 45)}`,
      commitmentDetails: '',
      fundingAmount: ch.proposals?.[0]?.estimatedBudget || 250000,
    });
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!offerTarget) return;
    setSubmitting(true);
    try {
      await api.post('/partnerships', {
        challengeId: offerTarget._id,
        proposalId: offerTarget.proposals?.[0]?._id || null,
        ...offerForm,
        fundingAmount: Number(offerForm.fundingAmount) || 0,
      });
      setOfferTarget(null);
      addToast('CSR Collaboration offer submitted!');
      setTab('offers');
      await loadMarketplace();
    } catch (err) {
      addToast(err.response?.data?.message || 'Unable to submit offer.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPledged = myPartnerships
    .filter((p) => p.status !== 'declined')
    .reduce((sum, p) => sum + (Number(p.fundingAmount) || 0), 0);
  const acceptedCount = myPartnerships.filter((p) =>
    ['accepted', 'completed'].includes(p.status)
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8 space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Industry & CSR Innovation Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {user?.organizationName || user?.name} • Partner on validated & active university R&D
            projects across Jharkhand.
          </p>
        </div>
        <Link to="/analytics" className="btn-secondary">
          <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          Executive Analytics
        </Link>
      </div>

      {/* Bento KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Open Marketplace</span>
            <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {challenges.length}
          </p>
        </div>

        <div className="glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>My Offers</span>
            <Handshake className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-violet-700 dark:text-violet-400">
            {myPartnerships.length}
          </p>
        </div>

        <div className="glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Accepted</span>
            <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {acceptedCount}
          </p>
        </div>

        <div className="glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>CSR Pledged</span>
            <IndianRupee className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatINR(totalPledged)}
          </p>
        </div>
      </div>

      {/* Tabs + Filters */}
      <div className="glass-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('marketplace')}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition active:scale-95 ${
              tab === 'marketplace'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Open Challenges ({challenges.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('offers')}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition active:scale-95 ${
              tab === 'offers'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            My Collaboration Offers ({myPartnerships.length})
          </button>
        </div>

        {tab === 'marketplace' && (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search challenge or district..."
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
        )}
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
      ) : tab === 'marketplace' ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map((ch) => (
            <ChallengeCard
              key={ch._id}
              challenge={ch}
              stepperNode={
                ch.proposals?.[0] ? (
                  <div className="rounded-lg bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-800 p-2.5 text-[11px] text-sky-900 dark:text-sky-200">
                    <div className="flex items-center gap-1 font-bold">
                      <GraduationCap className="h-3.5 w-3.5 text-sky-700 dark:text-sky-400" />
                      {ch.proposals[0].teamName}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sky-800 dark:text-sky-300">
                      {ch.proposals[0].abstract}
                    </p>
                  </div>
                ) : null
              }
              showStepper={Boolean(ch.proposals?.[0])}
              actionSlot={
                <button
                  type="button"
                  onClick={() => openOfferModal(ch)}
                  className="btn-emerald !py-1.5 !px-3 !text-xs"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  Offer Collaboration
                </button>
              }
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {myPartnerships.length === 0 ? (
            <div className="glass-card border-dashed p-10 text-center text-xs text-slate-500 dark:text-slate-400">
              No collaboration offers sent yet.
            </div>
          ) : (
            myPartnerships.map((p) => (
              <div
                key={p._id}
                className="glass-card flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {p.title}
                    </span>
                    <StatusBadge status={p.status} size="xs" />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {p.collaborationType.replace(/_/g, ' ')} •{' '}
                    <strong className="text-emerald-700 dark:text-emerald-400">
                      {formatINR(p.fundingAmount)}
                    </strong>{' '}
                    • Challenge: {p.challengeId?.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {p.commitmentDetails}
                  </p>
                </div>

                <Link
                  to={`/challenges/${p.challengeId?._id}`}
                  className="btn-secondary !py-2 !px-3.5 !text-xs"
                >
                  360° View
                </Link>
              </div>
            ))
          )}
        </div>
      )}

      {/* Offer Collaboration Modal */}
      {offerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="animate-scale-in w-full max-w-lg glass-card p-6 shadow-2xl">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Offer Industry Collaboration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                {offerTarget.title}
              </p>
            </div>

            <form onSubmit={handleSubmitOffer} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Collaboration Type *
                </label>
                <select
                  value={offerForm.collaborationType}
                  onChange={(e) =>
                    setOfferForm({ ...offerForm, collaborationType: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="funding">Funding (CSR Grant)</option>
                  <option value="mentorship">Technical Mentorship</option>
                  <option value="prototyping_support">Prototyping Support</option>
                  <option value="field_deployment">Field Deployment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Offer Title *
                </label>
                <input
                  type="text"
                  required
                  value={offerForm.title}
                  onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Funding Amount (INR, optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={offerForm.fundingAmount}
                  onChange={(e) => setOfferForm({ ...offerForm, fundingAmount: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Commitment Details *
                </label>
                <textarea
                  rows={3}
                  required
                  value={offerForm.commitmentDetails}
                  onChange={(e) =>
                    setOfferForm({ ...offerForm, commitmentDetails: e.target.value })
                  }
                  placeholder="Describe lab equipment, mentor hours, CSR tranche schedule, or deployment support..."
                  className="input-field"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOfferTarget(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-emerald">
                  {submitting ? 'Submitting...' : 'Send Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndustryDashboard;
