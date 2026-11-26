import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Crosshair, MapPin, Layers, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const createPinIcon = (color = '#4F46E5', size = 26) =>
  L.divIcon({
    className: 'custom-civic-pin',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:3px solid #ffffff;box-shadow:0 4px 12px rgba(15,23,42,0.35);">
      <div style="width:7px;height:7px;border-radius:9999px;background:#ffffff;"></div>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });

const primaryIcon = createPinIcon('#4F46E5', 28);
const nearbyIcon = createPinIcon('#D97706', 24);
const deployedIcon = createPinIcon('#059669', 24);

const TILE_LAYERS = {
  street: {
    label: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr: '&copy; OpenStreetMap contributors',
  },
  dark: {
    label: 'Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attr: '&copy; OpenStreetMap &copy; CARTO',
  },
  topo: {
    label: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attr: '&copy; OpenStreetMap &copy; OpenTopoMap',
  },
};

const ClickSelector = ({ onPick }) => {
  useMapEvents({
    click(e) {
      if (onPick) {
        onPick(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
      }
    },
  });
  return null;
};

const RecenterMap = ({ lat, lng, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (lat !== undefined && lng !== undefined && !Number.isNaN(lat) && !Number.isNaN(lng)) {
      map.setView([lat, lng], zoom || map.getZoom(), { animate: true });
    }
  }, [lat, lng, zoom, map]);
  return null;
};

export const MapPicker = ({
  latitude = 31.2554,
  longitude = 75.7058,
  onChange,
  readOnly = false,
  height = '320px',
  zoom = 13,
  radiusMeters = 0,
  markers = [],
  showCoordBar = true,
}) => {
  const { isDark } = useTheme();
  const [layerMode, setLayerMode] = useState('auto');
  const [expanded, setExpanded] = useState(false);

  const activeLayerKey = layerMode === 'auto' ? (isDark ? 'dark' : 'street') : layerMode;
  const activeLayer = TILE_LAYERS[activeLayerKey] || TILE_LAYERS.street;

  const lat = Number(latitude) || 31.2554;
  const lng = Number(longitude) || 75.7058;

  const handleUseMyLocation = () => {
    if (!navigator.geolocation || !onChange) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(
          Number(pos.coords.latitude.toFixed(6)),
          Number(pos.coords.longitude.toFixed(6))
        );
      },
      () => {}
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      {showCoordBar && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/60 px-3.5 py-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
            <MapPin className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="truncate">
              <code className="rounded bg-white dark:bg-slate-900 px-1.5 py-0.5 font-mono text-[11px] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700">
                {lat.toFixed(5)}° N, {lng.toFixed(5)}° E
              </code>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {!readOnly && onChange && (
              <button
                type="button"
                onClick={handleUseMyLocation}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-700 dark:hover:text-indigo-300 transition active:scale-95"
              >
                <Crosshair className="h-3 w-3" />
                GPS
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                setLayerMode((prev) =>
                  prev === 'auto' ? 'street' : prev === 'street' ? 'dark' : prev === 'dark' ? 'topo' : 'auto'
                )
              }
              title="Switch Map Layer"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
            >
              <Layers className="h-3 w-3 text-indigo-500" />
              {layerMode === 'auto' ? 'Auto' : activeLayer.label}
            </button>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              title="Expand Map"
              className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
            >
              {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      )}

      <div style={{ height: expanded ? '460px' : height }} className="w-full relative transition-all duration-300">
        <MapContainer
          center={[lat, lng]}
          zoom={zoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer key={activeLayerKey} attribution={activeLayer.attr} url={activeLayer.url} />
          <RecenterMap lat={lat} lng={lng} zoom={zoom} />
          {!readOnly && <ClickSelector onPick={onChange} />}

          {radiusMeters > 0 && (
            <Circle
              center={[lat, lng]}
              radius={radiusMeters}
              pathOptions={{
                color: '#6366F1',
                fillColor: '#6366F1',
                fillOpacity: 0.1,
                weight: 1.5,
                dashArray: '5, 5',
              }}
            />
          )}

          {markers.length === 0 ? (
            <Marker position={[lat, lng]} icon={primaryIcon}>
              <Popup>
                <div className="text-xs">
                  <p className="font-semibold">Selected Site</p>
                  <p className="opacity-75">
                    {lat.toFixed(5)}, {lng.toFixed(5)}
                  </p>
                </div>
              </Popup>
            </Marker>
          ) : (
            <>
              {(!readOnly || radiusMeters > 0) && (
                <Marker position={[lat, lng]} icon={primaryIcon}>
                  <Popup>
                    <div className="text-xs">
                      <p className="font-semibold text-indigo-600">Target Site</p>
                      <p className="opacity-75">
                        {lat.toFixed(5)}, {lng.toFixed(5)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {markers.map((m, idx) => (
                <Marker
                  key={m.id || idx}
                  position={[m.lat, m.lng]}
                  icon={m.status === 'deployed' ? deployedIcon : nearbyIcon}
                >
                  <Popup>
                    <div className="text-xs max-w-[210px]">
                      <p className="font-semibold">{m.title}</p>
                      {m.subtitle && <p className="opacity-75 mt-0.5">{m.subtitle}</p>}
                      {m.distanceMeters !== undefined && (
                        <p className="mt-1 font-semibold text-amber-600">
                          {m.distanceMeters} m away
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapPicker;
