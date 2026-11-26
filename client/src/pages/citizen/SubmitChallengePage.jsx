import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Upload, AlertTriangle, CheckCircle2, X, Wand2 } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import {
  CHALLENGE_CATEGORIES,
  CATEGORY_LABELS,
  REGION_HUBS,
} from '../../utils/constants';
import MapPicker from '../../components/MapPicker';

const KEYWORD_HINTS = [
  { cat: 'sanitation', words: ['water', 'drain', 'fluoride', 'arsenic', 'handpump', 'sewage', 'plastic', 'waste'] },
  { cat: 'agriculture', words: ['crop', 'farmer', 'irrigation', 'cold', 'lac', 'harvest', 'soil', 'mandi'] },
  { cat: 'healthcare', words: ['anemia', 'hospital', 'clinic', 'asha', 'anganwadi', 'health', 'malaria', 'doctor'] },
  { cat: 'environment', words: ['dust', 'coal', 'mine', 'methane', 'pollution', 'forest', 'air', 'aqi'] },
  { cat: 'education', words: ['school', 'student', 'stem', 'teacher', 'literacy', 'college', 'lab'] },
  { cat: 'infrastructure', words: ['road', 'bridge', 'solar', 'grid', 'highway', 'street', 'corridor'] },
];

export const SubmitChallengePage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'sanitation',
    severity: 'high',
    district: 'Phagwara',
    sourcePlatform: 'Direct Report',
    sourceUrl: '',
    externalTicketId: '',
    latitude: 31.2554,
    longitude: 75.7058,
  });

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [nearbyMatches, setNearbyMatches] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Smart Category Auto-Suggestion from title + description
  const suggestedCategory = useMemo(() => {
    const text = `${form.title} ${form.description}`.toLowerCase();
    if (text.trim().length < 6) return null;
    for (const rule of KEYWORD_HINTS) {
      if (rule.words.some((w) => text.includes(w)) && rule.cat !== form.category) {
        return rule.cat;
      }
    }
    return null;
  }, [form.title, form.description, form.category]);

  useEffect(() => {
    const checkNearby = async () => {
      try {
        const { data } = await api.get(
          `/challenges/spatial/nearby?lat=${form.latitude}&lng=${form.longitude}&radiusMeters=2000`
        );
        setNearbyMatches(data.nearby || []);
      } catch {
        setNearbyMatches([]);
      }
    };
    const t = setTimeout(checkNearby, 350);
    return () => clearTimeout(t);
  }, [form.latitude, form.longitude]);

  useEffect(() => {
    const urls = files.map((file) => ({
      name: file.name,
      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => {
        if (u.url) URL.revokeObjectURL(u.url);
      });
    };
  }, [files]);

  const handleDistrictChange = (districtName) => {
    const found = REGION_HUBS.find((d) => d.name === districtName);
    setForm((prev) => ({
      ...prev,
      district: districtName,
      latitude: found ? found.lat : prev.latitude,
      longitude: found ? found.lng : prev.longitude,
    }));
  };

  const handleFilesChange = (e) => {
    const selected = Array.from(e.target.files || []).slice(0, 5);
    setFiles(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      files.forEach((f) => fd.append('media', f));

      const { data } = await api.post('/challenges', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      addToast('Challenge submitted to State Innovation Cell!');
      navigate(`/challenges/${data.challenge._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit challenge.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8 space-y-6 animate-fade-up">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Submit a Societal Challenge
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Pin the exact location anywhere on OpenStreetMap, attach up to 5 photos, and route to
          civic moderators.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 px-4 py-3 text-xs font-medium text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-5 glass-card p-5 sm:p-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Challenge Title *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Arsenic contamination in Mandar block handpumps"
              className="input-field"
            />
          </div>

          {suggestedCategory && (
            <div className="animate-scale-in flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/50 px-3.5 py-2 text-xs">
              <span className="inline-flex items-center gap-1.5 text-indigo-800 dark:text-indigo-200 font-medium">
                <Wand2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                Smart Tagging detected{' '}
                <strong>{CATEGORY_LABELS[suggestedCategory]}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setForm((prev) => ({ ...prev, category: suggestedCategory }));
                  addToast(`Category updated to ${CATEGORY_LABELS[suggestedCategory]}`, 'info');
                }}
                className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700 active:scale-95 transition"
              >
                Apply Suggestion
              </button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input-field"
              >
                {CHALLENGE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Severity *
              </label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="input-field"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                City / Region *
              </label>
              <select
                value={form.district}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="input-field"
              >
                {REGION_HUBS.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Detailed Description & Ground Context *
            </label>
            <textarea
              required
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the ground challenge, impacted communities, and constraints..."
              className="input-field"
            />
          </div>

          {/* Connected Reporting Portal / Social Discovery Source */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-4 space-y-3">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Connect External Report / Discovery Source (Optional)
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Source Platform
                </label>
                <select
                  value={form.sourcePlatform}
                  onChange={(e) => setForm({ ...form, sourcePlatform: e.target.value })}
                  className="input-field !py-2 !text-xs"
                >
                  <option value="Direct Report">Direct Report</option>
                  <option value="Reddit • r/india">Reddit (r/india)</option>
                  <option value="Reddit • r/bangalore">Reddit (r/bangalore)</option>
                  <option value="Reddit • r/delhi">Reddit (r/delhi)</option>
                  <option value="Reddit • r/pune">Reddit (r/pune)</option>
                  <option value="X (Twitter) • Civic Thread">X (Twitter)</option>
                  <option value="CPGRAMS">CPGRAMS (pgportal.gov.in)</option>
                  <option value="Swachhata-MoHUA">Swachhata-MoHUA (1969)</option>
                  <option value="Municipal App">City Municipal App</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Post / Grievance Link
                </label>
                <input
                  type="url"
                  value={form.sourceUrl}
                  onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                  placeholder="https://reddit.com/r/..."
                  className="input-field !py-2 !text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Existing Ticket / Ref ID
                </label>
                <input
                  type="text"
                  value={form.externalTicketId}
                  onChange={(e) => setForm({ ...form, externalTicketId: e.target.value })}
                  placeholder="e.g., CPGRAMS-2026-..."
                  className="input-field !py-2 !text-xs"
                />
              </div>
            </div>
          </div>

          {/* Image Preview Uploader */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Upload Evidence Photos (Max 5)
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 px-4 py-5 text-center transition hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30">
              <Upload className="h-6 w-6 text-indigo-500" />
              <span className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                Click to upload up to 5 field images
              </span>
              <span className="mt-0.5 text-[11px] text-slate-400">
                Cloudinary or automatic /uploads local fallback
              </span>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFilesChange}
                className="hidden"
              />
            </label>

            {previews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                {previews.map((p, idx) => (
                  <div
                    key={idx}
                    className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {p.url ? (
                      <img src={p.url} alt={p.name} className="h-20 w-full object-cover" />
                    ) : (
                      <div className="flex h-20 items-center justify-center p-2 text-[10px] text-slate-600 dark:text-slate-300">
                        {p.name}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute right-1 top-1 rounded-full bg-slate-900/75 p-0.5 text-white hover:bg-rose-600 transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card p-5 space-y-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Pin Exact Challenge Location *
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click anywhere on the map to drop a pin or use GPS coordinates.
              </p>
            </div>

            <MapPicker
              latitude={form.latitude}
              longitude={form.longitude}
              radiusMeters={2000}
              height="320px"
              markers={nearbyMatches.map((m) => ({
                id: m._id,
                title: m.title,
                subtitle: m.district,
                distanceMeters: m.distanceMeters,
                lat: m.location.coordinates[1],
                lng: m.location.coordinates[0],
                status: m.status,
              }))}
              onChange={(lat, lng) =>
                setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))
              }
            />

            {nearbyMatches.length > 0 ? (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 p-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  {nearbyMatches.length} Existing Report(s) Within 2km Radius
                </div>
                <ul className="mt-2 space-y-1">
                  {nearbyMatches.slice(0, 3).map((m) => (
                    <li
                      key={m._id}
                      className="text-[11px] text-amber-900 dark:text-amber-200 flex justify-between gap-2"
                    >
                      <span className="truncate font-medium">{m.title}</span>
                      <span className="font-mono font-bold">{m.distanceMeters}m</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-3.5 py-2.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Clear: No nearby duplicates within 2km.
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full !py-3.5">
            <Send className="h-4 w-4" />
            {submitting ? 'Submitting Challenge...' : 'Submit Challenge'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitChallengePage;
