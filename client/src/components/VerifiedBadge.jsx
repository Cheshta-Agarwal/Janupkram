import React from 'react';
import { ShieldCheck, Clock, ShieldAlert, ShieldX } from 'lucide-react';

export const VerifiedBadge = ({ status = 'unverified', size = 'sm' }) => {
  const cfg = {
    verified: {
      label: 'KYC Verified',
      Icon: ShieldCheck,
      cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800',
    },
    pending_review: {
      label: 'KYC Pending',
      Icon: Clock,
      cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
    },
    rejected: {
      label: 'KYC Rejected',
      Icon: ShieldX,
      cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800',
    },
    unverified: {
      label: 'Unverified',
      Icon: ShieldAlert,
      cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    },
  }[status] || {
    label: 'Unverified',
    Icon: ShieldAlert,
    cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  };

  const Icon = cfg.Icon;
  const padding = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${padding} ${cfg.cls}`}
    >
      <Icon className={size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {cfg.label}
    </span>
  );
};

export default VerifiedBadge;
