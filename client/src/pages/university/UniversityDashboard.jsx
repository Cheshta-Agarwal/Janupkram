import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  FilePlus2,
  ListChecks,
  Plus,
  Trash2,
  Sparkles,
  Inbox,
  CheckCircle2,
  Handshake,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/StatusBadge';
import { CATEGORY_LABELS, formatINR, formatDate } from '../../utils/constants';

export const UniversityDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [tab, setTab] = useState('inbox');
  const [routedChallenges, setRoutedChallenges] = useState([]);
  const [openChallenges, setOpenChallenges] = useState([]);
  const [myProposals, setMyProposals] = useState([]);
  const [incomingPartnerships, setIncomingPartnerships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deliverables, setDeliverables] = useState({});

  const [builderChallenge, setBuilderChallenge] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [propForm, setPropForm] = useState({
    teamName: '',
    facultyMentor: '',
    members: [{ name: '', role: 'Student Innovator', department: 'CSE' }],
    abstract: '',
    methodology: '',
    expectedImpact: '',
    estimatedBudget: 350000,
    milestones: [
      { title: 'Field Survey & Architecture', description: '', dueDate: '' },
      { title: 'Lab Prototype & Bench Validation', description: '', dueDate: '' },
      { title: 'Community Field Pilot', description: '', dueDate: '' },
    ],
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [routedRes, openRes, propRes, partRes] = await Promise.all([
        api.get('/challenges?assignedToMe=true'),
        api.get('/challenges?status=validated'),
        api.get('/proposals?mine=true'),
        api.get('/partnerships?forMyUniversity=true'),
      ]);
      setRoutedChallenges(routedRes.data.challenges || []);
      setOpenChallenges(openRes.data.challenges || []);
      setMyProposals(propRes.data.proposals || []);
      setIncomingPartnerships(partRes.data.partnerships || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openBuilder = (ch) => {
    setBuilderChallenge(ch);
    setPropForm({
      teamName: `${(user?.organizationName || 'University').split(' ')[0]} Innovation Squad`,
      facultyMentor: user?.name || '',
      members: [{ name: '', role: 'Hardware / IoT Lead', department: 'ECE' }],
      abstract: '',
      methodology: '',
      expectedImpact: '',
      estimatedBudget: 350000,
      milestones: [
        { title: 'Baseline Field Study & Design', description: 'Survey & CAD specs', dueDate: '' },
        { title: 'Lab Prototype & Validation', description: 'Bench QA tests', dueDate: '' },
        { title: 'Field Pilot & Community Handover', description: 'On-site deployment', dueDate: '' },
      ],
    });
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    if (!builderChallenge) return;
    setSubmitting(true);
    try {
      await api.post('/proposals', {
        challengeId: builderChallenge._id,
        ...propForm,
        estimatedBudget: Number(propForm.estimatedBudget) || 0,
      });
      setBuilderChallenge(null);
      addToast('Team & proposal submitted!');
      setTab('milestones');
      await loadData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit proposal.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMilestoneChange = async (proposalId, milestoneId, status) => {
    try {
      await api.patch(`/proposals/${proposalId}/milestones/${milestoneId}`, {
        status,
        deliverableUrl: deliverables[milestoneId],
      });
      addToast(`Milestone updated to ${status.replace(/_/g, ' ')}.`);
      await loadData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Milestone update failed.', 'error');
    }
  };

  const handleAdvanceChallenge = async (challengeId, status) => {
    try {
      await api.patch(`/challenges/${challengeId}/status`, { status });
      addToast(`Challenge advanced to ${status.toUpperCase()}!`);
      await loadData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Status advance failed.', 'error');
    }
  };

  const handlePartnershipRespond = async (partnershipId, status) => {
    try {
      await api.patch(`/partnerships/${partnershipId}/respond`, { status });
      addToast(`Industry partnership offer ${status}.`);
      await loadData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Unable to respond to offer.', 'error');
    }
  };

  const completedMilestones = myProposals.reduce(
    (sum, p) => sum + (p.milestones || []).filter((m) => m.status === 'completed').length,
    0
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8 space-y-6 animate-fade-up">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          University R&D Collaboration Hub
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {user?.organizationName || user?.name} • Manage routed societal challenges, build LPU &
          campus R&D teams, execute milestones, and accept industry partnerships.
        </p>
      </div>

      {/* Bento KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Routed to Us</span>
            <Inbox className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {routedChallenges.length}
          </p>
        </div>

        <div className="glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Open Validated</span>
            <GraduationCap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-violet-700 dark:text-violet-400">
            {openChallenges.length}
          </p>
        </div>

        <div className="glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Milestones Done</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {completedMilestones}
          </p>
        </div>

        <div className="glass-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Industry Offers</span>
            <Handshake className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {incomingPartnerships.length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          {
            key: 'inbox',
            label: `Routed & Validated (${routedChallenges.length + openChallenges.length})`,
          },
          { key: 'milestones', label: `Milestone Execution (${myProposals.length})` },
          { key: 'partnerships', label: `Industry Offers (${incomingPartnerships.length})` },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition active:scale-95 ${
              tab === t.key
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
      ) : tab === 'inbox' ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Routed Challenges Assigned to My University
            </h2>
            {routedChallenges.length === 0 ? (
              <div className="glass-card border-dashed p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No challenges routed yet. Check Open Validated Challenges below.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {routedChallenges.map((c) => (
                  <div key={c._id} className="glass-card p-5 space-y-3 hover:-translate-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                        {CATEGORY_LABELS[c.category] || c.category}
                      </span>
                      <StatusBadge status={c.status} size="xs" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {c.description}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {c.district}
                      </span>
                      <div className="flex gap-2">
                        <Link
                          to={`/challenges/${c._id}`}
                          className="btn-secondary !py-1.5 !px-3 !text-xs"
                        >
                          360° View
                        </Link>
                        {['routed', 'validated'].includes(c.status) && (
                          <button
                            type="button"
                            onClick={() => openBuilder(c)}
                            className="btn-primary !py-1.5 !px-3 !text-xs"
                          >
                            <FilePlus2 className="h-3.5 w-3.5" />
                            Build Team & Proposal
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {openChallenges.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Open Validated Challenges
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {openChallenges.map((c) => (
                  <div key={c._id} className="glass-card p-5 space-y-3 hover:-translate-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                        {CATEGORY_LABELS[c.category] || c.category}
                      </span>
                      <StatusBadge status={c.status} size="xs" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {c.description}
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {c.district}
                      </span>
                      <button
                        type="button"
                        onClick={() => openBuilder(c)}
                        className="btn-primary !py-1.5 !px-3 !text-xs"
                      >
                        <FilePlus2 className="h-3.5 w-3.5" />
                        Form Team & Propose
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : tab === 'milestones' ? (
        <div className="space-y-5">
          {myProposals.length === 0 ? (
            <div className="glass-card border-dashed p-10 text-center text-xs text-slate-500 dark:text-slate-400">
              No proposals submitted yet.
            </div>
          ) : (
            myProposals.map((p) => {
              const totalMs = p.milestones?.length || 0;
              const doneMs = (p.milestones || []).filter((m) => m.status === 'completed').length;
              const pct = totalMs ? Math.round((doneMs / totalMs) * 100) : 0;

              return (
                <div key={p._id} className="glass-card p-5 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={p.status} size="xs" />
                        {p.challengeId?.status && (
                          <StatusBadge status={p.challengeId.status} size="xs" />
                        )}
                        <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                          {pct}% Complete
                        </span>
                      </div>
                      <h3 className="mt-1.5 text-base font-bold text-slate-900 dark:text-white">
                        {p.teamName} — {p.challengeId?.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Mentor: {p.facultyMentor} • Budget: {formatINR(p.estimatedBudget)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/challenges/${p.challengeId?._id}`}
                        className="btn-secondary !py-2 !px-3 !text-xs"
                      >
                        360° View
                      </Link>
                      {pct >= 75 &&
                        p.challengeId?.status &&
                        !['piloted', 'deployed'].includes(p.challengeId.status) && (
                          <button
                            type="button"
                            onClick={() => handleAdvanceChallenge(p.challengeId._id, 'piloted')}
                            className="btn-primary !py-2 !px-3.5 !text-xs"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Advance to Piloted
                          </button>
                        )}
                      {pct === 100 && p.challengeId?.status !== 'deployed' && (
                        <button
                          type="button"
                          onClick={() => handleAdvanceChallenge(p.challengeId._id, 'deployed')}
                          className="btn-emerald !py-2 !px-3.5 !text-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Advance to Deployed
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <ListChecks className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Interactive Milestones ({doneMs}/{totalMs} completed)
                    </div>
                    {(p.milestones || []).map((m) => (
                      <div
                        key={m._id}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-4 space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              {m.title}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {m.description} • Due {formatDate(m.dueDate)}
                            </p>
                          </div>
                          <StatusBadge status={m.status} size="xs" />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="url"
                            placeholder="Attach deliverable link (GitHub / Prototype video URL)"
                            value={deliverables[m._id] ?? m.deliverableUrl ?? ''}
                            onChange={(e) =>
                              setDeliverables((prev) => ({ ...prev, [m._id]: e.target.value }))
                            }
                            className="input-field !flex-1 !min-w-[200px] !py-1.5 !text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleMilestoneChange(p._id, m._id, 'pending')}
                            className="btn-secondary !py-1.5 !px-2.5 !text-[11px]"
                          >
                            Pending
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMilestoneChange(p._id, m._id, 'in_progress')}
                            className="rounded-xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/70 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 active:scale-95 transition"
                          >
                            In Progress
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMilestoneChange(p._id, m._id, 'completed')}
                            className="btn-emerald !py-1.5 !px-3 !text-[11px]"
                          >
                            Completed
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {incomingPartnerships.length === 0 ? (
            <div className="glass-card border-dashed p-10 text-center text-xs text-slate-500 dark:text-slate-400">
              No incoming industry partnership offers yet.
            </div>
          ) : (
            incomingPartnerships.map((offer) => (
              <div
                key={offer._id}
                className="glass-card flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {offer.title}
                    </span>
                    <StatusBadge status={offer.status} size="xs" />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    From{' '}
                    <strong>
                      {offer.industryId?.organizationName || offer.industryId?.name}
                    </strong>{' '}
                    • {offer.collaborationType.replace(/_/g, ' ')} •{' '}
                    <strong className="text-emerald-700 dark:text-emerald-400">
                      {formatINR(offer.fundingAmount)}
                    </strong>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Challenge: {offer.challengeId?.title} — {offer.commitmentDetails}
                  </p>
                </div>

                {offer.status === 'proposed' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handlePartnershipRespond(offer._id, 'accepted')}
                      className="btn-emerald !py-2 !px-3.5 !text-xs"
                    >
                      Accept Offer
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePartnershipRespond(offer._id, 'declined')}
                      className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 px-3.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 active:scale-95 transition"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Team & Proposal Builder Modal */}
      {builderChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="animate-scale-in my-8 w-full max-w-3xl glass-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Team & Proposal Builder
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {builderChallenge.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBuilderChallenge(null)}
                className="btn-ghost"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmitProposal} className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={propForm.teamName}
                    onChange={(e) => setPropForm({ ...propForm, teamName: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Faculty Mentor *
                  </label>
                  <input
                    type="text"
                    required
                    value={propForm.facultyMentor}
                    onChange={(e) => setPropForm({ ...propForm, facultyMentor: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estimated Budget (INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={propForm.estimatedBudget}
                    onChange={(e) =>
                      setPropForm({ ...propForm, estimatedBudget: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Abstract *
                </label>
                <textarea
                  rows={2}
                  required
                  value={propForm.abstract}
                  onChange={(e) => setPropForm({ ...propForm, abstract: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Methodology *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={propForm.methodology}
                    onChange={(e) => setPropForm({ ...propForm, methodology: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expected Impact *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={propForm.expectedImpact}
                    onChange={(e) => setPropForm({ ...propForm, expectedImpact: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Student Members */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Student Team Members
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPropForm((prev) => ({
                        ...prev,
                        members: [...prev.members, { name: '', role: '', department: '' }],
                      }))
                    }
                    className="btn-secondary !py-1 !px-2 !text-[11px]"
                  >
                    <Plus className="h-3 w-3" /> Add Member
                  </button>
                </div>
                {propForm.members.map((m, idx) => (
                  <div key={idx} className="grid gap-2 sm:grid-cols-12 items-center">
                    <input
                      type="text"
                      required
                      placeholder="Student Name"
                      value={m.name}
                      onChange={(e) => {
                        const next = [...propForm.members];
                        next[idx].name = e.target.value;
                        setPropForm({ ...propForm, members: next });
                      }}
                      className="input-field sm:col-span-4 !py-1.5 !text-xs"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Role"
                      value={m.role}
                      onChange={(e) => {
                        const next = [...propForm.members];
                        next[idx].role = e.target.value;
                        setPropForm({ ...propForm, members: next });
                      }}
                      className="input-field sm:col-span-4 !py-1.5 !text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Department"
                      value={m.department}
                      onChange={(e) => {
                        const next = [...propForm.members];
                        next[idx].department = e.target.value;
                        setPropForm({ ...propForm, members: next });
                      }}
                      className="input-field sm:col-span-3 !py-1.5 !text-xs"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPropForm((prev) => ({
                          ...prev,
                          members: prev.members.filter((_, i) => i !== idx),
                        }))
                      }
                      className="sm:col-span-1 text-slate-400 hover:text-rose-500 justify-self-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Milestones */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Milestones (3-5)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPropForm((prev) => ({
                        ...prev,
                        milestones: [
                          ...prev.milestones,
                          { title: '', description: '', dueDate: '' },
                        ],
                      }))
                    }
                    className="btn-secondary !py-1 !px-2 !text-[11px]"
                  >
                    <Plus className="h-3 w-3" /> Add Milestone
                  </button>
                </div>
                {propForm.milestones.map((ms, idx) => (
                  <div key={idx} className="grid gap-2 sm:grid-cols-12 items-center">
                    <input
                      type="text"
                      required
                      placeholder="Milestone Title"
                      value={ms.title}
                      onChange={(e) => {
                        const next = [...propForm.milestones];
                        next[idx].title = e.target.value;
                        setPropForm({ ...propForm, milestones: next });
                      }}
                      className="input-field sm:col-span-5 !py-1.5 !text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={ms.description}
                      onChange={(e) => {
                        const next = [...propForm.milestones];
                        next[idx].description = e.target.value;
                        setPropForm({ ...propForm, milestones: next });
                      }}
                      className="input-field sm:col-span-4 !py-1.5 !text-xs"
                    />
                    <input
                      type="date"
                      value={ms.dueDate}
                      onChange={(e) => {
                        const next = [...propForm.milestones];
                        next[idx].dueDate = e.target.value;
                        setPropForm({ ...propForm, milestones: next });
                      }}
                      className="input-field sm:col-span-2 !py-1.5 !px-2 !text-xs"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPropForm((prev) => ({
                          ...prev,
                          milestones: prev.milestones.filter((_, i) => i !== idx),
                        }))
                      }
                      className="sm:col-span-1 text-slate-400 hover:text-rose-500 justify-self-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBuilderChallenge(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Submitting...' : 'Submit Proposal & Activate Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversityDashboard;
