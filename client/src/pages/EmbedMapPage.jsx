import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Landmark, ExternalLink } from 'lucide-react';
import api from '../api/axios';
import MapPicker from '../components/MapPicker';
import { REGION_HUBS } from '../utils/constants';

export const EmbedMapPage = () => {
  const [searchParams] = useSearchParams();
  const district = searchParams.get('district') || 'ALL';
  const category = searchParams.get('category') || 'ALL';
  const height = searchParams.get('height') || '380px';
  const [challenges, setChallenges] = useState([]);

  useEffect(() => {
    const loadFeed = async () => {
      try {
        const qs = district !== 'ALL' ? `?district=${encodeURIComponent(district)}` : '';
        const { data } = await api.get(`/challenges/open-feed/public${qs}`);
        let list = data.challenges || [];
        if (category !== 'ALL') {
          list = list.filter((c) => c.category === category);
        }
        setChallenges(list);
      } catch {
        setChallenges([]);
      }
    };
    loadFeed();
  }, [district, category]);

  const hub = REGION_HUBS.find((h) => h.name === district);
  const markers = challenges
    .filter((c) => Array.isArray(c.location?.coordinates) && c.location.coordinates.length === 2)
    .map((c) => ({
      id: c._id,
      title: c.title,
      subtitle: `${c.district} • ${c.status.replace(/_/g, ' ')}`,
      lat: c.location.coordinates[1],
      lng: c.location.coordinates[0],
      status: c.status,
    }));

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 p-2 sm:p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
          <Landmark className="h-4 w-4 text-indigo-600" />
          <span>Janupkram Live Civic Map {district !== 'ALL' ? `— ${district}` : '— Pan-India'}</span>
          <span className="rounded-full bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 text-[10px] text-indigo-700 dark:text-indigo-300">
            {markers.length} active pins
          </span>
        </div>
        <a
          href={window.location.origin}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline"
        >
          Open Full Portal <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <MapPicker
        latitude={hub ? hub.lat : 23.2599}
        longitude={hub ? hub.lng : 77.4126}
        zoom={hub ? 11 : 5}
        readOnly={true}
        height={height}
        showCoordBar={false}
        markers={markers}
      />
    </div>
  );
};

export default EmbedMapPage;
