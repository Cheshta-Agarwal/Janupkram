import React, { useState, useEffect } from 'react';
import { Send, ExternalLink, Mail, Copy, X, Megaphone } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { AUTHORITY_DIRECTORY, getMatchedAuthority } from '../utils/authorities';

export const AuthorityEscalationModal = ({ challenge, open, onClose, onEscalated }) => {
  const { addToast } = useToast();
  const [selectedId, setSelectedId] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !challenge) return;
    const matched = getMatchedAuthority(challenge.category, challenge.district);
    setSelectedId(matched.id);

    const coords = challenge.location?.coordinates;
    const coordStr =
      Array.isArray(coords) && coords.length === 2
        ? `${coords[1].toFixed(4)}°N, ${coords[0].toFixed(4)}°E`
        : challenge.district;

    setMessage(
      `${matched.authorityHandle} Urgent Civic Escalation (${challenge.district}): "${challenge.title}" at ${coordStr}. ${
        challenge.externalTicketId ? `Ref: ${challenge.externalTicketId}. ` : ''
      }Requesting inspection & action. Track via Janupkram.`
    );
  }, [open, challenge]);

  if (!open || !challenge) return null;

  const authority =
    AUTHORITY_DIRECTORY.find((a) => a.id === selectedId) || AUTHORITY_DIRECTORY[0];

  const handleAuthorityChange = (newId) => {
    setSelectedId(newId);
    const nextAuth = AUTHORITY_DIRECTORY.find((a) => a.id === newId);
    if (nextAuth) {
      const coords = challenge.location?.coordinates;
      const coordStr =
        Array.isArray(coords) && coords.length === 2
          ? `${coords[1].toFixed(4)}°N, ${coords[0].toFixed(4)}°E`
          : challenge.district;
      setMessage(
        `${nextAuth.authorityHandle} Urgent Civic Escalation (${challenge.district}): "${challenge.title}" at ${coordStr}. Requesting inspection & action. Track via Janupkram.`
      );
    }
  };

  const persistEscalation = async (channel) => {
    setSubmitting(true);
    try {
      const { data } = await api.post(`/challenges/${challenge._id}/escalate`, {
        authorityName: authority.authorityName,
        authorityHandle: authority.authorityHandle,
        department: authority.department,
        channel,
        message,
        portalUrl: authority.portalUrl,
      });
      if (onEscalated) onEscalated(data.escalations);
      return true;
    } catch (err) {
      addToast(err.response?.data?.message || 'Escalation dispatch failed.', 'error');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostOnX = async () => {
    const ok = await persistEscalation('x_post');
    if (!ok) return;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
    addToast(`Escalation logged & X composer opened for ${authority.authorityHandle}`);
    onClose();
  };

  const handleOpenCpgrams = async () => {
    const ok = await persistEscalation('cpgrams');
    if (!ok) return;
    try {
      await navigator.clipboard.writeText(`${challenge.title}\n\n${challenge.description}\n\n${message}`);
      addToast('Formatted grievance copied! Opening official portal...');
    } catch {
      addToast('Opening official grievance portal...', 'info');
    }
    window.open(authority.portalUrl || 'https://pgportal.gov.in/', '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleSendEmail = async () => {
    const ok = await persistEscalation('email');
    if (!ok) return;
    const subject = encodeURIComponent(
      `[Janupkram Civic Escalation] ${challenge.district}: ${challenge.title}`
    );
    const body = encodeURIComponent(
      `To: ${authority.authorityName} (${authority.department})\n\n${message}\n\nProblem Details:\n${challenge.description}\n\nSource: ${challenge.sourcePlatform || 'Janupkram'}\nTracking Link: ${window.location.href}`
    );
    window.location.href = `mailto:${authority.email}?subject=${subject}&body=${body}`;
    addToast(`Escalation logged & email draft opened for ${authority.email}`);
    onClose();
  };

  const handleRecordOnly = async () => {
    const ok = await persistEscalation('municipal_portal');
    if (ok) {
      addToast(`Escalation logged to ${authority.authorityName}!`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="animate-scale-in w-full max-w-xl glass-card p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Escalate Directly to Concerned Authority
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                {challenge.title}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost !p-1.5">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Authority / Department (Auto-Matched)
            </label>
            <select
              value={selectedId}
              onChange={(e) => handleAuthorityChange(e.target.value)}
              className="input-field"
            >
              {AUTHORITY_DIRECTORY.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.authorityName} ({a.authorityHandle})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Dept: {authority.department} • Email: {authority.email}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Official Grievance / Escalation Message
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input-field !text-xs"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              {message.length} characters (recommended &lt; 280 chars for instant X post)
            </p>
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            disabled={submitting}
            onClick={handlePostOnX}
            className="btn-primary !justify-center"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Post on X ({authority.authorityHandle})
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={handleOpenCpgrams}
            className="btn-emerald !justify-center"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy & Open Official Portal
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={handleSendEmail}
            className="btn-secondary !justify-center"
          >
            <Mail className="h-3.5 w-3.5 text-indigo-500" />
            Send Official Email
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={handleRecordOnly}
            className="btn-secondary !justify-center"
          >
            <Send className="h-3.5 w-3.5 text-emerald-500" />
            Record Escalation Only
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthorityEscalationModal;
