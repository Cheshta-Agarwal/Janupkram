import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Radar,
  GraduationCap,
  CheckCircle2,
  XCircle,
  BarChart3,
  AlertTriangle,
  ExternalLink,
  Star,
  Megaphone,
} from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/StatusBadge';
import MapPicker from '../../components/MapPicker';
import AuthorityEscalationModal from '../../components/AuthorityEscalationModal';
import { CATEGORY_LABELS } from '../../utils/constants';

export const AdminDashboard = () => {
  const { addToast } = useToast();
  const [statusFilter, setStatusFilter] = useState('submitted');
  const [challenges, setChallenges] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [busyId, setBusyId] = useState('');
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [kycUsers, setKycUsers] = useState([]);
  const [kycFeedback, setKycFeedback] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [chRes, univRes, kycRes] = await Promise.all([
        api.get('/challenges?limit=100'),
        api.get('/auth/users?role=university'),
        api.get('/profile/verification/queue?status=ALL'),
      ]);
      const all = chRes.data.challenges || [];
      setChallenges(all);
      setUniversities(univRes.data.users || []);
      setKycUsers(kycRes.data.users || []);

      setSelected((prev) => {
        if (prev) return all.find((c) => c._id === prev._id) || all[0] || null;
        return all.find((c) => c.status === 'submitted') || all[0] || null;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCheckDuplicates = async (challenge) => {
    if (!challenge) return;
    setScanning(true);
    setHasScanned(true);
    try {
      const { data } = await api.get(`/challenges/${challenge._id}/duplicates`);
      setDuplicates(data.duplicates || []);
      addToast(
        data.count > 0
          ? `Found ${data.count} nearby report(s) within 2km.`
          : '2km spatial scan clear — no duplicates found.',
        data.count > 0 ? 'info' : 'success'
      );
    } catch {
      setDuplicates([]);
    } finally {
      setScanning(false);
    }
  };

  const handleSelectChallenge = (c) => {
    setSelected(c);
    setDuplicates([]);
    setHasScanned(false);
    setRejectionReason('');
  };

  const handleReview = async (challengeId, status, duplicateOf = null, customReason = '') => {
    const reason = customReason || rejectionReason;
    if (status === 'rejected' && !reason.trim()) {
      addToast('Please enter a mandatory rejection reason first.', 'error');
      return;
    }
    setBusyId(challengeId);
    try {
      await api.patch(`/challenges/${challengeId}/review`, {
        status,
        rejectionReason: reason,
        duplicateOf,
      });
      setRejectionReason('');
      addToast(`Challenge marked as ${status.replace(/_/g, ' ')}.`);
      await loadData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Review update failed.', 'error');
    } finally {
      setBusyId('');
    }
  };

  const handleRoute = async (challengeId, universityId) => {
    setBusyId(challengeId);
    try {
      await api.patch(`/challenges/${challengeId}/route`, { universityId });
      addToast('Challenge routed to university & alert dispatched!');
      await loadData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Routing failed.', 'error');
    } finally {
      setBusyId('');
    }
  };

  const handleKycDecision = async (userId, status) => {
    setBusyId(userId);
    try {
      await api.patch(`/profile/${userId}/verify`, {
        status,
        feedback: kycFeedback[userId] || '',
      });
      addToast(`User KYC marked ${status}.`);
      await loadData();
    } catch (err) {
      addToast(err.response?.data?.message || 'KYC decision failed.', 'error');
    } finally {
      setBusyId('');
    }
  };

  const filteredQueue =
    statusFilter === 'ALL'
      ? challenges
      : challenges.filter((c) => c.status === statusFilter);

  const rankedUniversities = selected
    ? [...universities]
        .map((u) => ({
          ...u,
          matches: (u.specializations || []).includes(selected.category),
        }))
        .sort((a, b) => Number(b.matches) - Number(a.matches))
    : universities;

  const counts = {
    submitted: challenges.filter((c) => c.status === 'submitted').length,
    under_review: challenges.filter((c) => c.status === 'under_review').length,
    validated: challenges.filter((c) => c.status === 'validated').length,
    routed: challenges.filter((c) => c.status === 'routed').length,
    rejected: challenges.filter((c) => c.status === 'rejected').length,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8 space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Government Problem Management Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Moderation queue, 2km spatial duplicate detector, and specialization-ranked university
            routing.
          </p>
        </div>
        <Link to="/analytics" className="btn-secondary">
          <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          Executive Analytics
        </Link>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'submitted', label: `Submitted (${counts.submitted})` },
          { key: 'under_review', label: `Under Review (${counts.under_review})` },
          { key: 'validated', label: `Validated (${counts.validated})` },
          { key: 'routed', label: `Routed (${counts.routed})` },
          { key: 'rejected', label: `Rejected (${counts.rejected})` },
          { key: 'ALL', label: `All (${challenges.length})` },
          {
            key: 'kyc',
            label: `KYC Audit (${kycUsers.filter((u) => u.verificationStatus === 'pending_review').length} pending)`,
          },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => {
              setStatusFilter(f.key);
              const first =
                f.key === 'ALL'
                  ? challenges[0]
                  : challenges.find((c) => c.status === f.key);
              if (first) handleSelectChallenge(first);
            }}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-150 active:scale-95 ${
              statusFilter === f.key
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-72 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
      ) : statusFilter === 'kyc' ? (
        <div className="space-y-3">
          {kycUsers.map((u) => (
            <div key={u._id} className="glass-card flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/profile/${u._id}`}
                    className="text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600"
                  >
                    {u.name}
                  </Link>
                  <StatusBadge
                    status={
                      u.verificationStatus === 'verified'
                        ? 'approved'
                        : u.verificationStatus === 'pending_review'
                        ? 'proposed'
                        : u.verificationStatus === 'rejected'
                        ? 'rejected'
                        : 'pending'
                    }
                    size="xs"
                  />
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {u.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {u.email} • {u.organizationName || u.district}
                </p>
                {u.verificationDocuments?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {u.verificationDocuments.map((d) => (
                      <a
                        key={d._id}
                        href={d.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300"
                      >
                        {d.docType.replace(/_/g, ' ').toUpperCase()} {d.docNumber ? `(${d.docNumber})` : ''} →
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Optional feedback..."
                  value={kycFeedback[u._id] || ''}
                  onChange={(e) =>
                    setKycFeedback((prev) => ({ ...prev, [u._id]: e.target.value }))
                  }
                  className="input-field !w-48 !py-1.5 !text-xs"
                />
                {u.verificationStatus !== 'verified' && (
                  <button
                    type="button"
                    disabled={busyId === u._id}
                    onClick={() => handleKycDecision(u._id, 'verified')}
                    className="btn-emerald !py-1.5 !px-3 !text-xs"
                  >
                    Approve KYC
                  </button>
                )}
                {u.verificationStatus !== 'rejected' && (
                  <button
                    type="button"
                    disabled={busyId === u._id}
                    onClick={() => handleKycDecision(u._id, 'rejected')}
                    className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Queue */}
          <div className="lg:col-span-5 space-y-2.5 max-h-[420px] lg:max-h-[720px] overflow-y-auto pr-1">
            {filteredQueue.length === 0 ? (
              <div className="glass-card border-dashed p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No challenges in "{statusFilter}" queue.
              </div>
            ) : (
              filteredQueue.map((c) => {
                const isSel = selected?._id === c._id;
                return (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => handleSelectChallenge(c)}
                    className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 active:scale-[0.99] ${
                      isSel
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-md shadow-indigo-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                        {CATEGORY_LABELS[c.category] || c.category}
                      </span>
                      <div className="flex gap-1.5">
                        <StatusBadge status={c.severity} variant="severity" size="xs" />
                        <StatusBadge status={c.status} size="xs" />
                      </div>
                    </div>
                    <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                      {c.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {c.district} • By {c.submittedBy?.name}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Inspector */}
          <div className="lg:col-span-7">
            {selected ? (
              <div className="glass-card p-5 sm:p-6 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={selected.status} size="xs" />
                      <StatusBadge status={selected.severity} variant="severity" size="xs" />
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {CATEGORY_LABELS[selected.category] || selected.category}
                      </span>
                    </div>
                    <h2 className="mt-1.5 text-lg font-bold text-slate-900 dark:text-white">
                      {selected.title}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selected.district} • Reported by {selected.submittedBy?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEscalateOpen(true)}
                      className="btn-secondary !py-1.5 !px-3 !text-xs"
                    >
                      <Megaphone className="h-3.5 w-3.5 text-amber-500" />
                      Escalate to Authority
                    </button>
                    <Link
                      to={`/challenges/${selected._id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      360° View <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {selected.description}
                </p>

                {/* 2km Spatial Duplicate Detector */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Radar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        2km Spatial Duplicate Detector ($near)
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCheckDuplicates(selected)}
                      className="btn-primary !py-1.5 !px-3 !text-[11px]"
                    >
                      {scanning ? 'Checking...' : 'Check Nearby Duplicates'}
                    </button>
                  </div>

                  <MapPicker
                    latitude={selected.location?.coordinates?.[1] || 31.2554}
                    longitude={selected.location?.coordinates?.[0] || 75.7058}
                    readOnly={true}
                    zoom={14}
                    radiusMeters={2000}
                    height="220px"
                    markers={duplicates.map((d) => ({
                      id: d._id,
                      title: d.title,
                      subtitle: `${d.district} • ${d.status}`,
                      distanceMeters: d.distanceMeters,
                      lat: d.location.coordinates[1],
                      lng: d.location.coordinates[0],
                      status: d.status,
                    }))}
                  />

                  {hasScanned &&
                    (duplicates.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          {duplicates.length} Overlapping Report(s) Found Within 2km:
                        </div>
                        {duplicates.map((d) => (
                          <div
                            key={d._id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 px-3 py-2 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900 dark:text-white truncate">
                                {d.title}
                              </p>
                              <p className="text-[11px] text-amber-800 dark:text-amber-300 font-mono">
                                {d.distanceMeters} meters away • Status: {d.status}
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={busyId === selected._id}
                              onClick={() =>
                                handleReview(
                                  selected._id,
                                  'rejected',
                                  d._id,
                                  `Duplicate of "${d.title}" (${d.distanceMeters}m away)`
                                )
                              }
                              className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-rose-700 active:scale-95 transition"
                            >
                              Mark Duplicate & Reject
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        No overlapping reports found within 2,000 meters.
                      </p>
                    ))}
                </div>

                {/* Validate / Reject */}
                {['submitted', 'under_review', 'rejected'].includes(selected.status) && (
                  <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Moderation Decision
                    </h3>
                    <input
                      type="text"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Mandatory rejection reason (if rejecting or marking duplicate)..."
                      className="input-field !py-2 !text-xs"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyId === selected._id}
                        onClick={() => handleReview(selected._id, 'validated')}
                        className="btn-emerald !py-2 !px-4 !text-xs"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Validate Challenge
                      </button>
                      {selected.status === 'submitted' && (
                        <button
                          type="button"
                          disabled={busyId === selected._id}
                          onClick={() => handleReview(selected._id, 'under_review')}
                          className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/60 px-3.5 py-2 text-xs font-semibold text-amber-800 dark:text-amber-300 active:scale-95 transition"
                        >
                          <ShieldCheck className="h-4 w-4 inline mr-1" />
                          Mark Under Review
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busyId === selected._id}
                        onClick={() => handleReview(selected._id, 'rejected')}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 px-3.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 active:scale-95 transition"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {/* Smart University Router */}
                {['submitted', 'under_review', 'validated', 'routed'].includes(selected.status) && (
                  <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Smart University Router (Ranked by Specialization Match)
                      </h3>
                    </div>

                    <div className="space-y-2">
                      {rankedUniversities.map((u) => (
                        <div
                          key={u._id}
                          className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 transition ${
                            u.matches
                              ? 'border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/30'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xs font-bold text-slate-900 dark:text-white">
                                {u.organizationName || u.name}
                              </p>
                              {u.matches && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                  <Star className="h-2.5 w-2.5" />
                                  Specialization Match
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Specializations:{' '}
                              {(u.specializations || []).join(', ') || 'General R&D'}
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={busyId === selected._id}
                            onClick={() => handleRoute(selected._id, u._id)}
                            className="btn-primary !py-1.5 !px-3 !text-xs"
                          >
                            Route Challenge
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card p-10 text-center text-xs text-slate-500 dark:text-slate-400">
                Select a challenge from the moderation queue.
              </div>
            )}
          </div>
        </div>
      )}
      <AuthorityEscalationModal
        challenge={selected}
        open={escalateOpen}
        onClose={() => setEscalateOpen(false)}
        onEscalated={() => loadData()}
      />
    </div>
  );
};

export default AdminDashboard;
