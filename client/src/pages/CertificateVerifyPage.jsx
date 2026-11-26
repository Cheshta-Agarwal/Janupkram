import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, ShieldCheck, Printer, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import { formatDate } from '../utils/constants';

// Deterministic visual QR matrix SVG derived from certificateId
const QrVisual = ({ seed }) => {
  const size = 9;
  const cells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const isCorner =
        (r < 3 && c < 3) || (r < 3 && c >= size - 3) || (r >= size - 3 && c < 3);
      const charCode = seed.charCodeAt((r * size + c) % seed.length) || 65;
      const on = isCorner || (charCode + r * 7 + c * 13) % 3 !== 0;
      if (on) {
        cells.push(
          <rect
            key={`${r}-${c}`}
            x={c * 10}
            y={r * 10}
            width="8.5"
            height="8.5"
            rx="1.5"
            fill="currentColor"
          />
        );
      }
    }
  }
  return (
    <svg viewBox="0 0 90 90" className="h-24 w-24 text-slate-900 dark:text-white">
      {cells}
    </svg>
  );
};

export const CertificateVerifyPage = () => {
  const { proposalId } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/proposals/${proposalId}/certificate`);
        setCert(data);
      } catch {
        setCert(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [proposalId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="h-80 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-rose-600">
        Certificate record not found.
      </div>
    );
  }

  const { certificateId, eligible, proposal, milestoneStats } = cert;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6 animate-fade-up">
      <div className="flex items-center justify-between no-print">
        <Link to="/" className="btn-ghost">
          <ArrowLeft className="h-4 w-4" />
          Back to Janupkram
        </Link>
        <button type="button" onClick={() => window.print()} className="btn-primary">
          <Printer className="h-4 w-4" />
          Print / Save PDF Certificate
        </button>
      </div>

      <div className="glass-card relative overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 p-8 sm:p-12 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 dark:bg-indigo-950/70 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300">
              <ShieldCheck className="h-4 w-4" />
              Janupkram Verified Innovation Credential
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Certificate of Societal R&amp;D Impact
            </h1>
            <p className="mt-1 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
              Certificate ID: {certificateId}
            </p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3">
            <QrVisual seed={certificateId} />
            <span className="mt-1 text-[10px] font-mono text-slate-400">Scan / Verify</span>
          </div>
        </div>

        <div className="py-8 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            This certifies that student team{' '}
            <strong className="text-slate-900 dark:text-white text-base">
              {proposal.teamName}
            </strong>{' '}
            under faculty mentor{' '}
            <strong className="text-slate-900 dark:text-white">{proposal.facultyMentor}</strong>{' '}
            at{' '}
            <strong className="text-indigo-600 dark:text-indigo-400">
              {proposal.universityId?.organizationName || proposal.universityId?.name}
            </strong>{' '}
            developed and executed an open societal innovation solution for:
          </p>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {proposal.challengeId?.title}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Region: {proposal.challengeId?.district} • Milestones Completed:{' '}
              {milestoneStats.completed}/{milestoneStats.total} • Challenge Status:{' '}
              <strong className="uppercase">{proposal.challengeId?.status}</strong>
            </p>
          </div>

          {proposal.members?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Recognized Student Innovators
              </p>
              <div className="flex flex-wrap gap-2">
                {proposal.members.map((m, i) => (
                  <span
                    key={i}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    {m.name} — {m.role} ({m.department})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800 pt-6">
          <div className="flex items-center gap-2 text-xs font-semibold">
            {eligible ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Verified Eligible for LPU / University Capstone Credit
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Award className="h-4 w-4" />
                In Progress ({milestoneStats.completed}/{milestoneStats.total} milestones)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Issued via Janupkram • {formatDate(proposal.updatedAt)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CertificateVerifyPage;
