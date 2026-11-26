import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Landmark,
  ShieldCheck,
  GraduationCap,
  Building2,
  Users,
  ArrowRight,
  MapPin,
  CheckCircle2,
  IndianRupee,
  Sparkles,
  Search,
  Globe2,
  ExternalLink,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  ROLE_DASHBOARD_PATH,
  REGION_HUBS,
  CHALLENGE_CATEGORIES,
  CATEGORY_LABELS,
  formatINR,
} from '../utils/constants';
import { CONNECTED_REPORTING_PORTALS } from '../utils/authorities';
import ChallengeCard from '../components/ChallengeCard';
import MapPicker from '../components/MapPicker';

export const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLanding = async () => {
      try {
        const [ovRes, chRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/challenges?limit=30'),
        ]);
        setOverview(ovRes.data);
        setChallenges(chRes.data.challenges || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    loadLanding();
  }, []);

  const visibleChallenges = challenges.filter((c) => {
    const matchesRegion = regionFilter === 'ALL' || c.district === regionFilter;
    const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      c.title?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.district?.toLowerCase().includes(q) ||
      c.sourcePlatform?.toLowerCase().includes(q);
    return matchesRegion && matchesCategory && matchesSearch;
  });

  const focusedRegion = REGION_HUBS.find((d) => d.name === regionFilter);

  const mapMarkers = visibleChallenges
    .filter((c) => Array.isArray(c.location?.coordinates) && c.location.coordinates.length === 2)
    .map((c) => ({
      id: c._id,
      title: c.title,
      subtitle: `${c.district} • ${c.status.replace(/_/g, ' ')}`,
      lat: c.location.coordinates[1],
      lng: c.location.coordinates[0],
      status: c.status,
    }));

  const actors = [
    {
      icon: Users,
      role: 'Citizens & Communities',
      color:
        'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-800/60',
      desc: 'Anyone anywhere can pin local sanitation, agri, health, or infrastructure issues on the open map with photo evidence.',
    },
    {
      icon: ShieldCheck,
      role: 'Civic Nodal Moderators',
      color:
        'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60',
      desc: 'Run 2km spatial duplicate checks, validate reports, and route challenges to specialization-matched campus R&D teams.',
    },
    {
      icon: GraduationCap,
      role: 'LPU & Partner Campuses',
      color:
        'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-950/60 dark:text-violet-400 dark:border-violet-800/60',
      desc: 'Student innovators from Lovely Professional University (LPU) & partner universities build real prototypes via tracked milestones.',
    },
    {
      icon: Building2,
      role: 'Industry & CSR Partners',
      color:
        'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60',
      desc: 'Sponsor open societal R&D with CSR grants, engineering mentorship, lab prototyping, and field deployment.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/20" />
        <div className="pointer-events-none absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/15" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 animate-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/70 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <Sparkles className="h-3.5 w-3.5" />
                Built by LPU Students • Open Societal Innovation Platform for Everyone
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl leading-[1.12]">
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-600 bg-clip-text text-transparent">
                  Janupkram
                </span>{' '}
                — Open Societal Innovation Collaboration Grid.
              </h1>
              <p className="mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
                Engineered by college student innovators at <strong>Lovely Professional University (LPU)</strong> for everyone—connecting real-world community problems anywhere with campus R&D labs, civic moderators, and industry CSR partners through verifiable milestones.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                {isAuthenticated ? (
                  <Link to={ROLE_DASHBOARD_PATH[user.role] || '/'} className="btn-primary !px-5 !py-3">
                    Open My Workspace
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="btn-primary !px-5 !py-3">
                      1-Click Demo Sign-In
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link to="/register" className="btn-secondary !px-5 !py-3">
                      Register Stakeholder
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-4 animate-fade-up">
              <div className="glass-card p-4 sm:p-5 hover:-translate-y-0.5">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Challenges</span>
                  <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {overview ? overview.totalChallenges : '—'}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Geotagged across regions
                </p>
              </div>

              <div className="glass-card p-4 sm:p-5 hover:-translate-y-0.5">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Pilots & Deployed</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {overview ? overview.activePrototypes + overview.deployedChallenges : '—'}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {overview ? `${overview.deployedChallenges} deployed in field` : 'Active impact'}
                </p>
              </div>

              <div className="glass-card p-4 sm:p-5 hover:-translate-y-0.5">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Universities</span>
                  <GraduationCap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {overview ? overview.universitiesCount : '—'}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Academic R&D partners
                </p>
              </div>

              <div className="glass-card p-4 sm:p-5 hover:-translate-y-0.5">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">CSR Pledged</span>
                  <IndianRupee className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="mt-3 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                  {overview ? formatINR(overview.totalCsrFunding) : '—'}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Industry & CSR backing
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Four-Actor Architecture */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actors.map((a) => {
            const Icon = a.icon;
            return (
              <div
                key={a.role}
                className="glass-card p-5 hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-700"
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${a.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">{a.role}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {a.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Spatial Explorer */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 space-y-8">
        <div className="glass-card p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Interactive Pan-India Spatial Explorer
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Search any issue by keyword, category, source (Reddit / X), or city to filter map pins &amp; reports.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['ALL', 'Phagwara', 'New Delhi', 'Bengaluru', 'Pune', 'Jaipur'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setRegionFilter(d)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95 ${
                    regionFilter === d
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                      : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {d === 'ALL' ? 'All Regions' : d === 'Phagwara' ? 'Phagwara (LPU)' : d}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-indigo-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search issue (e.g., Bellandur sewage, PM2.5, potholes, Reddit, GT Road)..."
                className="input-field !pl-10 !py-2.5 !text-xs sm:!text-sm"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-field !w-auto !py-2.5 !text-xs sm:!text-sm"
            >
              <option value="ALL">All Categories</option>
              {CHALLENGE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>

            {(searchQuery || categoryFilter !== 'ALL' || regionFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('ALL');
                  setRegionFilter('ALL');
                }}
                className="btn-secondary !py-2.5 !px-3 !text-xs"
              >
                Reset
              </button>
            )}
          </div>

          <MapPicker
            latitude={
              focusedRegion
                ? focusedRegion.lat
                : visibleChallenges[0]?.location?.coordinates?.[1] && (searchQuery || categoryFilter !== 'ALL')
                ? visibleChallenges[0].location.coordinates[1]
                : 23.2599
            }
            longitude={
              focusedRegion
                ? focusedRegion.lng
                : visibleChallenges[0]?.location?.coordinates?.[0] && (searchQuery || categoryFilter !== 'ALL')
                ? visibleChallenges[0].location.coordinates[0]
                : 77.4126
            }
            zoom={focusedRegion ? 11 : searchQuery && visibleChallenges.length === 1 ? 12 : 5}
            readOnly={true}
            height="340px"
            showCoordBar={true}
            markers={mapMarkers}
          />
        </div>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {regionFilter === 'ALL' && !searchQuery && categoryFilter === 'ALL'
                ? 'Featured Societal Challenges (Including Real Reddit & X Reports)'
                : `Matching Challenges (${visibleChallenges.length})`}
            </h2>
            <Link
              to="/login"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Sign in to collaborate or escalate →
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-56 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                />
              ))}
            </div>
          ) : visibleChallenges.length === 0 ? (
            <div className="glass-card border-dashed p-10 text-center text-xs text-slate-500 dark:text-slate-400">
              No challenges matched your search. Try clearing filters or submit a new civic issue.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleChallenges.slice(0, 9).map((ch) => (
                <ChallengeCard key={ch._id} challenge={ch} />
              ))}
            </div>
          )}
        </div>

        {/* Connected Public Reporting Portals & Discovery Channels */}
        <div className="glass-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Connected Civic Reporting Portals &amp; Public Discovery Channels
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Discover community problems from Reddit/X or escalate verified issues directly to official government grievance systems.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {CONNECTED_REPORTING_PORTALS.map((portal) => (
              <a
                key={portal.name}
                href={portal.url}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-white dark:hover:bg-slate-900"
              >
                <div>
                  <span className="inline-block rounded-md bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                    {portal.badge}
                  </span>
                  <h3 className="mt-2 text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between gap-1">
                    {portal.name}
                    <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-indigo-500" />
                  </h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                    {portal.desc}
                  </p>
                </div>
                <p className="mt-3 font-mono text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                  {portal.handle}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 text-xs text-slate-500 dark:text-slate-400 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
            <Landmark className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Janupkram • Built by Lovely Professional University (LPU) Student Innovators — Open for Everyone
          </div>
          <p>OpenStreetMap + MongoDB 2dsphere Spatial Grid</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
