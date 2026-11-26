import React from 'react';
import { Check, XCircle } from 'lucide-react';
import { LIFECYCLE_STEPS } from '../utils/constants';

export const LifecycleStepper = ({ currentStatus }) => {
  if (currentStatus === 'rejected') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 px-4 py-3 text-rose-800 dark:text-rose-200">
        <XCircle className="h-5 w-5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
        <div>
          <p className="text-sm font-semibold">Challenge Rejected During Moderation</p>
          <p className="text-xs text-rose-700 dark:text-rose-300">
            Marked as duplicate or outside portal scope by the Nodal Officer.
          </p>
        </div>
      </div>
    );
  }

  const normalized = currentStatus === 'under_review' ? 'submitted' : currentStatus;
  const currentIdx = Math.max(
    0,
    LIFECYCLE_STEPS.findIndex((s) => s.key === normalized)
  );

  return (
    <div className="w-full overflow-x-auto pb-1">
      <div className="flex min-w-[580px] items-center justify-between">
        {LIFECYCLE_STEPS.map((step, idx) => {
          const isCompleted = idx < currentIdx || currentStatus === 'deployed';
          const isCurrent = idx === currentIdx && currentStatus !== 'deployed';

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center text-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-all duration-300 ${
                    isCompleted
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                      : isCurrent
                      ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 ring-4 ring-indigo-100 dark:ring-indigo-900/50'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                </div>
                <span
                  className={`mt-1.5 text-[11px] font-semibold whitespace-nowrap ${
                    isCompleted
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : isCurrent
                      ? 'text-indigo-700 dark:text-indigo-300'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < LIFECYCLE_STEPS.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                    idx < currentIdx
                      ? 'bg-emerald-500'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default LifecycleStepper;
