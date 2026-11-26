import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Upload, AlertTriangle, CheckCircle2, X, Wand2, Mic, MicOff, Camera, Sparkles, WifiOff, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  enqueueOfflineReport,
  getOfflineReports,
  removeOfflineReport,
} from '../../utils/offlineQueue';
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
  const { t } = useLanguage();

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
  const [listening, setListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState('en-IN');
  const [captureMeta, setCaptureMeta] = useState({
    capturedViaLiveCamera: false,
    capturedAt: '',
    gpsVerified: false,
  });
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [syncingQueue, setSyncingQueue] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);
  const [triaging, setTriaging] = useState(false);

  const loadOfflineQueue = useCallback(async () => {
    const items = await getOfflineReports();
    setOfflineQueue(items);
  }, []);

  useEffect(() => {
    loadOfflineQueue();
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [loadOfflineQueue]);

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

  const handleLiveCameraCapture = (e) => {
    const camFiles = Array.from(e.target.files || []);
    if (!camFiles.length) return;
    setFiles((prev) => [...prev, ...camFiles].slice(0, 5));
    const ts = camFiles[0].lastModified ? new Date(camFiles[0].lastModified).toISOString() : new Date().toISOString();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm((prev) => ({
            ...prev,
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
          }));
          setCaptureMeta({ capturedViaLiveCamera: true, capturedAt: ts, gpsVerified: true });
          addToast('Live camera evidence captured with GPS timestamp!');
        },
        () => {
          setCaptureMeta({ capturedViaLiveCamera: true, capturedAt: ts, gpsVerified: false });
          addToast('Live camera photo captured (GPS permission skipped).', 'info');
        }
      );
    } else {
      setCaptureMeta({ capturedViaLiveCamera: true, capturedAt: ts, gpsVerified: false });
    }
  };

  const handleVoiceReport = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      addToast('Voice recognition is not supported in this browser (try Chrome/Edge).', 'info');
      return;
    }
    const rec = new SpeechRec();
    rec.lang = voiceLang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    setListening(true);
    rec.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        setForm((prev) => ({
          ...prev,
          description: prev.description ? `${prev.description} ${transcript}` : transcript,
        }));
        addToast('Voice transcription added to description!');
      }
      setListening(false);
    };
    rec.onerror = () => {
      setListening(false);
      addToast('Could not capture audio. Please check mic permissions.', 'error');
    };
    rec.onend = () => setListening(false);
    rec.start();
  };

  const handleAiTriage = async () => {
    if (!form.title.trim() && !form.description.trim()) {
      addToast('Enter a title or description first for AI moderation & translation.', 'info');
      return;
    }
    setTriaging(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('category', form.category);
      const firstImg = files.find((f) => f.type?.startsWith('image/'));
      if (firstImg) fd.append('image', firstImg);
      const { data } = await api.post('/challenges/ai-triage', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAiPreview(data.triage);
      addToast('AI Civic Triage complete!');
    } catch {
      addToast('Unable to run AI triage offline.', 'error');
    } finally {
      setTriaging(false);
    }
  };

  const handleSyncOfflineQueue = async () => {
    if (!isOnline || offlineQueue.length === 0) return;
    setSyncingQueue(true);
    let synced = 0;
    try {
      for (const item of offlineQueue) {
        const fd = new FormData();
        Object.entries(item.form || {}).forEach(([k, v]) => fd.append(k, String(v)));
        fd.append('isOfflineSynced', 'true');
        await api.post('/challenges', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        await removeOfflineReport(item.localId);
        synced += 1;
      }
      await loadOfflineQueue();
      addToast(`Synced ${synced} offline report(s) to Janupkram!`);
    } catch {
      addToast('Partial sync failure; remaining reports stay safely queued.', 'error');
    } finally {
      setSyncingQueue(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!navigator.onLine) {
      await enqueueOfflineReport({ form, captureMeta });
      await loadOfflineQueue();
      addToast('Saved offline to IndexedDB! Auto-sync ready when internet returns.');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      fd.append('capturedViaLiveCamera', String(captureMeta.capturedViaLiveCamera));
      if (captureMeta.capturedAt) fd.append('capturedAt', captureMeta.capturedAt);
      fd.append('gpsVerified', String(captureMeta.gpsVerified));
      files.forEach((f) => fd.append('media', f));

      const { data } = await api.post('/challenges', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      addToast('Challenge submitted to Janupkram Civic Grid!');
      navigate(`/challenges/${data.challenge._id}`);
    } catch (err) {
      if (!err.response) {
        await enqueueOfflineReport({ form, captureMeta });
        await loadOfflineQueue();
        addToast('Network unavailable — report saved offline in IndexedDB!', 'info');
      } else {
        setError(err.response?.data?.message || 'Failed to submit challenge.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8 space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {t('submitTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('submitSubtitle')}
          </p>
        </div>
        {offlineQueue.length > 0 && (
          <button
            type="button"
            disabled={!isOnline || syncingQueue}
            onClick={handleSyncOfflineQueue}
            className="btn-emerald !py-2 !px-3.5 !text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncingQueue ? 'animate-spin' : ''}`} />
            {t('syncQueueBtn')} ({offlineQueue.length})
          </button>
        )}
      </div>

      {!isOnline && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 px-4 py-3 text-xs font-semibold text-amber-800 dark:text-amber-300">
          <WifiOff className="h-4 w-4 flex-shrink-0" />
          Offline Mode Active: Submissions will save locally in IndexedDB and sync when connectivity returns.
        </div>
      )}

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
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Detailed Description &amp; Ground Context *
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  value={voiceLang}
                  onChange={(e) => setVoiceLang(e.target.value)}
                  aria-label="Voice Language"
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] font-semibold"
                >
                  <option value="en-IN">English (IN)</option>
                  <option value="hi-IN">हिन्दी (Hindi)</option>
                  <option value="pa-IN">ਪੰਜਾਬੀ (Punjabi)</option>
                  <option value="bn-IN">বাংলা (Bengali)</option>
                  <option value="mr-IN">मराठी (Marathi)</option>
                  <option value="ta-IN">தமிழ் (Tamil)</option>
                  <option value="kn-IN">ಕನ್ನಡ (Kannada)</option>
                </select>
                <button
                  type="button"
                  onClick={handleVoiceReport}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition active:scale-95 ${
                    listening
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
                  }`}
                >
                  {listening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                  {listening ? 'Listening...' : 'Speak Issue'}
                </button>
              </div>
            </div>
            <textarea
              required
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Type or click 'Speak Issue' in Hindi, Punjabi, English, or regional languages..."
              className="input-field"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                disabled={triaging || !isOnline}
                onClick={handleAiTriage}
                className="btn-secondary !py-1.5 !px-3 !text-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                {triaging ? 'Analyzing...' : t('aiTriageBtn')}
              </button>
              {aiPreview && (
                <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                  {aiPreview.provider} • {aiPreview.isSafe ? 'Safe' : 'Flagged'} • Match:{' '}
                  {CATEGORY_LABELS[aiPreview.suggestedCategory] || aiPreview.suggestedCategory}
                </span>
              )}
            </div>
            {aiPreview?.translatedEnglish && (
              <div className="mt-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 p-3 text-xs space-y-1.5">
                <p className="text-indigo-900 dark:text-indigo-200">
                  <strong>English Translation Preview:</strong> {aiPreview.translatedEnglish}
                </p>
                {aiPreview.suggestedCategory && aiPreview.suggestedCategory !== form.category && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, category: aiPreview.suggestedCategory }))
                    }
                    className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white"
                  >
                    Switch Category to {CATEGORY_LABELS[aiPreview.suggestedCategory]}
                  </button>
                )}
              </div>
            )}
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

          {/* Image Preview Uploader + Live Camera Capture */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Upload Field Evidence (Max 5)
              </label>
              <label className="btn-secondary !py-1 !px-2.5 !text-[11px] cursor-pointer">
                <Camera className="h-3.5 w-3.5 text-emerald-500" />
                Capture Live Field Photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleLiveCameraCapture}
                  className="hidden"
                />
              </label>
            </div>
            {captureMeta.capturedViaLiveCamera && (
              <p className="mb-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                ✓ Live field camera capture attached {captureMeta.gpsVerified ? '(GPS Verified)' : ''}
              </p>
            )}
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
            {isOnline ? <Send className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {submitting
              ? 'Submitting Challenge...'
              : isOnline
              ? t('submitBtn')
              : t('saveOfflineBtn')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitChallengePage;
