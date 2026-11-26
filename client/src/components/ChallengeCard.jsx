import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ThumbsUp, GraduationCap, ArrowRight, Globe2, Megaphone } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { CATEGORY_LABELS } from '../utils/constants';

export const ChallengeCard = ({
  challenge,
  onUpvote,
  currentUserId,
  actionSlot,
  showStepper = false,
  stepperNode = null,
}) => {
  const upvotesCount = challenge.upvotesCount ?? challenge.upvotes?.length ?? 0;
  const hasUpvoted =
    currentUserId &&
    Array.isArray(challenge.upvotes) &&
    challenge.upvotes.some((id) => String(id) === String(currentUserId));

  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-800/60 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
            {CATEGORY_LABELS[challenge.category] || challenge.category}
          </span>
          <div className="flex items-center gap-1.5">
            <StatusBadge status={challenge.severity} variant="severity" size="xs" />
            <StatusBadge status={challenge.status} size="xs" />
          </div>
        </div>

        <Link to={`/challenges/${challenge._id}`} className="block mt-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
            {challenge.title}
          </h3>
        </Link>

        <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-3">
          {challenge.description}
        </p>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 font-medium">
            <MapPin className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />
            {challenge.district}
          </span>
          {challenge.sourcePlatform && challenge.sourcePlatform !== 'Direct Report' && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-2 py-1 font-semibold text-amber-700 dark:text-amber-300">
              <Globe2 className="h-3 w-3" />
              {challenge.sourcePlatform}
            </span>
          )}
          {challenge.escalations?.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 px-2 py-1 font-semibold text-rose-700 dark:text-rose-300">
              <Megaphone className="h-3 w-3" />
              Escalated ({challenge.escalations.length})
            </span>
          )}
          {challenge.proposalsCount > 0 && (
            <span className="inline-flex items-center rounded-md bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-800/60 px-2 py-1 font-medium text-sky-700 dark:text-sky-300">
              {challenge.proposalsCount} Proposal(s)
            </span>
          )}
          {challenge.partnershipsCount > 0 && (
            <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/60 px-2 py-1 font-medium text-emerald-700 dark:text-emerald-300">
              {challenge.partnershipsCount} CSR Partner(s)
            </span>
          )}
        </div>

        {challenge.assignedUniversity && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-700 dark:text-violet-200 bg-violet-50/70 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-800/60 rounded-lg px-2.5 py-1.5">
            <GraduationCap className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 flex-shrink-0" />
            <span className="truncate font-medium">
              {challenge.assignedUniversity.organizationName || challenge.assignedUniversity.name}
            </span>
          </div>
        )}

        {showStepper && stepperNode && <div className="mt-4">{stepperNode}</div>}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div>
          {onUpvote ? (
            <button
              type="button"
              onClick={() => onUpvote(challenge._id)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-90 ${
                hasUpvoted
                  ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              {upvotesCount}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <ThumbsUp className="h-3.5 w-3.5" />
              {upvotesCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {actionSlot}
          <Link
            to={`/challenges/${challenge._id}`}
            className="inline-flex items-center gap-1 rounded-xl bg-slate-900 dark:bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-indigo-600 dark:hover:bg-indigo-500 active:scale-95"
          >
            360° View
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ChallengeCard;
