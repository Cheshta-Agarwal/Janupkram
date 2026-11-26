import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Upload, Save, FileCheck2, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import VerifiedBadge from '../components/VerifiedBadge';
import { REGION_HUBS } from '../utils/constants';

export const VerificationSettingsPage = () => {
  const { user, refreshProfile } = useAuth();
  const { addToast } = useToast();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    organizationName: user?.organizationName || '',
    district: user?.district || 'Phagwara',
    bio: user?.bio || '',
    portfolioUrl: user?.portfolioUrl || '',
    githubUrl: user?.githubUrl || '',
    wardOrConstituency: user?.wardOrConstituency || '',
    aisheOrNaacCode: user?.aisheOrNaacCode || '',
    labCapabilities: (user?.labCapabilities || []).join(', '),
    cinOrGstin: user?.cinOrGstin || '',
    csrFocusAreas: (user?.csrFocusAreas || []).join(', '),
    mentorshipSlots: user?.mentorshipSlots || 0,
    designation: user?.designation || '',
    jurisdiction: user?.jurisdiction || '',
  });

  const [docType, setDocType] = useState(
    user?.role === 'university'
      ? 'aishe_naac'
      : user?.role === 'industry'
      ? 'cin_csr1'
      : 'gov_id'
  );
  const [docNumber, setDocNumber] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/profile/me', profileForm);
      await refreshProfile();
      addToast('Stakeholder profile updated!');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadKyc = async (e) => {
    e.preventDefault();
    if (!docFile) {
      addToast('Please select a document image or PDF.', 'error');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('docType', docType);
      fd.append('docNumber', docNumber);
      fd.append('document', docFile);

      await api.post('/profile/verification', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshProfile();
      setDocFile(null);
      setDocNumber('');
      addToast('KYC document uploaded and queued for Nodal Moderator verification!');
    } catch (err) {
      addToast(err.response?.data?.message || 'KYC upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Stakeholder Profile &amp; KYC Verification
            </h1>
            <VerifiedBadge status={user?.verificationStatus} />
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Verified accounts unlock direct X/CPGRAMS escalations, university proposal
            submissions, and CSR grant pledges.
          </p>
        </div>
        {user && (
          <Link to={`/profile/${user.id}`} className="btn-secondary !text-xs">
            View Public Profile →
          </Link>
        )}
      </div>

      {user?.verificationStatus === 'rejected' && user?.verificationFeedback && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 p-4 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">KYC Rejected by Moderator</p>
            <p className="mt-0.5">{user.verificationFeedback}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Role-Specific Profile Form */}
        <form onSubmit={handleSaveProfile} className="lg:col-span-7 glass-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Role-Specific Profile Details
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                City / Region
              </label>
              <select
                value={profileForm.district}
                onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                className="input-field"
              >
                {REGION_HUBS.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Organization / Institution / Forum
              </label>
              <input
                type="text"
                value={profileForm.organizationName}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, organizationName: e.target.value })
                }
                className="input-field"
              />
            </div>

            {user?.role === 'citizen' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ward / Constituency
                </label>
                <input
                  type="text"
                  value={profileForm.wardOrConstituency}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, wardOrConstituency: e.target.value })
                  }
                  placeholder="e.g., Ward 14, Municipal Corporation"
                  className="input-field"
                />
              </div>
            )}

            {user?.role === 'university' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NAAC / AISHE Code
                  </label>
                  <input
                    type="text"
                    value={profileForm.aisheOrNaacCode}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, aisheOrNaacCode: e.target.value })
                    }
                    placeholder="e.g., NAAC A++ • AISHE U-0379"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lab Capabilities (comma separated)
                  </label>
                  <input
                    type="text"
                    value={profileForm.labCapabilities}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, labCapabilities: e.target.value })
                    }
                    placeholder="IoT FabLab, Water Assay Lab, Civil Eng."
                    className="input-field"
                  />
                </div>
              </>
            )}

            {user?.role === 'industry' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company CIN / GSTIN
                  </label>
                  <input
                    type="text"
                    value={profileForm.cinOrGstin}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, cinOrGstin: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Active Mentorship Slots
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={profileForm.mentorshipSlots}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, mentorshipSlots: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    CSR Schedule VII Focus Areas (comma separated)
                  </label>
                  <input
                    type="text"
                    value={profileForm.csrFocusAreas}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, csrFocusAreas: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GitHub URL
              </label>
              <input
                type="url"
                value={profileForm.githubUrl}
                onChange={(e) => setProfileForm({ ...profileForm, githubUrl: e.target.value })}
                placeholder="https://github.com/..."
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Portfolio / Website URL
              </label>
              <input
                type="url"
                value={profileForm.portfolioUrl}
                onChange={(e) => setProfileForm({ ...profileForm, portfolioUrl: e.target.value })}
                placeholder="https://..."
                className="input-field"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bio / Mission Statement
              </label>
              <textarea
                rows={3}
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        {/* Right: KYC Document Upload */}
        <div className="lg:col-span-5 space-y-5">
          <form onSubmit={handleUploadKyc} className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Document Verification (KYC)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload an Institutional ID, University Affiliation/NAAC Certificate, NGO Darpan ID,
              or Corporate CIN/CSR-1 document for Nodal Moderator verification.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Document Type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="input-field"
              >
                <option value="gov_id">Government / Voter / Civic ID</option>
                <option value="aishe_naac">University AISHE / NAAC Certificate</option>
                <option value="ngo_darpan">NGO Darpan Registration</option>
                <option value="cin_csr1">Corporate CIN / CSR-1 Certificate</option>
                <option value="other">Other Official Credential</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Document / Registration Number
              </label>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="e.g., AISHE U-0379 or CIN..."
                className="input-field"
              />
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 px-4 py-5 text-center transition hover:border-indigo-400">
              <Upload className="h-6 w-6 text-indigo-500" />
              <span className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {docFile ? docFile.name : 'Select Verification File (Image or PDF)'}
              </span>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>

            <button type="submit" disabled={uploading} className="btn-emerald w-full">
              <FileCheck2 className="h-4 w-4" />
              {uploading ? 'Submitting KYC...' : 'Submit Document for Verification'}
            </button>
          </form>

          {user?.verificationDocuments?.length > 0 && (
            <div className="glass-card p-5 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Submitted Documents ({user.verificationDocuments.length})
              </h3>
              {user.verificationDocuments.map((d) => (
                <a
                  key={d._id}
                  href={d.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span>
                    {d.docType.replace(/_/g, ' ').toUpperCase()}
                    {d.docNumber ? ` (${d.docNumber})` : ''}
                  </span>
                  <span>View →</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationSettingsPage;
