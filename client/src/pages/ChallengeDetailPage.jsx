import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  ThumbsUp,
  GraduationCap,
  Building2,
  Clock,
  CheckCircle2,
  ExternalLink,
  History,
  Sparkles,
  Share2,
  Printer,
  Megaphone,
  Globe2,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import LifecycleStepper from '../components/LifecycleStepper';
import MapPicker from '../components/MapPicker';
import AuthorityEscalationModal from '../components/AuthorityEscalationModal';
import { CATEGORY_LABELS, formatINR, formatDate } from '../utils/constants';

export const ChallengeDetailPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionBusy, setActionBusy] = useState('');
  const [deliverableInputs, setDeliverableInputs] = useState({});

  const [pledgeOpen, setPledgeOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [pledgeForm, setPledgeForm] = useState({
    collaborationType: 'funding',
    title: '',
    commitmentDetails: '',
    fundingAmount: 200000,
  });

  const loadDetail = useCallback(async () => {
    try {
      const res = await api.get(`/challenges/${id}`);
      setData(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load challenge details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleUpvote = async () => {
    if (!isAuthenticated) return;
    const res = await api.post(`/challenges/${id}/upvote`);
    addToast(res.data.upvoted ? 'Upvoted challenge!' : 'Upvote removed.', 'info');
    loadDetail();
  };

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      addToast('Challenge link copied to clipboard!');
    } catch {
      addToast('Copy the URL from your browser bar.', 'info');
    }
  };

  const handleMilestoneUpdate = async (proposalId, milestoneId, status) => {
    setActionBusy(milestoneId);
    try {
      await api.patch(`/proposals/${proposalId}/milestones/${milestoneId}`, {
        status,
        deliverableUrl: deliverableInputs[milestoneId],
      });
      addToast(`Milestone marked ${status.replace(/_/g, ' ')}.`);
      await loadDetail();
    } finally {
      setActionBusy('');
    }
  };

  const handleChallengeStatusChange = async (status) => {
    setActionBusy('status');
    try {
      await api.patch(`/challenges/${id}/status`, { status });
      addToast(`Challenge transitioned to ${status.toUpperCase()}.`);
      await loadDetail();
    } finally {
      setActionBusy('');
    }
  };

  const handlePartnershipRespond = async (partnershipId, status) => {
    setActionBusy(partnershipId);
    try {
      await api.patch(`/partnerships/${partnershipId}/respond`, { status });
      addToast(`Partnership ${status}.`);
      await loadDetail();
    } finally {
      setActionBusy('');
    }
  };

  const handlePledgeSubmit = async (e) => {
    e.preventDefault();
    setActionBusy('pledge');
    try {
      await api.post('/partnerships', {
        challengeId: id,
        ...pledgeForm,
        fundingAmount: Number(pledgeForm.fundingAmount) || 0,
      });
      setPledgeOpen(false);
      addToast('Collaboration offer sent!');
      await loadDetail();
    } finally {
      setActionBusy('');
    }
  };

  const handleEscalationStatus = async (escId, status) => {
    setActionBusy(escId);
    try {
      await api.patch(`/challenges/${id}/escalations/${escId}`, { status });
      addToast(`Authority response marked ${status.replace(/_/g, ' ')}.`);
      await loadDetail();
    } finally {
      setActionBusy('');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="h-96 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
      </div>
    );
  }

  if (error || !data?.challenge) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm font-semibold text-rose-600">{error || 'Challenge not found'}</p>
        <Link to="/" className="mt-4 inline-block text-xs font-semibold text-indigo-600 underline">
          Back to Portal
        </Link>
      </div>
    );
  }

  const { challenge, proposals = [], partnerships = [], activityLogs = [] } = data;
  const lat = challenge.location?.coordinates?.[1] ?? 23.3441;
  const lng = challenge.location?.coordinates?.[0] ?? 85.3096;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8 space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="btn-ghost"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleCopyShare} className="btn-secondary !py-2 !px-3 !text-xs">
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-secondary !py-2 !px-3 !text-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            Export Dossier
          </button>

          {isAuthenticated && ['admin', 'citizen', 'university'].includes(user?.role) && (
            <button
              type="button"
              onClick={() => setEscalateOpen(true)}
              className="btn-primary !py-2 !px-3.5 !text-xs"
            >
              <Megaphone className="h-3.5 w-3.5" />
              Post to Concerned Authority
            </button>
          )}

          {user?.role === 'industry' &&
            ['validated', 'routed', 'team_formed', 'in_progress', 'piloted'].includes(
              challenge.status
            ) && (
              <button
                type="button"
                onClick={() => setPledgeOpen(true)}
                className="btn-emerald !py-2 !px-3.5 !text-xs"
              >
                <Building2 className="h-3.5 w-3.5" />
                Offer Collaboration
              </button>
            )}

          {user?.role === 'admin' && challenge.status === 'piloted' && (
            <button
              type="button"
              disabled={actionBusy === 'status'}
              onClick={() => handleChallengeStatusChange('deployed')}
              className="btn-emerald !py-2 !px-3.5 !text-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark Deployed
            </button>
          )}
        </div>
      </div>

      {/* Header + Stepper */}
      <div className="glass-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-indigo-100 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/70 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                {CATEGORY_LABELS[challenge.category] || challenge.category}
              </span>
              <StatusBadge status={challenge.severity} variant="severity" />
              <StatusBadge status={challenge.status} />
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {challenge.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                {challenge.district}
              </span>
              {challenge.sourcePlatform && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 font-semibold text-amber-800 dark:text-amber-300">
                  <Globe2 className="h-3 w-3" />
                  Source: {challenge.sourcePlatform}
                  {challenge.externalTicketId ? ` (${challenge.externalTicketId})` : ''}
                </span>
              )}
              {challenge.sourceUrl && (
                <a
                  href={challenge.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View Original Thread / Portal <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <span>
                Reported by{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {challenge.submittedBy?.name}
                </strong>{' '}
                on {formatDate(challenge.createdAt)}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={!isAuthenticated}
            onClick={handleUpvote}
            className="btn-secondary !py-2.5 !px-4 !text-xs no-print"
          >
            <ThumbsUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>{challenge.upvotesCount || 0} Upvotes</span>
          </button>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
          <LifecycleStepper currentStatus={challenge.status} />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Problem Context & Evidence
            </h2>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
              {challenge.description}
            </p>

            {challenge.rejectionReason && (
              <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 p-4">
                <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
                  Rejection Reason
                </p>
                <p className="mt-1 text-xs text-rose-700 dark:text-rose-400">
                  {challenge.rejectionReason}
                </p>
              </div>
            )}

            {challenge.media && challenge.media.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Uploaded Evidence ({challenge.media.length})
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {challenge.media.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <img
                        src={url}
                        alt={`Evidence ${idx + 1}`}
                        className="h-44 w-full object-cover hover:scale-105 transition duration-300"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Proposals & Milestones */}
          <div className="glass-card p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  University R&D Proposals & Milestones ({proposals.length})
                </h2>
              </div>
              {challenge.assignedUniversity && (
                <span className="text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 border border-violet-100 dark:border-violet-800 px-2.5 py-1 rounded-lg">
                  {challenge.assignedUniversity.organizationName || challenge.assignedUniversity.name}
                </span>
              )}
            </div>

            {proposals.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No university R&D proposal submitted yet.
              </p>
            ) : (
              <div className="space-y-5">
                {proposals.map((prop) => {
                  const totalMs = prop.milestones?.length || 0;
                  const doneMs = (prop.milestones || []).filter(
                    (m) => m.status === 'completed'
                  ).length;
                  const pct = totalMs ? Math.round((doneMs / totalMs) * 100) : 0;
                  const canEdit =
                    user &&
                    (user.role === 'admin' ||
                      (user.role === 'university' &&
                        String(prop.universityId?._id) === String(user.id)));

                  return (
                    <div
                      key={prop._id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-4 space-y-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              {prop.teamName}
                            </h3>
                            <StatusBadge status={prop.status} size="xs" />
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {prop.universityId?.organizationName || prop.universityId?.name} •
                            Mentor: {prop.facultyMentor} • Budget:{' '}
                            {formatINR(prop.estimatedBudget)}
                          </p>
                        </div>
                        <span className="rounded-lg bg-indigo-50 dark:bg-indigo-950/70 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                          {pct}% Milestones Complete
                        </span>
                      </div>

                      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                        {prop.abstract}
                      </p>

                      {prop.members?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {prop.members.map((m, i) => (
                            <span
                              key={i}
                              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300"
                            >
                              <strong>{m.name}</strong> ({m.role} • {m.department})
                            </span>
                          ))}
                        </div>
                      )}

                      {prop.milestones?.length > 0 && (
                        <div className="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                          {prop.milestones.map((ms) => (
                            <div
                              key={ms._id}
                              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                                    {ms.title}
                                  </p>
                                  {ms.description && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                      {ms.description}
                                    </p>
                                  )}
                                </div>
                                <StatusBadge status={ms.status} size="xs" />
                              </div>

                              {ms.deliverableUrl && (
                                <a
                                  href={ms.deliverableUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  {ms.deliverableUrl}
                                </a>
                              )}

                              {canEdit && (
                                <div className="flex flex-wrap items-center gap-2 pt-1 no-print">
                                  <input
                                    type="url"
                                    placeholder="Deliverable URL (GitHub / Prototype video)"
                                    value={deliverableInputs[ms._id] ?? ms.deliverableUrl ?? ''}
                                    onChange={(e) =>
                                      setDeliverableInputs((prev) => ({
                                        ...prev,
                                        [ms._id]: e.target.value,
                                      }))
                                    }
                                    className="input-field !flex-1 !min-w-[180px] !py-1.5 !text-[11px]"
                                  />
                                  <button
                                    type="button"
                                    disabled={actionBusy === ms._id}
                                    onClick={() =>
                                      handleMilestoneUpdate(prop._id, ms._id, 'in_progress')
                                    }
                                    className="btn-secondary !py-1.5 !px-2.5 !text-[11px]"
                                  >
                                    In Progress
                                  </button>
                                  <button
                                    type="button"
                                    disabled={actionBusy === ms._id}
                                    onClick={() =>
                                      handleMilestoneUpdate(prop._id, ms._id, 'completed')
                                    }
                                    className="btn-emerald !py-1.5 !px-2.5 !text-[11px]"
                                  >
                                    Completed
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {canEdit && pct >= 75 && challenge.status !== 'deployed' && (
                        <div className="flex flex-wrap gap-2 pt-2 no-print">
                          {challenge.status !== 'piloted' && (
                            <button
                              type="button"
                              onClick={() => handleChallengeStatusChange('piloted')}
                              className="btn-primary !py-2 !px-3.5 !text-xs"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              Advance to Piloted ({pct}%)
                            </button>
                          )}
                          {pct === 100 && (
                            <button
                              type="button"
                              onClick={() => handleChallengeStatusChange('deployed')}
                              className="btn-emerald !py-2 !px-3.5 !text-xs"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Advance to Deployed (100%)
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Industry Partnerships */}
          <div className="glass-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Industry & CSR Partnerships ({partnerships.length})
              </h2>
            </div>

            {partnerships.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No industry collaboration offers yet.
              </p>
            ) : (
              <div className="space-y-3">
                {partnerships.map((p) => (
                  <div
                    key={p._id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{p.title}</p>
                        <StatusBadge status={p.status} size="xs" />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {p.industryId?.organizationName || p.industryId?.name} •{' '}
                        {p.collaborationType.replace(/_/g, ' ')} •{' '}
                        <strong className="text-emerald-700 dark:text-emerald-400">
                          {formatINR(p.fundingAmount)}
                        </strong>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {p.commitmentDetails}
                      </p>
                    </div>

                    {(user?.role === 'university' || user?.role === 'admin') &&
                      p.status === 'proposed' && (
                        <div className="flex gap-2 no-print">
                          <button
                            type="button"
                            onClick={() => handlePartnershipRespond(p._id, 'accepted')}
                            className="btn-emerald !py-1.5 !px-3 !text-xs"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePartnershipRespond(p._id, 'declined')}
                            className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 active:scale-95 transition"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Map + Audit Log */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Geo-Location</h2>
            <MapPicker
              latitude={lat}
              longitude={lng}
              readOnly={true}
              zoom={14}
              height="270px"
            />
          </div>

          {/* Direct Authority Escalations Card */}
          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Authority Escalations ({challenge.escalations?.length || 0})
                </h2>
              </div>
              {isAuthenticated && ['admin', 'citizen', 'university'].includes(user?.role) && (
                <button
                  type="button"
                  onClick={() => setEscalateOpen(true)}
                  className="btn-secondary !py-1 !px-2.5 !text-[11px] no-print"
                >
                  + Escalate
                </button>
              )}
            </div>

            {!challenge.escalations?.length ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Not yet escalated to municipal/government authorities. Click &ldquo;Post to Concerned Authority&rdquo; to dispatch via X, Email, or CPGRAMS.
              </p>
            ) : (
              <div className="space-y-2.5">
                {challenge.escalations.map((esc) => (
                  <div
                    key={esc._id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-3 space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {esc.authorityName}
                      </p>
                      <StatusBadge
                        status={
                          esc.status === 'resolved_by_authority'
                            ? 'completed'
                            : esc.status === 'acknowledged'
                            ? 'approved'
                            : 'proposed'
                        }
                        size="xs"
                      />
                    </div>
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                      {esc.channel.toUpperCase()} {esc.authorityHandle ? `• ${esc.authorityHandle}` : ''}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{esc.message}</p>
                    {user?.role === 'admin' && esc.status !== 'resolved_by_authority' && (
                      <div className="flex gap-2 pt-1 no-print">
                        {esc.status === 'dispatched' && (
                          <button
                            type="button"
                            disabled={actionBusy === esc._id}
                            onClick={() => handleEscalationStatus(esc._id, 'acknowledged')}
                            className="btn-secondary !py-1 !px-2 !text-[10px]"
                          >
                            Mark Acknowledged
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={actionBusy === esc._id}
                          onClick={() => handleEscalationStatus(esc._id, 'resolved_by_authority')}
                          className="btn-emerald !py-1 !px-2 !text-[10px]"
                        >
                          Resolved by Authority
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Activity Audit Log
              </h2>
            </div>

            {activityLogs.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">No audit entries yet.</p>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {activityLogs.map((log) => (
                  <div
                    key={log._id}
                    className="relative pl-5 pb-3 border-l border-slate-200 dark:border-slate-700 last:border-l-transparent"
                  >
                    <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-900" />
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span className="font-semibold uppercase text-indigo-600 dark:text-indigo-400">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {log.actorName} ({log.actorRole})
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{log.remarks}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Offer Collaboration Modal */}
      {pledgeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="animate-scale-in w-full max-w-md glass-card p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Offer Industry Collaboration
            </h3>
            <form onSubmit={handlePledgeSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Collaboration Type
                </label>
                <select
                  value={pledgeForm.collaborationType}
                  onChange={(e) =>
                    setPledgeForm({ ...pledgeForm, collaborationType: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="funding">CSR Funding</option>
                  <option value="mentorship">Technical Mentorship</option>
                  <option value="prototyping_support">Prototyping Support</option>
                  <option value="field_deployment">Field Deployment</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={pledgeForm.title}
                  onChange={(e) => setPledgeForm({ ...pledgeForm, title: e.target.value })}
                  placeholder="e.g., CSR Hardware Prototyping Grant"
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
                  value={pledgeForm.fundingAmount}
                  onChange={(e) =>
                    setPledgeForm({ ...pledgeForm, fundingAmount: e.target.value })
                  }
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
                  value={pledgeForm.commitmentDetails}
                  onChange={(e) =>
                    setPledgeForm({ ...pledgeForm, commitmentDetails: e.target.value })
                  }
                  placeholder="Specify lab access, engineering mentors, or funding tranche terms..."
                  className="input-field"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPledgeOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={actionBusy === 'pledge'} className="btn-emerald">
                  {actionBusy === 'pledge' ? 'Sending...' : 'Send Collaboration Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <AuthorityEscalationModal
        challenge={challenge}
        open={escalateOpen}
        onClose={() => setEscalateOpen(false)}
        onEscalated={() => loadDetail()}
      />
    </div>
  );
};

export default ChallengeDetailPage;
