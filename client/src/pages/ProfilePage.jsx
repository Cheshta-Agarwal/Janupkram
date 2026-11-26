import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Award,
  ThumbsUp,
  ExternalLink,
  Github,
  Building2,
  GraduationCap,
  ShieldCheck,
  Settings,
  CheckCircle2,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import VerifiedBadge from '../components/VerifiedBadge';
import StatusBadge from '../components/StatusBadge';
import { ROLE_LABELS, formatINR } from '../utils/constants';

export const ProfilePage = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [endorsing, setEndorsing] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/profile/${id}`);
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleEndorse = async () => {
    if (!isAuthenticated) {
      addToast('Sign in to endorse this stakeholder.', 'info');
      return;
    }
    setEndorsing(true);
    try {
      const res = await api.post(`/profile/${id}/endorse`);
      addToast(res.data.endorsed ? 'Endorsed! (+5 Civic Karma)' : 'Endorsement removed.', 'info');
      await loadProfile();
    } catch (err) {
      addToast(err.response?.data?.message || 'Unable to endorse.', 'error');
    } finally {
      setEndorsing(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-72 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
      </div>
    );
  }

  if (!data?.profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-slate-500">
        Stakeholder profile not found.
      </div>
    );
  }

  const { profile, stats, submittedChallenges, proposals, partnerships } = data;
  const isOwner = user && String(user.id) === String(profile._id);
  const hasEndorsed =
    user &&
    Array.isArray(profile.endorsements) &&
    profile.endorsements.some((eid) => String(eid) === String(user.id));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-fade-up">
      {/* Header Card */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-2xl font-extrabold text-white shadow-lg shadow-indigo-500/25">
              {profile.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {profile.name}
                </h1>
                <VerifiedBadge status={profile.verificationStatus} />
              </div>
              <p className="mt-0.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                {ROLE_LABELS[profile.role] || profile.role}
                {profile.organizationName ? ` • ${profile.organizationName}` : ''}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                  {profile.district}
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                  <Award className="h-3.5 w-3.5" />
                  {profile.civicKarma || 0} Civic Karma
                </span>
                <span>{profile.endorsementsCount || 0} Endorsements</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isOwner ? (
              <Link to="/settings/verification" className="btn-primary !py-2 !px-3.5 !text-xs">
                <Settings className="h-3.5 w-3.5" />
                Edit Profile &amp; KYC
              </Link>
            ) : (
              <button
                type="button"
                disabled={endorsing}
                onClick={handleEndorse}
                className={hasEndorsed ? 'btn-emerald !py-2 !px-3.5 !text-xs' : 'btn-secondary !py-2 !px-3.5 !text-xs'}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                {hasEndorsed ? 'Endorsed' : 'Endorse (+5 Karma)'}
              </button>
            )}
          </div>
        </div>

        {profile.bio && (
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
            {profile.bio}
          </p>
        )}

        {/* Role-Specific Credentials & Links */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-3.5">
            <p className="text-[11px] font-bold uppercase text-slate-400">Civic Karma</p>
            <p className="mt-1 text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {profile.civicKarma || 0}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-3.5">
            <p className="text-[11px] font-bold uppercase text-slate-400">
              {profile.role === 'university'
                ? 'Active Proposals'
                : profile.role === 'industry'
                ? 'CSR Disbursed'
                : 'Issues Reported'}
            </p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
              {profile.role === 'university'
                ? stats.proposalsCount
                : profile.role === 'industry'
                ? formatINR(stats.grantsDisbursed)
                : stats.issuesReported}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-3.5">
            <p className="text-[11px] font-bold uppercase text-slate-400">
              {profile.role === 'industry' ? 'Mentorship Slots' : 'Resolved / Assigned'}
            </p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {profile.role === 'industry'
                ? profile.mentorshipSlots || 0
                : profile.role === 'university'
                ? stats.assignedCount
                : stats.issuesResolved}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-3.5">
            <p className="text-[11px] font-bold uppercase text-slate-400">Role Credential</p>
            <p className="mt-1 text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              {profile.aisheOrNaacCode ||
                profile.cinOrGstin ||
                profile.wardOrConstituency ||
                profile.designation ||
                'Verified Member'}
            </p>
          </div>
        </div>

        {/* Role Metadata Tags */}
        <div className="flex flex-wrap gap-2">
          {(profile.labCapabilities || []).map((lab, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/60 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              {lab}
            </span>
          ))}
          {(profile.csrFocusAreas || []).map((area, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
            >
              <Building2 className="h-3.5 w-3.5" />
              {area}
            </span>
          ))}
          {profile.githubUrl && (
            <a
              href={profile.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary !py-1 !px-3 !text-xs"
            >
              <Github className="h-3.5 w-3.5" />
              GitHub
            </a>
          )}
          {profile.portfolioUrl && (
            <a
              href={profile.portfolioUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary !py-1 !px-3 !text-xs"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Portfolio
            </a>
          )}
        </div>
      </div>

      {/* Proposals & Certificates (University) */}
      {proposals?.length > 0 && (
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            R&amp;D Prototypes &amp; Verified Certificates
          </h2>
          <div className="space-y-3">
            {proposals.map((p) => (
              <div
                key={p._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-4"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{p.teamName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Challenge: {p.challengeId?.title} ({p.challengeId?.district})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={p.challengeId?.status || p.status} size="xs" />
                  <Link
                    to={`/verify/cert/${p._id}`}
                    className="btn-secondary !py-1.5 !px-3 !text-xs"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    Certificate
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Partnerships (Industry) */}
      {partnerships?.length > 0 && (
        <div className="glass-card p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            CSR Grants &amp; Mentorship History
          </h2>
          {partnerships.map((part) => (
            <div
              key={part._id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-800 p-4"
            >
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{part.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {part.challengeId?.title} • {formatINR(part.fundingAmount)}
                </p>
              </div>
              <StatusBadge status={part.status} size="xs" />
            </div>
          ))}
        </div>
      )}

      {/* Submitted Challenges */}
      {submittedChallenges?.length > 0 && (
        <div className="glass-card p-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Reported Civic Challenges ({submittedChallenges.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {submittedChallenges.map((c) => (
              <Link
                key={c._id}
                to={`/challenges/${c._id}`}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:border-indigo-400 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {c.district}
                  </span>
                  <StatusBadge status={c.status} size="xs" />
                </div>
                <p className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                  {c.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
